import test from "node:test";
import assert from "node:assert/strict";
import { goldenWindows, goldenStatus, claimGoldenKill, normalizeGoldenClears, countdown } from "../src/golden-boss.ts";
const time = value => Date.parse(`2026-10-03T${value}+07:00`);
test("all three boss windows use Vietnam time, independent of client timezone", () => {
  const windows = goldenWindows(time("00:00:00"));
  assert.deepEqual(windows.map(w => new Date(w.startsAt).toISOString()), ["2026-10-03T05:00:00.000Z", "2026-10-03T12:00:00.000Z", "2026-10-03T14:00:00.000Z"]);
  assert.equal(goldenWindows(Date.parse("2026-10-02T17:00:00Z"))[0].id, "2026-10-03-12");
});
test("boss appears at the exact start, expires at 20 minutes and tomorrow is selected after last window", () => {
  for (const hour of [12, 19, 21]) {
    assert.equal(goldenStatus(time(`${hour}:00:00`) - 1).active, null);
    assert.ok(goldenStatus(time(`${hour}:00:00`)).active);
    assert.ok(goldenStatus(time(`${hour}:19:59`)).active);
    assert.equal(goldenStatus(time(`${hour}:20:00`)).active, null);
  }
  assert.equal(goldenStatus(time("23:59:59")).next.id, "2026-10-04-12");
});
test("kill claim is once per character/window; repeated calls, reloads and out-of-window claims cannot reward", () => {
  const window = goldenWindows(time("12:01:00"))[0], cleared = [];
  assert.equal(claimGoldenKill(cleared, window, window.startsAt - 1), false);
  assert.equal(claimGoldenKill(cleared, window, window.startsAt), true);
  assert.equal(claimGoldenKill(cleared, window, window.startsAt + 1), false);
  assert.equal(claimGoldenKill(JSON.parse(JSON.stringify(cleared)), window, window.startsAt + 1), false);
  assert.equal(claimGoldenKill([], window, window.endsAt), false);
  assert.equal(goldenStatus(window.startsAt, cleared).defeated, true);
});
test("old saves start with no clears, history is bounded and countdown cannot become negative", () => {
  assert.deepEqual(normalizeGoldenClears(undefined), []);
  assert.deepEqual(normalizeGoldenClears(["2026-10-03-12", "2026-10-03-12", "wrong", 0]), ["2026-10-03-12"]);
  const history = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}-12`);
  assert.equal(normalizeGoldenClears(history).length, 24);
  assert.equal(countdown(-1000), "0:00");
  assert.equal(countdown(1199000), "19:59");
});
