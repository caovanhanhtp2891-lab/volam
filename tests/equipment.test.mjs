import test from "node:test";
import assert from "node:assert/strict";
import { RARITIES, RARITY_COLORS, gearStats, totalGearStats, gearScore, equipBestGear, rollGearBonuses, discardCandidates, validBonuses, equipmentGrade } from "../src/equipment.ts";
import { equipmentMarkup } from "../src/equipment-art.ts";
const item = (id, slot = "weapon", changes = {}) => ({ id, slot, power: 20, level: 10, enhance: 0, rarity: "Tốt", ...changes });
test("old saves retain primary attack/defense and enhancement without inventing random bonuses", () => {
  assert.deepEqual(gearStats(item("old", "weapon", { enhance: 5 })), { attack: 24, defense: 0, hp: 0, mp: 0, crit: 0, speed: 0 });
  assert.equal(gearStats(item("old-armor", "armor")).defense, 20);
});
test("all six bonus lines stack across slots and enhancement scales each line exactly once", () => {
  const a = item("all", "ring", { enhance: 10, bonuses: { attack: 10, defense: 5, hp: 100, mp: 50, crit: 5, speed: 10 } });
  const before = JSON.stringify(a);
  assert.deepEqual(gearStats(a), { attack: 14, defense: 35, hp: 140, mp: 70, crit: 7, speed: 14 });
  assert.equal(totalGearStats([a, a]).hp, 280);
  assert.equal(JSON.stringify(a), before);
});
test("new rarity rolls increase line count; Golden has all six; all rolls remain positive", () => {
  for (const [tier, rarity] of RARITIES.entries()) for (const level of [1, 80, 160]) {
    const bonuses = rollGearBonuses(level, rarity, "boots", () => .5);
    assert.equal(Object.keys(bonuses).length, [1, 2, 3, 4, 6][tier]);
    assert.ok(Object.values(bonuses).every(n => Number.isInteger(n) && n > 0));
    assert.ok(bonuses.speed > 0);
  }
});
test("five rarity colors and all eleven SVG shapes identify Golden equipment without bitmaps", () => {
  assert.equal(new Set(Object.values(RARITY_COLORS)).size, 5);
  for (const slot of ["weapon", "armor", "helmet", "boots", "belt", "necklace", "ring", "ring2", "bracelet", "pendant", "horse"]) {
    assert.match(equipmentMarkup(slot, RARITY_COLORS["Hoàng Kim"], "Hoàng Kim"), /tier-4/);
  }
  assert.equal(equipmentGrade(1), "Bậc 1");
  assert.equal(equipmentGrade(160), "Bậc 16");
});
test("best equipment weighs bonus lines rather than raw primary power, preserves every item even in a full bag", () => {
  const old = item("old", "weapon", { power: 25 });
  const strongest = item("bonus", "weapon", { power: 10, bonuses: { attack: 30, hp: 100 } });
  const primary = item("primary", "weapon", { power: 30 });
  const owner = { equipment: { weapon: old }, inventory: [strongest, primary, ...Array.from({ length: 58 }, (_, i) => item(`spare-${i}`))] };
  const ids = [old, ...owner.inventory].map(i => i.id).sort();
  const before = gearScore(old);
  assert.equal(equipBestGear(owner), 1);
  assert.equal(owner.equipment.weapon.id, "bonus");
  assert.ok(gearScore(owner.equipment.weapon) > before);
  assert.equal(owner.inventory.length, 60);
  assert.deepEqual([owner.equipment.weapon, ...owner.inventory].map(i => i.id).sort(), ids);
  assert.equal(equipBestGear(owner), 0);
});
test("discard applies quality, level and weaker filters while protecting Golden/enhanced/equipped items", () => {
  const owner = { equipment: { weapon: item("equipped") }, inventory: [item("weak", "weapon", { power: 5 }), item("strong", "weapon", { power: 100 }), item("new-slot", "boots"), item("golden", "weapon", { rarity: "Hoàng Kim" }), item("enhanced", "weapon", { enhance: 1 }), item("high-level", "weapon", { level: 11 }), item("rare", "weapon", { rarity: "Hiếm" })] };
  const filter = { maxRarity: 1, maxLevel: 10, weakerOnly: true };
  assert.deepEqual(discardCandidates(owner, filter).map(i => i.id), ["weak"]);
  assert.deepEqual(discardCandidates(owner, { maxRarity: 4, maxLevel: 160, weakerOnly: false }).map(i => i.id), ["weak", "strong", "new-slot", "high-level", "rare"]);
});
test("save bonus validation rejects unknown, fractional, negative, nonnumeric or oversized stats", () => {
  for (const bad of [null, [], { attack: -1 }, { attack: .1 }, { attack: Infinity }, { attack: "10" }, { gold: 2 }, { hp: 1e9 }]) assert.equal(validBonuses(bad), false);
  assert.equal(validBonuses(undefined), true);
  assert.equal(validBonuses({ hp: 100, mp: 30, crit: 2 }), true);
});
