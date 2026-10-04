import test from "node:test";
import assert from "node:assert/strict";
import { RARITIES, RARITY_COLORS, emptyStats, gearStats, totalGearStats, gearScore, equipBestGear, rollGearBonuses, discardCandidates, validBonuses, equipmentGrade, enhancementInfo, attemptEnhancement } from "../src/equipment.ts";
import { equipmentMarkup } from "../src/equipment-art.ts";
const item = (id, slot = "weapon", changes = {}) => ({ id, slot, power: 20, level: 10, enhance: 0, rarity: "Tốt", ...changes });
test("old saves retain primary attack/defense and enhancement without randomizing saved bonuses", () => {
  assert.deepEqual(gearStats(item("old", "weapon", { enhance: 5 })), { ...emptyStats(), attack: 26 });
  assert.equal(gearStats(item("old-armor", "armor")).defense, 20);
});
test("all six bonus lines stack across slots and enhancement scales each line exactly once", () => {
  const a = item("all", "ring", { enhance: 10, bonuses: { attack: 10, defense: 5, hp: 100, mp: 50, crit: 5, speed: 10 } });
  const before = JSON.stringify(a);
  assert.deepEqual(gearStats(a), { ...emptyStats(), attack: 16, defense: 40, hp: 157, mp: 79, crit: 6, speed: 11, armorPen: 2, lifeSteal: 1 });
  assert.equal(totalGearStats([a, a]).hp, 314);
  assert.equal(JSON.stringify(a), before);
});
test("each enhancement rank improves small primary stats and rounds positive affixes upward and creates an extra line only at the tenth rank", () => {
  for (const power of [1, 10, 20, 25, 99, 120]) {
    let previous = gearStats(item("small", "weapon", { power })).attack;
    for (let enhance = 1; enhance <= 10; enhance++) {
      const stats = gearStats(item("small", "weapon", { power, enhance, bonuses: { crit: 1 } }));
      assert.ok(stats.attack > previous); previous = stats.attack;
      assert.equal(stats.hp > 0, enhance === 10); assert.ok(stats.crit >= 2);
    }
  }
});
test("enhancement charges exact materials once; failed attempts keep item stats and rank", () => {
  const equipped = item("upgrade", "armor", { enhance: 3, bonuses: { hp: 15 } });
  const owner = { gold: 1000, refiningStones: 10 };
  const info = enhancementInfo(equipped); assert.equal(info.cost, 222); assert.equal(info.stones, 1); assert.ok(info.chance < .94 && info.chance > .93);
  const before = gearStats(equipped);
  assert.equal(attemptEnhancement(equipped, owner, () => .99), "failed");
  assert.equal(equipped.enhance, 3); assert.deepEqual(gearStats(equipped), before);
  assert.deepEqual(owner, { gold: 778, refiningStones: 9 });
  assert.equal(attemptEnhancement(equipped, owner, () => .5), "success");
  assert.equal(equipped.enhance, 4); assert.deepEqual(owner, { gold: 556, refiningStones: 8 });
});
test("poor, zero-stone and capped upgrades never consume resources, roll randomness or change stats", () => {
  for (const [enhance, gold, refiningStones, expected] of [[0, 44, 3, "poor"], [0, 100, 0, "poor"], [100, 1000, 10, "capped"]]) {
    const gear = item("blocked", "weapon", { enhance }), owner = { gold, refiningStones };
    const before = JSON.stringify([gear, owner]);
    assert.equal(attemptEnhancement(gear, owner, () => { throw Error("must not roll"); }), expected);
    assert.equal(JSON.stringify([gear, owner]), before);
  }
  assert.equal(enhancementInfo(item("rate", "weapon", { enhance: 0 })).chance, 1); assert.equal(enhancementInfo(item("rate", "weapon", { enhance: 99 })).chance, .015);
});
test("new rarity rolls increase line count; Golden has ten unique lines; all rolls remain positive", () => {
  for (const [tier, rarity] of RARITIES.entries()) for (const level of [1, 80, 160]) {
    const bonuses = rollGearBonuses(level, rarity, "boots", () => .5);
    assert.equal(Object.keys(bonuses).length, [2, 3, 5, 7, 10, 12, 14][tier]);
    assert.ok(Object.values(bonuses).every(n => Number.isInteger(n) && n > 0));
    assert.ok(bonuses.speed > 0);
  }
});
test("seven rarity colors and all eleven SVG shapes identify Golden equipment without bitmaps", () => {
  assert.equal(new Set(Object.values(RARITY_COLORS)).size, 7);
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
