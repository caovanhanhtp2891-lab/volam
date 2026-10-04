import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { WUXIA_SCENES, wuxiaScene, roadControlPoints, roadPoint } from '../src/wuxia-scenes.ts';

test('terrain coordinates stay finite, scale consistently, and roads cross the playable center at every world size', () => {
  const layouts = new Set();
  for (let region = 0; region < 16; region++) {
    for (const vertical of [false, true]) {
      const points = roadControlPoints(region, vertical);
      layouts.add(JSON.stringify(points));
      for (const [width, height] of [[1900, 1200], [3600, 2400], [480, 300]]) {
        for (let i = 0; i <= 20; i++) {
          const t = i / 20, point = roadPoint(region, width, height, t, vertical);
          const unit = roadPoint(region, 1, 1, t, vertical);
          assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
          assert.ok(Math.abs(point.x / width - unit.x) < 1e-12);
          assert.ok(Math.abs(point.y / height - unit.y) < 1e-12);
          assert.ok(point.x >= -width * .05 && point.x <= width * 1.05);
          assert.ok(point.y >= -height * .05 && point.y <= height * 1.05);
        }
        const middle = roadPoint(region, width, height, .5, vertical);
        assert.ok(Math.hypot(middle.x / width - .5, middle.y / height - .54) < .1);
      }
    }
  }
  assert.equal(layouts.size, 32);
});

test('scene references stay within the painted sheets, invalid regions have a fallback, and compressed assets fit their budgets', () => {
  assert.equal(WUXIA_SCENES.length, 16);
  for (const scene of WUXIA_SCENES) {
    for (const frame of [scene.landmark, scene.companion]) assert.ok(Number.isInteger(frame) && frame >= 0 && frame < 16);
    for (const material of [scene.ground, scene.road]) assert.ok(Number.isInteger(material) && material >= 0 && material < 4);
  }
  for (const invalid of [-1, 16, NaN, Infinity, .5]) assert.equal(wuxiaScene(invalid), WUXIA_SCENES[0]);
  for (const name of ['wuxia-landmarks.webp', 'wuxia-ground.webp']) {
    const bytes = statSync(new URL(`../src/assets/${name}`, import.meta.url)).size;
    assert.ok(bytes > 100000 && bytes < 900 * 1024, `${name} must remain below 900 KiB`);
  }
});
