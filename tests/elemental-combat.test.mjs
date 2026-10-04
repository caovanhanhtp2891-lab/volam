import test from "node:test";
import assert from "node:assert/strict";
import { COMBAT_STAT_SCALE, toCombat, toCore, displayedStat, migrateCombatScale, scaledOutgoingDamage, scaledIncomingDamage } from "../src/combat-scale.ts";
import { outgoingDamage, incomingDamage, emptyStats } from "../src/gear-stats.ts";
import { combatPower } from "../src/cultivation.ts";
import { applyElementalAilments, takeBurnTick } from "../src/skill-ailments.ts";
import { enemyStatusVisual } from "../src/enemy-status.ts";
import { elementalParticles, elementalMotionKind, drawElementalMotion } from "../src/elemental-motion.ts";
import { SECTS } from "../src/sects.ts";
import { RELIC_TRAITS, GEAR_VARIANTS, gearTrait, weaponBaseVariant, validGearIdentity } from "../src/gear-catalog.ts";
import { RARITIES, rollGearBonuses, validBonuses } from "../src/equipment.ts";
import { weaponFamily } from "../src/actor-animation.ts";

test("legacy saves retain health ratios, power, inventory and currency through repeated validation", () => {
  const old = { player: { hp: 225, maxHp: 900, mp: 80, maxMp: 200, shield: 15, attack: 220, defense: 90, gold: 712, inventory: [{ power: 80, bonuses: { hp: 400 } }] }, enemies: [{ hp: 420, maxHp: 560, attack: 36, defense: 19 }], wildElite: { hp: 1120 } };
  const power = combatPower(old.player.attack, old.player.defense, old.player.maxHp, 121);
  const gear = structuredClone(old.player.inventory);
  migrateCombatScale(old);
  assert.equal(old.player.maxHp, 90000);
  assert.equal(old.player.hp / old.player.maxHp, .25);
  assert.equal(old.player.mp / old.player.maxMp, .4);
  assert.equal(old.player.shield, 1500);
  assert.equal(old.enemies[0].hp, 42000);
  assert.equal(old.wildElite.hp, 112000);
  assert.equal(old.player.gold, 712);
  assert.deepEqual(old.player.inventory, gear);
  assert.equal(combatPower(old.player.attack, old.player.defense, toCore(old.player.maxHp), 121), power);
  const upgraded = structuredClone(old);
  migrateCombatScale(old); migrateCombatScale(old);
  assert.deepEqual(old, upgraded);
  for (const version of [2, -1, NaN, null, "1"]) assert.throws(() => migrateCombatScale({ ...structuredClone(upgraded), combatScaleVersion: version }), /save-invalid/);
});

test("migration rejects corrupt resource values before changing the save", () => {
  for (const hp of [NaN, Infinity, -1, Number.MAX_SAFE_INTEGER]) {
    const save = { player: { hp, maxHp: 200, mp: 40, maxMp: 100 } };
    assert.throws(() => migrateCombatScale(save), /save-invalid/);
    assert.equal(save.player.maxHp, 200);
    assert.equal(save.combatScaleVersion, undefined);
  }
});

test("larger attacks, enemy armor and incoming damage preserve combat proportions, including modifier caps", () => {
  for (const level of [1, 40, 160]) for (const critical of [false, true]) for (const mods of [{}, { armorPen: 95, critDamage: 250, damageReduction: 80 }]) {
    const raw = 24 + level * 9, defense = 8 + level * 4;
    assert.equal(scaledOutgoingDamage(toCombat(raw), toCombat(defense), level, critical, mods), outgoingDamage(raw, defense, level, critical, mods) * COMBAT_STAT_SCALE);
    assert.equal(scaledIncomingDamage(toCombat(raw), toCombat(defense), level, mods), incomingDamage(raw, defense, level, mods) * COMBAT_STAT_SCALE);
  }
  for (const stat of ["attack", "defense", "hp", "mp", "hpRegen", "mpRegen"]) assert.equal(displayedStat(stat, 12), 1200);
  for (const stat of ["speed", "crit", "attackSpeed", "damageReduction", "lifeSteal"]) assert.equal(displayedStat(stat, 12), 12);
});

