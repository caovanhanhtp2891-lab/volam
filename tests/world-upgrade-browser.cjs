const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const saveKey = "giang-ho-di-truyen-prototype";

async function save(page) {
  return page.evaluate(key => {
    document.querySelector("#save-btn").click();
    return JSON.parse(localStorage.getItem(key));
  }, saveKey);
}
async function seed(page, level, inTown = true) {
  const value = await save(page);
  value.player.level = level;
  Object.assign(value.player.idle, { stage: 1, maxStage: 1, wave: 1, inTown, autoSkills: false, autoEquip: false, autoLoot: false });
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
    document.querySelector("#load-btn").click();
  }, { key: saveKey, value });
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      window.legDraws = [];
      const proto = CanvasRenderingContext2D.prototype, draw = proto.drawImage;
      proto.drawImage = function(image, ...args) {
        // Capture only the two cropped lower-body pieces of the Cái Bang atlas tile.
        if (this.canvas.id === "game-canvas" && image instanceof HTMLImageElement && image.naturalWidth === 1223 && args.length === 8 && args[0] >= 244 && args[0] < 490 && args[1] > 540 && args[1] < 643 && args[3] < 110) {
          const m = this.getTransform();
          window.legDraws.push({ source: args[0], angle: Math.atan2(m.b, m.a) });
          if (window.legDraws.length > 200) window.legDraws.shift();
        }
        return draw.call(this, image, ...args);
      };
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-faction="gaibang"]').click();
    assert.match(await page.locator(".sect-preview-description").textContent(), /Tầm đánh 360/);
    await page.locator("#join-sect").click();
    await seed(page, 10);
    await page.locator('[data-idle-tab="log"]').click();
    assert.equal(await page.locator('[data-region="1"]').isDisabled(), true);
    assert.match(await page.locator('[data-region="1"]').textContent(), /Cần cấp 11/);
    await seed(page, 11);
    assert.equal(await page.locator('[data-region="1"]').isDisabled(), false);
    assert.equal(await page.locator('[data-region="2"]').isDisabled(), true);
    await page.screenshot({ path: "/tmp/volam-level-maps.png" });
    await page.locator('[data-region="1"]').click();
    const entered = await save(page);
    assert.equal(entered.player.idle.stage, 11);
    assert.equal(entered.player.idle.maxStage, 11);
    assert.ok(entered.enemies.length > 0);
    assert.ok(entered.enemies.every(enemy => enemy.level === 11), "new region spawns stronger monsters");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await save(page)).player.idle.stage, 11);
    console.log("PASS level-11 map entry, level-21 lock, stronger monsters and save/reload");

    await page.locator('[data-idle-tab="skill"]').click();
    assert.match(await page.locator(".skill-range").first().textContent(), /Tầm đánh 360.*bán kính 100/);
    assert.match(await page.locator('[data-skill="skill1"]').getAttribute("title"), /Tầm đánh 360/);
    await page.locator('[data-show-skill-art]').click();
    assert.match(await page.locator(".skill-art-preview .skill-range").textContent(), /Tầm đánh 360/);
    await page.screenshot({ path: "/tmp/volam-dragon-skill.png" });
    await page.locator("#utility-close").click();

    await seed(page, 11, false);
    await page.locator('[data-idle-tab="log"]').click();
    if (await page.locator("#world-panel-close").isVisible()) await page.locator("#world-panel-close").click();
    if ((await page.locator("#mobile-auto").getAttribute("aria-pressed")) === "true") await page.locator("#mobile-auto").evaluate(button => button.click());
    await page.evaluate(() => { window.legDraws = []; });
    const before = (await save(page)).player;
    await page.keyboard.down("d");
    await page.waitForTimeout(700);
    await page.keyboard.up("d");
    const after = (await save(page)).player;
    assert.ok(after.x > before.x + 50);
    const legs = await page.evaluate(() => window.legDraws);
    assert.ok(legs.length > 12, "walking renders actual independent lower-body pieces");
    assert.equal(new Set(legs.map(leg => leg.source)).size, 2);
    for (const source of new Set(legs.map(leg => leg.source))) {
      const angles = legs.filter(leg => leg.source === source).map(leg => leg.angle);
      assert.ok(Math.max(...angles) - Math.min(...angles) > .1, "each leg changes its pose throughout a stride");
    }
    await page.waitForTimeout(500);
    await page.evaluate(() => { window.legDraws = []; });
    await page.waitForTimeout(200);
    assert.equal((await page.evaluate(() => window.legDraws)).length, 0, "legs stop stepping while stationary");
    await page.screenshot({ path: "/tmp/volam-larger-hero.png" });
    console.log("PASS actual movement animates both legs and stops cleanly at rest");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
