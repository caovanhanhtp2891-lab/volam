import test from "node:test";
import assert from "node:assert/strict";
import {
  FACTIONS,
  ELEMENTS,
  MAX_STAGE,
  normalizeIdle,
  stageInfo,
  elementalMultiplier,
  completeWave,
  goToStage,
  canEnterStage,
  spendAttribute,
  dailyDate,
  claimDaily,
  offlineReward,
} from "../src/idle.ts";

test("ten factions cover all five elements with two distinct factions each", () => {
  assert.equal(new Set(FACTIONS.map((faction) => faction.id)).size, 10);
  for (const element of Object.keys(ELEMENTS)) {
    assert.equal(FACTIONS.filter((faction) => faction.element === element).length, 2);
  }
});

test("save migration preserves classic adventure mode and initializes new idle characters", () => {
  assert.equal(normalizeIdle(undefined, true).enabled, false);
  assert.equal(normalizeIdle().enabled, true);
  const progress = normalizeIdle({ stage: 4, maxStage: 8, totalKills: 37, autoSkills: false });
  assert.equal(progress.stage, 4);
  assert.equal(progress.totalKills, 37);
  assert.equal(progress.autoSkills, false);
});

test("invalid saved progression cannot unlock regions, create negative points or select unsupported speeds", () => {
  const progress = normalizeIdle({
    stage: Infinity,
    maxStage: -4,
    wave: 99,
    speed: 100,
    attributePoints: NaN,
    attributes: { strength: -5, dexterity: Infinity },
    autoLoot: "false",
  });
  assert.equal(progress.stage, 1);
  assert.equal(progress.maxStage, 1);
  assert.equal(progress.wave, 4);
  assert.equal(progress.speed, 1);
  assert.equal(progress.attributePoints, 0);
  assert.equal(progress.attributes.strength, 0);
  assert.equal(progress.attributes.dexterity, 0);
  assert.equal(progress.autoLoot, true);
});

test("every tenth stage has a boss and region transitions retain the correct stage number", () => {
  assert.equal(stageInfo(9).boss, false);
  assert.equal(stageInfo(10).boss, true);
  assert.equal(stageInfo(11).name, "Kiếm Các Tây Bắc");
  assert.equal(stageInfo(11).localStage, 1);
  assert.equal(stageInfo(MAX_STAGE).boss, true);
});

test("a stage unlocks only after all four waves and push mode advances once", () => {
  const progress = normalizeIdle();
  for (let wave = 1; wave < 4; wave++) {
    assert.equal(completeWave(progress).stageCleared, false);
    assert.equal(progress.maxStage, 1);
  }
  assert.deepEqual(completeWave(progress), { stageCleared: true, advanced: true });
  assert.equal(progress.stage, 2);
  assert.equal(progress.maxStage, 2);
  assert.equal(progress.wave, 1);
});

test("farm mode unlocks progress while repeating the chosen stage", () => {
  const progress = normalizeIdle({ push: false, wave: 4 });
  assert.deepEqual(completeWave(progress), { stageCleared: true, advanced: false });
  assert.equal(progress.stage, 1);
  assert.equal(progress.maxStage, 2);
});

test("stage selection respects unlocks and the final stage never overflows", () => {
  const progress = normalizeIdle({ stage: 2, maxStage: 3 });
  const original = structuredClone(progress);
  for (const stage of [0, -1, 4, 1.5, NaN]) assert.equal(goToStage(progress, stage), false);
  assert.deepEqual(progress, original);
  assert.equal(goToStage(progress, 3), true);
  const final = normalizeIdle({ stage: MAX_STAGE, maxStage: MAX_STAGE, wave: 4 });
  assert.equal(completeWave(final).advanced, false);
  assert.equal(final.stage, MAX_STAGE);
  assert.equal(final.maxStage, MAX_STAGE);
});

