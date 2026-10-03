import test from "node:test";
import assert from "node:assert/strict";
import { STAT_LABELS, emptyStats, statUnit, combatModifiers, outgoingDamage, incomingDamage, stolenLife, gearStats, gearScore, loadoutStats, equipBestGear, validBonuses } from "../src/equipment.ts";
import { GEAR_SETS, SET_IDS, EQUIPMENT_SLOTS, setBonuses, rollGearIdentity } from "../src/gear-catalog.ts";
import { equipmentMarkup } from "../src/equipment-art.ts";
import { SET_CREST_PATHS } from "../src/set-art.ts";
import { SECT_SIGILS } from "../src/skill-art.ts";

const piece = (slot, setId, changes = {}) => ({ id: `${setId}-${slot}`, slot, setId, element: GEAR_SETS[setId].element, rarity: "Tốt", level: 10, power: 0, enhance: 0, ...changes });
const fullSet = id => EQUIPMENT_SLOTS.map(slot => piece(slot, id));

test("all fourteen stat lines survive serialization, stack once and scale with enhancement", () => {
  const bonuses = Object.fromEntries(Object.keys(STAT_LABELS).map(key => [key, 5]));
  const item = piece("weapon", "bao-vu", { power: 20, bonuses, enhance: 10 });
  const stats = gearStats(item);
  assert.equal(Object.keys(stats).length, 14);
  for (const key of Object.keys(bonuses)) assert.equal(stats[key], key === "attack" ? 37 : 7);
  assert.equal(validBonuses(bonuses), true);
  assert.deepEqual(gearStats(JSON.parse(JSON.stringify(item))), stats);
  assert.deepEqual(loadoutStats([item]), stats, "one set piece grants no set bonus");
  assert.equal(statUnit("attackSpeed"), "%");
  assert.equal(statUnit("hpRegen"), "/giây");
  assert.equal(statUnit("attack"), "");
});
test("armor penetration and critical damage change damage without changing legacy combat", () => {
  assert.equal(outgoingDamage(100, 100, 1, false, {}), 47);
  assert.equal(outgoingDamage(100, 100, 1, true, {}), 70);
  assert.equal(outgoingDamage(100, 100, 1, false, { armorPen: 50 }), 64);
  assert.equal(outgoingDamage(100, 100, 1, true, { armorPen: 50, critDamage: 50 }), 128);
  assert.equal(outgoingDamage(100, 0, 1, true, { critDamage: 1e6 }), 300);
  assert.equal(outgoingDamage(0, 100, 1, false, {}), 1);
});
test("damage reduction applies after armor and never creates immunity", () => {
  assert.equal(incomingDamage(100, 100, 1, {}), 52);
  assert.equal(incomingDamage(100, 100, 1, { damageReduction: 50 }), 26);
  assert.equal(incomingDamage(100, 0, 1, { damageReduction: 1e6 }), 50);
  assert.equal(incomingDamage(1, 1e6, 1, { damageReduction: 50 }), 1);
});
test("lifesteal uses actual lost enemy HP and capped percentage, excluding overkill", () => {
  assert.equal(stolenLife(100, 200, { lifeSteal: 10 }), 10);
  assert.equal(stolenLife(1000, 25, { lifeSteal: 1e6 }), 5);
  assert.equal(stolenLife(100, 0, { lifeSteal: 20 }), 0);
  assert.equal(stolenLife(100, 200, {}), 0);
  const capped = combatModifiers(Object.fromEntries(Object.keys(STAT_LABELS).map(key => [key, 1e6])));
  assert.deepEqual(capped, { critDamage: 150, attackSpeed: 80, lifeSteal: 20, armorPen: 60, damageReduction: 50, dodge: 35, hpRegen: 1000, mpRegen: 300 });
});
test("advanced affixes affect loadout choice and enhancement while every absent line stays zero", () => {
  const old = piece("weapon", "kim-phong", { power: 20 });
  const fast = piece("weapon", "bao-vu", { bonuses: { attackSpeed: 20, lifeSteal: 5 } });
  assert.ok(gearScore(fast) > gearScore(old));
  const owner = { inventory: [fast], equipment: { weapon: old } };
  assert.equal(equipBestGear(owner), 1);
  assert.equal(owner.equipment.weapon.id, fast.id);
  assert.ok(gearStats({ ...fast, enhance: 1 }).attackSpeed > gearStats(fast).attackSpeed);
  assert.equal(gearStats(fast).hpRegen, 0);
  assert.deepEqual(gearStats({ ...old, setId: undefined, bonuses: undefined }), { ...emptyStats(), attack: 20 });
});
test("ten sect sets add distinct bonuses only at six and eleven pieces, all remain obtainable", () => {
  const newSets = SET_IDS.filter(id => GEAR_SETS[id].sect);
  assert.equal(newSets.length, 10);
  assert.equal(new Set(SET_IDS.map(id => JSON.stringify(setBonuses(fullSet(id))))).size, 15);
  for (const id of newSets) {
    const set = GEAR_SETS[id], items = fullSet(id), key = set.specialty;
    assert.equal(setBonuses(items.slice(0, 5))[key], 0);
    assert.ok(setBonuses(items.slice(0, 6))[key] > 0);
    assert.ok(setBonuses(items)[key] > setBonuses(items.slice(0, 10))[key]);
    const sameElement = SET_IDS.filter(other => GEAR_SETS[other].element === set.element);
    const values = [.1, (sameElement.indexOf(id) + .1) / sameElement.length, 0];
    assert.equal(rollGearIdentity("weapon", "Hoàng Kim", set.element, () => values.shift()).setId, id);
    const aligned = setBonuses(items, set.element), base = setBonuses(items);
    for (const stat of Object.keys(base)) assert.equal(aligned[stat], Math.ceil(base[stat] * 1.2));
    assert.match(equipmentMarkup("weapon", "#ffd35a", "Hoàng Kim", "", items[0]), new RegExp(`data-set-crest="${id}"`));
    assert.ok(SET_CREST_PATHS[set.crest]);
  }
  assert.equal(new Set(Object.values(SECT_SIGILS)).size, 10);
});
