const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function save(page) { await page.locator("#save-btn").evaluate(el => el.click()); return read(page); }
async function seed(page, change) {
  const value = await save(page); change(value);
  await page.evaluate(({ key, value }) => { localStorage.setItem(key, JSON.stringify(value)); document.querySelector("#load-btn").click(); }, { key, value });
}
async function time(page, delta) { await page.evaluate(delta => window.__huntNow += delta, delta); await page.waitForTimeout(200); }
const gear = (id, slot, changes = {}) => ({ id, name: id, slot, power: 10, enhance: 0, balanceVersion: 2, level: 5, rarity: "Tốt", color: "#73d19b", icon: "◆", ...changes });
async function clickEnemy(page, enemy) {
  const at = await page.evaluate(enemy => {
    const c = document.querySelector("#game-canvas"), r = c.getBoundingClientRect();
    return { x: r.x + (enemy.x - (window.__cam?.x ?? 0)) * r.width / c.width, y: r.y + (enemy.y - (window.__cam?.y ?? 0)) * r.height / c.height };
  }, enemy);
  await page.mouse.click(at.x, at.y);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      const RealDate = Date; window.__huntNow = Date.parse("2026-10-03T10:00:00+07:00"); window.__roll = .5;
      globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [window.__huntNow])); } static now() { return window.__huntNow; } };
      Math.random = () => window.__roll;
      const translate = CanvasRenderingContext2D.prototype.translate;
      CanvasRenderingContext2D.prototype.translate = function(x, y) { if (this.canvas.id === "game-canvas" && x <= 0 && y <= 0 && (x < -100 || y < -100)) window.__cam = { x: -x, y: -y }; return translate.call(this, x, y); };
    });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-faction="tianwang"]').click(); await page.locator("#join-sect").click();
    await seed(page, s => {
      const p = s.player; p.level = 5; p.attack = 30; p.defense = 10; p.gold = 1000; p.refiningStones = 20;
      p.idle.inTown = true; p.idle.autoEquip = false;
      p.equipment = { weapon: gear("test-weapon", "weapon", { bonuses: { attack: 2, defense: 2, hp: 10, mp: 10, crit: 1, speed: 1 } }) };
      p.inventory = [gear("bag-armor", "armor", { bonuses: { hp: 10 } })];
    });
    const base = (await save(page)).player;
    await page.locator('[data-idle-tab="char"]').click(); await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click();
    assert.match(await page.locator(".enhancement-cost").textContent(), /45 bạc.*100%/);
    assert.equal((await read(page)).player.gold, base.gold, "preview does not charge");
    const preview = await page.locator('[data-enhance-stat="attack"] td').allTextContents(); assert.deepEqual(preview, ["Tấn công", "1.200", "1.400", "+200"]);
    await page.locator('[data-confirm-enhance]').click();
    const upgraded = (await read(page)).player;
    assert.equal(upgraded.equipment.weapon.enhance, 1); assert.equal(upgraded.gold, base.gold - 45); assert.equal(upgraded.refiningStones, base.refiningStones - 1);
    assert.equal(upgraded.maxMp, base.maxMp + 100); assert.equal(upgraded.speed, base.speed + 1); assert.ok(upgraded.maxHp > base.maxHp);
    assert.match(await page.locator("#enhance-result").textContent(), /Thành công/);
    await page.locator("#utility-close").click();
    assert.match(await page.locator("#stat-grid").textContent(), /4[.,]400/);
    const cp = await page.locator("#header-combat-power").textContent(); await page.reload({ waitUntil: "networkidle" }); assert.equal(await page.locator("#header-combat-power").textContent(), cp);
    console.log("PASS equipped enhancement preview, exact cost, all real character bonuses and reload without double addition");

    const beforeBag = (await save(page)).player;
    await page.locator('[data-idle-tab="inv"]').click(); await page.locator('.enhance-btn:not([data-equipped])').click(); await page.locator('[data-confirm-enhance]').click();
    const afterBag = (await read(page)).player;
    assert.equal(afterBag.inventory[0].enhance, 1); assert.equal(afterBag.maxHp, beforeBag.maxHp); assert.equal(await page.locator("#header-combat-power").textContent(), cp);
    await page.locator("#utility-close").click(); await page.locator('.equip-btn').click(); assert.ok((await read(page)).player.maxHp > beforeBag.maxHp);
    console.log("PASS bag enhancement contributes only after equipping the item");

    await seed(page, s => { s.player.equipment.weapon.enhance = 3; s.player.gold = 1000; s.player.refiningStones = 20; });
    await page.evaluate(() => window.__roll = .99);
    await page.locator('[data-idle-tab="char"]').click(); await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click();
    const beforeFail = (await save(page)).player; await page.locator('[data-confirm-enhance]').click();
    const failed = (await read(page)).player;
    assert.equal(failed.equipment.weapon.enhance, 3); assert.equal(failed.gold, 778); assert.equal(failed.refiningStones, 19);
    assert.equal(failed.maxHp, beforeFail.maxHp); assert.equal(failed.maxMp, beforeFail.maxMp); assert.equal(failed.speed, beforeFail.speed);
    await page.locator("#utility-close").click();
    for (const mode of ["poor", "capped"]) {
      await seed(page, s => { s.player.equipment.weapon.enhance = mode === "capped" ? 100 : 0; s.player.gold = mode === "poor" ? 0 : 1000; });
      await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click(); assert.equal(await page.locator('[data-confirm-enhance]').isDisabled(), true); await page.locator("#utility-close").click();
    }
    console.log("PASS failed, insufficient-material and +100 limit attempts keep stats and charge only valid attempts");

    await seed(page, s => {
      const p = s.player; p.idle.enabled = false; p.idle.inTown = false; p.idle.autoSkills = false; p.idle.autoLoot = false; p.idle.autoPotions = false;
      p.level = 5; p.attack = 10000; p.defense = 10000; p.x = 560; p.y = 330; p.equipment = {}; p.xp = 0;
      p.eliteHunt = { normalKills: 19, spawned: 0 }; s.campfires = []; delete s.wildElite; s.groundLoot = [];
    });
    await page.locator('[data-idle-tab="log"]').click(); await page.locator('#world-panel-close').click(); await page.waitForTimeout(300);
    await clickEnemy(page, (await save(page)).enemies.find(e => e.id === "bandit-1"));
    await page.locator('[data-basic-attack]').click();
    await page.waitForFunction(key => Boolean(JSON.parse(localStorage.getItem(key)).wildElite), key, { timeout: 6000 });
    const spawned = await read(page); assert.equal(spawned.player.eliteHunt.spawned, 1); assert.equal(spawned.player.eliteHunt.normalKills, 0); assert.ok(spawned.wildElite);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await read(page)).wildElite.id, spawned.wildElite.id);
    console.log("PASS normal kill creates one real wild elite, resets streak and restores the living elite on reload");
    await page.waitForTimeout(400); await clickEnemy(page, (await save(page)).enemies.find(e => e.wildElite)); await page.locator('[data-basic-attack]').click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).campfires.length > 0, key, { timeout: 6000 });
    const killed = await read(page), fire = killed.campfires[0]; assert.equal(killed.wildElite, undefined); assert.equal(fire.area, "world"); assert.equal(killed.player.eliteHunt.spawned, 1);
    await page.waitForFunction(() => !document.querySelector("#campfire-btn").disabled, undefined, { timeout: 2000 });
    assert.equal(await page.locator("#campfire-btn").isDisabled(), false);
    await page.locator('[data-idle-tab="log"]').click();
    await page.locator("#campfire-btn").click(); assert.equal(await page.locator("#mobile-auto").getAttribute("aria-pressed"), "false");
    await page.waitForTimeout(1000);
    const near = (await save(page)).player; assert.ok(Math.hypot(near.x - fire.x, near.y - fire.y) <= 120);
    const xp0 = near.xp; await time(page, 3000); const xp1 = (await read(page)).player.xp; assert.equal(xp1 - xp0, 6 + fire.level * 2);
    await page.waitForTimeout(300); assert.equal((await read(page)).player.xp, xp1);
    await page.screenshot({ path: "/tmp/volam-campfire-mobile.png" });
    console.log("PASS elite defeat produces a campfire, rest button pauses auto, nearby XP is awarded once per real-time tick");

    await seed(page, s => { s.player.x = 300; s.player.y = 900; s.player.xp = 0; });
    await time(page, 6000); assert.equal((await save(page)).player.xp, 0);
    await seed(page, s => { s.player.x = fire.x; s.player.y = fire.y; s.player.xp = 0; });
    await page.reload({ waitUntil: "networkidle" }); assert.equal((await read(page)).player.xp, 0);
    assert.equal((await read(page)).campfires[0].expiresAt, fire.expiresAt);
    await time(page, 3000); assert.equal((await read(page)).player.xp, 6 + fire.level * 2);
    await page.evaluate(expires => window.__huntNow = expires, fire.expiresAt); await page.waitForTimeout(250);
    const xpBefore = (await save(page)).player.xp; await time(page, 3000); assert.equal((await save(page)).player.xp, xpBefore); assert.equal((await read(page)).campfires.length, 0);
    console.log("PASS far-away characters get no XP, reload cannot grant offline ticks or extend life, expiration stops rewards");

    await seed(page, s => { s.player.idle.inTown = true; s.player.equipment.weapon = gear("responsive-weapon", "weapon", { bonuses: { attack: 2, defense: 2, hp: 10, mp: 10, crit: 1, speed: 1 } }); s.player.gold = 1000; s.player.refiningStones = 10; });
    for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[844,390],[1280,900]]) {
      await page.setViewportSize({ width, height });
      for (const tab of ["log", "char", "inv"]) {
        await page.locator(`[data-idle-tab="${tab}"]`).click();
        const fit = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, overflow: [...document.querySelectorAll(".tab-page")].filter(e => e.checkVisibility()).some(e => e.scrollWidth > e.clientWidth + 1) }));
        assert.equal(fit.w, width); assert.equal(fit.h, height); assert.equal(fit.overflow, false);
      }
      await page.locator('[data-idle-tab="char"]').click();
      if (await page.locator('[data-equipped-preview="weapon"]').isEnabled()) { await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click(); await page.locator('[data-confirm-enhance]').scrollIntoViewIfNeeded(); assert.ok(await page.locator('[data-confirm-enhance]').isVisible()); const b = await page.locator('[data-confirm-enhance]').boundingBox(); assert.ok(b.y >= 0 && b.y + b.height <= height); await page.locator("#utility-close").click(); }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-idle-tab="char"]').click(); await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click();
    await page.screenshot({ path: "/tmp/volam-enhancement-mobile.png" }); await page.locator("#utility-close").click();
    await page.locator('[data-idle-tab="inv"]').click(); await page.locator('[data-tab="dungeon"]').click();
    await page.locator('[data-dungeon-action="enter"][data-dungeon-id="tomb"]').click();
    await page.locator('[data-idle-tab="char"]').click(); await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click();
    assert.equal(await page.locator('[data-confirm-enhance]').isDisabled(), true); assert.match(await page.locator('[data-confirm-enhance]').textContent(), /Rời phụ bản/);
    console.log("PASS enhancement is blocked inside an unsaved dungeon encounter");
    assert.deepEqual(errors, []); console.log("PASS enhancement and elite/campfire UI fit six phone/desktop viewports without page scrolling");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
