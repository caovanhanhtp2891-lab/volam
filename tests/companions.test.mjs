import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import {
  COMPANIONS,
  COMPANION_IDS,
  companionFrame,
  freshCompanions,
  normalizeCompanions,
  validCompanions,
  isCompanionId,
  equipCompanion,
  companionBonuses,
  settleCompanionVictory,
  captureChance,
} from "../src/companions.ts";
import { BOND_DUNGEONS, isBondDungeon } from "../src/companion-realms.ts";
import { freshDungeonClears } from "../src/progression.ts";
import {
  createCompanionActor,
  moveCompanion,
  companionStrike,
} from "../src/companion-battle.ts";
import {
  realmStyle,
  titleStyle,
  militaryStyle,
  placePrestigeLabels,
} from "../src/prestige-art.ts";
import { cultivationForPower } from "../src/cultivation.ts";
import { TITLES } from "../src/character-progression.ts";

import { emptyStats } from "../src/gear-stats.ts";

test("ten unique companion portraits, increasingly difficult realms and scaled rewards", () => {
  assert.equal(COMPANION_IDS.length, 10);
  assert.equal(new Set(COMPANION_IDS).size, 10);
  assert.ok(
    statSync(new URL("../src/assets/companions.webp", import.meta.url)).size <
      900_000,
  );
  const frames = COMPANION_IDS.map((id) => companionFrame(id, 1983, 793));
  assert.equal(new Set(frames.map((f) => `${f.x}/${f.y}`)).size, 10);
  frames.forEach((f) => {
    assert.equal(f.width, 396.6);
    assert.equal(f.height, 396.5);
    assert.ok(f.x + f.width <= 1983 && f.y + f.height <= 793);
  });
  const realms = Object.values(BOND_DUNGEONS);
  assert.equal(realms[0].minLevel, 5);
  assert.equal(realms.at(-1).minLevel, 155);
  realms.forEach((r, i) => {
    assert.equal(r.companionId, COMPANION_IDS[i]);
    assert.equal(r.minLevel, COMPANIONS[r.companionId].level);
    assert.equal(r.waves.flat().filter((s) => s.companionId).length, 1);
    assert.equal(r.waves.at(-1)[0].companionId, r.companionId);
    assert.equal(r.waves.at(-1)[0].kind, "boss");
    const ids = r.waves.flat().map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    r.waves.flat().forEach((s) => {
      assert.ok(s.x > 0 && s.x < 1900 && s.y > 0 && s.y < 1200);
      assert.ok(s.level <= 160);
    });
    if (i) {
      assert.ok(r.minLevel > realms[i - 1].minLevel);
      assert.ok(r.reward.gold > realms[i - 1].reward.gold);
      assert.ok(r.reward.xp > realms[i - 1].reward.xp);
    }
  });
  assert.equal(realms.at(-1).reward.rarity, "Thần Thoại");
  assert.ok(realms.at(-1).waves.length > realms[0].waves.length);
  assert.equal(Object.keys(freshDungeonClears()).length, 12);
  assert.equal(isCompanionId("__proto__"), false);
  assert.equal(isBondDungeon("__proto__"), false);
});

test("old saves migrate to empty slots; malformed and unowned equipment is rejected", () => {
  assert.equal(validCompanions(undefined), true);
  assert.deepEqual(normalizeCompanions(), freshCompanions());
  for (const p of [
    null,
    [],
    {},
    { ...freshCompanions(), equipped: "linh-lan" },
    { ...freshCompanions(), owned: ["unknown"] },
    { ...freshCompanions(), owned: ["linh-lan", "linh-lan"] },
    { ...freshCompanions(), affinity: { "linh-lan": 1 } },
    { ...freshCompanions(), failures: { "thien-co": 10 } },
    { ...freshCompanions(), victories: { "linh-lan": -1 } },
    { ...freshCompanions(), failures: [] },
  ])
    assert.equal(validCompanions(p), false);
  const p = freshCompanions();
  settleCompanionVictory(p, "linh-lan", () => 0);
  equipCompanion(p, "linh-lan");
  assert.equal(validCompanions(p), true);
  const copy = normalizeCompanions(p);
  copy.owned.length = 0;
  copy.affinity["linh-lan"] = 5;
  copy.victories["linh-lan"] = 500;
  assert.equal(p.owned.length, 1);
  assert.equal(p.affinity["linh-lan"], 1);
  assert.equal(p.victories["linh-lan"], 1);
});

test("only the worn companion adds stats; duplicate captures raise affinity without duplicate ownership", () => {
  const p = freshCompanions();
  assert.equal(equipCompanion(p, "linh-lan"), false);
  assert.deepEqual(companionBonuses(p), emptyStats());
  COMPANION_IDS.forEach((id) => settleCompanionVictory(p, id, () => 0));
  assert.deepEqual(companionBonuses(p), emptyStats());
  assert.equal(equipCompanion(p, "linh-lan"), true);
  assert.deepEqual(companionBonuses(p), COMPANIONS["linh-lan"].bonuses);
  for (let i = 0; i < 8; i++) settleCompanionVictory(p, "linh-lan", () => 0);
  assert.equal(p.owned.length, 10);
  assert.equal(p.affinity["linh-lan"], 5);
  assert.equal(companionBonuses(p).hp, COMPANIONS["linh-lan"].bonuses.hp * 1.6);
  equipCompanion(p, "thien-co");
  assert.deepEqual(companionBonuses(p), COMPANIONS["thien-co"].bonuses);
  equipCompanion(p, null);
  assert.deepEqual(companionBonuses(p), emptyStats());
});

