// Optional: VOLAM_PLAYWRIGHT_PATH, VOLAM_CHROMIUM_PATH and VOLAM_TEST_URL.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.VOLAM_TEST_URL || 'http://127.0.0.1:5173';
const saveKey = 'giang-ho-di-truyen-prototype';

async function saved(page) {
  return page.evaluate(key => { document.querySelector('#save-btn').click(); return JSON.parse(localStorage.getItem(key)); }, saveKey);
}

async function seed(page, changes) {
  const snapshot = await saved(page);
  Object.assign(snapshot.player, { level: 5, xp: 0, attack: 10, defense: 1000, hp: 50, mp: 500, rage: 100, x: 460, y: 330, cooldowns: { skill1: 0, skill2: 0, ultimate: 0 }, skillRanks: { skill1: 1, skill2: 1, ultimate: 1 }, ...changes });
  await page.evaluate(({ key, data }) => { localStorage.setItem(key, JSON.stringify(data)); document.querySelector('#load-btn').click(); }, { key: saveKey, data: snapshot });
  await page.waitForTimeout(80); // Let the camera settle before projecting a world target.
  return saved(page);
}

async function castAndSave(page, key, aimId = 'bandit-1') {
  return page.evaluate(({ key, aimId, saveKey }) => {
    document.querySelector('#save-btn').click();
    const before = JSON.parse(localStorage.getItem(saveKey));
    const enemy = before.enemies.find(e => e.id === aimId);
    const canvas = document.querySelector('#game-canvas'), rect = canvas.getBoundingClientRect();
    const cameraX = Math.max(0, Math.min(1900 - canvas.width, before.player.x - canvas.width / 2));
    const cameraY = Math.max(0, Math.min(1200 - canvas.height, before.player.y - canvas.height / 2));
    canvas.dispatchEvent(new MouseEvent('click', { clientX: rect.x + (enemy.x - cameraX) / canvas.width * rect.width, clientY: rect.y + (enemy.y - cameraY) / canvas.height * rect.height, bubbles: true }));
    document.querySelector(`[data-skill="${key}"]`).click();
    document.querySelector('#save-btn').click();
    return { ...JSON.parse(localStorage.getItem(saveKey)), before };
  }, { key, aimId, saveKey });
}

