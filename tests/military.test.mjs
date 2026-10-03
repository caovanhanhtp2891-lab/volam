import test from "node:test";
import assert from "node:assert/strict";
import { TERRITORIES, MILITARY_RANKS, freshMilitary, normalizeMilitary, validMilitary, militaryMerit, canChallengeTerritory, captureTerritory, canClaimRank, claimMilitaryRank, wearMilitarySeal, militaryBonuses } from "../src/military.ts";
import { militarySealMarkup } from "../src/military-art.ts";
import { emptyStats } from "../src/gear-stats.ts";

const conquered = (count = 9) => ({ ...freshMilitary(), captured: TERRITORIES.slice(0, count).map(land => land.id) });

test("old characters migrate without granting military ranks or land", () => {
  assert.equal(validMilitary(undefined), true);
  assert.deepEqual(normalizeMilitary(), freshMilitary());
  assert.deepEqual(militaryBonuses(freshMilitary()), emptyStats());
});
test("conquest requires level and the preceding city, and never rewards a city twice", () => {
  const progress = freshMilitary();
  for (const level of [9, -1, NaN, Infinity]) assert.equal(canChallengeTerritory(progress, "bien-thanh", level), false);
  assert.equal(captureTerritory(progress, "tuong-duong", 160), false);
  for (const land of TERRITORIES) {
    assert.equal(captureTerritory(progress, land.id, land.level - 1), false);
    assert.equal(captureTerritory(progress, land.id, land.level), true);
    const earned = militaryMerit(progress);
    assert.equal(captureTerritory(progress, land.id, 160), false);
    assert.equal(militaryMerit(progress), earned);
    assert.equal(validMilitary(progress), true);
  }
  assert.equal(militaryMerit(progress), 4300);
  assert.equal(canChallengeTerritory(progress, "__proto__", 160), false);
});
test("Thái Thú, Thừa Tướng and Hoàng Đế unlock at their earned campaign thresholds", () => {
  for (const rank of MILITARY_RANKS) {
    assert.equal(canClaimRank(conquered(rank.lands - 1), rank.id), false);
    assert.equal(canClaimRank(conquered(rank.lands), rank.id), true);
  }
  assert.equal(canClaimRank(conquered(8), "hoang-de"), false);
  assert.equal(canClaimRank(conquered(), "unknown"), false);
});
test("receiving a seal requires merit and changes no stats until it is worn", () => {
  const progress = conquered(3);
  assert.equal(claimMilitaryRank(progress, "hoang-de"), false);
  assert.equal(claimMilitaryRank(progress, "thai-thu"), true);
  assert.equal(claimMilitaryRank(progress, "thai-thu"), false);
  assert.deepEqual(militaryBonuses(progress), emptyStats());
  assert.equal(wearMilitarySeal(progress, "thai-thu"), true);
  assert.deepEqual(militaryBonuses(progress), { ...emptyStats(), attack: 20, defense: 15, hp: 200, mp: 50, crit: 3 });
});
test("one seal slot prevents unowned seals and replaces bonuses instead of stacking them", () => {
  const progress = conquered();
  assert.equal(wearMilitarySeal(progress, "hoang-de"), false);
  for (const rank of MILITARY_RANKS) claimMilitaryRank(progress, rank.id);
  wearMilitarySeal(progress, "hoang-de");
  assert.equal(militaryBonuses(progress).attack, 100);
  wearMilitarySeal(progress, "huong-truong");
  assert.equal(militaryBonuses(progress).attack, 5);
  assert.equal(militaryBonuses(progress).lifeSteal, 0);
  assert.equal(wearMilitarySeal(progress, "huong-truong"), false);
  assert.equal(wearMilitarySeal(progress, null), true);
  assert.deepEqual(militaryBonuses(progress), emptyStats());
});
test("save validation rejects skipped land, duplicate merit, unearned or unclaimed seals", () => {
  for (const invalid of [null, [], {}, { ...freshMilitary(), captured: ["hoang-thanh"] },
    { ...freshMilitary(), captured: ["bien-thanh", "bien-thanh"] },
    { ...conquered(3), captured: ["tuong-duong", "bien-thanh", "dai-ly"] },
    { ...conquered(3), seals: ["hoang-de"] },
    { ...conquered(3), seals: ["thai-thu", "thai-thu"] },
    { ...conquered(), seals: ["constructor"] },
    { ...conquered(), equipped: "hoang-de" },
    { ...conquered(), seals: ["hoang-de"], equipped: "thai-thu" }]) assert.equal(validMilitary(invalid), false);
});
test("save round trips preserve earned seals without aliasing or accumulating bonuses", () => {
  const progress = conquered(); claimMilitaryRank(progress, "hoang-de"); wearMilitarySeal(progress, "hoang-de");
  const restored = normalizeMilitary(JSON.parse(JSON.stringify(progress)));
  assert.deepEqual(restored, progress);
  assert.deepEqual(militaryBonuses(restored), militaryBonuses(progress));
  restored.captured.pop(); restored.seals.length = 0;
  assert.equal(progress.captured.length, 9); assert.equal(progress.seals.length, 1);
});
test("all seven offices have individual stamp art, including an imperial dragon seal", () => {
  const art = MILITARY_RANKS.map(rank => militarySealMarkup(rank.id));
  assert.equal(new Set(art.map(svg => svg.replaceAll(/rank-seal-\d+/g, "seal"))).size, 7);
  for (const [index, svg] of art.entries()) assert.ok(svg.includes(`data-seal-art="${MILITARY_RANKS[index].id}"`));
  assert.match(militarySealMarkup(null), /empty-seal/);
});
