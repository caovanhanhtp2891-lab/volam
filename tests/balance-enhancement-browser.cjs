const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium} = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:4174/volam/';
const key = 'giang-ho-di-truyen-prototype';
const click = (p,s) => p.locator(s).first().evaluate(e=>e.click());
const step = (p,ms=100) => p.evaluate(ms=>window.advanceGame(ms),ms);
const save = async p => {await click(p,'#save-btn');return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)};
async function seed(p,edit){const data=await save(p);edit(data);await p.evaluate(({data,key})=>{localStorage.setItem(key,JSON.stringify(data));document.querySelector('#load-btn').click()},{data,key});await step(p);return save(p)}
const close = p=>click(p,'#utility-close');
const power = async p=>Number((await p.locator('#combat-power').textContent()).replaceAll('.',''));
const forge = async p=>{await click(p,'[data-idle-tab="char"]');await click(p,'[data-equipped-preview="weapon"]');await click(p,'[data-detail-enhance]')};
(async()=>{
 const {gearStats,enhancementInfo,migrateEquipmentBalance,EQUIPMENT_BALANCE_VERSION}=await import('../src/equipment.ts');
 const browser=await chromium.launch({executablePath:process.env.VOLAM_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const errors=[];
 try{
  await fs.mkdir('/tmp/volam-v24',{recursive:true});const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
   let time=1000,serial=0;const frames=new Map();Object.defineProperty(performance,'now',{value:()=>time});window.roll=.5;Math.random=()=>window.roll;
   window.requestAnimationFrame=cb=>{const id=++serial;frames.set(id,cb);return id};window.cancelAnimationFrame=id=>frames.delete(id);
   window.healthLabels={};let lastBar;const proto=CanvasRenderingContext2D.prototype,fill=proto.fill,text=proto.fillText;
   proto.fill=function(...args){if(this.canvas.id==='game-canvas'&&['#ef5360','#66db9c','#dfbd78'].includes(this.fillStyle))lastBar=this.fillStyle;return fill.apply(this,args)};
   proto.fillText=function(t,x,y,...args){if(this.canvas.id==='game-canvas'&&(/ · Cấp \d+$/.test(String(t))||/ · BOT$/.test(String(t))))window.healthLabels[t]=lastBar;return text.call(this,t,x,y,...args)};
   window.advanceGame=ms=>{while(ms>0){const dt=Math.min(50,ms);time+=dt;ms-=dt;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time))}};
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))errors.push(`${r.status()} ${r.url()}`)});
  await p.goto(url,{waitUntil:'networkidle'});await click(p,'[data-faction="gaibang"]');await click(p,'#join-sect');
  const original=await seed(p,s=>{
   Object.assign(s.player.idle,{inTown:true,autoEquip:false,autoLoot:false,autoSkills:false});s.player.botSettings={enabled:false,assist:false,pvp:false};s.player.level=80;s.player.gold=1000000000;s.player.refiningStones=1000000;
   const old={...s.player.equipment.weapon,id:'legacy-gold',name:'Kiếm Cũ',rarity:'Hoàng Kim',power:100,enhance:10,bonuses:{attack:20,hp:100,mp:30}};delete old.balanceVersion;delete old.setId;
   s.player.equipment={weapon:old};s.player.inventory=[{...old,id:'legacy-bag',rarity:'Tốt'}];s.player.pendingItems=[{...old,id:'legacy-pending',rarity:'Cực phẩm'}];s.groundLoot=[{id:'legacy-ground',x:950,y:650,gold:0,stones:0,item:{...old,id:'legacy-drop'}}];
  });
  for(const gear of [original.player.equipment.weapon,...original.player.inventory,...original.player.pendingItems,...original.groundLoot.map(d=>d.item)])assert.equal(gear.balanceVersion,EQUIPMENT_BALANCE_VERSION);
  assert.equal(original.player.equipment.weapon.power,180);assert.equal(original.player.equipment.weapon.enhance,10);assert.equal(original.player.gold,1000000000);
  assert.equal(original.player.inventory.length,1);assert.equal(original.player.pendingItems.length,1);assert.equal(original.groundLoot.length,1);
  const ownership=s=>JSON.stringify([s.player.equipment,s.player.inventory,s.player.pendingItems,s.groundLoot]);const migrated=ownership(original);
  await click(p,'#load-btn');await step(p);assert.equal(ownership(await save(p)),migrated,'repeated loading does not multiply upgraded items');
  await p.reload({waitUntil:'networkidle'});await step(p);assert.equal(ownership(await save(p)),migrated,'reload keeps every storage location');
  await forge(p);assert.match(await p.locator('[data-confirm-enhance]').textContent(),/\+11/);await close(p);
  // Use canonical gear to test all 100 actual button transactions, including affix unlocks.
  await seed(p,s=>{s.player.equipment.weapon={...s.player.equipment.weapon,enhance:0};s.player.inventory=[];s.player.pendingItems=[];s.groundLoot=[];});await p.evaluate(()=>window.roll=0);await forge(p);
  let previous=await save(p);
  for(let rank=0;rank<100;rank++){
   const item=previous.player.equipment.weapon,info=enhancementInfo(item);assert.equal(item.enhance,rank);assert.equal(await p.locator('[data-confirm-enhance]').isDisabled(),false);
   const predicted=Number((await p.locator('#enhance-character-power').textContent()).split(' → ')[1].slice(0,-1).replaceAll('.',''));
   await click(p,'[data-confirm-enhance]');const after=await save(p);
   assert.equal(after.player.equipment.weapon.enhance,rank+1);assert.equal(after.player.gold,previous.player.gold-info.cost);assert.equal(after.player.refiningStones,previous.player.refiningStones-info.stones);
   assert.equal(await power(p),predicted,'preview predicts exact power after each successful rank');
   assert.ok(gearStats(after.player.equipment.weapon).attack>gearStats(item).attack);
   if([10,30,60,100].includes(rank+1)){assert.equal(await p.locator('.detail-gear-art').getAttribute('data-enhancement'),String(rank+1));await p.screenshot({path:`/tmp/volam-v24/forge-${rank+1}.png`})}
   previous=after;
  }
  assert.equal(await p.locator('[data-confirm-enhance]').isDisabled(),true);assert.match(await p.locator('[data-confirm-enhance]').textContent(),/\+100 tối đa/);
  const capped=await save(p),cappedPower=await power(p);await click(p,'[data-confirm-enhance]');assert.deepEqual((await save(p)).player.equipment.weapon,capped.player.equipment.weapon);assert.equal((await save(p)).player.gold,capped.player.gold);await close(p);
  await p.reload({waitUntil:'networkidle'});await step(p);assert.equal((await save(p)).player.equipment.weapon.enhance,100);assert.equal(await power(p),cappedPower);
  await seed(p,s=>{s.player.equipment.weapon.enhance=99});await forge(p);await p.evaluate(()=>window.roll=.99);
  const failedBefore=await save(p),fee=enhancementInfo(failedBefore.player.equipment.weapon);await click(p,'[data-confirm-enhance]');const failed=await save(p);
  assert.equal(failed.player.equipment.weapon.enhance,99);assert.deepEqual(failed.player.equipment.weapon,failedBefore.player.equipment.weapon);assert.equal(failed.player.gold,failedBefore.player.gold-fee.cost);assert.equal(failed.player.refiningStones,failedBefore.player.refiningStones-fee.stones);assert.match(await p.locator('#enhance-result').textContent(),/10 đá/);await close(p);
  await seed(p,s=>{s.player.refiningStones=9});await forge(p);assert.equal(await p.locator('[data-confirm-enhance]').isDisabled(),true);await close(p);
  await seed(p,s=>{s.player.equipment.weapon.enhance=98;s.player.refiningStones=1000});await forge(p);await p.evaluate(()=>window.roll=0);
  const stale=await p.locator('[data-confirm-enhance]').getAttribute('data-enhance-rank');await click(p,'[data-confirm-enhance]');const once=await save(p);
  await p.locator('[data-confirm-enhance]').evaluate((b,rank)=>{b.dataset.enhanceRank=rank;b.click()},stale);assert.equal((await save(p)).player.equipment.weapon.enhance,99);assert.equal((await save(p)).player.gold,once.player.gold);await close(p);
  // Actual rendered enemies and PK bots use red, support teammates use green.
  await click(p,'#world-panel-close');
  await p.evaluate(()=>window.roll=.5);
  await seed(p,s=>{s.player.equipment={};s.player.attack=1;s.player.defense=1000000;Object.assign(s.player.idle,{enabled:true,inTown:false,maxStage:160,stage:10,wave:4,push:false});s.player.botSettings={enabled:true,assist:false,pvp:false};});
  if(await p.locator('#mobile-auto').getAttribute('aria-pressed')==='true')await click(p,'#mobile-auto');await p.evaluate(()=>window.healthLabels={});await step(p,200);
  let labels=await p.evaluate(()=>window.healthLabels);let world=await save(p);assert.ok(world.enemies.some(e=>e.kind==='boss'));
  for(const e of world.enemies.filter(e=>!e.dead))assert.equal(labels[`${e.name} · Cấp ${e.level}`],'#ef5360',e.name);
  const neutrals=Object.entries(labels).filter(([name])=>name.endsWith(' · BOT'));assert.ok(neutrals.length);assert.ok(neutrals.every(([,color])=>color==='#dfbd78'));
  await seed(p,s=>{s.player.botSettings.assist=true});await p.evaluate(()=>window.healthLabels={});await step(p,100);labels=await p.evaluate(()=>window.healthLabels);const teammates=Object.entries(labels).filter(([name])=>name.endsWith(' · BOT'));assert.ok(teammates.length);assert.ok(teammates.every(([,color])=>color==='#66db9c'));
  await p.evaluate(()=>window.roll=0);await seed(p,s=>{Object.assign(s.player.idle,{stage:1,wave:1});s.player.botSettings={enabled:true,assist:false,pvp:true};s.player.x=950;s.player.y=650;});
  if(await p.locator('#mobile-auto').getAttribute('aria-pressed')==='true')await click(p,'#mobile-auto');await p.evaluate(()=>window.healthLabels={});await step(p,400);labels=await p.evaluate(()=>window.healthLabels);const pk=Object.entries(labels).filter(([name])=>name.includes('ĐỒ SÁT'));assert.ok(pk.length);assert.ok(pk.every(([,color])=>color==='#ef5360'));await p.screenshot({path:'/tmp/volam-v24/hostile-red.png'});
  // Energy allocation contributes to the displayed linear power as well as MP.
  await seed(p,s=>{s.player.idle.inTown=true;s.player.botSettings.enabled=false});const base=await power(p);await seed(p,s=>{s.player.idle.attributes.energy+=10});assert.ok(await power(p)>base);
  await click(p,'[data-idle-tab="char"]');await click(p,'#realm-guide-btn');assert.equal(await p.locator('.realm-table tbody tr').count(),23);assert.match(await p.locator('.realm-table').textContent(),/12\.000\.000/);await close(p);
  await seed(p,s=>{s.player.equipment.weapon=migrateEquipmentBalance({...original.player.equipment.weapon,enhance:99});s.player.gold=1000000000;s.player.refiningStones=1000;});
  for(const [width,height]of[[320,568],[390,844],[844,390],[1440,900]]){await p.setViewportSize({width,height});await forge(p);assert.ok(await p.locator('.utility-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await close(p)}
  assert.deepEqual(errors,[]);console.log('PASS: all gear storage locations migrate once; +10 continues to +100; 100 actual successes and exact power previews; +99 failure/stale click/material limits/save reload; enemy/boss/PK red, neutral amber, teammates green; linear realms and MP points; four viewport layouts.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
