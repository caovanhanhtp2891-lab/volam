const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function save(page) { await page.locator("#save-btn").evaluate(el => el.click()); return read(page); }
async function seed(page, change) {
  const value = await save(page); change(value);
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value)); document.querySelector("#load-btn").click();
    if (document.querySelector("#mobile-auto").getAttribute("aria-pressed") === "true") document.querySelector("#mobile-auto").click();
  }, { key, value });
}
async function tab(page, name) { await page.locator(`[data-idle-tab="${name}"]`).click(); }
async function clock(page, delta) { await page.evaluate(delta => window.__now += delta, delta); await page.waitForTimeout(200); }
async function killBandit(page) {
  const before = await save(page);
  await page.waitForTimeout(250);
  const point = await page.evaluate(key => {
    const enemy = JSON.parse(localStorage.getItem(key)).enemies.find(e => e.id === "bandit-1"), canvas = document.querySelector("#game-canvas"), r = canvas.getBoundingClientRect();
    return { x: r.x + (enemy.x - (window.__cam?.x || 0)) * r.width / canvas.width, y: r.y + (enemy.y - (window.__cam?.y || 0)) * r.height / canvas.height };
  }, key);
  await page.mouse.click(point.x, point.y); await page.locator('[data-basic-attack]').click();
  await page.waitForFunction(({ key, kills }) => JSON.parse(localStorage.getItem(key)).player.journey.kills > kills, { key, kills: before.player.journey.kills }, { timeout: 6000 });
  return read(page);
}
const gear = (id, slot = "weapon", enhance = 0) => ({ id, name: "Kiếm thử trùng sinh", slot, power: 20, enhance, level: 5, rarity: "Tốt", color: "#73d19b", icon: "◆" });
async function stat(page, name) { return Number((await page.locator('#stat-grid > div').filter({ has: page.locator('span', { hasText: new RegExp(`^${name}$`) }) }).locator('strong').textContent()).replace(/\./g, "")); }
(async () => {
  const { TITLES, MAX_LEVEL, xpToNext, REBIRTH_BONUS } = await import("../src/character-progression.ts");
  const { SECTS } = await import("../src/sects.ts");
  const { offlineReward } = await import("../src/idle.ts");
  const school = SECTS["thien-vuong"];
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      const RealDate = Date; window.__now = Date.parse("2026-10-03T10:00:00+07:00"); Math.random = () => .5;
      globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [window.__now])); } static now() { return window.__now; } };
      window.__titleStrokes = 0; window.__titleLabels = 0; window.__damageLabels = 0;
      const proto = CanvasRenderingContext2D.prototype, translate = proto.translate, stroke = proto.stroke, fillText = proto.fillText;
      proto.translate = function(x,y) { if (this.canvas.id === "game-canvas" && x <= 0 && y <= 0 && (x < -100 || y < -100)) window.__cam = { x: -x, y: -y }; return translate.call(this, x,y); };
      proto.stroke = function(...args) { if (this.canvas.id === "game-canvas" && this.strokeStyle === "#ff9ed1") window.__titleStrokes++; return stroke.apply(this, args); };
      proto.fillText = function(text,...args) { if (this.canvas.id === "game-canvas") { if (String(text).includes("Niết Bàn Tái Sinh")) window.__titleLabels++; if (/^-\d/.test(text)) window.__damageLabels++; } return fillText.call(this,text,...args); };
    });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" }); assert.equal(await page.locator('html').getAttribute('data-version'), '0.12.0');
    await page.locator('[data-faction="tianwang"]').click(); await page.locator("#join-sect").click();
    await seed(page, s => { delete s.player.preferences; delete s.player.journey; s.player.idle.inTown = true; });
    const old = (await read(page)).player;
    assert.equal(old.preferences.xpMultiplier, 1); assert.equal(old.journey.rebirths, 0); assert.equal(old.journey.activeTitle, "");
    const oldCp = await page.locator('#header-combat-power').textContent(); await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.locator('#header-combat-power').textContent(), oldCp);
    console.log("PASS old saves receive safe settings and journey defaults without altering strength or equipping a title");

    for (const rate of [1,5,10,100,1000]) {
      await seed(page, s => {
        Object.assign(s.player, { level: 100, xp: 0, attack: 10000, defense: 10000, x: 560, y: 330, questKills: 0, bossDefeated: false, questRewardClaimed: false });
        Object.assign(s.player.idle, { enabled: false, inTown: false, autoSkills: false, autoLoot: false, autoEquip: false }); s.groundLoot = []; s.campfires = []; delete s.wildElite;
      });
      await tab(page,'more'); await page.locator('#xp-multiplier').selectOption(String(rate)); assert.equal((await read(page)).player.preferences.xpMultiplier, rate);
      await tab(page,'log'); const killed = await killBandit(page); assert.equal(killed.player.xp, 58 * rate);
      await seed(page, s => {
        s.player.xp = 0; s.player.idle.inTown = false;
        s.campfires = [{ id: 'xp-fire', area: 'world', x: s.player.x, y: s.player.y, level: 4, expiresAt: s.savedAt + 90000, nextTickAt: s.savedAt + 3000 }];
      });
      await clock(page,3000); assert.equal((await read(page)).player.xp, 14 * rate);
      await seed(page, s => { s.player.idle.enabled = true; s.player.idle.stage = 1; s.player.xp = 0; s.savedAt -= 60000; s.campfires = []; });
      const reward = offlineReward(await page.evaluate(() => Date.now() - 60000), await page.evaluate(() => Date.now()), 1);
      assert.equal((await read(page)).player.xp, reward.xp * rate);
    }
    await page.reload({ waitUntil:'networkidle' }); await tab(page,'more'); assert.equal(await page.locator('#xp-multiplier').inputValue(),'1000');
    console.log("PASS all five settings multiply real normal-kill, campfire and offline XP exactly and survive reload");

    await seed(page, s => {
      Object.assign(s.player, { level: 100, xp: 0, x: 560, y: 330, questKills: 4, bossDefeated: true, questRewardClaimed: false });
      s.player.preferences.xpMultiplier = 10; s.player.idle.enabled = false; s.player.idle.inTown = false; s.groundLoot=[]; s.campfires=[]; delete s.wildElite;
    });
    await tab(page,'log'); const quest = await killBandit(page); assert.equal(quest.player.xp, 1580); assert.equal(quest.player.questRewardClaimed,true);
    await seed(page, s => { s.player.level = 159; s.player.xp = xpToNext(159) - 1; s.player.questRewardClaimed = true; s.player.journey.kills=99; s.groundLoot=[]; s.campfires=[]; delete s.wildElite; });
    const skillPoints = (await read(page)).player.skillPoints, attributes = (await read(page)).player.idle.attributePoints;
    const capped = await killBandit(page); assert.equal(capped.player.level,160); assert.equal(capped.player.xp,0);
    assert.equal(capped.player.skillPoints,skillPoints+1); assert.equal(capped.player.idle.attributePoints,attributes+5);
    assert.ok(capped.player.journey.unlockedTitles.includes('grandmaster')); assert.ok(capped.player.journey.unlockedTitles.includes('hunter'));
    await page.waitForFunction(()=>document.querySelector('#xp-label').textContent.includes('MAX'));
    assert.match(await page.locator('#xp-label').textContent(), /MAX/); assert.equal(await page.locator('#xp-bar').evaluate(el=>el.style.width),'100%');
    console.log("PASS quest XP uses the multiplier; cap 160 discards overflow, grants level points once and opens earned titles");

    await seed(page, s => {
      s.player.idle.inTown=true; s.player.idle.enabled=true; s.player.idle.maxStage=120;
      s.player.inventory=[gear('keep-bag')]; s.player.equipment={ weapon:gear('keep-weapon','weapon',10) }; s.player.pendingItems=[gear('keep-pending','armor')];
      s.player.skillRanks={skill1:10,skill2:5,ultimate:3}; s.player.gold=1234; s.player.refiningStones=45;
      s.player.attack=school.baseAttack+159*3; s.player.defense=school.baseDefense+159*2;
      s.groundLoot=[{id:'keep-ground',x:300,y:300,item:gear('keep-ground-item','boots'),gold:15,stones:2}];
    });
    await tab(page,'char'); await page.locator('#rebirth-btn').click();
    const before = (await read(page)).player; await page.locator('#cancel-rebirth').click(); assert.deepEqual((await read(page)).player,before);
    await page.locator('#rebirth-btn').click();
    await page.locator('#confirm-rebirth').evaluate(el => { const parent=el.parentElement, replay=el.cloneNode(true); el.click(); parent.append(replay); replay.click(); replay.remove(); });
    const reborn = (await read(page)).player;
    assert.equal(reborn.level,1); assert.equal(reborn.xp,0); assert.equal(reborn.journey.rebirths,1); assert.equal(reborn.idle.stage,1); assert.equal(reborn.idle.maxStage,120); assert.equal(reborn.idle.inTown,true);
    assert.deepEqual(reborn.skillRanks,before.skillRanks); assert.equal(reborn.skillPoints,before.skillPoints); assert.deepEqual(reborn.idle.attributes,before.idle.attributes); assert.equal(reborn.idle.attributePoints,before.idle.attributePoints);
    assert.deepEqual(reborn.equipment,before.equipment); assert.ok(reborn.inventory.some(i=>i.id==='keep-ground-item')); assert.equal(reborn.pendingItems[0].id,'keep-pending');
    assert.equal(reborn.gold,before.gold+15); assert.equal(reborn.refiningStones,before.refiningStones+2); assert.ok(reborn.journey.unlockedTitles.includes('reborn'));
    const backup = await page.evaluate(key=>JSON.parse(localStorage.getItem(`${key}-backup`)),key); assert.equal(backup.player.level,160); assert.equal(backup.player.journey.rebirths,0);
    assert.equal(await stat(page,'Công kích'),school.baseAttack + 30 + reborn.idle.attributes.strength*2 + REBIRTH_BONUS.attack);
    const cp = await page.locator('#header-combat-power').textContent(); await page.reload({waitUntil:'networkidle'}); assert.equal(await page.locator('#header-combat-power').textContent(),cp);
    await tab(page,'char'); await page.locator('#rebirth-btn').click(); assert.equal(await page.locator('#confirm-rebirth').isDisabled(),true); await page.locator('#utility-close').click();
    console.log("PASS rebirth preview/cancel, replay guard, permanent stats, backup, loot recovery, possessions and stage unlocks survive reload");

    await page.locator('#titles-btn').click(); const baseHp=(await read(page)).player.maxHp;
    await page.locator('[data-wear-title="reborn"]').click(); assert.equal((await read(page)).player.maxHp,baseHp+300);
    assert.equal((await read(page)).player.journey.activeTitle,'reborn');
    const titleCp=await page.locator('#header-combat-power').textContent(); await page.locator('#utility-close').click();
    await page.reload({waitUntil:'networkidle'}); assert.equal(await page.locator('#header-combat-power').textContent(),titleCp);
    await page.evaluate(()=>{ window.__titleStrokes=0; window.__titleLabels=0; }); await page.waitForTimeout(250);
    assert.ok(await page.evaluate(()=>window.__titleStrokes>0 && window.__titleLabels>0));
    await tab(page,'more'); await page.locator('[data-preference="titleEffects"]').uncheck(); await page.locator('[data-preference="titleVisible"]').uncheck(); await page.locator('[data-preference="minimap"]').uncheck();
    await page.evaluate(()=>{ window.__titleStrokes=0; window.__titleLabels=0; }); await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.__titleStrokes+window.__titleLabels),0); assert.equal(await page.locator('.mobile-map-card').isVisible(),false);
    assert.equal(await page.locator('#header-combat-power').textContent(),titleCp);
    await page.locator('[data-preference="titleEffects"]').check(); await page.locator('[data-preference="titleVisible"]').check(); await page.locator('[data-preference="minimap"]').check();
    await tab(page,'char'); await page.locator('#titles-btn').click();
    const hashes=[];
    for (const title of TITLES) {
      await page.locator(`[data-preview-title="${title.id}"]`).click(); await page.waitForTimeout(80);
      assert.match(await page.locator('.title-preview').textContent(),new RegExp(title.name));
      for (const selector of ['#title-effect-preview','#utility-close']) { const box=await page.locator(selector).boundingBox(); assert.ok(box.y>=0 && box.y+box.height<=844, 'preview and close remain on screen while the list scrolls'); }
      hashes.push(await page.locator('#title-effect-preview').evaluate(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;for(let i=0;i<data.length;i+=4)hash=Math.imul(hash^data[i]^data[i+1]^data[i+2]^data[i+3],16777619);return hash;}));
    }
    assert.equal(new Set(hashes).size,12); assert.equal(await page.locator('[data-wear-title="eternal"]').isDisabled(),true);
    await page.screenshot({path:'/tmp/volam-titles-v070.png'});
    await page.locator('#remove-title').click(); assert.equal((await read(page)).player.maxHp,baseHp); assert.equal((await read(page)).player.journey.activeTitle,''); await page.locator('#utility-close').click();
    console.log("PASS wearing one title adds real stats; removal restores them; actual name/effects can be hidden independently; 12 previews draw distinct pixels");

    for (const visible of [true,false]) {
      await seed(page,s=>{Object.assign(s.player,{level:100,xp:0,attack:10000,defense:10000,x:560,y:330,questRewardClaimed:true});Object.assign(s.player.idle,{enabled:false,inTown:false,autoSkills:false,autoLoot:false});s.groundLoot=[];s.campfires=[];delete s.wildElite;});
      await tab(page,'more'); await page.locator('[data-preference="damageNumbers"]').setChecked(visible);
      await page.evaluate(()=>window.__damageLabels=0); await tab(page,'log'); await killBandit(page); await page.waitForTimeout(250);
      assert.equal(await page.evaluate(()=>window.__damageLabels>0),visible);
    }
    console.log("PASS damage-number setting changes actual combat rendering while kills and XP continue");
    await seed(page,s=>{s.player.level=160;s.player.attack=school.baseAttack+159*3;s.player.defense=school.baseDefense+159*2;s.player.idle.inTown=true;s.player.inventory=Array.from({length:60},(_,i)=>gear(`full-${i}`));s.groundLoot=[{id:'full-ground',x:300,y:300,item:gear('full-ground-item','boots'),gold:0,stones:0}];});
    await tab(page,'char'); await page.locator('#rebirth-btn').click();
    await page.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.endsWith('-backup'))throw Error('test quota');return window.__setItem.call(this,key,value);};});
    await page.locator('#confirm-rebirth').click(); assert.equal((await read(page)).player.level,160); assert.equal((await read(page)).player.journey.rebirths,1);
    await page.evaluate(()=>Storage.prototype.setItem=window.__setItem); await page.locator('#confirm-rebirth').click();
    assert.equal((await read(page)).player.journey.rebirths,2); assert.equal((await read(page)).player.level,1);
    assert.equal((await read(page)).player.inventory.length,60); assert.ok((await read(page)).player.pendingItems.some(item=>item.id==='full-ground-item'));
    assert.equal(await stat(page,'Công kích'),school.baseAttack+30+reborn.idle.attributes.strength*2+REBIRTH_BONUS.attack*2);
    console.log("PASS failed backup leaves the old character intact; a second valid rebirth adds exactly one further bonus set");

    await seed(page,s=>{s.player.level=100;s.player.xp=0;s.player.preferences.xpMultiplier=5;s.player.attack=100000;s.player.defense=10000;s.player.idle.inTown=true;s.player.idle.autoLoot=false;s.player.goldenClears=[];});
    await tab(page,'inv'); await page.locator('[data-tab="dungeon"]').click(); await page.locator('[data-dungeon-action="enter"][data-dungeon-id="tomb"]').click();
    await tab(page,'more'); assert.equal(await page.locator('#xp-multiplier').isDisabled(),true); assert.equal(await page.locator('#skill-effects-quality').isDisabled(),true);
    await tab(page,'char'); await page.locator('#rebirth-btn').click(); assert.match(await page.locator('#rebirth-blocked').textContent(),/phụ bản/); await page.locator('#utility-close').click();
    await page.locator('#titles-btn').click(); assert.equal(await page.locator('[data-wear-title="novice"]').isDisabled(),true); await page.locator('#utility-close').click();
    await tab(page,'log'); await page.locator('#mobile-auto').click();
    await tab(page,'inv'); await page.locator('[data-tab="dungeon"]').click();
    await page.waitForSelector('[data-dungeon-action="claim"]',{timeout:45000});
    const xpBeforeClaim=Number((await page.locator('#xp-label').textContent()).split(' / ')[0].replace(/\./g,''));
    await page.locator('[data-dungeon-action="claim"]').click(); assert.equal((await read(page)).player.xp,xpBeforeClaim+320*5);
    console.log("PASS dungeon reward uses x5 and unsaved encounters block preference, title and rebirth transactions");

    await seed(page,s=>{s.player.idle.inTown=true;s.player.xp=0;s.player.preferences.xpMultiplier=10;s.player.gold=100;s.player.goldenClears=[];s.groundLoot=[];s.campfires=[];});
    await page.evaluate(()=>window.__now=Date.parse('2026-10-03T12:00:00+07:00'));
    await tab(page,'log'); if (!(await page.locator('.game-layout').isVisible())) await tab(page,'log'); await page.locator('#golden-boss-btn').click(); await page.locator('#golden-enter').click();
    await tab(page,'char'); await page.locator('#rebirth-btn').click(); assert.match(await page.locator('#rebirth-blocked').textContent(),/Hoàng Kim/); await page.locator('#utility-close').click();
    await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).player.goldenClears.length>0,key,{timeout:12000});
    assert.equal((await read(page)).player.xp,900*10); assert.ok((await read(page)).player.journey.unlockedTitles.includes('golden')); await tab(page,'log'); await page.locator('#town-btn').click();
    console.log("PASS Golden boss reward uses x10, opens its title and prevents rebirth during the encounter");

    for (const [width,height] of [[320,568],[360,640],[390,844],[430,932],[844,390],[1280,900]]) {
      await page.setViewportSize({width,height});
      for (const name of ['more','char']) {
        await tab(page,name);
        const fit=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,overflow:[...document.querySelectorAll('.tab-page')].filter(el=>el.checkVisibility()).some(el=>el.scrollWidth>el.clientWidth+1)}));
        assert.deepEqual(fit,{w:width,h:height,overflow:false});
      }
      for (const id of ['titles-btn','rebirth-btn']) {
        await page.locator(`#${id}`).click();
        const fit=await page.locator('.utility-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&el.scrollWidth<=el.clientWidth+1;}); assert.equal(fit,true);
        if (id==='titles-btn') { await page.locator('[data-preview-title="eternal"]').click(); const box=await page.locator('#title-effect-preview').boundingBox(); assert.ok(box.y>=0 && box.y+box.height<=height); const close=await page.locator('#utility-close').boundingBox(); assert.ok(close.y>=0 && close.y+close.height<=height); }
        await page.locator('#utility-close').click();
      }
    }
    await page.setViewportSize({width:390,height:844}); await tab(page,'more'); await page.screenshot({path:'/tmp/volam-settings-v070.png'});
    await page.locator('#export-code').click(); const exported=await page.locator('#save-code').inputValue(); const expected=JSON.parse(exported).player;
    await page.locator('#import-code').click(); assert.deepEqual((await read(page)).player.preferences,expected.preferences); assert.deepEqual((await read(page)).player.journey,expected.journey);
    assert.deepEqual(errors,[]); console.log("PASS settings/title/rebirth UI fits six viewports and file/code round trip retains progression and preferences without console errors");
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
