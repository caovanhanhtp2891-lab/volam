import test from "node:test";
import assert from "node:assert/strict";
import { freshLootSettings, normalizeLootSettings, validLootSettings, acceptsLoot, autoDiscardItems } from "../src/loot-settings.ts";
import { botEncounter, randomPatrolGoal, normalizeBotSettings, validBotSettings } from "../src/bots.ts";
import { freshSiegeCapture, tickSiegeCapture, SIEGE_CAPTURE_SECONDS } from "../src/siege.ts";
const item = (id, extra = {}) => ({ id, slot: "weapon", rarity: "Thường", level: 10, power: 10, enhance: 0, ...extra });

test("old saves keep all pickup qualities with automatic discard off; invalid filters cannot enter a save", () => {
  assert.deepEqual(normalizeLootSettings(), freshLootSettings());
  assert.equal(freshLootSettings().autoDiscard, false);
  assert.equal(validLootSettings(undefined), true);
  for (const bad of [null, [], {}, { ...freshLootSettings(), minRarity: 7 }, { ...freshLootSettings(), minGrade: 1.5 }, { ...freshLootSettings(), maxDiscardRarity: 7 }, { ...freshLootSettings(), autoDiscard: "true" }, { ...freshLootSettings(), maxDiscardGrade: 21 }]) assert.equal(validLootSettings(bad), false);
  const original = freshLootSettings(), copy = normalizeLootSettings(original); copy.minGrade = 4;
  assert.equal(original.minGrade, 1);
});
test("pickup filters require both quality and grade, including exact ten-level boundaries", () => {
  const p = { ...freshLootSettings(), minRarity: 2, minGrade: 2 };
  assert.equal(acceptsLoot(item("low", { rarity: "Hiếm", level: 10 }), p), false);
  assert.equal(acceptsLoot(item("next", { rarity: "Hiếm", level: 11 }), p), true);
  assert.equal(acceptsLoot(item("quality", { rarity: "Tốt", level: 160 }), p), false);
  for (const extra of [{ setId: "tower" }, { enhance: 1 }, { rarity: "Hoàng Kim" }, { rarity: "Thần Thoại" }]) assert.equal(acceptsLoot(item("keep", extra), { ...p, minRarity: 6, minGrade: 16 }), false);
});
test("automatic discard keeps equipped, special, enhanced, pending and stronger equipment", () => {
  const equipped = item("equipped", { power: 100 });
  const owner = { equipment: { weapon: equipped }, pendingItems: [item("pending")], inventory: [item("weak"), item("strong", { power: 200 }), item("set", { setId: "tower" }), item("gold", { rarity: "Hoàng Kim" }), item("upgraded", { enhance: 1 }), item("no-slot", { slot: "helmet" })] };
  assert.equal(autoDiscardItems(owner, freshLootSettings()).length, 0);
  assert.deepEqual(autoDiscardItems(owner, { ...freshLootSettings(), autoDiscard: true }).map(x => x.id), ["weak"]);
  assert.equal(owner.equipment.weapon, equipped);
  assert.equal(owner.pendingItems[0].id, "pending");
  assert.deepEqual(owner.inventory.map(x => x.id), ["strong", "set", "gold", "upgraded", "no-slot"]);
  assert.deepEqual(autoDiscardItems(owner, { ...freshLootSettings(), autoDiscard: true, weakerOnly: false }).map(x => x.id), ["strong", "no-slot"]);
});
test("automatic discard applies its own rarity and grade ceilings independently of pickup settings", () => {
  const owner = { inventory: [item("10"), item("11", { level: 11 }), item("rare", { rarity: "Hiếm" })], equipment: {} };
  const p = { ...freshLootSettings(), autoDiscard: true, maxDiscardGrade: 1, weakerOnly: false, minRarity: 6 };
  assert.deepEqual(autoDiscardItems(owner, p).map(x => x.id), ["10"]);
  assert.deepEqual(owner.inventory.map(x => x.id), ["11", "rare"]);
});
test("PK rolls once per new encounter, with cooldown independent of frame rate and no rolls in safe zones", () => {
  const state = { near: false, nextRollAt: 0 }; let rolls = 0;
  const roll = () => { rolls++; return .12; };
  assert.equal(botEncounter(state, 190, 1000, false, roll), false);
  for (let i = 0; i < 600; i++) assert.equal(botEncounter(state, 90, 1000 + i * 16, false, roll), false);
  assert.equal(rolls, 1);
  botEncounter(state, 281, 20000, false, roll);
  assert.equal(botEncounter(state, 100, 20001, false, () => 0), false);
  botEncounter(state, 281, 46000, false, roll);
  assert.equal(botEncounter(state, 100, 46001, false, () => .119), true);
  assert.equal(botEncounter(state, 0, 100000, true, () => { throw Error("safe zone rolled"); }), false);
  assert.equal(botEncounter(state, 100, 100001, false, () => 0), false);
});
test("BOT settings migrate old characters and preserve an explicit PK opt-out", () => {
  assert.deepEqual(normalizeBotSettings({ enabled: true, assist: false }), { enabled: true, assist: false, pvp: true });
  assert.equal(normalizeBotSettings({ enabled: true, assist: false, pvp: false }).pvp, false);
  assert.equal(validBotSettings({ enabled: true, assist: false, pvp: 1 }), false);
});
test("random patrol explores world bounds and retries blocked goals with a bounded fallback", () => {
  const bounds = { width: 3600, height: 2400 }, fallback = { x: 500, y: 600 };
  const points = Array.from({ length: 50 }, () => randomPatrolGoal(bounds, () => false, fallback));
  assert.ok(new Set(points.map(p => Math.floor(p.x))).size > 10);
  assert.ok(points.every(p => p.x >= 120 && p.x <= 3480 && p.y >= 160 && p.y <= 2240));
  let tries = 0;
  assert.deepEqual(randomPatrolGoal(bounds, () => { tries++; return true; }, fallback), fallback);
  assert.equal(tries, 12);
});
test("capture needs an ally; defending troops push it back; each reinforcement wave triggers once", () => {
  const p = freshSiegeCapture();
  for (let i = 0; i < 100; i++) tickSiegeCapture(p, .1, false, false);
  assert.equal(p.progress, 0);
  let waves = 0;
  for (let i = 0; i < 41; i++) waves += Number(tickSiegeCapture(p, .1, true, false));
  assert.equal(waves, 1); assert.equal(p.reinforcements, 1);
  const before = p.progress;
  tickSiegeCapture(p, .2, true, true); assert.ok(p.progress < before);
  for (let i = 0; i < 100; i++) waves += Number(tickSiegeCapture(p, .1, true, false));
  assert.equal(waves, 2); assert.equal(p.progress, SIEGE_CAPTURE_SECONDS);
  assert.equal(tickSiegeCapture(p, Infinity, true, false), false);
  const late = freshSiegeCapture(); tickSiegeCapture(late, 240, true, false); assert.equal(late.progress, .25);
});
