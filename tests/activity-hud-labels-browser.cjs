const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.VOLAM_PLAYWRIGHT_PATH||'playwright');
const url=process.env.VOLAM_TEST_URL||'http://127.0.0.1:4174/volam/';
const key='giang-ho-di-truyen-prototype';
const click=(p,s)=>p.locator(s).first().evaluate(el=>el.click());
const step=(p,ms=100)=>p.evaluate(ms=>window.advanceGame(ms),ms);
const save=async p=>{await click(p,'#save-btn');return p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)};
async function seed(p,edit){const s=await save(p);edit(s);await p.evaluate(({s,key})=>{localStorage.setItem(key,JSON.stringify(s));document.querySelector('#load-btn').click()},{s,key});await step(p);return save(p)}
const arena=async p=>{await click(p,'#world-panel-close');await step(p)};
(async()=>{
 const {TERRITORIES,MILITARY_RANKS}=await import('../src/military.ts');
 const browser=await chromium.launch({executablePath:process.env.VOLAM_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const errors=[];
 try{
  await fs.mkdir('/tmp/volam-v23',{recursive:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
   let time=1000,serial=0;const frames=new Map();Object.defineProperty(performance,'now',{value:()=>time});Math.random=()=>.5;
   window.requestAnimationFrame=cb=>{const id=++serial;frames.set(id,cb);return id};window.cancelAnimationFrame=id=>frames.delete(id);
   window.motionSamples=[];window.currentSample={};
   const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText;
   proto.fillText=function(text,x,y,...args){
    if(this.canvas.id==='game-canvas'){
     let kind=String(text).startsWith('Ấn ·')?'military':String(text).includes('Trấn Thiên Chí Tôn')?'title':String(text).startsWith('Vô Cực')?'realm':text==='Kiểm Tra Nhãn · Cấp 160'?'hero':undefined;
     if(kind){const t=this.getTransform();window.currentSample[kind]={x:t.e+x,y:t.f+y,font:this.font};}
    }
    return fill.call(this,text,x,y,...args);
   };
   window.advanceGame=ms=>{while(ms>0){const dt=Math.min(25,ms);time+=dt;ms-=dt;window.currentSample={};const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time));if(window.currentSample.hero&&window.currentSample.realm)window.motionSamples.push(structuredClone(window.currentSample));}if(window.motionSamples.length>1200)window.motionSamples.splice(0,window.motionSamples.length-1200)};
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))errors.push(`${r.status()} ${r.url()}`)});
  await p.goto(url,{waitUntil:'networkidle'});await p.locator('[data-faction="gaibang"]').click();await p.locator('#join-sect').click();
  await seed(p,s=>{s.player.name='Kiểm Tra Nhãn';s.player.level=160;s.player.xp=0;s.player.attack=1000000;s.player.defense=1000000;s.player.gold=1000000000;s.player.botSettings.enabled=false;Object.assign(s.player.idle,{inTown:true,autoEquip:false,autoSkills:false,autoLoot:false});s.player.tower={highestFloor:100,clears:Array(100).fill(1),sigils:40};s.player.military={captured:TERRITORIES.map(t=>t.id),seals:MILITARY_RANKS.map(r=>r.id),equipped:'hoang-de'};s.player.journey.activeTitle='sky-sovereign';s.player.journey.unlockedTitles.push('sky-sovereign');});
  assert.match(await p.locator('[data-idle-tab="log"]').textContent(),/Hoạt động/);assert.match(await p.locator('[data-idle-tab="more"]').textContent(),/Cài đặt/);
  assert.equal(await p.locator('.settings-panel [data-open-events],.settings-panel [data-open-siege],.settings-panel [data-open-tower],.settings-panel [data-idle-open],.settings-panel [data-open-exploration],.settings-panel #adventure-btn').count(),0);
  for(const [selector,title] of [['[data-open-tower]','Trấn Thiên Tháp'],['[data-open-siege]','Công thành theo yêu cầu'],['[data-open-golden-boss]','Boss Hoàng Kim'],['[data-open-territories]','Tranh đoạt lãnh thổ'],['[data-open-bots]','Đồng hành'],['[data-open-exploration]','Khám phá'],['[data-open-bestiary]','Sổ quái']]){
   await click(p,'[data-idle-tab="more"]');await p.locator('[data-idle-tab="log"]').click();assert.equal(await p.locator('.activity-intro').isVisible(),true);await click(p,`.world-panel ${selector}`);assert.match(await p.locator('#utility-title').textContent(),new RegExp(title));await click(p,'#utility-close');
  }
  for(const game of ['wheel','dice','lottery']){await click(p,`.world-panel [data-event-game="${game}"]`);assert.equal(await p.locator('.lucky-stage').getAttribute('data-lucky-stage'),game);await click(p,'#utility-close');}
  await click(p,'#golden-boss-btn');assert.match(await p.locator('#utility-title').textContent(),/Boss Hoàng Kim/);await click(p,'#utility-close');
  await click(p,'.world-panel [data-idle-open="dungeon"]');assert.equal(await p.locator('.dungeon-card').count()>0,true);
  await click(p,'[data-idle-tab="log"]');await p.screenshot({path:'/tmp/volam-v23/activities-mobile.png'});
  await click(p,'[data-idle-tab="more"]');await p.screenshot({path:'/tmp/volam-v23/settings-mobile.png'});await arena(p);
  for(const [width,height]of[[320,568],[360,640],[390,844],[600,960],[844,390],[1440,900]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(100);await step(p);
   const hud=await p.evaluate(()=>{
    const silver=document.querySelector('#gold-label'),wallet=silver.parentElement,hero=document.querySelector('#hero-status'),actions=document.querySelector('.header-actions');
    const s=silver.getBoundingClientRect(),w=wallet.getBoundingClientRect(),h=hero.getBoundingClientRect(),a=actions.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(silver);const text=range.getBoundingClientRect();
    return {value:silver.textContent,clipped:silver.scrollWidth>silver.clientWidth,textInside:text.left>=w.left&&text.right<=w.right,inside:s.left>=0&&s.right<=innerWidth,overlap:h.right>a.left,bar:document.querySelector('.hp-meter').getBoundingClientRect().width,full:document.documentElement.scrollWidth===innerWidth};
   });assert.equal(hud.value,'1.000.000.000');assert.equal(hud.clipped,false);assert.equal(hud.textInside,true);assert.equal(hud.inside,true);assert.equal(hud.overlap,false);assert.equal(hud.full,true);if(width<height&&width<=390)assert.ok(hud.bar<145);
   await p.screenshot({path:`/tmp/volam-v23/hud-${width}x${height}.png`});
   await click(p,'[data-idle-tab="log"]');assert.equal(await p.locator('.activity-intro').isVisible(),true);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await arena(p);
  }
  await p.setViewportSize({width:390,height:844});
  // All text shares the hero's movement, even near a camera edge and the HUD.
  for(const mounted of [false,true]){
   await seed(p,s=>{Object.assign(s.player.idle,{enabled:false,inTown:false});s.player.x=300;s.player.y=330;s.player.mounted=mounted;if(mounted)s.player.equipment.horse={...s.player.equipment.weapon,id:'motion-horse',slot:'horse',variant:'bay',name:'Ngựa Kiểm Tra',rarity:'Tốt',level:1,enhance:0,power:10};});
   if(await p.locator('#mobile-auto').getAttribute('aria-pressed')==='true')await click(p,'#mobile-auto');
   await p.evaluate(()=>{window.motionSamples=[];document.activeElement?.blur()});const before=(await save(p)).player.x;await p.keyboard.down('d');await step(p,2200);await p.keyboard.up('d');assert.ok((await save(p)).player.x>before+40,'keyboard input moves the actual hero');await p.keyboard.down('w');await step(p,1500);await p.keyboard.up('w');
   const samples=await p.evaluate(()=>window.motionSamples);assert.ok(samples.length>50);assert.ok(new Set(samples.map(s=>`${Math.round(s.hero.x)}:${Math.round(s.hero.y)}`)).size>10,'hero traverses camera edges on screen');
   const first=samples.find(s=>s.military&&s.title&&s.realm);assert.ok(first);
   for(const s of samples){for(const kind of ['military','title','realm']){assert.ok(s[kind]);assert.ok(Math.abs(s[kind].x-s.hero.x)<.001);assert.ok(Math.abs((s[kind].y-s.hero.y)-(first[kind].y-first.hero.y))<.001,`${kind} must move with the hero without HUD clamping`);const size=parseFloat(s[kind].font.match(/[\d.]+(?=px)/)[0]);assert.ok(size>=10&&size<=14);}}
   await step(p);await p.screenshot({path:`/tmp/volam-v23/labels-${mounted?'mounted':'walking'}.png`});
  }
  await click(p,'[data-idle-tab="char"]');for(const selector of ['#preview-military-rank','#preview-title-label','#preview-player-realm']){const style=await p.locator(selector).evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow}});assert.equal(style.background,'rgba(0, 0, 0, 0)');assert.equal(style.border,'0px');assert.equal(style.shadow,'none');}
  await click(p,'[data-idle-tab="more"]');await p.locator('[data-preference="titleVisible"]').uncheck();const saved=await save(p);await p.reload({waitUntil:'networkidle'});await step(p);assert.equal((await save(p)).player.preferences.titleVisible,false);assert.equal((await save(p)).player.gold,saved.player.gold);assert.deepEqual(errors,[]);
  console.log('PASS: one-tap Activity hub, real routes for all activities and three event tabs, settings-only panel; full maximum silver at six sizes; compact transparent prestige; walking/mounted labels follow hero exactly through camera/HUD edges; preferences and saves preserved.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
