const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const click = async (p, s) => {
  await p.locator(s).evaluate((e) => e.click());
  if (
    s === '[data-idle-tab="log"]' &&
    (await p.locator("#world-panel-close").isVisible())
  )
    await p.locator("#world-panel-close").evaluate((e) => e.click());
};
const read = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const advance = (p, ms) => p.evaluate((ms) => window.advance(ms), ms);
async function seed(p, edit) {
  await click(p, "#save-btn");
  const d = await read(p);
  edit(d);
  await p.evaluate(
    ({ key, d }) => {
      localStorage.setItem(key, JSON.stringify(d));
      document.querySelector("#load-btn").click();
      if (
        document.querySelector("#mobile-auto").getAttribute("aria-pressed") ===
        "true"
      )
        document.querySelector("#mobile-auto").click();
    },
    { key, d },
  );
  await advance(p, 200);
  return read(p);
}
async function command(p, value) {
  await p.locator("#chat-input").fill(value);
  await p.locator("#chat-input").press("Enter");
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      let time = 10000,
        id = 0;
      const callbacks = new Map();
      window.wall = Date.now();
      const real = Date.now;
      Date.now = () => window.wall;
      performance.now = () => time;
      requestAnimationFrame = (cb) => {
        callbacks.set(++id, cb);
        return id;
      };
      cancelAnimationFrame = (id) => callbacks.delete(id);
      Math.random = () => 0.5;
      window.advance = (ms) => {
        while (ms > 0) {
          const dt = Math.min(ms, 50);
          time += dt;
          window.wall += dt;
          ms -= dt;
          const batch = [...callbacks.values()];
          callbacks.clear();
          batch.forEach((cb) => cb(time));
        }
      };
      window.draws = 0;
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        if (this.canvas.id === "game-canvas") window.draws++;
        return draw.apply(this, args);
      };
    });
    const p = await context.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await p.locator("html").getAttribute("data-version"),
      "0.28.0",
    );
    await click(p, '[data-faction="tianwang"]');
    await click(p, "#join-sect");
    await advance(p, 200);
    const d = await seed(p, (s) => {
      s.player.name = "Lữ khách chat";
      s.player.level = 160;
      s.player.preferences.xpMultiplier = 1000;
      s.player.idle.speed = 2.5;
      s.player.idle.inTown = true;
      delete s.player.experienceBuff;
    });
    assert.equal(d.player.level, 160);
    assert.equal(d.player.experienceBuff, 1);
    assert.equal("xpMultiplier" in d.player.preferences, false);
    assert.equal("speed" in d.player.idle, false);
    assert.equal(await p.locator("#game-speed,#xp-multiplier").count(), 0);
    await click(p, "#chat-toggle");
    const pos = await read(p);
    await p.locator("#chat-input").pressSequentially("wasd 123");
    await advance(p, 500);
    await click(p, "#save-btn");
    const typed = await read(p);
    assert.equal(typed.player.x, pos.player.x);
    assert.equal(typed.player.y, pos.player.y);
    await command(p, "<img src=x onerror=alert(1)>");
    assert.equal(await p.locator("#chat-messages img").count(), 0);
    assert.ok(
      (await p.locator("#chat-messages").textContent()).includes("<img src=x"),
    );
    await advance(p, 1600);
    assert.ok((await p.locator("#chat-messages .chat-bot").count()) > 0);
    await command(p, "/kn 7");
    assert.equal((await read(p)).player.experienceBuff, 7);
    assert.match(await p.locator("#xp-label").textContent(), /x7/);
    for (const bad of ["/kn -1", "/kn 0", "/kn 1001", "/kn 1.5", "/speed 2"]) {
      await command(p, bad);
      assert.equal((await read(p)).player.experienceBuff, 7);
    }
    await p.evaluate(() => {
      window.originalSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === "giang-ho-di-truyen-prototype") throw Error("quota");
        return window.originalSet.call(this, k, v);
      };
    });
    await command(p, "/kn 100");
    assert.match(
      await p.locator("#chat-preview").textContent(),
      /Không lưu được/,
    );
    await p.evaluate(() => (Storage.prototype.setItem = window.originalSet));
    await click(p, "#save-btn");
    assert.equal((await read(p)).player.experienceBuff, 7);
    await p.reload({ waitUntil: "networkidle" });
    await advance(p, 200);
    assert.equal((await read(p)).player.experienceBuff, 7);
    await click(p, "#chat-toggle");
    await command(p, "/kn 1");
    assert.equal((await read(p)).player.experienceBuff, 1);
    console.log(
      "PASS chat text safety, bot reply, keyboard isolation, XP command validation, quota rollback and save migration/reload",
    );
    // Never save a half-completed dungeon when editing the chat buff.
    await seed(p, (s) => {
      s.player.idle.inTown = true;
      s.player.experienceBuff = 1;
      s.player.attack = 10000;
      s.player.defense = 10000;
    });
    await click(p, '[data-idle-tab="inv"]');
    await click(p, '[data-tab="dungeon"]');
    await click(p, '[data-dungeon-action="enter"][data-dungeon-id="tomb"]');
    const world = await read(p);
    await click(p, '[data-idle-tab="log"]');
    if (
      (await p.locator("#chat-toggle").getAttribute("aria-expanded")) !== "true"
    )
      await click(p, "#chat-toggle");
    await command(p, "/kn 9");
    const encounterSave = await read(p);
    assert.equal(encounterSave.player.experienceBuff, 9);
    encounterSave.player.experienceBuff = world.player.experienceBuff;
    assert.deepEqual(encounterSave, world);
    await p.reload({ waitUntil: "networkidle" });
    await advance(p, 200);
    assert.equal((await read(p)).player.experienceBuff, 9);
    console.log(
      "PASS command inside dungeon updates only the pre-encounter buff, retaining world snapshot",
    );
    // Hidden map stops drawing; stat cells retain identity until visible refresh.
    await p.evaluate(() => {
      window.statNode = document.querySelector("#stat-grid").firstElementChild;
      window.draws = 0;
    });
    await advance(p, 1000);
    assert.equal(
      await p.evaluate(
        () =>
          window.statNode ===
          document.querySelector("#stat-grid").firstElementChild,
      ),
      true,
    );
    await click(p, '[data-idle-tab="more"]');
    await p.evaluate(() => (window.draws = 0));
    await advance(p, 2000);
    assert.equal(await p.evaluate(() => window.draws), 0);
    console.log(
      "PASS hidden sheets do not redraw map, and closed character stats are not rebuilt every HUD tick",
    );
    await click(p, '[data-idle-tab="log"]');
    await click(p, "#chat-toggle");
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
      [1280, 900],
    ]) {
      await p.setViewportSize({ width, height });
      await p.waitForTimeout(80);
      await advance(p, 100);
      const fit = await p.locator("#mobile-chat").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return {
          fits:
            r.left >= 0 &&
            r.top >= 0 &&
            r.right <= innerWidth &&
            r.bottom <= innerHeight,
          font: getComputedStyle(document.querySelector("#chat-input"))
            .fontSize,
          scale: visualViewport.scale,
          scroll: document.documentElement.scrollWidth,
        };
      });
      assert.equal(fit.fits, true);
      assert.equal(fit.font, "16px");
      assert.equal(fit.scale, 1);
      assert.equal(fit.scroll, width);
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(80);
    await advance(p, 100);
    await p.screenshot({ path: "/tmp/volam-v28-chat.png" });
    assert.deepEqual(errors, []);
    console.log("PASS chat fits four viewports without zoom or page errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
