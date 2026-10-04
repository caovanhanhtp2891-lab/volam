const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const click = (page, selector) => page.locator(selector).evaluate(el => el.click());
const step = (page, ms = 100) => page.evaluate(ms => window.advanceGame(ms), ms);
const save = page => page.evaluate(key => { document.querySelector("#save-btn").click(); return JSON.parse(localStorage.getItem(key)); }, key);
async function load(page, data) {
  await page.evaluate(({ key, data }) => { localStorage.setItem(key, JSON.stringify(data)); document.querySelector("#load-btn").click(); }, { key, data });
}
async function seed(page, mutate) {
  const data = await save(page); mutate(data); await load(page, data); await step(page); return save(page);
}
async function aim(page, point) {
  await page.evaluate(point => {
    const canvas = document.querySelector("#game-canvas"), rect = canvas.getBoundingClientRect(), camera = window.camera;
    canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: rect.x + (point.x - camera.x) * rect.width / canvas.width, clientY: rect.y + (point.y - camera.y) * rect.height / canvas.height }));
  }, point);
}
(async () => {
  const { FACTIONS } = await import("../src/idle.ts");
  const { SECT_BY_FACTION, SECTS } = await import("../src/sects.ts");
  const { RELIC_TRAITS, GEAR_VARIANTS, gearTrait } = await import("../src/gear-catalog.ts");
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    await fs.mkdir("/tmp/volam-v17", { recursive: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      let time = 1000, serial = 0; const frames = new Map();
      Object.defineProperty(performance, "now", { value: () => time });
      Math.random = () => .5;
      window.requestAnimationFrame = cb => { const id = ++serial; frames.set(id, cb); return id; };
      window.cancelAnimationFrame = id => frames.delete(id);
      window.advanceGame = ms => { while (ms > 0) { const dt = Math.min(25, ms); time += dt; ms -= dt; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(time)); } };
      window.statusDraws = { fire: 0, acid: 0 };
      const test = document.createElement("canvas").getContext("2d"); test.fillStyle = "#ff792db5"; const burnInk = test.fillStyle;
      const p = CanvasRenderingContext2D.prototype, clear = p.clearRect, translate = p.translate, fill = p.fill, stroke = p.stroke;
      p.clearRect = function (...args) { if (this.canvas.id === "game-canvas") this.nextCamera = true; return clear.apply(this, args); };
      p.translate = function (x, y) { if (this.nextCamera) { window.camera = { x: -x, y: -y }; this.nextCamera = false; } return translate.call(this, x, y); };
      p.fill = function (...args) { if (this.canvas.id === "game-canvas" && this.fillStyle === burnInk) window.statusDraws.fire++; return fill.apply(this, args); };
      p.stroke = function (...args) { if (this.canvas.id === "game-canvas" && this.strokeStyle === "#b1e873") window.statusDraws.acid++; return stroke.apply(this, args); };
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400 && response.url().startsWith(url)) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-version"), "0.25.0");
    await click(page, '[data-faction="gaibang"]'); await click(page, "#join-sect"); await step(page);

    await seed(page, data => { Object.assign(data.player, { level: 30, attack: 220, defense: 90 }); Object.assign(data.player.idle, { inTown: true, enabled: false, autoSkills: false, autoEquip: false, autoLoot: false }); });
    const baseline = await save(page), cp = await page.locator("#header-combat-power").getAttribute("title");
    const legacy = structuredClone(baseline);
    delete legacy.combatScaleVersion;
    for (const field of ["hp", "maxHp", "mp", "maxMp", "shield"]) legacy.player[field] /= 100;
    legacy.player.hp = legacy.player.maxHp * .25; legacy.player.mp = legacy.player.maxMp * .4;
    for (const enemy of legacy.enemies) for (const field of ["hp", "maxHp", "attack", "defense"]) enemy[field] /= 100;
    await load(page, legacy);
    const migrated = await save(page);
    assert.equal(migrated.combatScaleVersion, 1);
    assert.equal(migrated.player.maxHp, baseline.player.maxHp);
    assert.equal(migrated.player.hp / migrated.player.maxHp, .25);
    assert.equal(migrated.player.mp / migrated.player.maxMp, .4);
    assert.equal(await page.locator("#header-combat-power").getAttribute("title"), cp);
    assert.deepEqual(migrated.player.inventory, baseline.player.inventory);
    assert.deepEqual(migrated.player.equipment, baseline.player.equipment);
    await load(page, migrated); const second = await save(page);
    assert.equal(second.player.maxHp, migrated.player.maxHp);
    assert.equal(second.player.hp, migrated.player.hp);
    console.log("PASS real legacy load preserves power, HP/MP ratios, equipment and repeated save/load scale");

    for (const [faction, skill, status] of [["gaibang", "skill1", "fire"], ["tianren", "skill1", "fire"], ["wudu", "skill1", "acid"]]) {
      const sect = SECT_BY_FACTION[faction], definition = SECTS[sect].kit[skill];
      const before = await seed(page, data => {
        Object.assign(data.player, { factionId: faction, sect: FACTIONS.find(f => f.id === faction).archetype, level: 5, attack: 10, defense: 0, x: 460, y: 330, mp: 50000, maxMp: 50000, hp: 50000, maxHp: 50000, equipment: {}, rage: 100, cooldowns: { skill1: 0, skill2: 0, ultimate: 0 }, skillRanks: { skill1: 1, skill2: 1, ultimate: 1 } });
        Object.assign(data.player.idle, { enabled: false, inTown: false, autoSkills: false, autoPotions: false, autoLoot: false, autoEquip: false, speed: 1 });
      });
      await click(page, '[data-idle-tab="log"]');
      if (await page.locator(".world-panel").isVisible()) await click(page, "#world-panel-close");
      await aim(page, before.enemies[0]); await click(page, `[data-skill="${skill}"]`); await aim(page, before.player);
      const cast = await save(page);
      assert.equal(cast.player.mp, before.player.mp - definition.mp * 100);
      assert.equal(cast.enemies[0].hp, before.enemies[0].hp);
      assert.equal(cast.enemies[0].burnUntil, 0);
      assert.equal(cast.enemies[0].corrodedUntil, 0);
      await step(page, 75); assert.equal((await save(page)).enemies[0].hp, before.enemies[0].hp);
      await step(page, 425);
      const hit = await save(page), enemy = hit.enemies[0];
      assert.ok(enemy.hp < before.enemies[0].hp && enemy.hp > 0);
      if (status === "fire") { assert.ok(enemy.burnUntil > 0); assert.equal(enemy.burnSect, sect); assert.ok(await page.evaluate(() => window.statusDraws.fire > 0)); }
      else { assert.ok(enemy.corrodedUntil > 0); assert.equal(enemy.defenseDownUntil, enemy.corrodedUntil); assert.ok(await page.evaluate(() => window.statusDraws.acid > 0)); }
      await page.screenshot({ path: `/tmp/volam-v17/${sect}-contact.png` });
      await step(page, 1000);
      assert.ok((await save(page)).enemies[0].hp < enemy.hp, "status deals actual periodic damage without another attack");
      await step(page, 2500);
      await page.evaluate(() => window.statusDraws = { fire: 0, acid: 0 }); await step(page, 100);
      assert.equal(await page.evaluate(status => window.statusDraws[status], status), 0, "status drawing stops after expiry");
    }
    console.log("PASS fire/corrosion begin at contact, consume scaled MP, deal real DOT and stop drawing at expiry");

    await seed(page, data => { data.player.gold = 100000; data.player.inventory = []; data.player.idle.inTown = true; });
    await click(page, '[data-idle-tab="inv"]');
    for (const variant of Object.keys(RELIC_TRAITS)) {
      await click(page, ".inventory-panel [data-open-gear-gallery]");
      await page.locator("#gear-gallery-slot").selectOption(GEAR_VARIANTS[variant].slot);
      assert.equal(await page.locator(`.gear-gallery [data-painted-item="${variant}"]`).count(), 1);
      await click(page, `[data-buy-gear-kind="${variant}"]`);
      assert.match(await page.locator("#utility-content .gear-trait-label").textContent(), new RegExp(gearTrait(variant).name));
      await click(page, "#buy-set-piece"); await click(page, "#utility-close");
    }
    const bought = await save(page);
    assert.equal(bought.player.inventory.length, 24);
    assert.equal(new Set(bought.player.inventory.map(item => item.variant)).size, 24);
    for (const item of bought.player.inventory) {
      assert.equal(Object.keys(item.bonuses).length, 3);
      assert.ok(gearTrait(item.variant).stats.some(stat => item.bonuses[stat] > 0));
    }
    await click(page, '[data-idle-tab="inv"]'); await page.screenshot({ path: "/tmp/volam-v17/relic-inventory.png" });
    await load(page, bought); assert.deepEqual((await save(page)).player.inventory, bought.player.inventory);
    console.log("PASS all 24 relics purchase exact blueprints with actual trait affixes and retain art/identity on reload");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
