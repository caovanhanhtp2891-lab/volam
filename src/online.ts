import { validChatMessage, type ChatMessage } from "./chat";
export type OnlineStatus = "offline" | "connecting" | "online";

export interface OnlineSnapshot {
  tick: number;
  serverTime: number;
  self: {
    id: string;
    x: number;
    y: number;
    level: number;
  };
  players: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    level: number;
    hostile?: boolean;
    teammate?: boolean;
    hp?: number;
    maxHp?: number;
  }>;
}

interface GuestResponse {
  sessionToken: string;
  accountId: string;
  characterId: string;
}

interface OnlineClientOptions {
  onChat?: (message: ChatMessage) => void;
  onChatError?: (code: string) => void;
  onStatus: (status: OnlineStatus, detail?: string) => void;
  onSnapshot: (snapshot: OnlineSnapshot) => void;
}

const TOKEN_KEY = "giang-ho-di-truyen-online-token";

export class OnlineClient {
  private readonly options: OnlineClientOptions;
  private socket: WebSocket | null = null;
  private sessionToken = "";
  private lastInputAt = 0;
  private inputSequence = 0;
  private status: OnlineStatus = "offline";

  public constructor(options: OnlineClientOptions) {
    this.options = options;
  }

  public getStatus(): OnlineStatus {
    return this.status;
  }

  private setStatus(status: OnlineStatus, detail?: string): void {
    this.status = status;
    this.options.onStatus(status, detail);
  }

  private apiBase(): string {
    const configured = (globalThis as typeof globalThis & { __GAME_API_BASE__?: string }).__GAME_API_BASE__;
    if (configured) return configured.replace(/\/$/, "");
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return "http://127.0.0.1:8787";
    return location.origin;
  }

  private websocketBase(): string {
    return this.apiBase().replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  }

  public async connect(characterName: string): Promise<void> {
    if (this.status === "connecting" || this.status === "online") return;
    this.setStatus("connecting");
    try {
      const resumeToken = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${this.apiBase()}/api/auth/guest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: characterName, resumeToken }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const guest = (await response.json()) as GuestResponse;
      this.sessionToken = guest.sessionToken;
      localStorage.setItem(TOKEN_KEY, guest.sessionToken);
      const socket = new WebSocket(`${this.websocketBase()}/ws?ticket=${encodeURIComponent(guest.sessionToken)}`);
      this.socket = socket;
      socket.addEventListener("open", () => this.setStatus("online"));
      socket.addEventListener("message", (event) => this.handleMessage(event.data));
      socket.addEventListener("error", () => this.setStatus("offline", "Không kết nối được WebSocket"));
      socket.addEventListener("close", () => {
        this.socket = null;
        if (this.status !== "offline") this.setStatus("offline", "Kết nối đã đóng");
      });
    } catch (error) {
      this.socket = null;
      this.setStatus("offline", error instanceof Error ? error.message : "Không kết nối được máy chủ");
    }
  }

  public disconnect(): void {
    this.socket?.close(1000, "client disconnect");
    this.socket = null;
    this.setStatus("offline");
  }

  public sendInput(axisX: number, axisY: number): void {
    const now = performance.now();
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || now - this.lastInputAt < 45) return;
    this.lastInputAt = now;
    this.inputSequence += 1;
    this.send({ type: "world.input", requestId: `input-${this.inputSequence}`, payload: { sequence: this.inputSequence, axisX, axisY } });
  }

  public sendSkill(skillId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.send({ type: "combat.cast", requestId: `cast-${Date.now()}-${this.inputSequence}`, payload: { skillId } });
  }

  public sendChat(text: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.send({ type: "chat.send", requestId: `chat-${crypto.randomUUID()}`, payload: { text } });
    return true;
  }

  private send(message: { type: string; requestId: string; payload: Record<string, unknown> }): void {
    this.socket?.send(JSON.stringify({ protocolVersion: 1, ...message }));
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;
    try {
      const message = JSON.parse(raw) as { type?: string; requestId?: string; payload?: unknown };
      if (message.type === "world.snapshot" && message.payload) this.options.onSnapshot(message.payload as OnlineSnapshot);
      else if (message.type === "chat.message" && validChatMessage(message.payload)) this.options.onChat?.(message.payload);
      else if (message.type === "command.error" && message.requestId?.startsWith("chat-")) this.options.onChatError?.((message.payload as { code?: string })?.code ?? "chat-error");
    } catch {
      this.setStatus("offline", "Snapshot không hợp lệ");
    }
  }
}
