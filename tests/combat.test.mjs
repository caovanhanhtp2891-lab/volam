import test from "node:test";
import assert from "node:assert/strict";
import {
  freshMotion,
  updateMotion,
  actionProgress,
  easedPoint,
  flightDuration,
  landingHeight,
  withinReach,
} from "../src/combat.ts";

test("walking advances with actual distance and faces all eight directions", () => {
  for (const [x, y] of [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ]) {
    const motion = freshMotion();
    updateMotion(motion, { x: 0, y: 0 }, { x: x * 13, y: y * 13 }, 1 / 30, 0);
    assert.ok(motion.moving > 0);
    assert.ok(motion.stride > 0);
    assert.ok(Math.abs(Math.hypot(motion.facingX, motion.facingY) - 1) < 1e-8);
    assert.equal(Math.sign(motion.facingX), Math.sign(x));
    assert.equal(Math.sign(motion.facingY), Math.sign(y));
  }
});
test("a blocked actor stops walking and retains its facing", () => {
  const motion = freshMotion();
  updateMotion(motion, { x: 0, y: 0 }, { x: 20, y: 0 }, 0.1, 0);
  const stride = motion.stride;
  updateMotion(motion, { x: 20, y: 0 }, { x: 20, y: 0 }, 0.1, 100);
  assert.equal(motion.stride, stride);
  assert.equal(motion.moving, 0);
  assert.equal(motion.facingX, 1);
});
test("attack pose holds through windup and returns to idle at its end", () => {
  const motion = Object.assign(freshMotion(), {
    action: "attack",
    actionAt: 100,
    actionDuration: 300,
  });
  assert.equal(actionProgress(motion, 50), 0);
  assert.equal(actionProgress(motion, 250), 0.5);
  updateMotion(motion, { x: 0, y: 0 }, { x: 0, y: 0 }, 0.02, 399);
  assert.equal(motion.action, "attack");
  updateMotion(motion, { x: 0, y: 0 }, { x: 0, y: 0 }, 0.02, 400);
  assert.equal(motion.action, "idle");
});
test("dash reaches its destination without overshooting or teleporting at the start", () => {
  const from = { x: 100, y: 200 },
    to = { x: 300, y: 400 };
  assert.deepEqual(easedPoint(from, to, -1), from);
  const middle = easedPoint(from, to, 0.5);
  assert.ok(
    middle.x > 100 && middle.x < 300 && middle.y > 200 && middle.y < 400,
  );
  assert.deepEqual(easedPoint(from, to, 2), to);
});
test("projectiles have nonzero travel time and distant flights remain bounded", () => {
  assert.equal(flightDuration({ x: 0, y: 0 }, { x: 0, y: 0 }), 150);
  assert.equal(flightDuration({ x: 0, y: 0 }, { x: 720, y: 0 }), 650);
  assert.ok(flightDuration({ x: 0, y: 0 }, { x: 250, y: 0 }) > 150);
});
test("loot launches above the ground and lands at zero height", () => {
  assert.equal(landingHeight(0), 0);
  assert.ok(landingHeight(0.5) > 40);
  assert.ok(Math.abs(landingHeight(1)) < 1e-8);
  assert.ok(Math.abs(landingHeight(2)) < 1e-8);
});
test("skill reach includes the target radius and rejects an out-of-range target", () => {
  assert.equal(withinReach({ x: 0, y: 0 }, { x: 100, y: 0 }, 80, 20), true);
  assert.equal(withinReach({ x: 0, y: 0 }, { x: 101, y: 0 }, 80, 20), false);
  assert.equal(withinReach({ x: 0, y: 0 }, { x: 0, y: 100 }, 100), true);
});
