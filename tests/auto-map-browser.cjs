const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:4178/volam/';
const key = 'giang-ho-di-truyen-prototype';
const step = (p, ms = 100) => p.evaluate(ms => window.advanceGame(ms), ms);
const click = (p, selector) => p.locator(selector).first().evaluate(e => e.click());
async function save(p) {
  await click(p, '#save-btn');
  return p.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
}
async function seed(p, edit) {
  const data = await save(p); edit(data);
  await p.evaluate(({ data, key }) => {
    localStorage.setItem(key, JSON.stringify(data)); document.querySelector('#load-btn').click();
  }, { data, key });
  await step(p);
  return save(p);
}
async function arena(p) {
  await click(p, '[data-idle-tab="char"]'); await click(p, '[data-idle-tab="log"]');
  await click(p, '#world-panel-close'); await step(p);
}
async function auto(p, enabled) {
  if ((await p.locator('#mobile-auto').getAttribute('aria-pressed') === 'true') !== enabled)
    await p.locator('#mobile-auto').tap();
  await step(p, 100);
  assert.equal(await p.locator('#mobile-auto').getAttribute('aria-pressed'), String(enabled));
}
async function groundTap(p, point) {
  const at = await p.evaluate(point => {
    const c = document.querySelector('#game-canvas'), r = c.getBoundingClientRect();
    return { x: r.x + (point.x - window.camera.x) * r.width / c.width,
      y: r.y + (point.y - window.camera.y) * r.height / c.height };
  }, point);
  await p.touchscreen.tap(at.x, at.y);
}
const ownership = s => JSON.stringify([s.player.level, s.player.gold, s.player.equipment,
  s.player.inventory, s.player.skillRanks, s.player.gems, s.player.companions]);
