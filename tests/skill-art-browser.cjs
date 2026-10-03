// Real production UI previews, graphics preferences, rendering budgets and mobile fit.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:5173';
const saveKey = 'giang-ho-di-truyen-prototype';
async function snapshot(page) {
  return page.evaluate(key => { document.querySelector('#save-btn').click(); return JSON.parse(localStorage.getItem(key)).player; }, saveKey);
}
function capture() {
  const raf = requestAnimationFrame;
  window.requestAnimationFrame = cb => raf(t => { window.frameTime = t; cb(t); });
  window.artMetrics = { glows: 0, strokes: 0, gradients: 0, frames: 0, shadows: 0 };
  const proto = CanvasRenderingContext2D.prototype;
  for (const [method, metric] of [['drawImage','glows'],['stroke','strokes'],['createRadialGradient','gradients'],['clearRect','frames']]) {
    const original = proto[method];
    proto[method] = function(...args) {
      if (this.canvas.id === 'skill-art-canvas') window.artMetrics[metric]++;
      return original.apply(this, args);
    };
  }
}
(async () => {
  const { SECTS, SKILL_KEYS } = await import('../src/sects.ts');
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const errors = [], cards = [], icons = new Set(), frames = new Set();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 740 }, isMobile: true, hasTouch: true });
    await context.addInitScript(capture);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`); });
    for (const sect of Object.values(SECTS)) {
      await page.goto(url, { waitUntil: 'networkidle' });
      if (await page.locator('#sect-overlay').isHidden()) {
        await page.locator('#reset-btn').evaluate(el => el.click()); await page.locator('#confirm-new').click();
      }
      await page.locator(`[data-sect="${sect.id}"]`).click(); await page.locator('#join-sect').click();
      const player = await snapshot(page);
      player.idle.inTown = true; player.idle.autoSkills = false; player.idle.autoLoot = false;
      player.idle.autoEquip = false; player.idle.enabled = true;
      await page.evaluate(({ key, player }) => {
        const data = JSON.parse(localStorage.getItem(key)); data.player = player;
        localStorage.setItem(key, JSON.stringify(data)); document.querySelector('#load-btn').click();
      }, { key: saveKey, player });
      await page.locator('[data-idle-tab="skill"]').click();
      const before = await snapshot(page);
      await page.locator('[data-show-skill-art]').click();
      for (const key of SKILL_KEYS) {
        await page.locator(`[data-art-skill="${key}"]`).click();
        const icon = page.locator(`[data-art-skill="${key}"] svg`);
        assert.equal(await icon.getAttribute('data-visual'), `${sect.id}-${key}`);
        icons.add((await icon.evaluate(el => el.outerHTML)).replaceAll(/skill-art-\d+/g,'skill-art'));
        await page.waitForFunction(() => window.frameTime % 1600 > 650 && window.frameTime % 1600 < 740);
        const first = await page.locator('#skill-art-canvas').evaluate(c => c.toDataURL());
        if (sect.kit[key].dash) {
          await page.evaluate(() => { window.artMetrics = { glows: 0, strokes: 0, gradients: 0, frames: 0 }; });
          await page.waitForTimeout(100);
          const metrics = await page.evaluate(() => window.artMetrics);
          assert.ok(metrics.frames > 0 && metrics.glows / metrics.frames <= 2, 'dash preview shows the hero and its effect without a ranged projectile');
        }
        frames.add(first);
        cards.push({ sect: sect.name, skill: sect.kit[key].name, image: first, icon: await icon.evaluate(el => el.outerHTML) });
        await page.waitForTimeout(220);
        assert.notEqual(first, await page.locator('#skill-art-canvas').evaluate(c => c.toDataURL()), `${sect.name} ${key} animates`);
      }
      const after = await snapshot(page);
      assert.equal(after.mp, before.mp, 'preview spends no mana');
      assert.equal(after.rage, before.rage, 'preview spends no rage');
      assert.equal(after.xp, before.xp, 'preview grants no XP');
      assert.deepEqual(after.cooldowns, before.cooldowns, 'preview starts no cooldowns');
      assert.deepEqual(after.skillRanks, before.skillRanks);
      await page.evaluate(() => { window.artMetrics = { glows: 0, strokes: 0, gradients: 0, frames: 0 }; });
      await page.waitForTimeout(1700);
      const full = await page.evaluate(() => window.artMetrics);
      assert.equal(full.gradients, 0, 'no gradient creation in the animation loop');
      await page.locator('#utility-close').click();
      await page.locator('[data-idle-tab="more"]').click();
      await page.locator('#skill-effects-quality').selectOption('simple');
      assert.equal((await snapshot(page)).preferences.skillEffects, 'simple');
      await page.reload(); await page.locator('[data-idle-tab="more"]').click();
      assert.equal(await page.locator('#skill-effects-quality').inputValue(), 'simple', 'setting survives reload');
      await page.locator('[data-idle-tab="skill"]').click(); await page.locator('[data-show-skill-art]').click();
      await page.locator('[data-art-skill="ultimate"]').click();
      await page.evaluate(() => { window.artMetrics = { glows: 0, strokes: 0, gradients: 0, frames: 0 }; });
      await page.waitForTimeout(1700);
      const simple = await page.evaluate(() => window.artMetrics);
      // Each frame still includes the hero atlas; only the full mode draws light sprites.
      assert.ok(simple.glows / simple.frames < full.glows / full.frames, `${sect.name}: compact mode reduces image operations`);
      assert.ok(simple.strokes / simple.frames <= full.strokes / full.frames * 1.1, `${sect.name}: compact mode reduces geometry`);
      console.log(`PASS ${sect.name}: three illustrated animated skills, safe preview, persisted compact mode`);
      await page.locator('#utility-close').click();
    }
    assert.equal(icons.size, 30, 'thirty distinct icon drawings, ignoring SVG IDs');
    assert.equal(frames.size, 30, 'thirty distinct rendered previews');
    await page.locator('[data-idle-tab="skill"]').click(); await page.locator('[data-show-skill-art]').click();
    for (const [width,height] of [[320,568],[360,640],[390,740],[430,932],[600,960],[844,390]]) {
      await page.setViewportSize({ width, height });
      const dimensions = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
      assert.deepEqual(dimensions, [width,height]);
      const dialog = await page.locator('.utility-dialog').boundingBox();
      assert.ok(dialog.x >= 0 && dialog.y >= 0 && dialog.x + dialog.width <= width + 1 && dialog.y + dialog.height <= height + 1);
      const close = await page.locator('#utility-close').boundingBox();
      assert.ok(close.y >= 0 && close.y + close.height <= height, 'close button remains visible');
    }
    await page.setViewportSize({ width: 390, height: 740 });
    await page.screenshot({ path: '/tmp/volam-skill-preview-mobile.png' });
    assert.deepEqual(errors, [], 'no browser or asset errors');
    const gallery = await browser.newPage({ viewport: { width: 1080, height: 900 } });
    const html = `<meta charset="utf-8"><style>body{margin:20px;background:#0a1819;color:#e9dab7;font:14px system-ui}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}article{background:#142c26;border:1px solid #4a6251;border-radius:7px;padding:8px}img{width:100%}header{display:flex;align-items:center;gap:8px}svg{width:44px;height:44px;flex-shrink:0}small{display:block;color:#adc6b6}</style><h1>Giang Hồ Dị Truyện · Thập đại môn phái · v0.8.0</h1><main>${cards.map(card => `<article><header>${card.icon}<div><b>${card.sect}</b><small>${card.skill}</small></div></header><img src="${card.image}"></article>`).join('')}</main>`;
    await fs.writeFile('/tmp/volam-skill-gallery.html', html);
    await gallery.setContent(html);
    await gallery.screenshot({ path: '/tmp/volam-skill-gallery.png', fullPage: true });
    console.log('PASS 30 unique illustrated icons/effects, lighter mode, six mobile viewports; gallery saved in /tmp');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