test("capture probability improves after failed wins and guarantees on exactly each advertised pity threshold", () => {
  for (const id of COMPANION_IDS) {
    const p = freshCompanions(),
      def = COMPANIONS[id];
    let calls = 0;
    for (let i = 0; i < def.pity; i++) {
      const chance = captureChance(p, id);
      assert.ok(
        Math.abs(chance - Math.min(0.95, def.chance + i * 0.05)) < 1e-10,
      );
      const r = settleCompanionVictory(p, id, () => {
        calls++;
        return 1;
      });
      assert.equal(r.captured, i === def.pity - 1);
      assert.equal(r.guaranteed, i === def.pity - 1);
      assert.equal(p.victories[id], i + 1);
      assert.equal(validCompanions(p), true);
    }
    assert.equal(calls, def.pity);
    assert.deepEqual(p.owned, [id]);
    assert.equal(p.failures[id], 0);
    assert.equal(captureChance(p, id), def.chance);
  }
  const p = freshCompanions();
  assert.equal(
    settleCompanionVictory(p, "linh-lan", () => 0.7).captured,
    false,
  );
  assert.equal(settleCompanionVictory(p, "linh-lan", () => 0.7).captured, true);
  const before = structuredClone(p);
  for (const value of [NaN, Infinity, -0.1, 1.1])
    assert.equal(
      settleCompanionVictory(p, "linh-lan", () => value),
      null,
    );
  assert.deepEqual(p, before);
});

test("companion follows across the expanded world, respects obstacles and limits a long frame", () => {
  const a = createCompanionActor("linh-lan", { x: 2600, y: 1700 }, "map", 1000);
  const before = { x: a.x, y: a.y };
  moveCompanion(
    a,
    { x: 2800, y: 1800 },
    1,
    1100,
    () => false,
    { width: 3600, height: 2400 },
    200,
  );
  assert.ok(a.x > before.x && a.y > before.y && a.x > 1900 && a.y > 1200);
  assert.ok(Math.hypot(a.x - before.x, a.y - before.y) <= 20.001);
  const blocked = { x: a.x, y: a.y };
  moveCompanion(
    a,
    { x: 3000, y: 2000 },
    0.05,
    1150,
    () => true,
    { width: 3600, height: 2400 },
    200,
  );
  assert.equal(a.x, blocked.x);
  assert.equal(a.y, blocked.y);
});

test("rank-sensitive labels grow 25% and stay attached above the hero with clear row gaps", () => {
  const cultivation = cultivationForPower(19.9e9),
    title = TITLES.find((t) => t.id === "grandmaster");
  assert.equal(
    realmStyle(cultivation).fontSize,
    (11 + cultivation.rank * 0.1) * 1.25,
  );
  assert.equal(titleStyle(title).fontSize, (11 + title.rarity * 0.4) * 1.25);
  assert.equal(militaryStyle("hoang-de").fontSize, (11.5 + 6 * 0.4) * 1.25);
  const labels = [
    { kind: "military", text: "Hoàng Đế", style: militaryStyle("hoang-de") },
    { kind: "title", text: title.name, style: titleStyle(title) },
    { kind: "realm", text: cultivation.label, style: realmStyle(cultivation) },
  ];
  for (const bottom of [0, 90, 400]) {
    const boxes = placePrestigeLabels(labels, [120, 180, 160], 200, bottom);
    boxes
      .slice(1)
      .forEach((box, i) =>
        assert.ok(
          Math.abs(
            box.y -
              box.label.style.height / 2 -
              boxes[i].y -
              boxes[i].label.style.height / 2 -
              4,
          ) < 1e-9,
        ),
      );
    assert.ok(
      Math.abs(boxes.at(-1).y + boxes.at(-1).label.style.height / 2 - bottom) <
        1e-9,
    );
  }
});

test("companion impact uses its element and normalizes status ticks to its own attack units", () => {
  const raw = 12000,
    owner = 100000000;
  const neutral = companionStrike(raw, owner, 0, 100, "hoa");
  const strong = companionStrike(raw, owner, 0, 100, "hoa", "kim");
  const weak = companionStrike(raw, owner, 0, 100, "hoa", "thuy");
  assert.ok(strong.damage > neutral.damage && weak.damage < neutral.damage);
  assert.equal(neutral.statusMultiplier * owner, raw);
  assert.ok(
    neutral.statusMultiplier < 0.001,
    "combat HP must never be passed as an attack multiplier",
  );
});