test("level milestones open a new region without clearing the previous boss", () => {
  for (const start of [11, 21, 31, 151]) {
    const progress = normalizeIdle({ maxStage: 1, wave: 3, inTown: true });
    const before = structuredClone(progress);
    assert.equal(goToStage(progress, start, start - 1), false);
    assert.deepEqual(progress, before);
    assert.equal(canEnterStage(progress, start, start), true);
    assert.equal(goToStage(progress, start, start), true);
    assert.equal(progress.stage, start);
    assert.equal(progress.maxStage, start);
    assert.equal(progress.wave, 1);
    assert.equal(progress.inTown, false);
    assert.equal(stageInfo(progress.stage).level, start);
    const restored = normalizeIdle(JSON.parse(JSON.stringify(progress)));
    assert.equal(goToStage(restored, start, 1), true, "opened maps survive save/load and rebirth");
  }
});

test("level unlocks only region entrances and rejects invalid stages and levels", () => {
  const progress = normalizeIdle();
  for (const stage of [0, 1.5, 12, 152, MAX_STAGE + 1, Infinity, NaN]) {
    assert.equal(goToStage(progress, stage, 160), false);
  }
  for (const level of [10, -1, NaN, Infinity]) assert.equal(goToStage(progress, 11, level), false);
  assert.equal(progress.maxStage, 1);
  assert.equal(goToStage(progress, 11, 11), true);
  assert.equal(goToStage(progress, 12, 11), false);
  completeWave(Object.assign(progress, { wave: 4 }));
  assert.equal(goToStage(progress, 12, 11), true, "wave completion still opens the next stage");
});

test("all five elemental relationships have an advantage and the reciprocal penalty", () => {
  for (const [attacker, defender] of [
    ["kim", "moc"],
    ["moc", "tho"],
    ["tho", "thuy"],
    ["thuy", "hoa"],
    ["hoa", "kim"],
  ]) {
    assert.equal(elementalMultiplier(attacker, defender), 1.25);
    assert.equal(elementalMultiplier(defender, attacker), 0.8);
    assert.equal(elementalMultiplier(attacker, attacker), 1);
  }
});

test("attribute allocation and refunds conserve points and never refund an unspent point", () => {
  const progress = normalizeIdle({ attributePoints: 1 });
  assert.equal(spendAttribute(progress, "strength", 1), true);
  assert.equal(progress.attributes.strength, 1);
  assert.equal(progress.attributePoints, 0);
  assert.equal(spendAttribute(progress, "vitality", 1), false);
  assert.equal(spendAttribute(progress, "strength", -1), true);
  assert.equal(progress.attributePoints, 1);
  assert.equal(spendAttribute(progress, "strength", -1), false);
  assert.equal(spendAttribute(progress, "constructor", 1), false);
  assert.equal(spendAttribute(progress, "strength", 2), false);
});

test("daily gifts cannot be claimed twice, including after a save round trip", () => {
  const progress = normalizeIdle();
  assert.deepEqual(claimDaily(progress, "2026-10-03"), { gold: 100, stones: 2, hp: 3, mp: 2 });
  assert.equal(claimDaily(progress, "2026-10-03"), null);
  const restored = normalizeIdle(JSON.parse(JSON.stringify(progress)));
  assert.equal(claimDaily(restored, "2026-10-03"), null);
  assert.equal(claimDaily(restored, "2026-10-04").gold, 150);
  assert.equal(restored.dailyCount, 2);
});

test("daily boundaries follow Vietnam time independently of the execution host", () => {
  assert.equal(dailyDate(new Date("2026-10-02T16:59:59Z")), "2026-10-02");
  assert.equal(dailyDate(new Date("2026-10-02T17:00:00Z")), "2026-10-03");
});

test("offline progress is capped at four hours and future or absent timestamps grant nothing", () => {
  const now = 2e12;
  assert.deepEqual(offlineReward(now - 120e3, now, 1), { minutes: 2, xp: 16, gold: 12 });
  assert.deepEqual(offlineReward(now - 10 * 3600e3, now, 1), { minutes: 240, xp: 1920, gold: 1440 });
  for (const value of [undefined, NaN, "yesterday", now + 60000]) {
    assert.deepEqual(offlineReward(value, now, 1), { minutes: 0, xp: 0, gold: 0 });
  }
});
