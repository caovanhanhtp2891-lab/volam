import test from "node:test";
import assert from "node:assert/strict";
import { ELITE_MIN_KILLS, eliteChance, recordNormalKill, normalizeEliteHunt, createCampfire, CAMPFIRE_RADIUS, CAMPFIRE_INTERVAL, CAMPFIRE_DURATION, tickCampfires, restoreCampfires, validCampfires, validWildElite, campfireXp } from "../src/elite-hunt.ts";
const now = Date.parse("2026-10-03T10:00:00Z");
test("ordinary kills accumulate before elite rolls; failed rolls improve odds, pity and success reset streak", () => {
  const hunt = normalizeEliteHunt();
  for (let i = 1; i < ELITE_MIN_KILLS; i++) { assert.equal(recordNormalKill(hunt, false, () => { throw Error("too early"); }), false); assert.equal(hunt.normalKills, i); }
  assert.equal(recordNormalKill(hunt, false, () => .5), false); assert.equal(hunt.normalKills, 6);
  assert.ok(eliteChance(7) > eliteChance(6));
  assert.equal(recordNormalKill(hunt, false, () => .1), true); assert.deepEqual(hunt, { normalKills: 0, spawned: 1 });
  hunt.normalKills = 19; assert.equal(recordNormalKill(hunt, false, () => .999), true);
});
test("a living elite prevents both additional spawns and advancing the next streak", () => {
  const hunt = { normalKills: 19, spawned: 1 };
  assert.equal(recordNormalKill(hunt, true, () => { throw Error("must not roll"); }), false);
  assert.deepEqual(hunt, { normalKills: 19, spawned: 1 });
});
test("old and malformed hunt saves normalize safely and counters survive a JSON round trip", () => {
  assert.deepEqual(normalizeEliteHunt(), { normalKills: 0, spawned: 0 });
  assert.deepEqual(normalizeEliteHunt({ normalKills: -1, spawned: Infinity }), { normalKills: 0, spawned: 0 });
  assert.deepEqual(normalizeEliteHunt({ normalKills: 50, spawned: 2.8 }), { normalKills: 20, spawned: 2 });
  assert.deepEqual(normalizeEliteHunt(JSON.parse(JSON.stringify({ normalKills: 12, spawned: 4 }))), { normalKills: 12, spawned: 4 });
});
test("campfire awards a tick only at its interval inside the radius and in its own area", () => {
  const fire = createCampfire("fire", "world", 500, 500, 5, now);
  assert.equal(tickCampfires([fire], "world", { x: 500, y: 500 }, now + CAMPFIRE_INTERVAL - 1), 0);
  assert.equal(tickCampfires([fire], "world", { x: 500 + CAMPFIRE_RADIUS, y: 500 }, now + CAMPFIRE_INTERVAL), campfireXp(5));
  assert.equal(tickCampfires([fire], "world", { x: 500, y: 500 }, now + CAMPFIRE_INTERVAL), 0);
  assert.equal(tickCampfires([fire], "world", { x: 500 + CAMPFIRE_RADIUS + 1, y: 500 }, now + CAMPFIRE_INTERVAL * 2), 0);
  assert.equal(tickCampfires([fire], "stage-1", { x: 500, y: 500 }, now + CAMPFIRE_INTERVAL * 3), 0);
});
test("multiple fires cannot stack XP and delayed/background frames cannot grant catch-up XP", () => {
  const fires = [1, 5, 10].map(level => createCampfire(`fire-${level}`, "stage-1", 500, 500, level, now));
  assert.equal(tickCampfires(fires, "stage-1", { x: 500, y: 500 }, now + 30000), campfireXp(10));
  assert.equal(tickCampfires(fires, "stage-1", { x: 500, y: 500 }, now + 30000), 0);
});
test("staggered campfires and walking between their areas still award at most one tick every three seconds", () => {
  const fires = [createCampfire("first", "world", 500, 500, 5, now), createCampfire("second", "world", 500, 500, 10, now + 1000), createCampfire("third", "stage-1", 500, 500, 20, now + 2000)];
  assert.equal(tickCampfires(fires, "world", { x: 500, y: 500 }, now + 3000), campfireXp(5));
  assert.equal(tickCampfires(fires, "world", { x: 500, y: 500 }, now + 4000), 0);
  assert.equal(tickCampfires(fires, "stage-1", { x: 500, y: 500 }, now + 5000), 0);
  assert.equal(tickCampfires(fires, "world", { x: 500, y: 500 }, now + 6000), campfireXp(10));
});
test("expiry is exact, reload never extends an ordinary fire or awards immediate/offline ticks", () => {
  const fire = createCampfire("fire", "world", 500, 500, 5, now);
  const restored = restoreCampfires(JSON.parse(JSON.stringify([fire])), now + 20000);
  assert.equal(restored[0].expiresAt, now + CAMPFIRE_DURATION);
  assert.equal(tickCampfires(restored, "world", { x: 500, y: 500 }, now + 20000), 0);
  assert.equal(tickCampfires(restored, "world", { x: 500, y: 500 }, now + CAMPFIRE_DURATION), 0);
  assert.deepEqual(restoreCampfires([fire], now + CAMPFIRE_DURATION), []);
  assert.ok(restoreCampfires([{ ...fire, expiresAt: now + 1e9 }], now)[0].expiresAt <= now + CAMPFIRE_DURATION);
});
test("campfire and saved elite validation rejects malformed maps, positions, timers or unlimited lists", () => {
  const fire = createCampfire("fire", "world", 500, 500, 5, now);
  assert.equal(validCampfires(undefined), true); assert.equal(validCampfires([fire]), true);
  for (const change of [{ area: "stage-161" }, { x: -1 }, { y: Infinity }, { level: 0 }, { nextTickAt: NaN }, { expiresAt: "tomorrow" }]) assert.equal(validCampfires([{ ...fire, ...change }]), false);
  assert.equal(validCampfires(Array(4).fill(fire)), false);
  const elite = { id: "wild-elite-1", name: "Tinh anh", area: "stage-160", x: 500, y: 500, level: 160, hp: 10, element: "kim" };
  assert.equal(validWildElite(elite), true); assert.equal(validWildElite(undefined), true);
  for (const change of [{ id: "boss" }, { hp: 0 }, { area: "golden" }, { element: "invalid" }, { x: -5 }]) assert.equal(validWildElite({ ...elite, ...change }), false);
});
