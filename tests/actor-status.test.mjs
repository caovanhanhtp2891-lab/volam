import test from "node:test";
import assert from "node:assert/strict";
import { freshMotion } from "../src/combat.ts";
import { horseGait, weaponPose } from "../src/actor-animation.ts";
import { horseWalkFrame, HORSE_WALK_SIZE } from "../src/horse-animation.ts";
import { variantsForSlot } from "../src/gear-catalog.ts";
import { enemyStatusVisual } from "../src/enemy-status.ts";

test("painted gait uses all four frames, loops continuously and stops the saddle bob", () => {
  const frames = new Set();
  for (let stride = 0; stride < Math.PI * 2; stride += 0.1) {
    const gait = horseGait(stride, 1);
    frames.add(gait.frame);
    assert.ok(gait.bob >= 0 && gait.bob <= 1.3);
    assert.ok(Math.abs(gait.lean) <= 0.018);
    assert.equal(horseGait(stride, 0).bob, 0);
  }
  assert.equal(frames.size, 4);
  assert.deepEqual(horseGait(0, 1), horseGait(Math.PI * 2, 1));
  for (const variant of [
    "bay",
    "white",
    "warhorse",
    "ember",
    "dapple",
    "night",
  ]) {
    const crops = Array.from({ length: 4 }, (_, frame) =>
      horseWalkFrame(variant, frame),
    );
    for (const crop of crops) {
      assert.ok(
        crop.x >= 0 &&
          crop.y >= 0 &&
          crop.x + crop.width <= HORSE_WALK_SIZE.width &&
          crop.y + crop.height <= HORSE_WALK_SIZE.height,
      );
      assert.ok(crop.width > 230 && crop.height > 180);
    }
    assert.equal(
      new Set(crops.map((c) => c.y)).size,
      1,
      "the saddle does not jump between source rows",
    );
    assert.equal(new Set(crops.map((c) => c.x)).size, 4);
  }
});

test("each wielded type winds up, strikes and recovers to the resting grip", () => {
  const attack = {
    ...freshMotion(),
    action: "attack",
    actionAt: 0,
    actionDuration: 400,
  };
  for (const variant of variantsForSlot("weapon")) {
    for (const now of [-50, 0, 90, 160, 250, 400, 500]) {
      const pose = weaponPose(variant, attack, now);
      assert.ok(
        [pose.angle, pose.pull, pose.trail, pose.lean].every(Number.isFinite),
      );
      assert.ok(
        pose.pull >= 0 && pose.pull <= 1 && pose.trail >= 0 && pose.trail <= 1,
      );
      if (now >= 400) {
        assert.equal(pose.angle, -0.16);
        assert.equal(pose.trail, 0);
      }
    }
  }
  const sword = weaponPose("sword", attack, 160),
    spear = weaponPose("spear", attack, 160),
    bow = weaponPose("bow", attack, 160);
  assert.ok(sword.trail > 0 && spear.trail === 0 && bow.trail === 0);
  assert.ok(
    spear.angle > sword.angle && bow.pull > 0 && Math.abs(bow.angle) < 0.2,
  );
});

test("freeze is distinct from ordinary stun, fades before expiry and does not outlive the lock", () => {
  const enemy = {
    slowUntil: 3000,
    stunUntil: 1400,
    poisonUntil: 0,
    frozenUntil: 1400,
    chilledUntil: 3000,
  };
  assert.equal(enemyStatusVisual(enemy, 100).frozen, true);
  assert.equal(enemyStatusVisual(enemy, 1300).stunned, false);
  assert.ok(
    enemyStatusVisual(enemy, 1300).iceAlpha > 0 &&
      enemyStatusVisual(enemy, 1300).iceAlpha < 1,
  );
  assert.equal(enemyStatusVisual(enemy, 1400).frozen, false);
  assert.equal(enemyStatusVisual(enemy, 1400).chilled, true);
  assert.equal(
    enemyStatusVisual({ ...enemy, stunUntil: 0 }, 100).frozen,
    false,
  );
  assert.equal(
    enemyStatusVisual({ ...enemy, frozenUntil: 0 }, 100).stunned,
    true,
  );
  const expired = enemyStatusVisual(enemy, 3000);
  assert.equal(Object.values(expired).some(Boolean), false);
});

test("poison and freeze can coexist, while dead enemies lose all status artwork", () => {
  const enemy = {
    slowUntil: 3000,
    stunUntil: 1400,
    poisonUntil: 2000,
    frozenUntil: 1400,
    chilledUntil: 3000,
  };
  const active = enemyStatusVisual(enemy, 100);
  assert.equal(active.poisoned, true);
  assert.equal(active.frozen, true);
  assert.equal(
    Object.values(enemyStatusVisual({ ...enemy, dead: true }, 100)).some(
      Boolean,
    ),
    false,
  );
});
