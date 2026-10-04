const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:4178/volam/';
const step = (p, ms = 100) => p.evaluate(ms => window.advanceGame(ms), ms);
(async () => {
  const { MARTIAL_PATHS } = await import('../src/martial-paths.ts');
  const { SECT_BY_FACTION } = await import('../src/sects.ts');
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const errors = [], cards = [];
  try {
    await fs.mkdir('/tmp/volam-v31', { recursive: true });
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
      await context.addInitScript(() => {
        let now = 1000, id = 0; const frames = new Map(); performance.now = () => now;
        requestAnimationFrame = cb => { frames.set(++id, cb); return id; }; cancelAnimationFrame = id => frames.delete(id);
        window.advanceGame = ms => { while (ms > 0) { const dt = Math.min(50, ms); ms -= dt; now += dt; const batch = [...frames.values()]; frames.clear(); batch.forEach(cb => cb(now)); } };
      });
      const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
      p.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await p.goto(url, { waitUntil: 'networkidle' });
      assert.equal(await p.locator('html').getAttribute('data-version'), '0.31.0');
      for (const [faction, sect] of Object.entries(SECT_BY_FACTION)) {
        await p.locator(`[data-faction="${faction}"]`).tap(); await step(p);
        assert.equal(await p.locator('[data-select-path]').count(), 2);
        for (const route of MARTIAL_PATHS[sect]) {
          const button = p.locator(`[data-select-path="${route.id}"]`); await button.tap(); await step(p, 900);
          assert.equal(await button.getAttribute('aria-checked'), 'true');
          assert.equal(await p.locator('[data-select-path][aria-checked="true"]').count(), 1);
          assert.equal(await p.locator('#sect-preview').getAttribute('data-path'), route.id);
          assert.match(await p.locator('#join-sect').textContent(), new RegExp(route.weaponLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
          for (const skill of ['skill1','skill2','ultimate']) {
            await p.locator(`[data-preview-skill="${skill}"]`).tap(); await step(p, 800);
            assert.equal(await p.locator('#sect-preview').getAttribute('data-delivery'), route.kit[skill].visual.delivery);
            assert.equal(await p.locator(`[data-preview-skill="${skill}"] svg`).getAttribute('data-source-id'), String(route.kit[skill].sourceId));
          }
          if (viewport.width === 390) {
            cards.push({ name: `${sect} · ${route.name}`, image: await p.locator('#sect-preview').evaluate(c => c.toDataURL()) });
          }
          assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        }
        await p.locator('[data-select-path][aria-checked="true"]').focus();
        const chosen = await p.locator('[data-select-path][aria-checked="true"]').getAttribute('data-select-path');
        await p.keyboard.press('ArrowRight'); assert.notEqual(await p.locator('[data-select-path][aria-checked="true"]').getAttribute('data-select-path'), chosen);
      }
      await p.locator('[data-faction="tianren"]').tap(); await p.locator('[data-select-path="halberd"]').tap();
      await p.locator('#hero-name-input').fill('Long Kích'); await p.locator('#hero-sex-input').selectOption('male'); await step(p, 900);
      await p.screenshot({ path: `/tmp/volam-v31/creation-${viewport.width}.png` });
      await p.locator('#join-sect').tap(); await step(p);
      await p.locator('#save-btn').evaluate(e => e.click());
      const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('giang-ho-di-truyen-prototype')));
      assert.equal(saved.player.name, 'Long Kích'); assert.equal(saved.player.factionId, 'tianren');
      assert.equal(saved.player.martialPath, 'halberd'); assert.equal(saved.player.equipment.weapon.variant, 'halberd');
      await p.reload({ waitUntil: 'networkidle' }); await step(p);
      assert.equal(await p.locator('#sect-overlay').isHidden(), true);
      console.log(`PASS touch creation: 10 sects, 20 paths, 60 previews, keyboard choice, matching starter weapon and reload at ${viewport.width}×${viewport.height}`);
      await context.close();
    }
    const gallery = await browser.newPage({ viewport: { width: 1400, height: 950 } });
    await gallery.setContent(`<meta charset="utf-8"><style>body{background:#14261c;color:#ecd9a0;font:14px serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}img{width:100%}</style><main>${cards.map(c => `<article>${c.name}<img src="${c.image}"></article>`).join('')}</main>`);
    await gallery.screenshot({ path: '/tmp/volam-v31/skills.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS all real creation taps and asset/script checks');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