(async () => {
  const { SECTS, SKILL_KEYS } = await import('../src/sects.ts');
  const browser = await chromium.launch({ executablePath: process.env.VOLAM_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const sect of Object.values(SECTS)) {
      const context = await browser.newContext({ viewport: { width: 390, height: 740 }, isMobile: true, hasTouch: true });
      await context.addInitScript(() => {
        const draw = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
          if (image instanceof HTMLImageElement && image.naturalWidth === 480 && args[6] === 46 && args[7] === 50) window.smallHeroDrawn = true;
          return draw.call(this, image, ...args);
        };
      });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.sect-card').count(), 10);
      await page.locator(`[data-sect="${sect.id}"]`).click();
      assert.equal(await page.locator(`[data-sect="${sect.id}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#sect-overlay').isVisible(), true, 'selection previews before joining');
      for (const key of SKILL_KEYS) {
        await page.locator(`[data-preview-skill="${key}"]`).click();
        assert.ok((await page.locator('.sect-preview-description').textContent()).includes(sect.kit[key].name));
      }
      if (sect.id === 'thieu-lam') await page.screenshot({ path: '/tmp/volam-ten-sects-selection.png' });
      await page.evaluate(() => { window.smallHeroDrawn = false; });
      await page.locator('#join-sect').click();
      await page.locator('#sect-overlay').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => window.smallHeroDrawn);
      assert.equal(await page.locator('#avatar-orb').getAttribute('data-sect'), sect.id);
      const beforePosition = (await saved(page)).player;
      await page.keyboard.down('d'); await page.waitForTimeout(250); await page.keyboard.up('d');
      const moved = (await saved(page)).player;
      assert.ok(moved.x > beforePosition.x + 15, 'movement keeps the school speed');
      for (const key of SKILL_KEYS) {
        const definition = sect.kit[key], before = await seed(page, {});
        assert.equal(await page.locator(`[data-skill="${key}"] svg`).getAttribute('data-motif'), definition.motif);
        const after = await castAndSave(page, key);
        assert.equal(after.player.mp, after.before.player.mp - definition.mp, `${sect.name} ${key}: MP cost`);
        assert.ok(after.player.cooldowns[key] > 0, `${sect.name} ${key}: cooldown`);
        assert.equal(after.player.radius, 12);
        if (definition.damage > 0) assert.ok(after.enemies[0].hp < before.enemies[0].hp, `${sect.name} ${key}: damage`);
        if (definition.heal) assert.ok(after.player.hp > before.player.hp, `${sect.name} ${key}: healing`);
        if (definition.shield) assert.ok(after.player.shield > 0, `${sect.name} ${key}: shield`);
        if (definition.poison) assert.ok(after.enemies[0].poisonUntil > 0, 'poison applied');
        if (definition.slow) assert.equal(after.enemies[0].slowFactor, definition.slow);
        if (definition.stun) assert.ok(after.enemies[0].stunUntil > 0, 'stun applied');
        if (definition.breakArmor) assert.ok(after.enemies[0].defenseDownUntil > 0, 'armor break applied');
        if (key === 'ultimate') assert.equal(after.player.rage, 0);
      }
      console.log(`PASS ${sect.name}: compact sprite, selection, preview, movement, all three skill behaviors`);
      await context.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 740 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('[data-sect="thien-vuong"]').click(); await page.locator('#join-sect').click();
    let before = await seed(page, { x: 100, y: 300 });
    let after = await castAndSave(page, 'skill1');
    assert.equal(after.player.mp, after.before.player.mp); assert.equal(after.player.cooldowns.skill1, 0);
    before = await seed(page, { mp: 0 }); after = await castAndSave(page, 'skill1');
    assert.equal(after.player.mp, after.before.player.mp); assert.equal(after.player.cooldowns.skill1, 0);
    before = await seed(page, { rage: 0 }); after = await castAndSave(page, 'ultimate');
    assert.equal(after.player.mp, after.before.player.mp); assert.equal(after.player.cooldowns.ultimate, 0);
    before = await seed(page, { level: 1 }); after = await castAndSave(page, 'skill2');
    assert.equal(after.player.mp, after.before.player.mp); assert.equal(after.player.cooldowns.skill2, 0);
    before = await seed(page, { x: 1000, y: 390 }); after = await castAndSave(page, 'skill2', 'wolf-2');
    assert.ok(after.player.x <= 1018, 'dash does not cross the rock');
    assert.equal(after.player.mp, after.before.player.mp); assert.equal(after.player.cooldowns.skill2, 0);
    console.log('PASS invalid range, insufficient mana/rage, level lock and blocked dash preserve resources');
    for (const [legacy, migrated] of [['kim', 'thien-vuong'], ['hoa', 'cai-bang'], ['thuy', 'nga-mi']]) {
      const migratedSave = await seed(page, { sect: legacy, gold: 987, xp: 33, radius: 18, skillPoints: 4 });
      assert.equal(migratedSave.player.sect, migrated);
      assert.equal(migratedSave.player.gold, 987); assert.equal(migratedSave.player.xp, 33);
      assert.equal(migratedSave.player.skillPoints, 4); assert.equal(migratedSave.player.radius, 12);
      assert.equal(migratedSave.player.equipment.weapon.id.startsWith('starter-'), true);
    }
    console.log('PASS three legacy sect migrations preserve XP, gear, wallet and skill points');
    for (const [width, height] of [[320,568],[360,640],[390,740],[430,932],[600,960],[844,390]]) {
      await page.setViewportSize({ width, height });
      await page.locator('#reset-btn').evaluate(el => el.click());
      await page.waitForTimeout(160);
      const bounds = await page.locator('.sect-dialog').boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height + .5);
      await page.locator('.sect-card[data-sect="con-lon"]').click();
      await page.locator('#join-sect').click();
      const dimensions = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
      assert.deepEqual(dimensions, [width, height]);
      if (width === 390) await page.screenshot({ path: '/tmp/volam-small-hero-mobile.png' });
    }
    console.log('PASS selection and game fit six mobile viewports, including landscape');
    assert.deepEqual(errors, [], 'no browser or asset errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
