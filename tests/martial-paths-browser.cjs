const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.VOLAM_PLAYWRIGHT_PATH||'playwright');
const url=process.env.VOLAM_TEST_URL||'http://127.0.0.1:4174/volam/';
const key='giang-ho-di-truyen-prototype';
const click=(p,s)=>p.locator(s).first().evaluate(e=>e.click());
const step=(p,ms=100)=>p.evaluate(ms=>advanceGame(ms),ms);
async function save(p){await click(p,'#save-btn');return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)}
async function seed(p,edit){const s=await save(p);edit(s);await p.evaluate(({s,key})=>{localStorage.setItem(key,JSON.stringify(s));document.querySelector('#load-btn').click()},{s,key});await step(p);return save(p)}
const ownership=s=>JSON.stringify([s.player.equipment,s.player.inventory,s.player.gems,s.player.passiveRanks,s.player.companions,s.player.skillRanks,s.player.skillPoints,s.player.gold]);
async function arena(p){await click(p,'[data-idle-tab="char"]');await click(p,'[data-idle-tab="log"]');await click(p,'#world-panel-close');await step(p)}
async function target(p,e){const at=await p.evaluate(e=>{const c=document.querySelector('#game-canvas'),r=c.getBoundingClientRect();return{x:r.x+(e.x-(window.cam?.x||0))*r.width/c.width,y:r.y+(e.y-(window.cam?.y||0))*r.height/c.height}},e);await p.mouse.click(at.x,at.y)}
(async()=>{
 const {MARTIAL_PATHS}=await import('../src/martial-paths.ts');const {SECT_BY_FACTION}=await import('../src/sects.ts');
 const browser=await chromium.launch({executablePath:process.env.VOLAM_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true});const errors=[];
 try{
  await fs.mkdir('/tmp/volam-v29',{recursive:true});let casts=0;
  for(const [faction,sect] of Object.entries(SECT_BY_FACTION))for(const route of MARTIAL_PATHS[sect]){
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   await ctx.addInitScript(()=>{
    let time=1000,id=0;const frames=new Map();performance.now=()=>time;Math.random=()=>.5;
    requestAnimationFrame=cb=>{frames.set(++id,cb);return id};cancelAnimationFrame=id=>frames.delete(id);
    window.advanceGame=ms=>{while(ms>0){const dt=Math.min(50,ms);time+=dt;ms-=dt;const batch=[...frames.values()];frames.clear();batch.forEach(cb=>cb(time))}};
    const proto=CanvasRenderingContext2D.prototype,translate=proto.translate,clear=proto.clearRect;
    proto.clearRect=function(...args){if(this.canvas.id==='game-canvas')this.nextCamera=true;return clear.apply(this,args)};
    proto.translate=function(x,y){if(this.nextCamera){window.cam={x:-x,y:-y};this.nextCamera=false}return translate.call(this,x,y)};
   });
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(`${sect}/${route.id}: ${e.message}`));p.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
   await p.goto(url,{waitUntil:'networkidle'});assert.equal(await p.locator('html').getAttribute('data-version'),'0.30.0',errors.join('\n'));
   await click(p,`[data-faction="${faction}"]`);assert.equal(await p.locator('[data-select-path]').count(),2);
   await click(p,`[data-select-path="${route.id}"]`);assert.match(await p.locator('#sect-detail').textContent(),new RegExp(route.kit.ultimate.name));await click(p,'#join-sect');await step(p);
   assert.equal((await save(p)).player.martialPath,route.id);
   await seed(p,s=>{const q=s.player;q.level=20;q.attack=1;q.defense=100000;q.rage=100;q.skillPoints=17;q.skillRanks={skill1:4,skill2:3,ultimate:2};q.idle={...q.idle,inTown:true,enabled:false,autoEquip:false,autoLoot:false,autoSkills:false,autoPotions:false};q.botSettings={enabled:false,assist:false,pvp:false};q.cooldowns={skill1:0,skill2:0,ultimate:0};});
   await click(p,'[data-idle-tab="char"]');await click(p,'.character-heading [data-open-martial-paths]');
   for(const skill of ['skill1','skill2','ultimate']){await click(p,`[data-art-skill="${skill}"]`);await step(p,400);assert.match(await p.locator('#utility-title').textContent(),new RegExp(route.name));assert.equal(await p.locator('#skill-art-canvas').getAttribute('data-path'),route.id);}
   await p.screenshot({path:`/tmp/volam-v29/${sect}-${route.id}.png`});
   const before=await save(p),other=MARTIAL_PATHS[sect].find(x=>x.id!==route.id);
   await click(p,`[data-preview-path="${other.id}"]`);await step(p,150);assert.equal((await save(p)).player.martialPath,route.id,'preview does not equip the path');
   await click(p,'[data-apply-path]');await step(p,150);let after=await save(p);assert.equal(after.player.martialPath,other.id);assert.equal(ownership(after),ownership(before),'switch neither grants nor loses equipment, gems, companions or skill points');
   await click(p,`[data-preview-path="${route.id}"]`);await click(p,'[data-apply-path]');await click(p,'#utility-close');
   await p.reload({waitUntil:'networkidle'});await step(p);assert.equal((await save(p)).player.martialPath,route.id);assert.equal(ownership(await save(p)),ownership(before));
   if(sect==='thieu-lam'&&route.id==='staff'){
    // A quota failure must roll back the in-memory path as well as preserve the saved character.
    await click(p,'.character-heading [data-open-martial-paths]');await click(p,`[data-preview-path="${other.id}"]`);
    await p.evaluate(k=>{window.realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===k)throw new Error('test quota');return window.realSetItem.call(this,name,value)}},key);
    await click(p,'[data-apply-path]');assert.equal(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).player.martialPath,key),route.id);
    await p.evaluate(()=>{Storage.prototype.setItem=window.realSetItem;delete window.realSetItem});
    assert.equal((await save(p)).player.martialPath,route.id);assert.equal(ownership(await save(p)),ownership(before));await click(p,'#utility-close');
    // Town timers actually expire, so switching is not permanently locked after returning from battle.
    await seed(p,s=>{s.player.cooldowns={skill1:.6,skill2:0,ultimate:0};s.player.idle.inTown=true;});
    await click(p,'.character-heading [data-open-martial-paths]');await click(p,`[data-preview-path="${other.id}"]`);
    assert.equal(await p.locator('[data-apply-path]').isDisabled(),true);await step(p,800);assert.equal(await p.locator('[data-apply-path]').isDisabled(),false);await click(p,'#utility-close');
   }
   for(const skill of ['skill1','skill2','ultimate']){
    const def=route.kit[skill];await seed(p,s=>{const q=s.player;q.idle.inTown=false;q.idle.enabled=false;q.cooldowns={skill1:0,skill2:0,ultimate:0};q.rage=100;q.mp=q.maxMp;q.hp=Math.floor(q.maxHp*.4);const e=s.enemies.find(e=>e.id==='bandit-1');q.x=e.x-45;q.y=e.y;});
    await arena(p);let s=await save(p),e=s.enemies.find(e=>e.id==='bandit-1');await target(p,e);const start=await save(p);
    await p.locator(`[data-skill="${skill}"]`).click();await target(p,start.player);await step(p,850);const finish=await save(p),victim=finish.enemies.find(x=>x.id===e.id);
    if(!(finish.player.cooldowns[skill]>0)){await p.screenshot({path:'/tmp/volam-v29/cast-failure.png'});console.log('cast failure',JSON.stringify({sect,path:route.id,skill,position:{x:start.player.x,y:start.player.y},mp:start.player.mp,cooldowns:finish.player.cooldowns,enemy:e.name,ui:await p.locator('body').innerText()}));}
    assert.ok(finish.player.cooldowns[skill]>0,`${sect}/${route.id}/${skill} starts real cooldown`);
    assert.ok(finish.player.mp<start.player.mp,`${sect}/${route.id}/${skill} consumes MP`);
    if(def.damage>0)assert.ok(victim.dead||victim.hp<e.hp,`${sect}/${route.id}/${skill} damages the selected enemy`);
    if(def.poison&&!victim.dead)assert.ok(victim.poisonUntil>0);
    if(def.burn&&!victim.dead)assert.ok(victim.burnUntil>0);
    if(def.heal)assert.ok(finish.player.hp>start.player.hp);
    if(def.shield)assert.ok(finish.player.shield>0);
    if(def.slow&&!victim.dead)assert.equal(victim.slowFactor,def.slow);
    if(def.stun&&!victim.dead)assert.ok(victim.stunUntil>0);
    if(def.breakArmor&&!victim.dead)assert.ok(victim.defenseDownUntil>0);
    if(skill==='ultimate')assert.ok(finish.player.rage<100);
    casts++;
   }
   // Switching in combat remains blocked even if a DOM click is synthesized.
   await click(p,'[data-idle-tab="char"]');await click(p,'.character-heading [data-open-martial-paths]');await click(p,`[data-preview-path="${other.id}"]`);
   assert.equal(await p.locator('[data-apply-path]').isDisabled(),true);await click(p,'[data-apply-path]');assert.equal((await save(p)).player.martialPath,route.id);await click(p,'#utility-close');
   // Old saves without the new field load with a valid school default and keep the shared skill pool.
   const old=await seed(p,s=>{delete s.player.martialPath;s.player.idle.inTown=true;});assert.ok(MARTIAL_PATHS[sect].some(x=>x.id===old.player.martialPath));assert.deepEqual(old.player.skillRanks,{skill1:4,skill2:3,ultimate:2});assert.equal(old.player.skillPoints,17);
   for(const viewport of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){await p.setViewportSize(viewport);await step(p);await click(p,'.character-heading [data-open-martial-paths]');await step(p);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);const r=await p.locator('.utility-dialog').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width+1);await click(p,'#utility-close');}
   console.log(`PASS ${sect}/${route.id}: creation, three real casts, preview/switch, shared points, reload, legacy save, responsive UI`);
   await ctx.close();
  }
  assert.equal(casts,60);assert.deepEqual(errors,[]);console.log('PASS all 20 paths and 60 actual skill casts, without script or asset errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
