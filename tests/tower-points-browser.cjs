const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium} = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:5173';
const key = 'giang-ho-di-truyen-prototype';
const read = page => page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const click = (page,selector)=>page.locator(selector).evaluate(el=>el.click());
const save = async page=>{await click(page,'#save-btn');return read(page)};
const step = (page,ms)=>page.evaluate(ms=>window.advanceGame(ms),ms);
const close = page=>click(page,'#utility-close');
async function seed(page, edit) {
  const data=await save(page);edit(data);
  await page.evaluate(({key,data})=>{localStorage.setItem(key,JSON.stringify(data));document.querySelector('#load-btn').click()},{key,data});
  await step(page,100);return save(page);
}
const openTower=async(page,floor)=>{await close(page);await click(page,'.todo-card [data-open-tower]');if(floor){await page.locator('#tower-floor-input').fill(String(floor));await click(page,'[data-select-tower-input]')}};
const openSkills=async page=>{await close(page);await click(page,'[data-idle-tab="skill"]')};
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.VOLAM_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const errors=[];
  try {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>{
      let time=1000,serial=0;const frames=new Map();
      Object.defineProperty(performance,'now',{value:()=>time});
      window.requestAnimationFrame=cb=>{const id=++serial;frames.set(id,cb);return id};window.cancelAnimationFrame=id=>frames.delete(id);
      Math.random=()=>.5;const proto=CanvasRenderingContext2D.prototype;
      for(const name of ['fill','stroke','fillRect','strokeRect','fillText','strokeText','drawImage']) {const original=proto[name];proto[name]=function(...args){if(!window.fastSimulation)return original.apply(this,args)}}
      window.advanceGame=milliseconds=>{window.fastSimulation=milliseconds>1000;while(milliseconds>0){const dt=Math.min(50,milliseconds);time+=dt;milliseconds-=dt;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time))}window.fastSimulation=false};
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))errors.push(`${r.status()} ${r.url()}`)});
    await page.goto(url,{waitUntil:'networkidle'});await page.locator('[data-faction="gaibang"]').click();await page.locator('#join-sect').click();
    await seed(page,s=>{delete s.player.tower;delete s.player.idle.autoAttributes;delete s.player.idle.autoSkillPoints;s.player.idle.inTown=true;});
    let s=await save(page);assert.equal(s.player.tower.highestFloor,0);assert.equal(s.player.idle.autoAttributes,false);
    await openTower(page);assert.equal(await page.locator('[data-enter-tower="1"]').isDisabled(),true);
    await seed(page,s=>{Object.assign(s.player,{level:160,xp:0,attack:1000000,defense:1000000,questKills:0,bossDefeated:false});Object.assign(s.player.idle,{enabled:true,inTown:true,stage:1,maxStage:1,wave:1,autoSkills:false,autoEquip:false,autoLoot:false});});
    await openTower(page,2);assert.equal(await page.locator('[data-enter-tower="2"]').isDisabled(),true);
    await openTower(page,1);await click(page,'[data-enter-tower="1"]');await step(page,100);
    assert.match(await page.locator('#mobile-map-name').textContent(),/THÁP/);assert.match(await page.locator('#town-btn').textContent(),/tháp/);
    await click(page,'#town-btn');s=await save(page);assert.equal(s.player.tower.highestFloor,0);
    const before={gold:s.player.gold,stones:s.player.refiningStones,bag:s.player.inventory.length};
    await openTower(page,1);await click(page,'[data-enter-tower="1"]');await step(page,30000);await step(page,100);s=await save(page);
    assert.equal(s.player.tower.highestFloor,1);assert.equal(s.player.tower.clears[0],1);assert.equal(s.player.gold,before.gold+406);assert.equal(s.player.refiningStones,before.stones+2);assert.equal(s.player.tower.sigils,3);
    assert.equal(s.player.inventory.length,before.bag+1);assert.equal(s.player.inventory.at(-1).setId,'tran-thien');assert.equal(s.player.questKills,0);assert.equal(s.player.bossDefeated,false);assert.equal(s.player.idle.stage,1);
    await step(page,30000);assert.equal((await save(page)).player.tower.clears[0],1);
    await openTower(page,1);await click(page,'[data-enter-tower="1"]');await step(page,30000);s=await save(page);assert.equal(s.player.tower.clears[0],2);assert.equal(s.player.gold,before.gold+609);assert.equal(s.player.tower.sigils,5);
    console.log('PASS old-save migration, level/sequence locks, retreat, two-wave victory, single transaction and replay rewards');
    for(const f of [10,25,60,100]) {
      await seed(page,s=>{s.player.tower={highestFloor:f-1,clears:Array.from({length:100},(_,i)=>i<f-1?1:0),sigils:20};s.player.idle.inTown=true;});
      await openTower(page,f);await click(page,`[data-enter-tower="${f}"]`);await step(page,30000);s=await save(page);assert.equal(s.player.tower.highestFloor,f);assert.equal(s.player.inventory.at(-1).setId,'tran-thien');assert.equal(s.player.inventory.at(-1).rarity,f>=60?'Hoàng Kim':f>=25?'Cực phẩm':'Hiếm');
    }
    await openTower(page,100);await click(page,'[data-open-tower-shop]');const sigils=(await read(page)).player.tower.sigils;
    await page.locator('#tower-exchange-slot').selectOption('horse');await click(page,'[data-exchange-tower-piece="horse"]');s=await save(page);assert.equal(s.player.tower.sigils,sigils-20);assert.equal(s.player.inventory.at(-1).slot,'horse');assert.equal(s.player.inventory.at(-1).setId,'tran-thien');assert.equal(s.player.inventory.at(-1).level,155);
    await seed(page,s=>{s.player.tower.sigils=100;s.player.inventory=Array.from({length:60},(_,i)=>({...s.player.inventory[0],id:`full-${i}`}));});await openTower(page,100);await click(page,'[data-open-tower-shop]');assert.equal(await page.locator('[data-exchange-tower-piece]').isDisabled(),true);await click(page,'[data-exchange-tower-piece]');assert.equal((await save(page)).player.tower.sigils,100);
    await openTower(page,1);await click(page,'[data-enter-tower="1"]');await step(page,30000);s=await save(page);assert.ok(s.player.pendingItems.some(i=>i.setId==='tran-thien'));assert.equal(s.player.inventory.length,60);
    await close(page);await click(page,'#load-btn');assert.deepEqual((await save(page)).player.tower,s.player.tower);
    console.log('PASS actual boss/high-floor victories, rarity tiers, slot exchange, bag capacity, queued rewards and reload');
    await seed(page,s=>{s.player.attack=0;s.player.defense=1000000;s.player.idle.autoSkills=false;});const noReward=(await save(page)).player.tower;
    await openTower(page,100);await click(page,'[data-enter-tower="100"]');await step(page,181000);s=await save(page);assert.deepEqual(s.player.tower,noReward);assert.match(await page.locator('#log-list').textContent(),/Hết giờ/);
    await seed(page,s=>{s.player.hp=1;s.player.defense=0;s.player.potions.hp=0;});await openTower(page,100);await click(page,'[data-enter-tower="100"]');await step(page,30000);assert.deepEqual((await save(page)).player.tower,noReward);
    console.log('PASS timeout and death give no floor rewards');
    await seed(page,s=>{s.player.attack=1000;s.player.defense=1000;s.player.hp=s.player.maxHp;s.player.idle.inTown=true;s.player.idle.attributes={strength:0,dexterity:0,vitality:0,energy:0};s.player.idle.attributePoints=30;s.player.skillPoints=30;s.player.skillRanks={skill1:1,skill2:0,ultimate:0};});
    await close(page);await click(page,'[data-idle-tab="char"]');
    for(const invalid of ['0','-1','1.5','31']){await page.locator('#attribute-count-strength').fill(invalid);await click(page,'[data-bulk-attribute="strength"]');assert.equal((await save(page)).player.idle.attributePoints,30)}
    await page.locator('#attribute-count-strength').fill('17');await click(page,'[data-bulk-attribute="strength"]');s=await save(page);assert.equal(s.player.idle.attributes.strength,17);assert.equal(s.player.idle.attributePoints,13);
    await click(page,'[data-max-attribute="strength"]');s=await save(page);assert.equal(s.player.idle.attributes.strength,30);assert.equal(s.player.idle.attributePoints,0);
    await seed(page,s=>{s.player.idle.attributePoints=50;});await click(page,'[data-idle-tab="char"]');const pre=(await save(page)).player.idle.attributes;
    await click(page,'[data-recommend-points="attributes"]');assert.equal(await page.locator('[data-point-plan]').count(),4);assert.deepEqual((await read(page)).player.idle.attributes,pre);await click(page,'[data-cancel-point-plan]');assert.deepEqual((await save(page)).player.idle.attributes,pre);
    await click(page,'[data-recommend-points="attributes"]');await click(page,'[data-apply-point-plan="attributes"]');s=await save(page);assert.equal(s.player.idle.attributePoints,0);assert.equal(Object.values(s.player.idle.attributes).reduce((a,b)=>a+b),80);
    await openSkills(page);await page.locator('#skill-count-skill1').fill('10');await click(page,'[data-bulk-skill="skill1"]');assert.equal((await save(page)).player.skillRanks.skill1,11);
    await click(page,'[data-max-skill="skill1"]');s=await save(page);assert.equal(s.player.skillRanks.skill1,20);assert.equal(s.player.skillPoints,11);
    await click(page,'[data-recommend-points="skills"]');await click(page,'[data-apply-point-plan="skills"]');assert.equal((await save(page)).player.skillPoints,0);
    console.log('PASS exact bulk/invalid input, capped Max, proposal preview/cancel/apply and skill caps');
    await click(page,'[data-idle-tab="more"]');await page.locator('[data-setting="autoAttributes"]').check();await page.locator('[data-setting="autoSkillPoints"]').check();s=await save(page);assert.equal(s.player.idle.autoAttributes,true);assert.equal(s.player.idle.autoSkillPoints,true);
    await seed(page,s=>{s.player.level=5;s.player.xp=0;s.player.attack=1000000;s.player.defense=1000000;s.player.idle.attributePoints=0;s.player.skillPoints=0;s.player.skillRanks={skill1:1,skill2:0,ultimate:0};s.player.idle.attributes={strength:0,dexterity:0,vitality:0,energy:0};});
    await openTower(page,25);await click(page,'[data-enter-tower="25"]');await step(page,30000);s=await save(page);assert.ok(s.player.level>5);assert.equal(s.player.idle.attributePoints,0);assert.equal(s.player.skillPoints,0);assert.ok(Object.values(s.player.idle.attributes).reduce((a,b)=>a+b)>0);
    await close(page);await click(page,'#load-btn');assert.equal((await save(page)).player.idle.autoAttributes,true);
    console.log('PASS opted-in automatic allocation on real XP level-up and persisted settings');
    await seed(page,s=>{s.player.level=200;s.player.xp=0;});
    const beforeRebirth=(await save(page)).player;await close(page);await click(page,'[data-idle-tab="char"]');await click(page,'#rebirth-btn');assert.equal(await page.locator('#confirm-rebirth').isDisabled(),false);await click(page,'#confirm-rebirth');
    s=await save(page);assert.equal(s.player.level,1);assert.deepEqual(s.player.tower,beforeRebirth.tower);assert.equal(s.player.idle.autoAttributes,true);assert.equal(s.player.idle.autoSkillPoints,true);assert.deepEqual(s.player.inventory,beforeRebirth.inventory);
    await openTower(page,1);assert.equal(await page.locator('[data-enter-tower="1"]').isDisabled(),true);
    console.log('PASS tower progress, sigils, gear and auto preferences survive rebirth; entry still requires level five');
    const captures=process.env.VOLAM_CAPTURE_DIR||'/tmp/volam-tower-points';await fs.mkdir(captures,{recursive:true});
    for(const [w,h] of [[320,640],[390,844],[844,390],[1280,800]]) {
      await page.setViewportSize({width:w,height:h});await openTower(page,100);await page.evaluate(()=>document.querySelector('#toast').classList.remove('show'));await page.screenshot({path:`${captures}/tower-${w}x${h}.png`});
      const width=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth,modal:document.querySelector('.utility-dialog').scrollWidth,client:document.querySelector('.utility-dialog').clientWidth}));assert.ok(width.doc<=width.view+1);assert.ok(width.modal<=width.client+1);
      await close(page);await click(page,'[data-idle-tab="char"]');await page.screenshot({path:`${captures}/points-${w}x${h}.png`});
    }
    assert.deepEqual(errors,[]);console.log('PASS responsive tower/points screens, assets and browser runtime');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
