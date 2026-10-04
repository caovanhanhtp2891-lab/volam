const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.VOLAM_PLAYWRIGHT_PATH||'playwright');
const url=process.env.VOLAM_TEST_URL||'http://127.0.0.1:5173';
const key='giang-ho-di-truyen-prototype';
const click=(p,s)=>p.locator(s).evaluate(el=>el.click());
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const save=async p=>{await click(p,'#save-btn');return read(p)};
const step=(p,ms)=>p.evaluate(ms=>window.advanceGame(ms),ms);
async function seed(p,edit){const s=await save(p);edit(s);await p.evaluate(({s,key})=>{localStorage.setItem(key,JSON.stringify(s));document.querySelector('#load-btn').click()},{s,key});await step(p,100);return save(p)}
const close=p=>click(p,'#utility-close');
const hash=(p,selector)=>p.locator(selector).evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=2166136261;for(let i=0;i<d.length;i+=4)h=Math.imul(h^d[i]^d[i+1]^d[i+2]^d[i+3],16777619);return h});
(async()=>{
  const {TITLES}=await import('../src/character-progression.ts');
  const {MILITARY_RANKS,TERRITORIES}=await import('../src/military.ts');
  const {REALMS}=await import('../src/cultivation.ts');
  const browser=await chromium.launch({executablePath:process.env.VOLAM_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const errors=[],captures=process.env.VOLAM_CAPTURE_DIR||'/tmp/volam-prestige';
  try{
    await fs.mkdir(captures,{recursive:true});const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(({titles,realms})=>{
      let time=1000,serial=0;const frames=new Map();Object.defineProperty(performance,'now',{value:()=>time});window.requestAnimationFrame=cb=>{const id=++serial;frames.set(id,cb);return id};window.cancelAnimationFrame=id=>frames.delete(id);Math.random=()=>.5;
      window.prestigeDraws=[];window.militaryPath=[];const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText,stroke=proto.stroke;
      window.prestigeStrokes=0;proto.stroke=function(...args){window.prestigeStrokes++;return stroke.apply(this,args)};
      proto.fillText=function(text,...args){if(this.canvas.id==='game-canvas'&&(String(text).startsWith('Ấn ·')||titles.some(name=>String(text).endsWith(name))||realms.some(name=>String(text).startsWith(name)))){const t=this.getTransform();window.prestigeDraws.push({text:String(text),font:this.font,x:t.e,y:t.f,width:this.measureText(text).width});if(window.prestigeDraws.length>120)window.prestigeDraws.splice(0,60)}return fill.call(this,text,...args)};
      const move=proto.moveTo;proto.moveTo=function(x,y){if(this.canvas.id==='character-preview'&&this.strokeStyle==='#ffe083'&&this.lineWidth>13&&this.lineWidth<14){window.militaryPath.push([x,y]);if(window.militaryPath.length>400)window.militaryPath.splice(0,200)}return move.call(this,x,y)};
      window.advanceGame=ms=>{while(ms>0){const dt=Math.min(50,ms);time+=dt;ms-=dt;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time))}};
    },{titles:TITLES.map(t=>t.name),realms:REALMS.map(r=>r.name)});
    const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))errors.push(`${r.status()} ${r.url()}`)});
    await p.goto(url,{waitUntil:'networkidle'});await p.locator('[data-faction="gaibang"]').click();await p.locator('#join-sect').click();
    await seed(p,s=>{s.player.level=160;s.player.xp=0;s.player.attack=1000000;s.player.defense=1000000;Object.assign(s.player.idle,{inTown:true,autoSkills:false,autoEquip:false,autoLoot:false});s.player.tower={highestFloor:100,clears:Array(100).fill(1),sigils:30};s.player.military={captured:TERRITORIES.map(t=>t.id),seals:[],equipped:null};Object.assign(s.player.journey,{rebirths:20,kills:10000,elites:500,bosses:1000});s.player.dungeonClears.tomb=50;s.player.dungeonClears.bamboo=50;s.player.goldenClears=['2026-10-04-12'];s.player.equipment.weapon.enhance=10;s.player.preferences.titleVisible=true;s.player.preferences.titleEffects=true;});
    assert.equal((await save(p)).player.journey.unlockedTitles.length,28);
    await click(p,'[data-idle-tab="char"]');await click(p,'#titles-btn');assert.equal(await p.locator('[data-preview-title]').count(),28);
    const hashes=[];for(const title of TITLES){await click(p,`[data-preview-title="${title.id}"]`);await step(p,100);hashes.push(await hash(p,'#title-effect-preview'));assert.equal(await p.locator('.title-preview').getAttribute('data-prestige-tier'),String(title.rarity))}
    assert.equal(new Set(hashes).size,28);const beforePreview=await save(p);await click(p,'[data-preview-title="sky-sovereign"]');await step(p,100);assert.equal((await read(p)).player.journey.activeTitle,beforePreview.player.journey.activeTitle);
    await click(p,'[data-wear-title="sky-sovereign"]');await close(p);await click(p,'#military-seal-slot');
    for(const rank of MILITARY_RANKS){await click(p,`[data-claim-seal="${rank.id}"]`);assert.equal((await save(p)).player.military.equipped,null)}
    const colors=[],rankFrames=[];
    for(const rank of MILITARY_RANKS){await click(p,`[data-wear-seal="${rank.id}"]`);await close(p);await step(p,200);assert.equal(await p.locator('#preview-military-rank').textContent(),`Ấn · ${rank.name}`);colors.push(await p.locator('#preview-military-rank').evaluate(el=>getComputedStyle(el).color));rankFrames.push(await hash(p,'#character-preview'));await p.screenshot({path:`${captures}/rank-${rank.id}.png`});await click(p,'#military-seal-slot')}
    assert.equal(new Set(colors).size,7);assert.equal(new Set(rankFrames).size,7);await close(p);await click(p,'[data-idle-tab="log"]');await step(p,100);
    let labels=await p.evaluate(()=>window.prestigeDraws.slice(-3));assert.ok(labels[0].text.includes('Hoàng Đế'));assert.ok(labels[1].text.includes('Trấn Thiên Chí Tôn'));assert.ok(labels[2].text.includes('Vô Cực'));assert.ok(labels[0].y<labels[1].y&&labels[1].y<labels[2].y);
    for(const label of labels)assert.ok(parseFloat(label.font.match(/[\d.]+(?=px)/)[0])>=16);
    await p.screenshot({path:`${captures}/prestige-world.png`});
    console.log('PASS 28 distinct previews, actual wear/claim/swap, seven rank colors, layered name order and larger fonts');
    const stable=await save(p);await click(p,'#load-btn');await step(p,100);assert.equal((await save(p)).player.journey.activeTitle,'sky-sovereign');assert.equal((await save(p)).player.military.equipped,'hoang-de');assert.equal((await save(p)).player.maxHp,stable.player.maxHp);
    await click(p,'[data-idle-tab="char"]');const frame=await hash(p,'#character-preview');await step(p,600);assert.notEqual(await hash(p,'#character-preview'),frame);
    const fullStrokes=await p.evaluate(()=>{const n=window.prestigeStrokes;window.advanceGame(100);return window.prestigeStrokes-n});
    await click(p,'[data-idle-tab="more"]');await p.locator('#skill-effects-quality').selectOption('simple');await click(p,'[data-idle-tab="char"]');const simpleStrokes=await p.evaluate(()=>{const n=window.prestigeStrokes;window.advanceGame(100);return window.prestigeStrokes-n});assert.ok(simpleStrokes<fullStrokes);
    await click(p,'[data-idle-tab="more"]');await p.locator('[data-preference="titleVisible"]').uncheck();await click(p,'[data-idle-tab="char"]');assert.equal(await p.locator('#preview-title-label').isVisible(),false);assert.equal(await p.locator('#preview-military-rank').isVisible(),true);
    await click(p,'[data-idle-tab="more"]');await p.locator('[data-preference="titleVisible"]').check();await p.locator('#skill-effects-quality').selectOption('full');
    await click(p,'[data-idle-tab="char"]');await click(p,'#military-seal-slot');await click(p,'[data-remove-seal]');await close(p);assert.equal(await p.locator('#preview-military-rank').isVisible(),false);await click(p,'[data-idle-tab="log"]');await p.evaluate(()=>window.prestigeDraws=[]);await step(p,100);assert.ok(!(await p.evaluate(()=>window.prestigeDraws)).some(d=>d.text.startsWith('Ấn ·')));
    console.log(`PASS persisted title/seal/stats; animated dragons; simple mode fewer strokes (${fullStrokes} → ${simpleStrokes}); title toggle independent; removing seal clears military name`);
    await click(p,'[data-idle-tab="char"]');await click(p,'#military-seal-slot');await click(p,'[data-wear-seal="hoang-de"]');await close(p);
    for(const [width,height]of[[320,640],[360,640],[390,844],[600,960],[844,390],[1440,900]]){
      await p.setViewportSize({width,height});await click(p,'[data-idle-tab="log"]');await p.waitForTimeout(100);await p.evaluate(()=>window.prestigeDraws=[]);await step(p,100);labels=await p.evaluate(()=>window.prestigeDraws.slice(-3));const size=await p.locator('#game-canvas').evaluate(c=>({w:c.width,h:c.height}));for(const label of labels){assert.ok(label.x-label.width/2>=0&&label.x+label.width/2<=size.w);assert.ok(label.y>=0&&label.y<=size.h)}
      const overlap = await p.evaluate(() => {
        const canvas=document.querySelector('#game-canvas'),c=canvas.getBoundingClientRect();
        const tags=window.prestigeDraws.slice(-3).map(label=>{const font=parseFloat(label.font.match(/[\d.]+(?=px)/)[0]);return {left:c.left+(label.x-(label.width+52)/2)*c.width/canvas.width,right:c.left+(label.x+(label.width+52)/2)*c.width/canvas.width,top:c.top+(label.y-(font+12)/2)*c.height/canvas.height,bottom:c.top+(label.y+(font+12)/2)*c.height/canvas.height}});
        const blocks=['.mobile-map-card','.arena-quest','#hero-status'].flatMap(selector=>{const e=document.querySelector(selector);return e.classList.contains('hidden')?[]:[e.getBoundingClientRect()]});
        return tags.some(t=>blocks.some(b=>t.left<b.right&&t.right>b.left&&t.top<b.bottom&&t.bottom>b.top));
      });if(overlap) await p.screenshot({path:`${captures}/overlap-${width}x${height}.png`});assert.equal(overlap,false,`labels must avoid HUD at ${width}x${height}`);
      await p.screenshot({path:`${captures}/world-${width}x${height}.png`});await click(p,'[data-idle-tab="char"]');await step(p,100);await p.screenshot({path:`${captures}/character-${width}x${height}.png`});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await click(p,'#titles-btn');await step(p,100);const box=await p.locator('#title-effect-preview').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=height);await close(p);
    }
    await p.emulateMedia({reducedMotion:'reduce'});await click(p,'[data-idle-tab="char"]');assert.equal(await p.locator('#preview-military-rank').evaluate(el=>getComputedStyle(el,'::after').animationName),'none');
    await p.evaluate(()=>window.militaryPath=[]);await step(p,100);const frozen=await p.evaluate(()=>window.militaryPath);assert.ok(frozen.length>0);await p.evaluate(()=>window.militaryPath=[]);await step(p,100);assert.deepEqual(await p.evaluate(()=>window.militaryPath),frozen,'reduced motion must freeze the dragon orbit');
    assert.deepEqual(errors,[]);console.log('PASS mobile/landscape/world/character/titles layouts at six sizes, reduced motion and no runtime/asset errors');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
