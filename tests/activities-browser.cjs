const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const click = (page, selector) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => el.click());
const step = (page, ms = 100) =>
  page.evaluate((ms) => window.advanceGame(ms), ms);
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const save = async (page) => {
  await click(page, "#save-btn");
  return read(page);
};
async function seed(page, edit) {
  const data = await save(page);
  edit(data);
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      document.querySelector("#load-btn").click();
    },
    { key, data },
  );
  await step(page);
  return save(page);
}
const close = (page) => click(page, "#utility-close");
const events = (page) => click(page, "[data-open-events]");
const siege = (page) => click(page, "[data-open-siege]");
async function startSiege(page, city = "hoang-thanh", size = 6) {
  await siege(page);
  await page.locator("#siege-city").selectOption(city);
  await page.locator("#siege-size").selectOption(String(size));
  await click(page, "[data-start-siege]");
  await step(page);
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir("/tmp/volam-v18", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      const frames = new Map();
      window.wallClock =
        Number(sessionStorage.getItem("v18-clock")) || 1801600000000;
      Date.now = () => window.wallClock;
      Object.defineProperty(performance, "now", { value: () => time });
      window.randomSamples = [];
      Math.random = () =>
        window.randomSamples.length ? window.randomSamples.shift() : 0.5;
      window.requestAnimationFrame = (cb) => {
        const id = ++serial;
        frames.set(id, cb);
        return id;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      window.advanceGame = (ms) => {
        while (ms > 0) {
          const dt = Math.min(25, ms);
          time += dt;
          window.wallClock += dt;
          ms -= dt;
          const callbacks = [...frames.values()];
          frames.clear();
          callbacks.forEach((cb) => cb(time));
        }
        sessionStorage.setItem("v18-clock", String(window.wallClock));
      };
      window.botPositions = {};
      window.botDamageDraws = 0;
      window.heroRotations = [];
      const p = CanvasRenderingContext2D.prototype,
        clear = p.clearRect,
        translate = p.translate,
        text = p.fillText,
        rotate = p.rotate;
      p.clearRect = function (...a) {
        if (this.canvas.id === "game-canvas") this.nextCamera = true;
        return clear.apply(this, a);
      };
      p.translate = function (x, y) {
        if (this.nextCamera) {
          window.camera = { x: -x, y: -y };
          this.nextCamera = false;
        }
        return translate.call(this, x, y);
      };
      p.fillText = function (t, x, y, ...rest) {
        if (this.canvas.id === "game-canvas") {
          if (/ · BOT$/.test(t)) window.botPositions[t] = { x, y };
          if (String(t).startsWith("-") && this.fillStyle === "#95d8c1")
            window.botDamageDraws++;
        }
        return text.call(this, t, x, y, ...rest);
      };
      p.rotate = function (angle) {
        if (this.canvas.id === "game-canvas" && Math.abs(angle) > 0.05)
          window.heroRotations.push(angle);
        return rotate.call(this, angle);
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(url))
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("data-version"),
      "0.29.0",
    );
    await click(page, '[data-faction="gaibang"]');
    await click(page, "#join-sect");
    await step(page);
    await seed(page, (data) => {
      data.player.gold = 10000;
      Object.assign(data.player.idle, {
        enabled: false,
        inTown: true,
        autoSkills: false,
        autoEquip: false,
        autoLoot: false,
      });
    });
    const idlePositions = await page.evaluate(() =>
      structuredClone(window.botPositions),
    );
    await step(page, 1500);
    assert.notDeepEqual(
      await page.evaluate(() => window.botPositions),
      idlePositions,
      "ambient bots must walk even inside town",
    );

    await events(page);
    await page.evaluate(() => (window.randomSamples = [0.5]));
    await click(page, '[data-play-lucky="wheel"]');
    let data = await read(page);
    assert.equal(data.player.gold, 10030);
    assert.equal(data.player.lucky.history[0].silver, 80);
    assert.equal(
      await page.locator("#lucky-result").textContent(),
      "Đang mở thưởng…",
    );
    await click(page, '[data-play-lucky="wheel"]');
    assert.equal((await read(page)).player.lucky.nextRound, 2);
    await page.reload({ waitUntil: "networkidle" });
    await step(page);
    await events(page);
    assert.equal((await read(page)).player.gold, 10030);
    assert.equal(
      await page.locator('[data-play-lucky="wheel"]').isDisabled(),
      true,
    );
    await step(page, 2300);
    assert.match(await page.locator("#lucky-result").textContent(), /80 bạc/);
    await page.screenshot({ path: "/tmp/volam-v18/wheel-mobile.png" });
    await click(page, '[data-lucky-tab="dice"]');
    await page.locator("#event-stake").fill("50");
    await page.evaluate(() => (window.randomSamples = [0.9, 0.7, 0.5]));
    await click(page, '[data-play-lucky="dice"]');
    await step(page, 2300);
    assert.equal((await read(page)).player.gold, 10080);
    assert.match(
      await page.locator("#lucky-result").textContent(),
      /15 điểm · Tài/,
    );
    await page.locator("#event-choice").selectOption("xiu");
    await page.evaluate(() => (window.randomSamples = [0, 0, 0]));
    await click(page, '[data-play-lucky="dice"]');
    await step(page, 2300);
    assert.equal((await read(page)).player.gold, 10030);
    assert.match(
      await page.locator("#lucky-result").textContent(),
      /Bộ ba đồng số/,
    );
    await click(page, '[data-lucky-tab="lottery"]');
    await page.locator("#event-choice").fill("07");
    await page.locator("#event-stake").fill("10");
    await page.evaluate(() => (window.randomSamples = [0, 0.7]));
    await click(page, '[data-play-lucky="lottery"]');
    await step(page, 2300);
    assert.equal((await read(page)).player.gold, 10920);
    assert.equal((await read(page)).player.lucky.history[0].result, "07");
    await page.locator("#event-stake").fill("1.5");
    await click(page, '[data-play-lucky="lottery"]');
    assert.equal((await read(page)).player.gold, 10920);
    await page.locator("#event-stake").fill("10");
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw new Error("quota-test");
      };
    });
    await click(page, '[data-play-lucky="lottery"]');
    await page.evaluate(
      () => (Storage.prototype.setItem = window.originalSetItem),
    );
    await close(page);
    data = await save(page);
    assert.equal(data.player.gold, 10920);
    assert.equal(
      data.player.lucky.nextRound,
      5,
      "a failed save must roll back the bet and outcome",
    );

    await click(page, "[data-open-bots]");
    assert.equal(await page.locator(".bot-roster article").count(), 10);
    await page.screenshot({ path: "/tmp/volam-v18/bots-mobile.png" });
    await close(page);
    await seed(page, (data) => {
      Object.assign(data.player.idle, {
        enabled: true,
        inTown: false,
        autoSkills: false,
        autoEquip: false,
        autoLoot: false,
        stage: 1,
      });
      data.player.botSettings = { enabled: true, assist: true };
    });
    await click(page, "#mobile-auto");
    await page.evaluate(() => (window.botDamageDraws = 0));
    await step(page, 6500);
    assert.ok(
      (await page.evaluate(() => window.botDamageDraws)) > 0,
      "support bots must land real attacks while player Auto is off",
    );
    await seed(page, (data) => {
      Object.assign(data.player.idle, {
        enabled: false,
        inTown: true,
        autoSkills: true,
        autoPotions: true,
      });
      data.player.botSettings = { enabled: true, assist: false };
      data.player.level = 1;
      data.player.hp = data.player.maxHp = 50000;
      data.player.mp = data.player.maxMp = 50000;
    });
    const before = await save(page);
    await startSiege(page);
    assert.ok((await read(page)).player.sieges.pending);
    assert.match(await page.locator("#siege-clock").textContent(), /BOT 6\/6/);
    await click(page, '[data-siege-order="guard"]');
    assert.equal(
      await page
        .locator('#siege-orders [data-siege-order="guard"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    await click(page, '[data-siege-order="push"]');
    await step(page, 5000);
    await page.screenshot({ path: "/tmp/volam-v18/siege-mobile.png" });
    const phases = new Set();
    for (let i = 0; i < 24; i++) {
      phases.add(await page.locator("#siege-phase").textContent());
      await step(page, 10000);
      if (!(await page.locator("#siege-hud").isVisible())) break;
    }
    data = await save(page);
    console.log("First siege:", data.player.sieges.history[0], "phases", [
      ...phases,
    ]);
    assert.equal(
      data.player.sieges.history[0].outcome,
      "victory",
      "balanced level-1 party should be able to finish all objectives",
    );
    assert.ok(phases.has("Đoạt chiến kỳ") && phases.has("Hạ Thống lĩnh"));
    assert.equal(data.player.sieges.victories, 1);
    assert.deepEqual(data.player.military, before.player.military);
    assert.equal(data.player.gold, before.player.gold + 106);
    assert.equal(data.player.refiningStones, before.player.refiningStones + 2);
    await close(page);
    await startSiege(page, "hoang-thanh", 3);
    await click(page, '[data-siege-order="rally"]');
    await click(page, "#town-btn");
    data = await save(page);
    assert.equal(data.player.sieges.history[0].outcome, "retreat");
    assert.equal(data.player.sieges.history[0].silver, 0);
    assert.equal(data.player.sieges.victories, 1);
    await startSiege(page, "hoang-thanh", 9);
    await page.reload({ waitUntil: "networkidle" });
    await step(page);
    data = await save(page);
    assert.equal(data.player.sieges.history[0].outcome, "interrupted");
    assert.equal(data.player.sieges.pending, undefined);
    assert.equal(data.player.sieges.victories, 1);
    await siege(page);
    assert.equal(await page.locator("[data-start-siege]").isDisabled(), false);
    await close(page);
    await startSiege(page, "hoang-thanh", 6);
    await click(page, "#mobile-auto");
    await click(page, '[data-siege-order="rally"]');
    await step(page, 240100);
    data = await save(page);
    assert.equal(data.player.sieges.history[0].outcome, "timeout");
    assert.equal(data.player.sieges.history[0].silver, 0);
    assert.equal(data.player.sieges.victories, 1);
    // Older saves receive empty event/AI/siege state while equipment and currencies survive.
    const oldItems = JSON.stringify(data.player.equipment),
      oldGold = data.player.gold;
    await seed(page, (old) => {
      delete old.player.lucky;
      delete old.player.botSettings;
      delete old.player.sieges;
    });
    data = await save(page);
    assert.equal(data.player.gold, oldGold);
    assert.equal(JSON.stringify(data.player.equipment), oldItems);
    assert.deepEqual(data.player.sieges, {
      nextBattle: 1,
      victories: 0,
      history: [],
    });
    assert.deepEqual(data.player.botSettings, { enabled: true, assist: false, pvp: true });
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 844, height: 390 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await events(page);
      await step(page);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      );
      await page.screenshot({
        path: `/tmp/volam-v18/events-${viewport.width}.png`,
      });
      await close(page);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS v0.19: saved event payouts/cooldown/reload/quota rollback; walking bots; real support damage; level-1 siege victory, commands, retreat, timeout and reload; old-save migration; responsive UI.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
