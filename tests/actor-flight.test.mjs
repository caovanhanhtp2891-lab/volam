import test from "node:test";
import assert from "node:assert/strict";
import { SECTS } from "../src/sects.ts";
import {
  actorRig,
  actorCastOffset,
  RIDER_SEAT,
  horseStride,
} from "../src/actor-rig.ts";
import {
  skillUsesFlight,
  skillFlightPoint,
  iceFragments,
} from "../src/skill-flight.ts";

test("weapon and cast origins share a hand, including mirrored mounted seats for all 20 looks", () => {
  for (const id of Object.keys(SECTS))
    for (const sex of ["male", "female"]) {
      for (const mounted of [false, true]) {
        const rig = actorRig(id, sex, mounted);
        assert.ok(Math.abs(rig.right.x) < 28);
        assert.ok(rig.right.y < 0 && rig.right.y > -40);
        const right = actorCastOffset(id, sex, 1, mounted);
        const left = actorCastOffset(id, sex, -1, mounted);
        assert.equal(right.x, rig.right.x + (mounted ? RIDER_SEAT.x : 0));
        assert.equal(right.y, rig.right.y + (mounted ? RIDER_SEAT.y : 0));
        assert.equal(left.x, -right.x);
        assert.equal(left.y, right.y);
      }
    }
});

test("horse legs rest when stopped and stay bounded through a complete gait", () => {
  for (let phase = 0; phase < Math.PI * 4; phase += 0.1)
    for (let leg = 0; leg < 4; leg++) {
      const rest = horseStride(phase, 0, leg),
        step = horseStride(phase, 1, leg);
      assert.equal(Math.abs(rest.x) + rest.lift + Math.abs(rest.angle), 0);
      assert.ok(
        Math.abs(step.x) <= 3.5 &&
          step.lift >= 0 &&
          step.lift <= 3.5 &&
          Math.abs(step.angle) <= 0.13,
      );
    }
  assert.ok(horseStride(1, 1, 0).x * horseStride(1, 1, 1).x < 0);
});

test("ice fans and sword lines fly; defensive skills and body dashes stay local", () => {
  assert.equal(skillUsesFlight(SECTS["thuy-yen"].kit.skill1), true);
  assert.equal(skillUsesFlight(SECTS["vo-dang"].kit.skill1), true);
  assert.equal(skillUsesFlight(SECTS["con-lon"].kit.skill1), true);
  assert.equal(skillUsesFlight(SECTS["thuy-yen"].kit.skill2), false);
  assert.equal(skillUsesFlight(SECTS["thien-vuong"].kit.skill2), false);
});

test("all ten flight profiles reach their real contact point without overshooting", () => {
  const from = { x: -20, y: -60 },
    to = { x: 190, y: -24 };
  for (const id of Object.keys(SECTS)) {
    assert.deepEqual(skillFlightPoint(from, to, -1, id), from);
    const end = skillFlightPoint(from, to, 2, id);
    assert.ok(Math.hypot(end.x - to.x, end.y - to.y) < 1e-9);
  }
  assert.deepEqual(skillFlightPoint(from, to, 0.5, "con-lon"), {
    x: 85,
    y: -42,
  });
});

test("ice debris remains bounded, fades away and uses fewer shards in compact mode", () => {
  for (const simple of [false, true])
    for (const p of [0, 0.1, 0.5, 0.9, 1, 2]) {
      const shards = iceFragments(p, simple);
      assert.equal(shards.length, simple ? 3 : 12);
      for (const shard of shards) {
        assert.ok(Object.values(shard).every(Number.isFinite));
        assert.ok(Math.abs(shard.x) <= 59 && Math.abs(shard.y) < 60);
        assert.ok(shard.alpha >= 0 && shard.alpha <= 1);
        if (p >= 1) assert.equal(shard.alpha, 0);
      }
    }
});