const enemy = () => ({ burnUntil: 0, burnNextTick: 0, burnDamage: 0, burnSect: "cai-bang", corrodedUntil: 0, defenseDownUntil: 0, slowUntil: 0, stunUntil: 0, poisonUntil: 0 });
test("burn starts on contact, ticks each second and repeated hits cannot postpone ticks", () => {
  const target = enemy(), fire = SECTS["thien-nhan"].kit.skill1;
  assert.equal(takeBurnTick(target, 1000), 0);
  applyElementalAilments(target, fire, 2, 1000, "thien-nhan");
  applyElementalAilments(target, fire, 1, 1070, "thien-nhan");
  assert.equal(target.burnNextTick, 2000);
  assert.equal(takeBurnTick(target, 1999), 0);
  assert.equal(takeBurnTick(target, 2000), .4);
  assert.equal(takeBurnTick(target, 2000), 0);
  assert.equal(takeBurnTick(target, 3000), .4);
  assert.equal(takeBurnTick(target, 4000), 0);
  assert.equal(enemyStatusVisual(target, 3069).burning, true);
  assert.equal(enemyStatusVisual(target, 3070).burning, false);
  target.dead = true;
  assert.equal(takeBurnTick(target, 3070), 0);
  applyElementalAilments(target, fire, 20, 4000, "thien-nhan");
  assert.equal(target.burnUntil, 3070);
});

test("Ngũ Độc corrosion weakens actual armor and expires with its visual, preserving longer armor breaks", () => {
  const target = enemy();
  applyElementalAilments(target, SECTS["ngu-doc"].kit.skill1, 1.2, 1000, "ngu-doc");
  assert.equal(target.corrodedUntil, 4000);
  assert.equal(target.defenseDownUntil, 4000);
  assert.equal(enemyStatusVisual(target, 3999).corroded, true);
  assert.equal(enemyStatusVisual(target, 4000).corroded, false);
  target.defenseDownUntil = 12000;
  applyElementalAilments(target, SECTS["ngu-doc"].kit.skill2, .4, 5000, "ngu-doc");
  assert.equal(target.defenseDownUntil, 12000);
  assert.equal(target.corrodedUntil, 7000);
  assert.equal(Object.values(enemyStatusVisual({ ...target, dead: true }, 6000)).some(Boolean), false);
});

test("each sect has moving elemental geometry, with bounded full and simple effects", () => {
  const kinds = new Set(Object.values(SECTS).map(sect => elementalMotionKind(sect.id)));
  kinds.add(elementalMotionKind("thien-nhan", "shadow"));
  assert.equal(kinds.size, 8);
  for (const kind of kinds) {
    assert.notDeepEqual(elementalParticles(kind, 100, 1000), elementalParticles(kind, 100, 1150), kind);
    for (const simple of [false, true]) {
      const particles = elementalParticles(kind, 100, 1000, simple);
      assert.equal(particles.length, simple ? 4 : 14);
      assert.ok(particles.every(p => [p.x, p.y, p.alpha, p.size].every(Number.isFinite) && p.alpha >= 0 && p.alpha <= 1));
      const calls = [];
      const c = new Proxy({ globalAlpha: 1 }, { get(target, key) { return key in target ? target[key] : (...args) => calls.push([key, ...args]); } });
      drawElementalMotion(c, kind, 100, 1000, "#80cf64", "#fff7b3", simple, true);
      assert.ok(calls.length > 0);
      assert.ok(calls.length < 400, "bounded draw budget");
      assert.equal(calls.filter(([key]) => key === "save").length, calls.filter(([key]) => key === "restore").length);
      assert.equal(calls.some(([key]) => /Gradient|filter/.test(key)), false);
    }
  }
});

test("24 obtainable relic blueprints favor six builds without changing rarity affix counts or validity", () => {
  assert.equal(Object.keys(RELIC_TRAITS).length, 24);
  assert.equal(new Set(Object.values(RELIC_TRAITS)).size, 6);
  for (const [variant, trait] of Object.entries(RELIC_TRAITS)) {
    const slot = GEAR_VARIANTS[variant].slot;
    assert.ok(validGearIdentity({ slot, variant }));
    for (const [tier, rarity] of RARITIES.entries()) {
      const rolled = rollGearBonuses(160, rarity, slot, () => .5, variant);
      assert.equal(Object.keys(rolled).length, [2, 3, 5, 7, 10, 12, 14][tier]);
      assert.ok(validBonuses(rolled));
      if (tier >= 1) assert.ok(gearTrait(variant).stats.some(stat => rolled[stat] > 0), trait);
    }
  }
  const plain = rollGearBonuses(160, "Thần Thoại", "ring", () => .5);
  const lightning = rollGearBonuses(160, "Thần Thoại", "ring", () => .5, "thunderring");
  const blood = rollGearBonuses(160, "Thần Thoại", "ring", () => .5, "bloodring");
  assert.ok(lightning.crit > plain.crit && lightning.critDamage > plain.critDamage);
  assert.ok(blood.attack > plain.attack && blood.lifeSteal > plain.lifeSteal);
  assert.equal(weaponBaseVariant("iceglaive"), "halberd");
  assert.equal(weaponFamily("iceglaive"), "thrust");
  assert.equal(weaponFamily("jadebow"), "ranged");
  assert.equal(weaponFamily("meteorhammer"), "swing");
  assert.equal(gearTrait("sword"), undefined);
});
