const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const time = value => Date.parse(`2026-10-03T${value}+07:00`);
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function seed(page, mutate) {
  await page.locator("#save-btn").evaluate(el => el.click());
  const value = await read(page); mutate(value);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value });
  await page.locator("#load-btn").evaluate(el => el.click());
}
const gear = (id, slot, changes = {}) => ({ id, slot, name: `Trang bị ${id}`, level: 5, rarity: "Tốt", color: "#73d19b", icon: "◆", power: 20, enhance: 0, ...changes });
async function clock(page, value) { await page.evaluate(value => window.__bossNow = value, value); await page.waitForTimeout(200); }
async function boss(page) { await page.locator('[data-idle-tab="log"]').click(); await page.locator("#golden-boss-btn").click(); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(({ initial }) => {
      const RealDate = Date; window.__bossNow = initial;
      globalThis.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : [window.__bossNow])); }
        static now() { return window.__bossNow; }
      };
      Math.random = () => .5;
    }, { initial: time("11:59:59") });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400 && response.url().startsWith(url)) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-faction="tianwang"]').click(); await page.locator("#join-sect").click();
    await seed(page, s => {
      const p = s.player; p.level = 5; p.attack = 30; p.defense = 10;
      p.idle.inTown = true; p.idle.autoEquip = false; p.idle.autoLoot = false;
      p.equipment = { weapon: gear("old", "weapon", { power: 25 }) };
      p.inventory = [gear("new", "weapon", { power: 10, bonuses: { attack: 30, defense: 4, hp: 100, mp: 60, crit: 4, speed: 8 } }), gear("raw", "weapon", { power: 30 }), gear("ring", "ring", { bonuses: { attack: 12, hp: 50 } })];
    });
    const before = await read(page);
    await page.locator('[data-idle-tab="inv"]').click();
    await page.locator('.bag-slot[data-inspect-item="new"]').click();
    assert.equal(await page.locator(".item-detail .gear-stat-lines > span").count(), 6);
    assert.match(await page.locator(".item-comparison").textContent(), /lực chiến/);
    await page.locator("#utility-close").click();
    await page.locator("[data-auto-equip]").click();
    const after = await read(page);
    assert.equal(after.player.equipment.weapon.id, "new"); assert.equal(after.player.equipment.ring.id, "ring");
    assert.equal(after.player.inventory.length, 2);
    assert.ok(after.player.maxHp >= before.player.maxHp + 150);
    assert.equal(after.player.maxMp, before.player.maxMp + 60);
    assert.equal(after.player.speed, before.player.speed + 8);
    await page.locator('[data-idle-tab="char"]').click();
    const stats = await page.locator("#stat-grid").textContent(); assert.match(stats, /82/); assert.match(stats, /16%/);
    assert.equal((await page.locator("#header-combat-power").textContent()).replace("⚔ ", ""), await page.locator("#combat-power").textContent());
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual((await read(page)).player.equipment.weapon.bonuses, after.player.equipment.weapon.bonuses);
    console.log("PASS all six equipped stats affect character, header power, strongest loadout and reload");

    await seed(page, s => {
      s.player.inventory = [gear("weak", "weapon", { power: 1 }), gear("strong", "weapon", { power: 999 }), gear("gold", "weapon", { rarity: "Hoàng Kim", color: "#ffd35a" }), gear("refined", "weapon", { enhance: 1 }), gear("high", "weapon", { level: 20, power: 1 }), gear("rare", "weapon", { rarity: "Hiếm" })];
      s.player.pendingItems = [gear("pending", "weapon")];
    });
    await page.locator('[data-idle-tab="inv"]').click(); await page.locator("[data-discard-filter]").click();
    await page.locator("#preview-discard").click(); assert.equal(await page.locator(".discard-list li").count(), 1);
    await page.locator("#cancel-discard").click(); assert.equal((await read(page)).player.inventory.length, 6);
    await page.locator("[data-discard-filter]").click(); await page.locator("#preview-discard").click();
    await page.locator("#discard-rarity").selectOption("2"); assert.equal(await page.locator("#confirm-discard").count(), 0);
    await page.locator("#preview-discard").click(); assert.equal(await page.locator(".discard-list li").count(), 2);
    await page.locator("#confirm-discard").click();
    const filtered = await read(page); assert.deepEqual(filtered.player.inventory.map(i => i.id), ["strong", "gold", "refined", "high"]);
    assert.equal(filtered.player.pendingItems[0].id, "pending");
    assert.equal(filtered.player.equipment.weapon.id, "new");
    console.log("PASS discard preview/cancel, filter change invalidation and protected gear/pending rewards");

    await boss(page); assert.equal(await page.locator("#golden-enter").isDisabled(), true);
    await clock(page, time("12:00:00")); assert.equal(await page.locator("#golden-enter").isDisabled(), false);
    await page.locator("#utility-close").click();
    await seed(page, s => { s.player.attack = 10000; s.player.defense = 1000; s.player.gold = 100; s.player.refiningStones = 0; s.player.goldenClears = []; s.player.inventory = []; s.player.pendingItems = []; s.groundLoot = []; });
    const starting = await read(page);
    await boss(page); await page.locator("#golden-enter").click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).player.goldenClears.includes("2026-10-03-12"), key, { timeout: 12000 });
    const killed = await read(page);
    const drop = killed.groundLoot.find(l => l.item?.rarity === "Hoàng Kim"); assert.ok(drop);
    assert.equal(Object.keys(drop.item.bonuses).length, 6); assert.equal(drop.item.color, "#ffd35a");
    assert.equal(killed.player.bossDefeated, starting.player.bossDefeated);
    assert.equal(killed.player.idle.totalKills, starting.player.idle.totalKills);
    assert.equal(killed.player.idle.stage, starting.player.idle.stage);
    assert.equal(killed.player.idle.inTown, true);
    await page.waitForTimeout(700);
    await page.screenshot({ path: "/tmp/volam-golden-drop-mobile.png" });
    await page.reload({ waitUntil: "networkidle" });
    assert.ok((await read(page)).groundLoot.find(l => l.item?.id === drop.item.id));
    await boss(page); assert.equal(await page.locator("#golden-enter").isDisabled(), true); await page.locator("#utility-close").click();
    console.log("PASS scheduled Golden fight/drop, persistent unpicked reward and no repeat claim or quest/stage changes");

    await clock(page, time("19:00:00"));
    await seed(page, s => { s.player.inventory = Array.from({ length: 60 }, (_, i) => gear(`full-${i}`, "weapon")); s.player.pendingItems = []; s.groundLoot = []; });
    await boss(page); await page.locator("#golden-enter").click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).player.goldenClears.includes("2026-10-03-19"), key, { timeout: 12000 });
    await page.locator("#town-btn").click();
    const full = await read(page); assert.equal(full.player.inventory.length, 60); assert.equal(full.player.pendingItems.length, 1);
    assert.equal(full.player.pendingItems[0].rarity, "Hoàng Kim"); assert.equal(full.player.idle.inTown, true);
    await page.reload({ waitUntil: "networkidle" }); assert.equal((await read(page)).player.pendingItems.length, 1);
    console.log("PASS leaving Golden fight recovers rare drop into pending rewards when bag is full");

    await clock(page, time("21:00:00"));
    await seed(page, s => { s.player.attack = 1; s.player.idle.inTown = true; s.player.inventory = []; s.player.pendingItems = []; s.groundLoot = []; });
    await boss(page); await page.locator("#golden-enter").click();
    await clock(page, time("21:20:00"));
    assert.doesNotMatch(await page.locator("#canvas-badge").textContent(), /HOÀNG KIM/);
    assert.ok(!(await read(page)).player.goldenClears.includes("2026-10-03-21"));
    assert.equal((await read(page)).player.idle.inTown, true);
    console.log("PASS real-time expiry returns to original town state without granting rewards");

    await clock(page, time("21:01:00"));
    await seed(page, s => { s.player.hp = 1; s.player.defense = 0; s.player.idle.autoPotions = false; s.player.idle.autoSkills = false; });
    const beforeDeath = await read(page);
    await boss(page); await page.locator("#golden-enter").click();
    await page.waitForFunction(() => document.querySelector("#log-list").textContent.includes("Thất bại. Có thể khiêu chiến lại"), { timeout: 12000 });
    const death = await read(page);
    assert.equal(death.player.idle.inTown, true); assert.equal(death.player.idle.stage, beforeDeath.player.idle.stage);
    assert.deepEqual(death.player.goldenClears, beforeDeath.player.goldenClears);
    assert.equal(death.player.pendingItems.length, 0); assert.equal(death.groundLoot.length, 0);
    console.log("PASS Golden boss telegraph defeat restores town and stage without reward or dropping a cultivation stage");

    for (const [width, height] of [[320,568], [360,640], [390,844], [430,932], [844,390], [1280,900]]) {
      await page.setViewportSize({ width, height });
      for (const tab of ["log", "char", "inv"]) {
        await page.locator(`[data-idle-tab="${tab}"]`).click();
        const fit = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, overflow: [...document.querySelectorAll(".tab-page")].filter(e => e.checkVisibility()).some(e => e.scrollWidth > e.clientWidth + 1), cp: document.querySelector("#header-combat-power").getBoundingClientRect().right, name: document.querySelector("#character-name").getBoundingClientRect().right }));
        assert.equal(fit.w, width); assert.equal(fit.h, height); assert.equal(fit.overflow, false); assert.ok(fit.cp <= width && fit.name <= fit.cp);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('[data-idle-tab="inv"]').click();
    await page.screenshot({ path: "/tmp/volam-equipment-mobile.png" });
    assert.deepEqual(errors, []);
    console.log("PASS compact combat-power, new equipment and boss UI fit six phone/desktop viewports");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