(async () => {
  const { REGIONS } = await import('../src/idle.ts');
  const { WUXIA_SCENES } = await import('../src/wuxia-scenes.ts');
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    await fs.mkdir('/tmp/volam-v30', { recursive: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      let now = 1000, serial = 0; const frames = new Map();
      performance.now = () => now; Math.random = () => .5;
      requestAnimationFrame = cb => { frames.set(++serial, cb); return serial; };
      cancelAnimationFrame = id => frames.delete(id);
      window.advanceGame = ms => {
        while (ms > 0) { const dt = Math.min(50, ms); now += dt; ms -= dt;
          const batch = [...frames.values()]; frames.clear(); batch.forEach(cb => cb(now)); }
      };
      window.landmarkFrames = new Set(); window.groundFrames = new Set(); window.mapPaints = 0;
      const proto = CanvasRenderingContext2D.prototype;
      const clear = proto.clearRect, translate = proto.translate, draw = proto.drawImage, fill = proto.fillRect;
      proto.clearRect = function(...args) { if (this.canvas.id === 'game-canvas') this.nextCamera = true; return clear.apply(this, args); };
      proto.translate = function(x, y) { if (this.nextCamera) { window.camera = { x: -x, y: -y }; this.nextCamera = false; } return translate.call(this, x, y); };
      proto.fillRect = function(...args) { if (!this.canvas.id && this.canvas.width >= 1900) window.mapPaints++; return fill.apply(this, args); };
      proto.drawImage = function(source, ...args) {
        if (source instanceof HTMLImageElement && args.length === 8) {
          if (source.src.includes('wuxia-landmarks')) window.landmarkFrames.add(Math.round(args[0] / (source.naturalWidth / 4)) + Math.round(args[1] / (source.naturalHeight / 4)) * 4);
          if (source.src.includes('wuxia-ground')) window.groundFrames.add(Math.round(args[0] / (source.naturalWidth / 2)) + Math.round(args[1] / (source.naturalHeight / 2)) * 2);
        }
        return draw.call(this, source, ...args);
      };
    });
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await p.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await p.locator('html').getAttribute('data-version'), '0.30.0');
    await p.locator('#join-sect').tap(); await step(p);
    await seed(p, s => {
      Object.assign(s.player, { attack: 1, defense: 10000, hp: 100000 });
      Object.assign(s.player.idle, { inTown: true, enabled: true, autoSkills: false,
        autoLoot: false, autoEquip: false, autoPotions: false });
      s.player.botSettings = { enabled: false, assist: false, pvp: false };
    });
    await arena(p); const town = await save(p);
    await auto(p, true); const resumed = await save(p);
    assert.equal(resumed.player.idle.inTown, false); assert.ok(resumed.enemies.length > 0);
    assert.equal(ownership(resumed), ownership(town), 'resuming town does not alter character possessions');
    await step(p, 1300);
    assert.ok((await save(p)).enemies.some(e => e.hp < e.maxHp), 'Auto actually attacks after leaving town');
    await p.evaluate(() => { window.autoCaption = document.querySelector('#mobile-auto small'); });
    for (let i = 0; i < 10; i++) { await auto(p, i % 2 === 0); assert.equal(await p.evaluate(() => window.autoCaption === document.querySelector('#mobile-auto small')), true); }
    console.log('PASS real Auto taps, stable touch target, town resume and actual attacks, possession preservation');

    await seed(p, s => {
      s.player.idle.enabled = false; s.player.idle.inTown = false; s.player.x = 460; s.player.y = 330;
      s.player.exploration.active = false;
    });
    await arena(p); await auto(p, false);
    // Empty ground to the left; enemy 5 occupies the previous (650, 700) fixture.
    await groundTap(p, { x: 230, y: 700 }); await step(p, 150);
    const manual = await save(p); assert.ok(manual.player.x < 460);
    await auto(p, true); await step(p, 300);
    const taken = await save(p);
    assert.ok(taken.player.x >= manual.player.x, 'Auto cancels the previous leftward movement while fighting enemies to the right');
    await auto(p, false);
    await seed(p, s => { s.player.x = 80; s.player.y = 1100; }); await arena(p);
    const far = await save(p);
    assert.ok(far.enemies.every(e => Math.hypot(e.x - far.player.x, e.y - far.player.y) > 520));
    await auto(p, true); await step(p, 600); const approach = await save(p);
    assert.ok(Math.hypot(approach.player.x - far.player.x, approach.player.y - far.player.y) > 35, 'Auto finds enemies beyond the previous 520px limit');
    await groundTap(p, { x: approach.player.x + 80, y: approach.player.y - 80 }); await step(p, 100);
    assert.equal(await p.locator('#mobile-auto').getAttribute('aria-pressed'), 'false', 'a fresh manual tap stops Auto');
    console.log('PASS hand movement takeover, distant target acquisition and fresh manual override');

    await seed(p, s => { s.player.x = 460; s.player.y = 330; }); await arena(p); await auto(p, false);
    await p.keyboard.down('d'); await step(p, 100); const moving = await save(p);
    await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await step(p, 300);
    assert.equal((await save(p)).player.x, moving.player.x, 'blur clears a key whose keyup was lost');
    await p.keyboard.up('d');
    await p.locator('#joystick').evaluate(e => e.addEventListener('pointerdown', ev => { window.testPointer = ev.pointerId; }, { once: true }));
    const joy = await p.locator('#joystick').boundingBox();
    await p.mouse.move(joy.x + joy.width * .8, joy.y + joy.height / 2); await p.mouse.down(); await step(p, 100);
    const held = await save(p);
    await p.locator('#joystick').evaluate(e => e.releasePointerCapture(window.testPointer));
    await p.mouse.move(joy.x + joy.width * .81, joy.y + joy.height / 2); await step(p, 300);
    assert.equal((await save(p)).player.x, held.player.x, 'lost pointer capture clears joystick movement');
    await p.mouse.up(); await auto(p, true); await step(p, 300);
    assert.equal(await p.locator('#mobile-auto').getAttribute('aria-pressed'), 'true');
    await p.keyboard.down('a'); await step(p, 100); await p.keyboard.up('a');
    assert.equal(await p.locator('#mobile-auto').getAttribute('aria-pressed'), 'false');
    console.log('PASS lost keyboard/pointer input is cleared, Auto stays on, new directional input takes control');

    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 },
      { width: 430, height: 932 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await p.setViewportSize(viewport); await step(p);
      if (await p.locator('#chat-body').isHidden()) await p.locator('#chat-toggle').tap();
      const before = await p.locator('#mobile-auto').getAttribute('aria-pressed');
      await p.locator('#mobile-auto').tap(); await step(p);
      assert.notEqual(await p.locator('#mobile-auto').getAttribute('aria-pressed'), before);
      await p.locator('#mobile-auto').tap(); await step(p);
      assert.equal(await p.locator('#mobile-auto').getAttribute('aria-pressed'), before);
      for (const selector of ['#mobile-auto', '#chat-close', '#chat-input']) {
        const r = await p.locator(selector).boundingBox();
        assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= viewport.width + 1 && r.y + r.height <= viewport.height + 1, `${selector} remains on screen`);
      }
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await p.screenshot({ path: `/tmp/volam-v30/chat-auto-${viewport.width}.png` });
      await p.locator('#chat-close').tap();
    }
    console.log('PASS real Auto taps while chat is open in six portrait/landscape/desktop viewports');

    await p.setViewportSize({ width: 390, height: 844 });
    await seed(p, s => {
      s.player.level = 200; s.player.xp = 0; s.player.idle.enabled = true; s.player.idle.inTown = false;
      for (const id of Object.keys(s.player.dungeonClears)) s.player.dungeonClears[id] = 1;
    });
    for (const id of ['tomb', 'bamboo', 'thunder', 'frost', 'tomb']) {
      await click(p, '[data-idle-tab="inv"]'); await click(p, '.inventory-panel [data-tab="dungeon"]');
      await click(p, `[data-dungeon-id="${id}"]`);
      assert.equal(await p.locator('[data-dungeon-action="leave"]').count(), 1, `${id} was entered`);
      await arena(p);
      await auto(p, false); await auto(p, true); await step(p, 1200);
      assert.equal(await p.locator('#mobile-auto').getAttribute('aria-pressed'), 'true');
      assert.match(await p.locator('#combat-status-text').textContent(), /HP/);
      await click(p, '[data-idle-tab="inv"]'); await click(p, '.inventory-panel [data-tab="dungeon"]');
      await click(p, '[data-dungeon-action="leave"]'); await step(p);
    }
    await click(p, '[data-open-tower]'); await click(p, '[data-enter-tower="1"]'); await arena(p);
    await auto(p, false); await auto(p, true); await step(p, 1500);
    assert.match(await p.locator('#combat-status-text').textContent(), /Tầng 1.*HP/);
    await click(p, '#town-btn'); await step(p);
    console.log('PASS real Auto taps in regular dungeons and tower; scenery is rebuilt when returning to an evicted dungeon');

    await p.setViewportSize({ width: 390, height: 844 }); const hashes = new Set(), cards = [];
    // Region 0 was already cached in the combat tests. Visit it last so every
    // region produces a fresh native background within the bounded art cache.
    for (const region of [...REGIONS.keys()].slice(1).concat(0)) {
      await p.evaluate(() => window.landmarkFrames.clear());
      await seed(p, s => {
        s.player.level = 200; s.player.xp = 0; s.player.idle.enabled = true;
        s.player.idle.inTown = false; s.player.idle.maxStage = 160; s.player.idle.stage = region * 10 + 1;
      });
      await arena(p); await auto(p, false);
      assert.equal((await save(p)).player.idle.stage, region * 10 + 1);
      assert.ok(await p.evaluate(frame => window.landmarkFrames.has(frame), WUXIA_SCENES[region].landmark), `${REGIONS[region]} uses its painted landmark`);
      const paints = await p.evaluate(() => window.mapPaints); await step(p, 1500);
      assert.equal(await p.evaluate(() => window.mapPaints), paints, 'static terrain is cached across combat frames');
      const image = await p.locator('#mobile-minimap').evaluate(c => c.toDataURL());
      hashes.add(createHash('sha256').update(image).digest('hex')); cards[region] = { name: REGIONS[region], image };
      await p.screenshot({ path: `/tmp/volam-v30/map-${region}.png` });
    }
    assert.equal(hashes.size, 16); assert.equal(await p.evaluate(() => window.groundFrames.size), 4);
    const gallery = await context.newPage();
    await gallery.setViewportSize({ width: 1200, height: 900 });
    await gallery.setContent(`<meta charset="utf-8"><style>body{background:#13251f;color:#f5dfab;font:16px serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}img{width:100%}h3{margin:8px}</style><main>${cards.map(c => `<article><h3>${c.name}</h3><img src="${c.image}"></article>`).join('')}</main>`);
    await gallery.screenshot({ path: '/tmp/volam-v30/maps.png', fullPage: true });
    await gallery.close(); assert.deepEqual(errors, []);
    console.log('PASS 16 distinct maps, all painted terrain materials, correct scenery, cached native backgrounds, no script/asset errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
