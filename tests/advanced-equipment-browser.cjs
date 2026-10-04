const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4173";
const key = "giang-ho-di-truyen-prototype";
const save = page => page.evaluate(key => { document.querySelector("#save-btn").click(); return JSON.parse(localStorage.getItem(key)); }, key);
const step = (page, milliseconds) => page.evaluate(ms => window.advanceGame(ms), milliseconds);
const gear = bonuses => ({ id: "advanced-weapon", slot: "weapon", name: "Bạo Vũ Phi Châm", variant: "poisondarts", rarity: "Hoàng Kim", color: "#ffd35a", icon: "◆", level: 5, power: 0, enhance: 0, bonuses });
async function seed(page, bonuses = {}, changes = {}) {
  const data = await save(page);
  Object.assign(data.player, { level: 5, attack: 30, defense: 0, hp: 10000, mp: 10000, x: 508, y: 330, equipment: { weapon: gear(bonuses) }, inventory: [], gold: 100000, refiningStones: 20, ...changes });
  Object.assign(data.player.idle, { enabled: false, inTown: false, autoSkills: false, autoPotions: false, autoEquip: false, autoLoot: false, speed: 1 });
  if (changes.inTown !== undefined) data.player.idle.inTown = changes.inTown;
  data.player.idle.attributes = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
  await page.evaluate(({ key, data }) => { localStorage.setItem(key, JSON.stringify(data)); document.querySelector("#load-btn").click(); }, { key, data });
  await step(page, 40);
  return save(page);
}
async function target(page) {
  await page.evaluate(() => {
    const canvas = document.querySelector("#game-canvas"), rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: rect.x + (560 - window.gameCamera.x) / canvas.width * rect.width, clientY: rect.y + (330 - window.gameCamera.y) / canvas.height * rect.height }));
  });
}
(async () => {
  const { STAT_LABELS } = await import("../src/equipment.ts");
  const { SET_IDS, GEAR_SETS, variantsForSlot } = await import("../src/gear-catalog.ts");
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      let time = 1000, serial = 0;
      const frames = new Map();
      Object.defineProperty(performance, "now", { value: () => time });
      window.requestAnimationFrame = cb => { const id = ++serial; frames.set(id, cb); return id; };
      window.cancelAnimationFrame = id => frames.delete(id);
      window.advanceGame = milliseconds => {
        while (milliseconds > 0) {
          const dt = Math.min(20, milliseconds); time += dt; milliseconds -= dt;
          const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(time));
        }
      };
      window.randomRoll = .99; Math.random = () => window.randomRoll;
      const proto = CanvasRenderingContext2D.prototype, clear = proto.clearRect, translate = proto.translate;
      proto.clearRect = function(...args) { if (this.canvas.id === "game-canvas") this.nextCamera = true; return clear.apply(this, args); };
      proto.translate = function(x, y) { if (this.nextCamera) { window.gameCamera = { x: -x, y: -y }; this.nextCamera = false; } return translate.call(this, x, y); };
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-faction="tianwang"]').click(); await page.locator("#join-sect").click();
    await seed(page, {}, { inTown: true });
    await page.locator('[data-idle-tab="log"]').click();
    if (await page.locator("#world-panel-close").isVisible()) await page.locator("#world-panel-close").click();
    async function hit(bonuses, random = .99, attack = 30, duration = 180) {
      await page.evaluate(value => window.randomRoll = value, random);
      const before = await seed(page, bonuses, { attack });
      await target(page); await step(page, duration);
      const after = await save(page);
      return { damage: before.enemies[0].hp - after.enemies[0].hp, healing: after.player.hp - before.player.hp };
    }
    const plain = await hit({}), penetration = await hit({ armorPen: 60 });
    assert.ok(penetration.damage > plain.damage, "equipped penetration increases actual damage");
    const crit = await hit({}, 0), strongCrit = await hit({ critDamage: 50 }, 0);
    assert.ok(strongCrit.damage > crit.damage, "equipped critical damage increases actual critical strikes");
    const drain = await hit({ lifeSteal: 20 });
    assert.ok(Math.abs(drain.healing - drain.damage * .2) < 1e-6, "actual damage restores HP through equipped lifesteal");
    const normalRate = await hit({}, .99, 2, 2000), fastRate = await hit({ attackSpeed: 80 }, .99, 2, 2000);
    assert.ok(fastRate.damage > normalRate.damage, "attack speed increases the number of actual strikes");
    console.log("PASS equipped penetration, critical damage, lifesteal and attack speed affect actual combat");
    async function incoming(bonuses) {
      await page.evaluate(() => window.randomRoll = 0);
      const before = await seed(page, bonuses); await step(page, 500);
      return before.player.hp - (await save(page)).player.hp;
    }
    const normalHit = await incoming({}), reducedHit = await incoming({ damageReduction: 50 }), dodgedHit = await incoming({ dodge: 35 });
    assert.ok(normalHit > reducedHit && reducedHit > 0); assert.equal(dodgedHit, 0);
    await page.evaluate(() => window.randomRoll = .99);
    const beforeRegen = await seed(page, { hpRegen: 10, mpRegen: 4 }, { x: 100, y: 100 });
    await step(page, 1000); const afterRegen = await save(page);
    assert.ok(Math.abs(afterRegen.player.hp - beforeRegen.player.hp - 1000) < 1e-6);
    assert.ok(Math.abs(afterRegen.player.mp - beforeRegen.player.mp - 470) < 1e-6);
    console.log("PASS equipped reduction, dodge and HP/MP regeneration affect real incoming damage and recovery");

    const bonuses = Object.fromEntries(Object.keys(STAT_LABELS).map(stat => [stat, 5]));
    await seed(page, bonuses, { inTown: true });
    await page.locator('[data-idle-tab="char"]').click();
    await page.locator("#combat-stats-btn").click();
    assert.equal(await page.locator("[data-combat-stat]").count(), 8);
    assert.match(await page.locator('[data-combat-stat="attackSpeed"] strong').textContent(), /5%/);
    await page.screenshot({ path: "/tmp/volam-advanced-stats.png" });
    await page.locator("#utility-close").click();
    await page.locator('[data-equipped-preview="weapon"]').click();
    assert.equal(await page.locator(".item-detail .gear-stat-lines > span").count(), 14);
    await page.locator("[data-detail-enhance]").click();
    assert.equal(await page.locator("[data-enhance-stat]").count(), 14);
    await page.locator("[data-confirm-enhance]").click();
    const upgraded = (await save(page)).player.equipment.weapon;
    assert.equal(upgraded.enhance, 1); assert.deepEqual(upgraded.bonuses, bonuses);
    await page.locator("#utility-close").click();
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual((await save(page)).player.equipment.weapon, upgraded);
    console.log("PASS all fourteen lines display, enhance and survive save/reload; character displays effective advanced stats");
    await page.locator('[data-idle-tab="inv"]').click(); await page.locator('[data-tab="bag"]').click();
    await page.locator(".inventory-panel [data-open-gear-gallery]").click();
    const beforeGallery = (await save(page)).player;
    for (const id of SET_IDS) {
      await page.locator("#gear-gallery-set").selectOption(id);
      assert.equal(await page.locator(`[data-set-crest="${id}"]`).count(), variantsForSlot("weapon").length);
      assert.equal(await page.locator("#gear-gallery-element").inputValue(), GEAR_SETS[id].element);
    }
    await page.locator("#gear-gallery-set").selectOption("ma-diem");
    await page.locator("#gear-gallery-rarity").selectOption("Hoàng Kim");
    await page.locator("#gear-gallery-enhance").selectOption("10");
    await page.screenshot({ path: "/tmp/volam-expanded-weapons.png" });
    assert.equal((await save(page)).player.gold, beforeGallery.gold);
    await page.locator('[data-buy-gear-kind="firesaber"]').click();
    assert.equal(await page.locator("#set-shop-id").inputValue(), "ma-diem");
    await page.locator("#buy-set-piece").click();
    const bought = (await save(page)).player.inventory.at(-1);
    assert.equal(bought.variant, "firesaber"); assert.equal(bought.setId, "ma-diem");
    assert.equal(Object.keys(bought.bonuses).length, 3);
    await page.locator("#utility-close").click();
    for (const [width, height] of [[320,568], [390,844], [844,390], [1280,900]]) {
      await page.setViewportSize({ width, height });
      await page.locator('[data-idle-tab="char"]').click(); await page.locator("#combat-stats-btn").click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator("#utility-close").click();
    }
    assert.deepEqual(errors, []);
    console.log("PASS fifteen distinct set crests in safe gallery, correct selected-set purchases and mobile advanced stats");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
