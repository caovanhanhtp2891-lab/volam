const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:4174/volam/';
const key = 'giang-ho-di-truyen-prototype';
const click = (p, s) => p.locator(s).first().evaluate(e => e.click());
const read = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const save = async p => { await click(p, '#save-btn'); return read(p); };
const step = (p, ms=100) => p.evaluate(ms => window.advanceGame(ms), ms);
async function seed(p, edit) { const data = await save(p); edit(data); await p.evaluate(({data,key}) => { localStorage.setItem(key,JSON.stringify(data)); document.querySelector('#load-btn').click(); }, {data,key}); await step(p); return save(p); }
const close = p => click(p, '#utility-close');
async function siege(p, city) { await click(p,'[data-open-siege]'); await p.locator('#siege-city').selectOption(city); await p.locator('#siege-size').selectOption('6'); await click(p,'[data-start-siege]'); await step(p); }
(async () => {
 const browser = await chromium.launch({executablePath:process.env.VOLAM_CHROMIUM_PATH || '/usr/bin/chromium', headless:true,args:['--no-sandbox']});
 const errors=[];
 try {
  await fs.mkdir('/tmp/volam-v22',{recursive:true});
  const context = await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(() => {
   let time=1000, serial=0; const frames=new Map();
   Object.defineProperty(performance,'now',{value:()=>time});
   window.randomValue=.25; Math.random=()=>window.randomValue;
   window.requestAnimationFrame=cb=>{const id=++serial;frames.set(id,cb);return id};window.cancelAnimationFrame=id=>frames.delete(id);
   window.offscreenSizes=[]; window.labels=[]; window.botPositions={}; window.damageTexts=0;
   const p=CanvasRenderingContext2D.prototype, fill=p.fillText, draw=p.drawImage;
   p.fillText=function(text,x,y,...args){
    if(this.canvas.id==='game-canvas') {
     if(String(text).includes('ĐỒ SÁT')) window.labels.push(String(text));
     if(String(text).endsWith(' · BOT')) window.botPositions[text]={x,y};
     if(String(text).startsWith('-') && this.fillStyle==='#f6c1b8') window.damageTexts++;
    }
    if(!window.fastSimulation || this.canvas.id!=="game-canvas") return fill.call(this,text,x,y,...args);
   };
   p.drawImage=function(source,...args){if(source instanceof HTMLCanvasElement && source!==this.canvas && source.width>600) if(!window.offscreenSizes.some(([w,h])=>w===source.width&&h===source.height)) window.offscreenSizes.push([source.width,source.height]);if(!window.fastSimulation || this.canvas.id!=="game-canvas") return draw.call(this,source,...args)};
   for(const name of ['fill','stroke','fillRect','strokeRect','strokeText']){const original=p[name];p[name]=function(...args){if(!window.fastSimulation || this.canvas.id!=="game-canvas") return original.apply(this,args)}}
   window.advanceGame=ms=>{window.fastSimulation=ms>1000;while(ms>0){const dt=Math.min(50,ms);time+=dt;ms-=dt;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time))}window.fastSimulation=false};
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))errors.push(`${r.status()} ${r.url()}`)});
  await p.goto(url,{waitUntil:'networkidle'});await p.locator('[data-faction="gaibang"]').click();await p.locator('#join-sect').click();
  await seed(p,s=>{s.player.level=160;s.player.xp=0;s.player.attack=1000000;s.player.defense=1000000;Object.assign(s.player.idle,{inTown:true,autoEquip:false,autoLoot:true,autoSkills:false});s.player.botSettings={enabled:false,assist:false,pvp:false};s.player.inventory=[];});
  await click(p,'[data-idle-tab="more"]');
  assert.equal(await p.locator('[data-loot-setting="autoDiscard"]').isChecked(),false);
  await p.locator('[data-loot-setting="minRarity"]').selectOption('6');await p.locator('[data-loot-setting="minGrade"]').selectOption('16');
  let data=await save(p); assert.equal(data.player.lootSettings.minRarity,6);assert.equal(data.player.lootSettings.minGrade,16);
  await p.locator('#loot-settings-heading').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/volam-v22/loot-settings-mobile.png'});
  const gold=data.player.gold;
  await seed(p,s=>{
   Object.assign(s.player.idle,{stage:1,wave:1,enabled:true,inTown:false,push:false});s.player.x=950;s.player.y=650;
   const drop={...s.player.equipment.weapon,id:'filtered-green-item',rarity:'Tốt',level:1,power:1,enhance:0};delete drop.setId;
   s.groundLoot=[{id:'filtered-green',x:950,y:650,item:drop,gold:17,stones:2}];
  });
  if(await p.locator('#mobile-auto').getAttribute('aria-pressed')==='true')await click(p,'#mobile-auto');
  await step(p,1000);
  data=await save(p);assert.equal(data.player.gold,gold+17,'silver bundled with a rejected item still gets picked');assert.equal(data.player.inventory.length,0,'low quality drops stay on the ground');
  await p.keyboard.press('e');await step(p);data=await save(p);assert.ok(data.player.inventory.length>0,'manual pickup bypasses the automatic filter');
  assert.ok(data.player.inventory.some(i=>i.rarity==='Tốt'&&i.level<151));
  await seed(p,s=>{
   s.player.idle.inTown=true;
   const base=structuredClone(s.player.equipment.weapon);delete base.setId;delete base.bonuses;
   const weak={...base,id:'filter-weak',enhance:0,power:1,level:10,rarity:'Thường'};
   s.player.inventory=[weak,{...weak,id:'filter-strong',power:1000000},{...weak,id:'filter-gold',rarity:'Hoàng Kim'},{...weak,id:'filter-enhanced',enhance:1}];
   s.player.pendingItems=[{...weak,id:'filter-pending'}];
  });
  await click(p,'[data-idle-tab="more"]');
  await p.evaluate(()=>{
   window.originalSetItem=Storage.prototype.setItem;
   Storage.prototype.setItem=function(){throw Error('quota-test')};
   const input=document.querySelector('[data-loot-setting="autoDiscard"]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
   Storage.prototype.setItem=window.originalSetItem;
  });
  data=await save(p);assert.equal(data.player.lootSettings.autoDiscard,false);assert.ok(data.player.inventory.some(i=>i.id==='filter-weak'),'failed settings persistence restores discarded items');
  await p.locator('[data-loot-setting="autoDiscard"]').check();data=await save(p);
  assert.ok(!data.player.inventory.some(i=>i.id==='filter-weak'));assert.ok(data.player.inventory.some(i=>i.id==='filter-strong'));assert.ok(data.player.inventory.some(i=>i.id==='filter-gold'));assert.ok(data.player.inventory.some(i=>i.id==='filter-enhanced'));assert.equal(data.player.pendingItems[0].id,'filter-pending');
  await p.reload({waitUntil:'networkidle'});await step(p);await click(p,'[data-idle-tab="more"]');assert.equal(await p.locator('[data-loot-setting="autoDiscard"]').isChecked(),true);assert.equal(await p.locator('[data-loot-setting="minRarity"]').inputValue(),'6');
  await p.locator('[data-loot-setting="autoDiscard"]').uncheck();
  // Patrol targets are independent of the hero and remain far away after travel.
  await seed(p,s=>{Object.assign(s.player.idle,{enabled:true,inTown:false,stage:1,wave:1,autoLoot:false,autoSkills:false});s.player.botSettings={enabled:true,assist:false,pvp:false};s.player.x=950;s.player.y=650;});
  if(await p.locator('#mobile-auto').getAttribute('aria-pressed')==='true')await click(p,'#mobile-auto');
  await click(p,"#world-panel-close");
  await step(p,12000);const positions=await p.evaluate(()=>window.botPositions);
  assert.ok(Object.values(positions).some(b=>Math.hypot(b.x-950,b.y-650)>300),'BOT patrol goes beyond the old follow circle');
  // Actual PK: one encounter turns a BOT into a targetable player enemy, with no gear loss.
  await p.evaluate(()=>{window.randomValue=0;window.labels=[];});
  await seed(p,s=>{Object.assign(s.player.idle,{enabled:true,inTown:false,stage:1,wave:1});s.player.botSettings={enabled:true,assist:false,pvp:true};s.player.x=950;s.player.y=650;s.player.hp=s.player.maxHp;});
  await step(p,400);assert.ok((await p.evaluate(()=>window.labels)).length>0,'hostile BOT is drawn and targetable');
  const gear=JSON.stringify((await save(p)).player.equipment);
  if(await p.locator('#mobile-auto').getAttribute('aria-pressed')==='false')await click(p,'#mobile-auto');
  await step(p,5500);assert.match(await p.locator('#log-list').textContent(),/Đã đánh bại .*ĐỒ SÁT/);assert.equal(JSON.stringify((await save(p)).player.equipment),gear);
  await seed(p,s=>{s.player.idle.inTown=true;s.player.botSettings={enabled:true,assist:false,pvp:true};});await p.evaluate(()=>window.labels=[]);await step(p,1200);assert.equal((await p.evaluate(()=>window.labels)).length,0,'town remains safe even at RNG zero');
  // Eligible victories advance the territory route once; practice never skips a city.
  await p.evaluate(()=>window.randomValue=.5);
  await seed(p,s=>{s.player.level=160;s.player.military={captured:[],seals:[],equipped:null};s.player.botSettings.enabled=false;s.player.idle.autoSkills=true;s.player.idle.autoPotions=true;});
  const before=await save(p);await siege(p,'bien-thanh');const phases=new Set();
  for(let i=0;i<49;i++){phases.add(await p.locator('#siege-phase').textContent());await step(p,5000);if(!(await p.locator('#siege-hud').isVisible()))break;}
  data=await save(p);assert.equal(data.player.sieges.history[0]?.outcome,'victory',JSON.stringify({phases:[...phases],pending:data.player.sieges.pending}));assert.deepEqual(data.player.military.captured,['bien-thanh']);assert.ok([...phases].some(t=>t.startsWith('Giữ chiến kỳ')));assert.equal(data.player.inventory.length+data.player.pendingItems.length,before.player.inventory.length+before.player.pendingItems.length+1);
  assert.ok((await p.locator('#log-list').textContent()).includes('Viện binh thủ thành đợt 2/2'));await close(p);
  await siege(p,'bien-thanh');for(let i=0;i<49 && await p.locator('#siege-hud').isVisible();i++)await step(p,5000);
  data=await save(p);assert.deepEqual(data.player.military.captured,['bien-thanh']);assert.equal(data.player.sieges.victories,2);await close(p);
  // All map buffers retain their native size; exploration roads have readable edges.
  assert.ok((await p.evaluate(()=>window.offscreenSizes)).some(([w,h])=>w===1900&&h===1200));
  await click(p,'[data-open-exploration]');await p.locator('#exploration-region').selectOption('3');await click(p,'[data-explore-region="3"]');await step(p,100);await p.screenshot({path:'/tmp/volam-v22/map-mobile.png'});
  assert.ok((await p.evaluate(()=>window.offscreenSizes)).some(([w,h])=>w===3600&&h===2400));
  await click(p,'[data-exit-exploration]');await step(p);
  const old=await seed(p,s=>{delete s.player.lootSettings;delete s.player.botSettings.pvp;});assert.equal(old.player.lootSettings.autoDiscard,false);assert.equal(old.player.lootSettings.minRarity,0);assert.equal(old.player.botSettings.pvp,true);
  for(const viewport of [{width:320,height:740},{width:844,height:390},{width:1280,height:800}]){await p.setViewportSize(viewport);await click(p,'[data-idle-tab="more"]');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  assert.deepEqual(errors,[]);
  console.log('PASS: persisted pickup/grade filters; cash on rejected drops; manual pickup; automatic discard protection; independent patrol; PK/retaliation/safe town; capture/reinforcements/rewards/idempotent territory; native maps; old saves and responsive settings.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
