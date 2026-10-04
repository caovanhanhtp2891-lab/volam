import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import {
  RARITIES,
  RARITY_COLORS,
  rarityTier,
  rollEquipmentRarity,
  rollGearBonuses,
  discardCandidates,
} from "../src/equipment.ts";
import {
  REGION_SCENES,
  regionFrame,
  TRAINING_ATLAS_URL,
} from "../src/region-scenes.ts";
import { equipmentVisualState } from "../src/equipment-vfx.ts";
import { equipmentMarkup } from "../src/equipment-art.ts";

test("sixteen environments use unique, exact atlas cells within a mobile asset budget", () => {
  assert.equal(REGION_SCENES.length, 16);
  assert.equal(new Set(REGION_SCENES.map((scene) => scene.detail)).size, 16);
  assert.ok(statSync(new URL(TRAINING_ATLAS_URL)).size < 800000);
  const frames = Array.from({ length: 16 }, (_, i) =>
    regionFrame(i, 1536, 1024),
  );
  assert.equal(new Set(frames.map((f) => `${f.x}/${f.y}`)).size, 16);
  for (const f of frames) {
    assert.equal(f.width, 384);
    assert.equal(f.height, 256);
    assert.ok(
      f.x >= 0 && f.y >= 0 && f.x + f.width <= 1536 && f.y + f.height <= 1024,
    );
  }
  assert.deepEqual(regionFrame(NaN, 1536, 1024), frames[0]);
});
test("all seven qualities are actually obtainable; red is rarest and requires level 101", () => {
  assert.equal(RARITIES.at(-1), "Thần Thoại");
  assert.equal(new Set(Object.values(RARITY_COLORS)).size, 7);
  const counts = Object.fromEntries(RARITIES.map((r) => [r, 0]));
  for (let i = 0; i < 10000; i++)
    counts[rollEquipmentRarity(160, "normal", () => (i + 0.5) / 10000)]++;
  assert.ok(Object.values(counts).every((n) => n > 0));
  assert.equal(counts["Thần Thoại"], 5);
  assert.ok(counts["Thần Thoại"] < counts["Truyền Thuyết"]);
  assert.equal(
    rollEquipmentRarity(100, "boss", () => 0),
    "Truyền Thuyết",
  );
  assert.equal(
    rollEquipmentRarity(60, "boss", () => 0),
    "Hoàng Kim",
  );
  assert.equal(
    rollEquipmentRarity(101, "boss", () => 0),
    "Thần Thoại",
  );
  assert.equal(
    rollEquipmentRarity(61, "elite", () => 0.005),
    "Truyền Thuyết",
  );
  assert.equal(
    rollEquipmentRarity(160, "boss", () => 0.999),
    "Cực phẩm",
  );
  assert.equal(
    rollEquipmentRarity(160, "elite", () => 0.999),
    "Hiếm",
  );
  for (const level of [NaN, Infinity, -1])
    assert.notEqual(
      rollEquipmentRarity(level, "boss", () => 0),
      "Thần Thoại",
    );
});
test("red and orange have full, finite affixes and are protected from bulk discard", () => {
  const make = (rarity) => ({
    id: rarity,
    slot: "weapon",
    rarity,
    level: 160,
    enhance: 0,
    power: 100,
    bonuses: rollGearBonuses(160, rarity, "weapon", () => 0.5),
  });
  const red = make("Thần Thoại"),
    orange = make("Truyền Thuyết");
  assert.equal(Object.keys(red.bonuses).length, 14);
  assert.equal(Object.keys(orange.bonuses).length, 12);
  assert.ok(
    Object.values(red.bonuses).every((n) => Number.isFinite(n) && n > 0),
  );
  assert.ok(red.bonuses.attack > orange.bonuses.attack);
  const bag = RARITIES.map(make);
  const discarded = discardCandidates(
    { inventory: bag, equipment: {} },
    { maxRarity: 6, maxLevel: 160, weakerOnly: false },
  );
  assert.equal(discarded.length, 4);
  assert.ok(discarded.every((item) => rarityTier(item.rarity) < 4));
});
test("quality effects grow without enhancement and red keeps the strongest runes in simple mode", () => {
  const visuals = RARITIES.map((rarity) =>
    equipmentVisualState({ rarity, enhance: 0 }),
  );
  for (let i = 1; i < visuals.length; i++) {
    assert.ok(visuals[i].beam > visuals[i - 1].beam);
    assert.ok(visuals[i].motes >= visuals[i - 1].motes);
  }
  assert.equal(visuals.at(-1).motes, 8);
  assert.ok(visuals.at(-1).band > visuals.at(-2).band);
  const red = equipmentMarkup(
    "weapon",
    RARITY_COLORS["Thần Thoại"],
    "Thần Thoại",
    "",
    { enhance: 0 },
  );
  assert.match(red, /gear-mythic-runes/);
  assert.match(red, /gear-halo/);
  assert.doesNotMatch(
    equipmentMarkup("weapon", RARITY_COLORS.Thường, "Thường"),
    /gear-halo/,
  );
  assert.equal(equipmentVisualState({ rarity: "Thần Thoại" }, true).motes, 0);
  assert.equal(equipmentVisualState({ rarity: "Thần Thoại" }, true).halo, true);
});
