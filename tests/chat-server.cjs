const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdtemp, rm } = require("node:fs/promises");
const { once } = require("node:events");
const { WebSocket } = require("ws");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const base = "http://127.0.0.1:8788",
  url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const dir = await mkdtemp("/tmp/volam-chat-server-");
  const child = spawn(process.execPath, ["dist-server/index.js"], {
    env: { ...process.env, GAME_SERVER_PORT: "8788", GAME_DATA_DIR: dir },
    stdio: "ignore",
  });
  const sockets = [];
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        ready = (await fetch(base + "/api/health/ready")).ok;
        if (ready) break;
      } catch {}
      await delay(100);
    }
    assert.equal(ready, true);
    async function client(name) {
      const auth = await (
        await fetch(base + "/api/auth/guest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        })
      ).json();
      const ws = new WebSocket(
        base.replace("http", "ws") + "/ws?ticket=" + auth.sessionToken,
      );
      const messages = [];
      ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
      await once(ws, "open");
      sockets.push(ws);
      return { ws, messages };
    }
    const a = await client("Kiếm khách"),
      b = await client("Đạo sĩ");
    const send = (c, text, requestId = "chat-test") =>
      c.ws.send(
        JSON.stringify({
          protocolVersion: 1,
          type: "chat.send",
          requestId,
          payload: { text, name: "Mạo danh", kind: "system" },
        }),
      );
    send(a, "Xin chào giang hồ");
    for (
      let i = 0;
      i < 20 && !b.messages.some((m) => m.type === "chat.message");
      i++
    )
      await delay(30);
    const ma = a.messages.find((m) => m.type === "chat.message").payload,
      mb = b.messages.find((m) => m.type === "chat.message").payload;
    assert.deepEqual(ma, mb);
    assert.equal(ma.name, "Kiếm khách");
    assert.equal(ma.kind, "player");
    assert.equal(ma.text, "Xin chào giang hồ");
    send(a, "Spam", "chat-fast");
    await delay(80);
    assert.ok(
      a.messages.some(
        (m) =>
          m.requestId === "chat-fast" && m.payload.code === "chat-rate-limit",
      ),
    );
    for (const [i, text] of ["/kn 100", "a".repeat(161), "bad\0text"].entries())
      send(b, text, "chat-invalid-" + i);
    await delay(100);
    assert.equal(
      b.messages.filter((m) => m.payload.code === "chat-invalid").length,
      3,
    );
    assert.equal(a.messages.filter((m) => m.type === "chat.message").length, 1);
    console.log(
      "PASS authenticated two-client relay, authoritative names, rate limit and invalid/command rejection",
    );
    browser = await chromium.launch({
      executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
      headless: true,
      args: ["--no-sandbox"],
    });
    const ctx = await browser.newContext();
    await ctx.addInitScript(
      () => (window.__GAME_API_BASE__ = "http://127.0.0.1:8788"),
    );
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: "networkidle" });
    await p.locator('[data-faction="tianwang"]').click();
    await p.locator("#join-sect").click();
    await p.locator("#online-btn").evaluate((e) => e.click());
    await p.waitForFunction(
      () =>
        document.querySelector("#connection-pill").dataset.status === "online",
    );
    await p.locator("#chat-toggle").click();
    await p.locator("#chat-input").fill("Tin nhắn từ trình duyệt");
    await p.locator("#chat-input").press("Enter");
    await p.waitForFunction(() =>
      document
        .querySelector("#chat-messages")
        .textContent.includes("Tin nhắn từ trình duyệt"),
    );
    assert.match(await p.locator("#chat-mode").textContent(), /Online/);
    assert.equal(await p.locator("#chat-messages .chat-player").count(), 1);
    await p.locator("#chat-input").fill("/kn 7");
    await p.locator("#chat-input").press("Enter");
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("giang-ho-di-truyen-prototype"))
            .player.experienceBuff,
      ),
      7,
    );
    assert.equal(
      b.messages.filter(
        (m) => m.type === "chat.message" && m.payload.text.startsWith("/kn"),
      ).length,
      0,
    );
    console.log(
      "PASS browser chat sends and receives WebSocket echo exactly once; /kn stays local to the character",
    );
  } finally {
    await browser?.close();
    for (const ws of sockets) ws.terminate();
    child.kill("SIGKILL");
    await once(child, "exit");
    await rm(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
