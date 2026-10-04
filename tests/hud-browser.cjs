// Reference layout, reachable touch controls and exact equipment power prediction.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:5173';
const key = 'giang-ho-di-truyen-prototype';
const power = async page => Number((await page.locator('#combat-power').textContent()).replaceAll('.',''));
async function seed(page, change) {
  await page.locator('#save-btn').evaluate(el => el.click());
  const s = await page.evaluate(key => JSON.parse(localStorage.getItem(key)),key); change(s);
  await page.evaluate(({key,s}) => { localStorage.setItem(key,JSON.stringify(s)); document.querySelector('#load-btn').click(); },{key,s});
}
(async()=>{
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || '/usr/bin/chromium', headless:true, args:['--no-sandbox'] });
  const errors=[];
  try {
    const context = await browser.newContext({ viewport:{width:390,height:844},isMobile:true,hasTouch:true });
    const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(url))errors.push(`${r.status()} ${r.url()}`)});
    await page.goto(url,{waitUntil:'networkidle'}); assert.equal(await page.locator('html').getAttribute('data-version'),'0.24.0');
    await page.locator('#hero-name-input').fill('Ngũ Độc Thanh Vân'); await page.locator('[data-faction="wudu"]').click(); await page.locator('#join-sect').click();
    await seed(page,s=>{s.player.idle.inTown=true; s.player.idle.autoEquip=false; s.player.attack=22; s.player.defense=5;});
    for (const [width,height] of [[320,568],[360,640],[390,844],[600,960],[844,390],[1440,900]]) {
      await page.setViewportSize({width,height}); await page.waitForTimeout(120);
      const result=await page.evaluate(()=>{
        const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        const controls=[...document.querySelectorAll('#hero-status,#gift-btn,#settings-shortcut,#compact-btn,#arena-quest-toggle,#mobile-auto,#mount-toggle,.joystick,.mobile-pickup,.skill-button,.potion-button,.town-button,#arena-log-toggle,.bottom-nav button')].filter(e=>e.checkVisibility()).map(e=>({id:e.id||e.getAttribute('aria-label')||e.textContent,box:e.getBoundingClientRect().toJSON()}));
        const overlaps=[];for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i].box,b=controls[j].box;if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push([controls[i].id,controls[j].id])}
        const card=document.querySelector('.mobile-map-card'), app=box('.app-shell');
        return {width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,app,arena:box('.canvas-frame'),hero:box('#hero-status'),actions:box('.header-actions'),map:box('.mobile-map-card'),quest:box('.arena-quest'),joystick:box('.joystick'),skills:box('.combat-bar'),chat:box('.arena-chat'),nav:box('.bottom-nav'),overlaps,offscreen:controls.filter(({box:r})=>r.x<app.x-.5||r.right>app.right+.5||r.y<-.5||r.bottom>innerHeight+.5),mapOverflow:card.scrollWidth-card.clientWidth};
      });
      assert.equal(result.width,width); assert.equal(result.height,height); assert.deepEqual(result.overlaps,[],`${width}x${height}`); assert.deepEqual(result.offscreen,[]); assert.ok(result.mapOverflow<=1);
      assert.equal(await page.locator('.game-layout').isVisible(),false); assert.ok(result.arena.height >= height*.85); assert.equal(result.arena.bottom,result.nav.y);
      assert.ok(result.hero.right<result.actions.x); assert.ok(result.map.y>=result.actions.bottom); assert.ok(result.skills.x>result.joystick.right); assert.ok(result.chat.bottom<=result.nav.y);
      if(width<height)assert.ok(result.quest.y>=result.map.bottom);
      await page.screenshot({path:`/tmp/volam-hud-${width}x${height}.png`});
      await page.locator('#arena-quest-toggle').click(); assert.equal(await page.locator('#arena-quest-body').isVisible(),false); await page.locator('#arena-quest-toggle').click(); assert.equal(await page.locator('#arena-quest-body').isVisible(),true);
      await page.locator('[data-idle-tab="log"]').click(); assert.equal(await page.locator('.game-layout').isVisible(),true); assert.equal(await page.locator('[data-idle-tab="log"]').getAttribute('aria-expanded'),'true');
      await page.locator('#world-panel-close').click(); assert.equal(await page.locator('.game-layout').isVisible(),false); assert.equal(await page.locator('.joystick').isVisible(),true);
      await page.locator('#settings-shortcut').click(); assert.equal(await page.locator('.settings-panel').isVisible(),true); await page.locator('[data-idle-tab="log"]').click(); assert.equal(await page.locator('.world-panel').isVisible(),true); await page.locator('#world-panel-close').click(); assert.equal(await page.locator('.game-layout').isVisible(),false);
      await page.locator('#hero-status').click(); assert.equal(await page.locator('.character-panel').isVisible(),true); await page.locator('[data-idle-tab="log"]').click(); await page.locator("#world-panel-close").click();
      await page.locator('#arena-log-toggle').click(); assert.equal(await page.locator('.battle-log-history p').count()>0,true); await page.locator('#utility-close').click();
      console.log(`PASS reference HUD ${width}x${height}: full arena, no scrolling/overlapping controls, quest and sheets reachable`);
    }
    await page.setViewportSize({width:390,height:844});
    const gear=(id,slot,power,bonuses)=>({id,slot,power,bonuses,name:id,enhance:0,level:1,rarity:'Hoàng Kim',color:'#ffd35a',icon:'◆'});
    await seed(page,s=>{
      s.player.equipment={weapon:gear('old','weapon',10,{defense:3,hp:5,mp:7,crit:1,speed:1})};
      s.player.inventory=[gear('strong','weapon',200,{attack:12,defense:5,hp:100,mp:30,crit:4,speed:7}),gear('weak','weapon',1,{})];
      s.player.gold=10000; s.player.refiningStones=100;
    });
    for (const id of ['strong','weak']) {
      const before=await power(page);
      await page.locator('[data-idle-tab="inv"]').click();await page.locator(`.bag-slot[data-inspect-item="${id}"]`).click();
      const diff=Number((await page.locator('.item-comparison strong').textContent()).split(' ')[0].replaceAll('.',''));
      assert.ok(id==='strong'?diff>0:diff<0);
      await page.locator('[data-inspect-equip]').click(); await page.locator('[data-idle-tab="char"]').click(); assert.equal(await power(page),before+diff,'gear comparison predicts exact character CP including the defense-derived HP floor');
      assert.equal(await page.locator('#header-combat-power').getAttribute('title'),`Lực chiến ${await page.locator('#combat-power').textContent()}`);
    }
    await page.locator('[data-equipped-preview="weapon"]').click(); await page.locator('[data-detail-enhance]').click();
    const prediction=Number((await page.locator('#enhance-character-power').textContent()).split(' → ')[1].slice(0,-1).replaceAll('.',''));
    await page.locator('[data-confirm-enhance]').click(); await page.locator('#utility-close').click(); assert.equal(await power(page),prediction,'enhancement predicts the same CP that actually reaches the character');
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).player,key);
    await page.reload({waitUntil:'networkidle'}); await page.locator('#hero-status').click(); assert.equal(await power(page),prediction);
    const reloaded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).player,key); assert.equal(reloaded.attack,saved.attack); assert.equal(reloaded.defense,saved.defense);assert.deepEqual(reloaded.equipment,saved.equipment);
    await page.locator('#realm-guide-btn').click(); assert.equal(await page.locator('.realm-table tbody tr').count(),23);
    for(const [width,height]of [[320,568],[844,390]]) {await page.setViewportSize({width,height});assert.ok(await page.locator('.utility-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'realm guide stays within dialog');}
    await page.locator('#utility-close').click();await page.locator('[data-idle-tab="log"]').click();await page.locator('#world-panel-close').click();await page.locator('#compact-btn').click();assert.equal(await page.locator('#hero-status').isVisible(),false);await page.locator('#compact-btn').click();assert.equal(await page.locator('#hero-status').isVisible(),true);
    assert.deepEqual(errors,[]); console.log('PASS exact stronger/weaker gear and enhancement CP previews, unchanged save bases, 23-realm guide and HUD toggle');await context.close();
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
