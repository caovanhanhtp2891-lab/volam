const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const captures = process.env.VOLAM_CAPTURE_DIR || "/tmp/volam-military-characters";
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const save = async page => { await page.locator("#save-btn").evaluate(el => el.click()); return read(page); };
const step = (page, ms) => page.evaluate(ms => window.advanceGame(ms), ms);
async function seed(page, edit) {
  const data = await save(page); edit(data);
  await page.evaluate(({ key, data }) => { localStorage.setItem(key, JSON.stringify(data)); document.querySelector("#load-btn").click(); }, { key, data });
  await step(page, 100); return save(page);
}
const click = (page, selector) => page.locator(selector).evaluate(el => el.click());
const close = page => click(page, "#utility-close");
const openRanks = async page => { await close(page); await click(page, '[data-idle-tab="char"]'); await click(page, "#military-seal-slot"); };
const openMap = async (page, id) => { await close(page); await click(page, '.todo-card [data-open-territories]'); if (id) await click(page, `[data-select-territory="${id}"]`); };

(async () => {
  const { TERRITORIES, MILITARY_RANKS } = await import("../src/military.ts");
  const { FACTIONS } = await import("../src/idle.ts");
  const { SECT_BY_FACTION } = await import("../src/sects.ts");
  const { characterFrame, characterPortraitCrop } = await import("../src/character-art.ts");
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    await fs.mkdir(captures, { recursive: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      let time = 1000, serial = 0; const frames = new Map();
      Object.defineProperty(performance, "now", { value: () => time });
      window.requestAnimationFrame = cb => { const id = ++serial; frames.set(id, cb); return id; };
      window.cancelAnimationFrame = id => frames.delete(id);
      Math.random = () => .5; window.characterDraws = {};
      const proto = CanvasRenderingContext2D.prototype, originalDraw = proto.drawImage;
      proto.drawImage = function(source, ...args) {
        if (source instanceof HTMLImageElement && source.naturalWidth === 1223 && args.length === 8 && Math.abs(args[2] - 244.6) < .01 && Math.abs(args[3] - 321.5) < .01) window.characterDraws[this.canvas.id] = args.slice(0, 4);
        if (!window.fastSimulation) return originalDraw.call(this, source, ...args);
      };
      for (const name of ["fill", "stroke", "fillRect", "strokeRect", "fillText", "strokeText"]) {
        const original = proto[name]; proto[name] = function(...args) { if (!window.fastSimulation) return original.apply(this, args); };
      }
      window.advanceGame = milliseconds => {
        window.fastSimulation = milliseconds > 1000;
        while (milliseconds > 0) {
          const dt = Math.min(50, milliseconds); time += dt; milliseconds -= dt;
          const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(time));
        }
        window.fastSimulation = false;
      };
    });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("#hero-sex-input").selectOption("female");
    for (const faction of FACTIONS) assert.equal(await page.locator(`[data-faction="${faction.id}"] [data-character-art]`).getAttribute("data-character-art"), `${SECT_BY_FACTION[faction.id]}-female`);
    await page.locator('[data-faction="gaibang"]').click(); await page.locator("#join-sect").click();
    await seed(page, s => { delete s.player.military; s.player.level = 9; s.player.idle.inTown = true; });
    assert.deepEqual((await save(page)).player.military, { captured: [], seals: [], equipped: null });
    await click(page, '[data-idle-tab="char"]');
    assert.equal(await page.locator(".paper-doll .equipment-slot").count(), 12);
    assert.equal(await page.locator('[data-equipped-preview]').count(), 11);
    await openMap(page, "bien-thanh");
    assert.equal(await page.locator('[data-challenge-territory="bien-thanh"]').isDisabled(), true);
    await close(page);
    const cards = [];
    for (const faction of FACTIONS) for (const sex of ["male", "female"]) {
      const id = SECT_BY_FACTION[faction.id];
      await seed(page, s => { Object.assign(s.player, { factionId: faction.id, sect: faction.archetype, sex }); s.player.idle.inTown = true; });
      await click(page, '[data-idle-tab="log"]'); await step(page, 100);
      await click(page, '[data-idle-tab="char"]'); await step(page, 100);
      const artKey = `${id}-${sex}`;
      for (const selector of ["#avatar-orb", "#character-preview", "#game-canvas"]) assert.equal(await page.locator(selector).getAttribute("data-character-art"), artKey);
      const crop = (await page.locator("#avatar-orb svg").getAttribute("viewBox")).split(" ").map(Number);
      assert.deepEqual(crop, [...characterPortraitCrop(id, sex)]);
      const [x, y, w, h] = characterFrame(id, sex), frame = [x * 1223, y * 1286, w * 1223, h * 1286];
      const drawn = await page.evaluate(() => window.characterDraws);
      assert.deepEqual(drawn["game-canvas"], frame); assert.deepEqual(drawn["character-preview"], frame);
      cards.push({ name: faction.name, sex, image: await page.locator("#character-preview").evaluate(el => el.toDataURL()) });
    }
    await seed(page, s => { s.player.factionId = "gaibang"; s.player.sect = "hoa"; });
    await click(page, '[data-idle-tab="more"]'); await page.locator("#settings-sex").selectOption("male"); await click(page, "#save-name");
    await click(page, '[data-idle-tab="char"]'); await step(page, 100);
    assert.equal(await page.locator("#avatar-orb").getAttribute("data-character-art"), "cai-bang-male");
    assert.equal(await page.locator("#character-preview").getAttribute("data-character-art"), "cai-bang-male");
    console.log("PASS all 20 sect/gender appearances share the same full tile and avatar crop; gender changes refresh every view");

    await seed(page, s => { Object.assign(s.player, { level: 160, xp: 0, attack: 1000000, defense: 1000000, questKills: 0, bossDefeated: false, questRewardClaimed: false }); Object.assign(s.player.idle, { enabled: true, inTown: true, stage: 1, maxStage: 1, wave: 1, autoSkills: false, autoEquip: false, autoLoot: false }); });
    await openMap(page, "tuong-duong"); assert.equal(await page.locator('[data-challenge-territory="tuong-duong"]').isDisabled(), true);
    await click(page, '[data-select-territory="bien-thanh"]');
    await page.screenshot({ path: `${captures}/territories-mobile.png` });
    await click(page, '[data-challenge-territory="bien-thanh"]'); await step(page, 100);
    assert.match(await page.locator("#mobile-map-name").textContent(), /BIÊN THÀNH/);
    assert.match(await page.locator("#town-btn").textContent(), /Rút/);
    assert.equal(await page.locator("#stage-next").isDisabled(), true);
    const storedBeforeAbort = await read(page);
    await click(page, "#load-btn"); await click(page, "#save-btn"); await click(page, "#adventure-btn"); await click(page, "#training-btn");
    assert.deepEqual((await read(page)).player.military, storedBeforeAbort.player.military);
    assert.match(await page.locator("#mobile-map-name").textContent(), /BIÊN THÀNH/);
    await click(page, "#town-btn"); assert.equal((await save(page)).player.military.captured.length, 0);
    console.log("PASS level/route locks, safe retreat and guards against replacing the active campaign");

    for (const land of TERRITORIES) {
      await openMap(page, land.id); await click(page, `[data-challenge-territory="${land.id}"]`);
      await step(page, 30000); await step(page, 100);
      const state = await save(page);
      assert.ok(state.player.military.captured.includes(land.id), `${land.name} must be earned through all three battle waves`);
      assert.equal(state.player.questKills, 0); assert.equal(state.player.bossDefeated, false);
      assert.equal(state.player.idle.stage, 1); assert.equal(state.player.idle.wave, 1);
      await close(page);
    }
    assert.equal((await save(page)).player.military.captured.length, 9);
    await openMap(page, "hoang-thanh"); assert.equal(await page.locator('[data-challenge-territory="hoang-thanh"]').isDisabled(), true); await close(page);
    console.log("PASS all nine cities conquered through actual three-wave battles; campaign does not complete the old quest or advance training stages");

    await openRanks(page);
    const hpBefore = (await save(page)).player.maxHp;
    await close(page); await click(page, "#combat-stats-btn");
    const lifeStealBefore = Number((await page.locator('[data-combat-stat="lifeSteal"] strong').textContent()).replace("%", ""));
    await openRanks(page);
    for (const rank of MILITARY_RANKS) { assert.equal(await page.locator(`[data-claim-seal="${rank.id}"]`).isDisabled(), false); await click(page, `[data-claim-seal="${rank.id}"]`); }
    assert.equal((await save(page)).player.maxHp, hpBefore);
    await click(page, '[data-wear-seal="hoang-de"]');
    const imperial = await save(page); assert.equal(imperial.player.maxHp, hpBefore + 900); assert.equal(imperial.player.military.equipped, "hoang-de");
    assert.equal(await page.locator('#military-seal-slot [data-seal-art]').getAttribute("data-seal-art"), "hoang-de");
    await page.screenshot({ path: `${captures}/ranks-mobile.png` });
    await close(page); await click(page, "#combat-stats-btn"); assert.equal(Number((await page.locator('[data-combat-stat="lifeSteal"] strong').textContent()).replace("%", "")), Math.min(20, lifeStealBefore + 4)); await close(page);
    await click(page, "#load-btn"); await step(page, 100); assert.equal((await save(page)).player.maxHp, hpBefore + 900);
    await openRanks(page); await click(page, '[data-wear-seal="thai-thu"]'); assert.equal((await save(page)).player.maxHp, hpBefore + 200);
    await click(page, '[data-remove-seal]'); assert.equal((await save(page)).player.maxHp, hpBefore);
    await click(page, '[data-wear-seal="hoang-de"]'); await close(page);
    await click(page, "#rebirth-btn"); await click(page, "#confirm-rebirth"); await step(page, 100);
    const reborn = await save(page); assert.equal(reborn.player.level, 1); assert.deepEqual(reborn.player.military, imperial.player.military);
    await page.screenshot({ path: `${captures}/imperial-character-mobile.png` });
    console.log("PASS claim does not equip; one worn seal contributes stats once, swaps/removal/reload work, and earned military progress survives rebirth");

    await seed(page, s => { s.player.level = 160; s.player.military = { captured: [], seals: [], equipped: null }; s.player.attack = 0; s.player.defense = 1000000; s.player.idle.inTown = true; });
    await openMap(page, "bien-thanh"); await click(page, '[data-challenge-territory="bien-thanh"]'); await click(page, "#mobile-auto");
    await step(page, 241000); await step(page, 100);
    assert.equal((await save(page)).player.military.captured.length, 0);
    assert.match(await page.locator("#log-list").textContent(), /Hết giờ công thành/);
    await seed(page, s => { s.player.level = 160; s.player.defense = 0; s.player.equipment = {}; s.player.hp = 1; s.player.idle.autoPotions = false; s.player.idle.inTown = true; s.player.maxHp = 5511; });
    await openMap(page, "bien-thanh"); await click(page, '[data-challenge-territory="bien-thanh"]'); await click(page, "#mobile-auto"); await step(page, 20000);
    assert.equal((await save(page)).player.military.captured.length, 0);
    assert.match(await page.locator("#log-list").textContent(), /Công thành thất bại/);
    console.log("PASS timeout and death grant no territorial merit");
    await openRanks(page);
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1280, 900]]) {
      await page.setViewportSize({ width, height }); await step(page, 100);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const dialog = await page.locator(".utility-dialog").boundingBox(); assert.ok(dialog.x >= -1 && dialog.x + dialog.width <= width + 1);
      await click(page, '#utility-content [data-open-territories]');
      for (const node of await page.locator('[data-select-territory]').all()) { const rect = await node.boundingBox(); assert.ok(rect.x >= -1 && rect.x + rect.width <= width + 1); }
      await click(page, '#utility-content [data-open-military]');
    }
    const gallery = await context.newPage();
    await gallery.setViewportSize({ width: 1500, height: 1120 });
    await gallery.setContent(`<meta charset="utf-8"><style>body{background:#111f19;color:#e5d5a4;font:14px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}article{background:#182720;border:1px solid #586246;text-align:center}img{width:100%}h1{font-size:24px}small{display:block;color:#aebca8}</style><h1>Thập đại môn phái · Hình nhân vật nam & nữ</h1><main>${[...cards.filter(c => c.sex === "male"), ...cards.filter(c => c.sex === "female")].map(c => `<article><img src="${c.image}"><b>${c.name}</b><small>${c.sex === "male" ? "Nam" : "Nữ"}</small></article>`).join("")}</main>`);
    await gallery.screenshot({ path: `${captures}/twenty-sect-characters.png`, fullPage: true });
    assert.deepEqual(errors, []); console.log("PASS responsive seal/map layouts and no page or asset errors");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
