import test from "node:test";
import assert from "node:assert/strict";
import { MAX_LEVEL, xpToNext, normalizePreferences, normalizeJourney, applyExperience, REBIRTH_BONUS, rebirthBonuses, rebirthCharacter, TITLES, titleProgress, unlockTitles, wornTitle, progressionBonuses } from "../src/character-progression.ts";

const fighter = () => ({ level: 1, xp: 0, attack: 20, defense: 10, skillPoints: 0, idle: { attributePoints: 0 }, journey: normalizeJourney(), inventory: [], equipment: {}, pendingItems: [], dungeonClears: { tomb: 0, bamboo: 0 }, goldenClears: [] });
test("legacy XP preferences are removed while independent display toggles survive", () => {
  assert.equal(normalizePreferences({ skillEffects: "simple" }).skillEffects, "simple");
  for (const skillEffects of [null, false, "unknown"]) assert.equal(normalizePreferences({ skillEffects }).skillEffects, "full");
  for (const xpMultiplier of [1, 2, 7, 5, 10, 100, 1000]) assert.equal("xpMultiplier" in normalizePreferences({ xpMultiplier }), false);
  for (const xpMultiplier of [0, -1, 2, "1000", Infinity, NaN]) assert.equal("xpMultiplier" in normalizePreferences({ xpMultiplier }), false);
  assert.deepEqual(normalizePreferences({ minimap: false, titleEffects: false }), { skillEffects: "full", damageNumbers: true, minimap: false, titleEffects: false, titleVisible: true });
});
test("every XP multiplier conserves XP across multiple levels and grants each level's points once", () => {
  for (const multiplier of [1, 2, 7, 5, 10, 100, 1000]) {
    const player = fighter(), result = applyExperience(player, 120, multiplier);
    assert.equal(result.amount, 120 * multiplier);
    let spent = 0; for (let i = 1; i < player.level; i++) spent += xpToNext(i);
    assert.equal(player.xp + spent, result.amount);
    assert.equal(result.levels, player.level - 1);
    assert.equal(player.skillPoints, result.levels); assert.equal(player.idle.attributePoints, result.levels * 5);
    assert.equal(player.attack, 20 + result.levels * 3); assert.equal(player.defense, 10 + result.levels * 2);
  }
});
test("large XP awards stop at level 200, discard overflow and cannot mint points again while capped", () => {
  const player = fighter(); player.level = 199;
  assert.equal(applyExperience(player, 1e9, 1000).levels, 1);
  assert.equal(player.level, MAX_LEVEL); assert.equal(player.xp, 0); assert.equal(player.skillPoints, 1);
  const before = JSON.stringify(player);
  assert.deepEqual(applyExperience(player, 500, 1000), { amount: 0, levels: 0 });
  assert.equal(JSON.stringify(player), before);
});
test("negative and non-finite XP cannot reduce progress or create levels", () => {
  for (const value of [-12, NaN, Infinity]) {
    const player = fighter(); assert.deepEqual(applyExperience(player, value, 1000), { amount: 0, levels: 0 }); assert.equal(player.xp, 0);
  }
});
test("old journeys migrate known kills, boss victories and historical levels without inventing rebirths", () => {
  const journey = normalizeJourney(undefined, { level: 80, kills: 110, bosses: 12 });
  assert.equal(journey.rebirths, 0); assert.equal(journey.kills, 110); assert.equal(journey.bosses, 12); assert.equal(journey.highestLevel, 80);
  const normalized = normalizeJourney({ rebirths: -1, kills: Infinity, highestLevel: 1000, unlockedTitles: ["novice", "novice", "invalid"], activeTitle: "invalid" });
  assert.equal(normalized.rebirths, 0); assert.equal(normalized.kills, 0); assert.equal(normalized.highestLevel, MAX_LEVEL); assert.deepEqual(normalized.unlockedTitles, ["novice"]); assert.equal(normalized.activeTitle, "");
});
test("rebirth requires max level, resets level-derived bases and preserves earned possessions and points", () => {
  const player = fighter(); player.inventory.push({ id: "keep" }); player.gold = 300; player.skillPoints = 100; player.idle.attributePoints = 795;
  const before = JSON.stringify(player);
  assert.equal(rebirthCharacter(player, { attack: 20, defense: 10 }), false); assert.equal(JSON.stringify(player), before);
  player.level = MAX_LEVEL; player.xp = 123456; player.attack = 497; player.defense = 328;
  assert.equal(rebirthCharacter(player, { attack: 20, defense: 10 }), true);
  assert.equal(player.level, 1); assert.equal(player.xp, 0); assert.equal(player.attack, 20); assert.equal(player.defense, 10);
  assert.equal(player.journey.rebirths, 1); assert.equal(player.journey.highestLevel, MAX_LEVEL);
  assert.deepEqual(player.inventory, [{ id: "keep" }]); assert.equal(player.gold, 300); assert.equal(player.skillPoints, 100); assert.equal(player.idle.attributePoints, 795);
  assert.equal(rebirthCharacter(player, { attack: 20, defense: 10 }), false); assert.equal(player.journey.rebirths, 1);
});
test("permanent bonuses derive from rebirth count and never mutate or duplicate on reload/recalculation", () => {
  const journey = normalizeJourney({ rebirths: 5 }), before = JSON.stringify(journey);
  assert.deepEqual(rebirthBonuses(1), REBIRTH_BONUS);
  const bonus = progressionBonuses(journey);
  for (const [key, value] of Object.entries(REBIRTH_BONUS)) assert.equal(bonus[key], value * 5);
  assert.deepEqual(progressionBonuses(JSON.parse(before)), bonus); assert.equal(JSON.stringify(journey), before);
});
test("title thresholds unlock exactly once, remain earned after reset and do not equip themselves", () => {
  const player = fighter(); assert.deepEqual(unlockTitles(player).map(t => t.id), ["novice"]);
  player.journey.kills = 99; assert.deepEqual(unlockTitles(player), []);
  player.journey.kills = 100; player.level = 50;
  assert.deepEqual(unlockTitles(player).map(t => t.id), ["hunter", "master", "young-hero"]);
  player.level = 1; player.journey.kills = 0;
  assert.deepEqual(unlockTitles(player), []); assert.ok(player.journey.unlockedTitles.includes("master")); assert.equal(player.journey.activeTitle, "");
});
test("elite, boss, dungeon, Golden and enhancement titles use actual distinct achievements", () => {
  const player = fighter(); unlockTitles(player);
  player.journey.elites = 5; player.journey.bosses = 10; player.dungeonClears.tomb = 2; player.goldenClears.push("golden-one"); player.pendingItems.push({ enhance: 5 });
  assert.deepEqual(unlockTitles(player).map(t => t.id), ["elite", "boss", "golden", "forge"]);
  assert.equal(titleProgress(TITLES.find(t => t.id === "dungeon"), player), 1);
  player.dungeonClears.bamboo = 1; player.equipment.weapon = { enhance: 10 };
  assert.deepEqual(unlockTitles(player).map(t => t.id), ["dungeon", "weapon"]);
});
test("only the worn unlocked title grants bonuses, and swapping or removing changes the bonus set", () => {
  const player = fighter(); player.journey.rebirths = 5; player.level = MAX_LEVEL; unlockTitles(player);
  player.journey.activeTitle = "grandmaster";
  assert.equal(wornTitle(player.journey).name, "Nhất Đại Tông Sư");
  const base = rebirthBonuses(5), first = progressionBonuses(player.journey);
  assert.equal(first.attack, base.attack + 80); assert.equal(first.hp, base.hp + 400); assert.equal(first.crit, 0);
  player.journey.activeTitle = "eternal";
  assert.equal(progressionBonuses(player.journey).crit, 5); assert.equal(progressionBonuses(player.journey).attack, base.attack + 120);
  player.journey.activeTitle = "golden"; assert.equal(wornTitle(player.journey), undefined); assert.deepEqual(progressionBonuses(player.journey), base);
  player.journey.activeTitle = ""; assert.deepEqual(progressionBonuses(player.journey), base);
});
test("expanded title collection retains every original unlock condition and saved title", () => {
  assert.equal(TITLES.length, 28); assert.equal(new Set(TITLES.map(t => t.motif)).size, 18);
  const player = fighter(); player.level = MAX_LEVEL; Object.assign(player.journey, { kills: 100, elites: 5, bosses: 10, rebirths: 5 });
  player.dungeonClears = { tomb: 1, bamboo: 1 }; player.goldenClears = ["golden"]; player.inventory = [{ enhance: 10 }];
  unlockTitles(player);
  for (const title of TITLES.slice(0, 12)) assert.ok(player.journey.unlockedTitles.includes(title.id));
  const restored = { ...player, journey: normalizeJourney(JSON.parse(JSON.stringify(player.journey))) };
  assert.deepEqual(unlockTitles(restored), []); assert.deepEqual(restored.journey.unlockedTitles, player.journey.unlockedTitles);
});
