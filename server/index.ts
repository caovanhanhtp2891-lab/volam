import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { WebSocket, WebSocketServer, type RawData } from "ws";

interface AccountRecord {
  id: string;
  createdAt: string;
}

interface CharacterRecord {
  id: string;
  accountId: string;
  name: string;
  x: number;
  y: number;
  level: number;
  xp: number;
  lastSeenAt: string;
}

interface StoredSession {
  accountId: string;
  characterId: string;
}

interface StoreData {
  accounts: Record<string, AccountRecord>;
  characters: Record<string, CharacterRecord>;
  sessions: Record<string, StoredSession>;
}

interface Session {
  tokenHash: string;
  accountId: string;
  characterId: string;
  expiresAt: number;
  socket: WebSocket | null;
  axisX: number;
  axisY: number;
  inputSequence: number;
}

interface ProtocolMessage {
  protocolVersion?: number;
  type?: string;
  requestId?: string;
  payload?: Record<string, unknown>;
}

const PORT = Number(process.env.GAME_SERVER_PORT ?? 8787);
const DATA_DIR = process.env.GAME_DATA_DIR ?? "/tmp/giang-ho-di-truyen";
const DATA_FILE = path.join(DATA_DIR, "store.json");
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const WORLD_WIDTH = 1900;
const WORLD_HEIGHT = 1200;
const TICK_MS = 50;

let store: StoreData = { accounts: {}, characters: {}, sessions: {} };
let storeReady = false;
let storeDirty = false;
let serverTick = 0;
const sessions = new Map<string, Session>();

const nowIso = () => new Date().toISOString();
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

async function loadStore(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    store = {
      accounts: parsed.accounts ?? {},
      characters: parsed.characters ?? {},
      sessions: parsed.sessions ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    store = { accounts: {}, characters: {}, sessions: {} };
  }
  storeReady = true;
}

async function persistStore(): Promise<void> {
  if (!storeDirty) return;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  storeDirty = false;
}

function json(res: import("node:http").ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  });
  res.end(body);
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;
      if (body.length > 32_000) reject(new Error("payload-too-large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function bearer(req: import("node:http").IncomingMessage): string | null {
  const value = req.headers.authorization;
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length).trim() || null;
}

function sessionForToken(token: string | null): Session | null {
  if (!token) return null;
  const session = sessions.get(hashToken(token));
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessions.delete(session.tokenHash);
    return null;
  }
  return session;
}

function characterForSession(session: Session): CharacterRecord | null {
  return store.characters[session.characterId] ?? null;
}

function safeName(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const normalized = raw.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 20).trim();
  return normalized || "Tân nhân giang hồ";
}

function createGuest(name: string, resumeToken: string | null): { sessionToken: string; accountId: string; characterId: string } {
  const resumed = sessionForToken(resumeToken);
  if (resumed) {
    resumed.expiresAt = Date.now() + SESSION_TTL_MS;
    return { sessionToken: resumeToken!, accountId: resumed.accountId, characterId: resumed.characterId };
  }
  if (resumeToken) {
    const tokenHash = hashToken(resumeToken);
    const stored = store.sessions[tokenHash];
    if (stored && store.characters[stored.characterId]) {
      const session: Session = {
        tokenHash,
        accountId: stored.accountId,
        characterId: stored.characterId,
        expiresAt: Date.now() + SESSION_TTL_MS,
        socket: null,
        axisX: 0,
        axisY: 0,
        inputSequence: 0,
      };
      sessions.set(tokenHash, session);
      return { sessionToken: resumeToken, accountId: session.accountId, characterId: session.characterId };
    }
  }
  const accountId = `account-${randomUUID()}`;
  const characterId = `character-${randomUUID()}`;
  const createdAt = nowIso();
  store.accounts[accountId] = { id: accountId, createdAt };
  store.characters[characterId] = {
    id: characterId,
    accountId,
    name,
    x: 300,
    y: 360,
    level: 1,
    xp: 0,
    lastSeenAt: createdAt,
  };
  const sessionToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(sessionToken);
  sessions.set(tokenHash, { tokenHash, accountId, characterId, expiresAt: Date.now() + SESSION_TTL_MS, socket: null, axisX: 0, axisY: 0, inputSequence: 0 });
  store.sessions[tokenHash] = { accountId, characterId };
  storeDirty = true;
  return { sessionToken, accountId, characterId };
}

function snapshotFor(session: Session): Record<string, unknown> | null {
  const self = characterForSession(session);
  if (!self) return null;
  const players = [...sessions.values()]
    .map((candidate) => ({ session: candidate, character: characterForSession(candidate) }))
    .filter((entry): entry is { session: Session; character: CharacterRecord } => Boolean(entry.character) && entry.session.socket?.readyState === WebSocket.OPEN)
    .map(({ character }) => ({ id: character.id, name: character.name, x: character.x, y: character.y, level: character.level }));
  return {
    tick: serverTick,
    serverTime: Date.now(),
    self: { id: self.id, x: self.x, y: self.y, level: self.level },
    players,
  };
}

function send(ws: WebSocket, type: string, payload: unknown, requestId?: string): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ protocolVersion: 1, type, requestId, payload }));
}

function rejectCommand(ws: WebSocket, requestId: string | undefined, code: string): void {
  send(ws, "command.error", { code }, requestId);
}

