const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const captures = process.env.VOLAM_CAPTURE_DIR || "/tmp/volam-regions-rarity";
const click = (page, selector) =>
  page.locator(selector).evaluate((el) => el.click());
const step = (page, ms = 100) =>
  page.evaluate((ms) => window.advanceGame(ms), ms);
async function save(page) {
  await click(page, "#save-btn");
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
}
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
}
async function map(page) {
  const world = page.locator(".world-panel");
  if (await world.isVisible()) await click(page, "#world-panel-close");
  else if (
    (await page.locator(".app-shell").getAttribute("data-page")) !== "log"
  )
    await click(page, '[data-idle-tab="log"]');
  await page.locator("#travel-map-btn").click();
}
(async () => {
  const { RARITIES, RARITY_COLORS } = await import("../src/equipment.ts");
  const { REGIONS } = await import("../src/idle.ts");
  const { rollGearBonuses } = await import("../src/equipment.ts");
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir(captures, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      const frames = new Map();
      Object.defineProperty(performance, "now", { value: () => time });
      window.requestAnimationFrame = (cb) => {
        const id = ++serial;
        frames.set(id, cb);
        return id;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      Math.random = () => window.dropRoll ?? 0.5;
      window.mapFrames = [];
      window.redStrokes = {};
      const proto = CanvasRenderingContext2D.prototype;
      const draw = proto.drawImage;
      proto.drawImage = function (source, ...args) {
        if (
          source instanceof HTMLImageElement &&
          source.src.includes("training-regions") &&
          args.length === 8
        )
          window.mapFrames.push(args.slice(0, 4).join("/"));
        return draw.call(this, source, ...args);
      };
      const stroke = proto.stroke;
      proto.stroke = function (...args) {
        if (this.strokeStyle === "#ff405d")
          window.redStrokes[this.canvas.id] =
            (window.redStrokes[this.canvas.id] ?? 0) + 1;
        return stroke.apply(this, args);
      };
      window.advanceGame = (ms) => {
        while (ms > 0) {
          const dt = Math.min(25, ms);
          time += dt;
          ms -= dt;
          const callbacks = [...frames.values()];
          frames.clear();
          callbacks.forEach((cb) => cb(time));
        }
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("data-version"),
      "0.16.0",
    );
    await page.locator('[data-faction="gaibang"]').click();
    await page.locator("#join-sect").click();
    await seed(page, (s) => {
      Object.assign(s.player, { level: 10, attack: 0, defense: 1000000 });
      Object.assign(s.player.idle, {
        stage: 1,
        maxStage: 1,
        wave: 3,
        inTown: true,
        autoEquip: false,
        autoLoot: false,
        autoSkills: false,
      });
    });
    await map(page);
    assert.equal(
      await page.locator('.travel-atlas [data-region="1"]').isDisabled(),
      true,
    );
    await click(page, '.travel-atlas [data-region="1"]');
    assert.equal((await save(page)).player.idle.stage, 1);
    await click(page, "#utility-close");
    await seed(page, (s) => {
      s.player.level = 11;
    });
    await map(page);
    await page.locator('.travel-atlas [data-region="1"]').click();
    await step(page);
    const moved = await save(page);
    assert.equal(moved.player.idle.stage, 11);
    assert.equal(moved.player.idle.inTown, false);
    assert.equal(moved.player.idle.wave, 1);
    assert.match(
      await page.locator("#mobile-map-name").textContent(),
      /KIẾM CÁC TÂY BẮC/,
    );
    await click(page, "#load-btn");
    await step(page);
    assert.equal((await save(page)).player.idle.stage, 11);
    console.log(
      "PASS level 10 locked, level 11 moves from town into a live new region without clearing boss; save/reload retains it",
    );

    await seed(page, (s) => {
      s.player.level = 12;
      s.player.idle.maxStage = 1;
      s.player.idle.stage = 1;
      s.player.idle.enabled = false;
      s.player.idle.inTown = false;
    });
    await map(page);
    await page.locator("#travel-stage").selectOption("12");
    await page.locator("#travel-stage-go").click();
    await step(page);
    const stage12 = await save(page);
    assert.equal(stage12.player.idle.stage, 12);
    assert.equal(stage12.player.idle.enabled, true);
    console.log(
      "PASS legacy adventure character enters stage 12 directly when level 12; not limited to the region entrance",
    );

    await seed(page, (s) => {
      s.player.level = 160;
      s.player.idle.inTown = true;
    });
    for (let region = 0; region < 16; region++) {
      await map(page);
      assert.equal(
        await page.locator(".travel-atlas .region-thumbnail").count(),
        16,
      );
      await page.locator(`.travel-atlas [data-region="${region}"]`).click();
      await step(page);
      assert.equal((await save(page)).player.idle.stage, region * 10 + 1);
      assert.equal((await save(page)).player.idle.inTown, false);
      assert.ok(
        (await page.locator("#mobile-map-name").textContent()).includes(
          REGIONS[region].toLocaleUpperCase("vi"),
        ),
      );
      if ([0, 2, 12, 15].includes(region))
        await page.screenshot({ path: `${captures}/region-${region}.png` });
    }
    assert.equal(
      await page.evaluate(() => new Set(window.mapFrames).size),
      16,
      "real canvas painter must crop all sixteen different map tiles",
    );
    await map(page);
    await page.locator("#travel-stage").selectOption("160");
    await page.locator("#travel-stage-go").click();
    await step(page);
    assert.equal((await save(page)).player.idle.stage, 160);
    await map(page);
    await page.screenshot({ path: `${captures}/map-atlas-mobile.png` });
    await click(page, "#utility-close");
    console.log(
      "PASS all sixteen actual painted map cells and final stage 160, with four arena screenshots",
    );

    // Earn red through the actual boss-kill loot path, rather than injecting it.
    await seed(page, (s) => {
      s.player.level = 110;
      s.player.attack = 1000000;
      s.player.inventory = [];
      Object.assign(s.player.idle, {
        stage: 110,
        maxStage: 110,
        wave: 4,
        push: false,
        inTown: false,
        autoLoot: false,
        autoEquip: false,
        autoSkills: false,
      });
    });
    await page.evaluate(() => {
      window.dropRoll = 0;
      if (
        document.querySelector("#mobile-auto").getAttribute("aria-pressed") !==
        "true"
      )
        document.querySelector("#mobile-auto").click();
    });
    await step(page, 4500);
    let dropped = await save(page);
    const redLoot = dropped.groundLoot.find(
      (loot) =>
        loot.item?.rarity === "Thần Thoại" && loot.id.includes("stage-110-4"),
    );
    assert.ok(redLoot, "level 110 boss must roll actual red equipment");
    assert.equal(Object.keys(redLoot.item.bonuses).length, 14);
    assert.equal(redLoot.item.color, "#ff405d");
    await page.screenshot({ path: `${captures}/red-boss-drop.png` });
    await click(page, "#load-btn");
    await step(page);
    assert.ok(
      (await save(page)).groundLoot.some(
        (loot) => loot.item?.rarity === "Thần Thoại",
      ),
    );
    // Traveling collects earned loot and resets old attacks, without losing the item.
    await map(page);
    await page.locator('.travel-atlas [data-region="0"]').click();
    await step(page);
    assert.ok(
      (await save(page)).player.inventory.some(
        (item) => item.id === redLoot.item.id,
      ),
    );
    await page.evaluate(() => {
      delete window.dropRoll;
    });
    console.log(
      "PASS red drops from a real high-level boss, has 14 affixes, survives reload and is collected on map travel",
    );

    const weapon = (rarity, i) => ({
      id: `quality-${i}`,
      slot: "weapon",
      variant: "sword",
      name: `${rarity} Kiếm`,
      rarity,
      color: RARITY_COLORS[rarity],
      icon: "◆",
      level: 110,
      power: 100 + i * 30,
      enhance: 0,
      bonuses: rollGearBonuses(110, rarity, "weapon", () => 0.5),
    });
    await seed(page, (s) => {
      s.player.attack = 0;
      s.player.idle.inTown = true;
      s.player.inventory = RARITIES.map(weapon);
      s.player.equipment.weapon = weapon("Thần Thoại", 6);
    });
    await click(page, '[data-idle-tab="inv"]');
    await click(page, '[data-tab="bag"]');
    await step(page);
    for (let i = 0; i < 7; i++)
      assert.ok(
        (await page.locator(`#inventory-content .tier-${i}`).count()) > 0,
      );
    assert.ok(
      (await page.locator("#inventory-content .gear-mythic-runes").count()) > 0,
    );
    await page.screenshot({ path: `${captures}/seven-quality-bag.png` });
    await click(page, '[data-idle-tab="char"]');
    await step(page, 300);
    assert.ok(
      (await page.evaluate(() => window.redStrokes))["character-preview"] > 0,
    );
    const retained = await save(page);
    await click(page, "#load-btn");
    await step(page);
    assert.deepEqual(
      (await save(page)).player.equipment.weapon,
      retained.player.equipment.weapon,
    );
    await page.screenshot({ path: `${captures}/red-character.png` });
    await map(page);
    await page.locator('.travel-atlas [data-region="0"]').click();
    await step(page, 200);
    assert.ok(
      (await page.evaluate(() => window.redStrokes))["game-canvas"] > 0,
    );
    console.log(
      "PASS all seven visible bag tiers and red radiance in world/portrait, without enhancement, preserve gear across save/load",
    );

    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
      [1280, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await step(page);
      await map(page);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      for (const node of await page
        .locator(".travel-atlas .region-row")
        .all()) {
        const box = await node.boundingBox();
        assert.ok(box.x >= -1 && box.x + box.width <= width + 1);
      }
      await click(page, "#utility-close");
    }
    assert.deepEqual(errors, []);
    console.log("PASS map dialog fits four viewports; no page or asset errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
