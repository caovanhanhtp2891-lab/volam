import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { GEAR_VARIANTS } from "../src/gear-catalog.ts";
import { PAINTED_ITEM_FRAMES, paintedItemMarkup, resourceMarkup } from "../src/item-art.ts";
import { RARITIES, rarityTier } from "../src/equipment.ts";
import { equipmentMarkup } from "../src/equipment-art.ts";
import { equipmentVisualState, drawEquipmentRadiance, drawEquipmentDropAura } from "../src/equipment-vfx.ts";

test("108 obtainable equipment variants and both potions have distinct in-bounds painted cells", () => {
  const keys = [...Object.keys(GEAR_VARIANTS), "hp", "mp"];
  assert.equal(Object.keys(PAINTED_ITEM_FRAMES).length, keys.length);
  const crops = new Set();
  for (const key of keys) {
    const frame = PAINTED_ITEM_FRAMES[key];
    assert.ok(frame, key);
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= frame.width + .001 && frame.y + frame.h <= frame.height + .001, key);
    assert.ok(statSync(new URL(frame.url)).size < 750000, "compressed atlas budget");
    crops.add(`${frame.url}/${frame.x}/${frame.y}`);
    assert.match(paintedItemMarkup(key), new RegExp(`data-painted-item="${key}"`));
  }
  assert.equal(crops.size, keys.length);
});

test("rarity radiance increases from blue to red; enhancement can awaken low quality equipment", () => {
  for (const rarity of RARITIES) {
    for (const enhance of [0, 3, 6, 7, 10]) {
      const state = equipmentVisualState({ rarity, enhance });
      const awakened = rarityTier(rarity) >= 2 || enhance >= 7;
      const svg = equipmentMarkup("weapon", "#ffd75b", rarity, "", { enhance });
      assert.equal(state.halo, awakened);
      assert.equal(svg.includes('class="gear-halo"'), awakened);
      assert.equal(svg.includes('class="gear-awakening"'), awakened);
      if (!awakened) {
        assert.equal(state.motes, 0);
        drawEquipmentRadiance(new Proxy({}, { get() { throw new Error("unexpected low-enhancement radiance"); } }), { color: "#ffd75b", rarity, enhance }, 1000);
        const calls = [];
        const c = new Proxy({}, { get(_target, name) { return (...args) => calls.push([name, args]); } });
        drawEquipmentDropAura(c, { color: "#ffd75b", rarity, enhance }, 1000, true, true);
        assert.equal(calls.some(([name]) => name === "ellipse" || name === "arc"), false, "unawakened drops have no light rings");
      }
    }
  }
});

test("actual resources have shared illustrations without changing their labels or item types", () => {
  for (const key of ["hp", "mp", "silver", "stone", "token", "chest"]) {
    assert.match(resourceMarkup(key), new RegExp(`data-item-art="${key}"`));
    assert.match(resourceMarkup(key), /aria-hidden="true"/);
  }
  assert.equal(paintedItemMarkup("missing"), "");
});