function handleMessage(session: Session, raw: RawData): void {
  if (raw.toString().length > 16_000) return rejectCommand(session.socket!, undefined, "payload-too-large");
  let message: ProtocolMessage;
  try {
    message = JSON.parse(raw.toString()) as ProtocolMessage;
  } catch {
    return rejectCommand(session.socket!, undefined, "invalid-json");
  }
  if (message.protocolVersion !== 1 || typeof message.type !== "string") return rejectCommand(session.socket!, message.requestId, "invalid-protocol");
  const payload = message.payload ?? {};
  if (message.type === "world.input") {
    const sequence = Number(payload.sequence);
    const axisX = clamp(Number(payload.axisX), -1, 1);
    const axisY = clamp(Number(payload.axisY), -1, 1);
    if (!Number.isFinite(sequence) || !Number.isFinite(axisX) || !Number.isFinite(axisY) || sequence <= session.inputSequence) return rejectCommand(session.socket!, message.requestId, "invalid-input");
    session.inputSequence = sequence;
    session.axisX = axisX;
    session.axisY = axisY;
    return;
  }
  if (message.type === "session.resync") {
    const snapshot = snapshotFor(session);
    if (snapshot) send(session.socket!, "world.snapshot", snapshot, message.requestId);
    return;
  }
  if (message.type === "combat.cast") {
    const skillId = typeof payload.skillId === "string" ? payload.skillId : "";
    if (!["skill1", "skill2", "ultimate"].includes(skillId)) return rejectCommand(session.socket!, message.requestId, "unknown-skill");
    send(session.socket!, "combat.accepted", { skillId, serverTick }, message.requestId);
    return;
  }
  if (message.type === "ping") {
    send(session.socket!, "pong", { serverTime: Date.now() }, message.requestId);
    return;
  }
  rejectCommand(session.socket!, message.requestId, "unknown-command");
}

function tick(): void {
  serverTick += 1;
  for (const session of sessions.values()) {
    const character = characterForSession(session);
    if (!character) continue;
    const length = Math.hypot(session.axisX, session.axisY);
    if (length > 0) {
      const speed = 165;
      character.x = clamp(character.x + (session.axisX / length) * speed * (TICK_MS / 1000), 40, WORLD_WIDTH - 40);
      character.y = clamp(character.y + (session.axisY / length) * speed * (TICK_MS / 1000), 40, WORLD_HEIGHT - 40);
      character.lastSeenAt = nowIso();
      storeDirty = true;
    }
    if (serverTick % 2 === 0 && session.socket) {
      const snapshot = snapshotFor(session);
      if (snapshot) send(session.socket, "world.snapshot", snapshot);
    }
  }
}

async function handleHttp(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse): Promise<void> {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (req.method === "GET" && url.pathname === "/api/health/live") return json(res, 200, { status: "ok", service: "game-server" });
  if (req.method === "GET" && url.pathname === "/api/health/ready") return json(res, storeReady ? 200 : 503, { status: storeReady ? "ready" : "starting", persistence: DATA_FILE });
  if (req.method === "GET" && url.pathname === "/api/content/manifest") return json(res, 200, { protocolVersion: 1, contentVersion: "prototype-p3", mapIds: ["bamboo-forest"], maxPartySize: 1 });
  if (req.method === "POST" && url.pathname === "/api/auth/guest") {
    const raw = await readBody(req);
    let body: Record<string, unknown> = {};
    if (raw) {
      try { body = JSON.parse(raw) as Record<string, unknown>; } catch { return json(res, 400, { error: "invalid-json" }); }
    }
    return json(res, 200, createGuest(safeName(body.name), typeof body.resumeToken === "string" ? body.resumeToken : null));
  }
  const session = sessionForToken(bearer(req));
  if (req.method === "GET" && url.pathname === "/api/characters") {
    if (!session) return json(res, 401, { error: "unauthorized" });
    const character = characterForSession(session);
    return character ? json(res, 200, { characters: [character] }) : json(res, 404, { error: "character-not-found" });
  }
  return json(res, 404, { error: "not-found" });
}

await loadStore();
const server = createServer((req, res) => {
  void handleHttp(req, res).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "internal-error";
    if (!res.headersSent) json(res, 500, { error: message });
    else res.end();
  });
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 16_000 });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname !== "/ws") return socket.destroy();
  const session = sessionForToken(url.searchParams.get("ticket"));
  if (!session) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, session));
});

wss.on("connection", (ws: WebSocket, session: Session) => {
  session.socket?.close(4001, "session-replaced");
  session.socket = ws;
  const initial = snapshotFor(session);
  if (initial) send(ws, "world.snapshot", initial);
  ws.on("message", (message) => handleMessage(session, message));
  ws.on("close", () => {
    if (session.socket === ws) {
      session.socket = null;
      session.axisX = 0;
      session.axisY = 0;
      storeDirty = true;
    }
  });
  ws.on("error", () => {
    if (session.socket === ws) session.socket = null;
  });
});

setInterval(tick, TICK_MS);
setInterval(() => { void persistStore(); }, 5000);
process.on("SIGINT", () => { void persistStore().finally(() => server.close(() => process.exit(0))); });
process.on("SIGTERM", () => { void persistStore().finally(() => server.close(() => process.exit(0))); });

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Giang Hồ server listening on 0.0.0.0:${PORT}`);
  console.log(`Persistent store: ${DATA_FILE}`);
});
