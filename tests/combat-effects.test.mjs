import test from "node:test";
import assert from "node:assert/strict";
import { SECTS, SKILL_KEYS } from "../src/sects.ts";
import { drawSectEffect, drawSkillFlight } from "../src/sect-effects.ts";

// Record production rendering commands without a GPU. Path2D crests remain
// distinguishable and numeric arguments must be finite for every school.
globalThis.Path2D ??= class { constructor(data) { this.data = data; } };
function recorder() {
  const calls = [], target = { globalAlpha: 1 };
  const c = new Proxy(target, { get(object, name) {
    if (name in object) return object[name];
    return (...args) => {
      for (const arg of args) if (typeof arg === "number") assert.ok(Number.isFinite(arg), `${String(name)} received ${arg}`);
      calls.push([name, ...args, object.strokeStyle, object.fillStyle]);
    };
  } });
  return { c, calls };
}
test("ten schools have distinct contact bursts, separate from casting and release artwork", () => {
  const signatures = new Set();
  for (const sect of Object.values(SECTS)) {
    for (const skill of SKILL_KEYS) {
      const base = { x: 220, y: 120, radius: 36, color: sect.color, sect: sect.id, kind: sect.kit[skill].motif, skill, quality: "simple" };
      const contact = recorder(), cast = recorder(), release = recorder();
      drawSectEffect(contact.c, { ...base, phase: "impact" }, .3);
      drawSectEffect(cast.c, { ...base, phase: "cast" }, .3);
      drawSectEffect(release.c, { ...base, phase: "release" }, .3);
      assert.notDeepEqual(contact.calls, cast.calls, `${sect.name}: cast differs from contact`);
      assert.notDeepEqual(contact.calls, release.calls, `${sect.name}: release differs from contact`);
      assert.ok(contact.calls.length < 160, "bounded contact geometry");
      assert.deepEqual(contact.calls.find(([name]) => name === "translate").slice(1, 3), [220, 120], "contact stays on the actual victim");
      if (skill === "skill1") signatures.add(JSON.stringify(contact.calls));
      for (const p of [-1, 0, 1, 2]) {
        const expired = recorder(); drawSectEffect(expired.c, { ...base, phase: "impact" }, p);
        assert.equal(expired.calls.length, 0, "expired contacts never draw");
      }
    }
  }
  assert.equal(signatures.size, 10);
});
test("projectiles follow the same curved flight from caster to victim in both effect modes", () => {
  for (const sect of Object.values(SECTS)) {
    for (const p of [0, .1, .5, .99, 1]) {
      const { c, calls } = recorder();
      drawSkillFlight(c, { x: 10, y: 40 }, { x: 270, y: 90 }, p, sect.id, "skill1", 900, "simple");
      const position = calls.find(([name]) => name === "translate");
      assert.ok(Math.abs(position[1] - (10 + 260 * p)) < .001);
      assert.ok(Math.abs(position[2] - (40 + 50 * p - Math.sin(p * Math.PI) * 18)) < .001);
      assert.ok(calls.length < 180);
    }
  }
});
