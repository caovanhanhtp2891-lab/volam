import test from "node:test";
import assert from "node:assert/strict";
import {
  RARITIES,
  ENHANCEMENT_CAPS,
  enhancementCap,
  enhancementInfo,
  enhancementMilestones,
  attemptEnhancement,
  gearStats,
  loadoutStats,
  emptyStats,
  discardCandidates,
  gearScore,
  equipBestGear,
} from "../src/equipment.ts";
import {
  GEM_KINDS,
  GEM_COUNT_CAP,
  gemKey,
  gemFromKey,
  gemStats,
  addGems,
  setSocket,
  socketCount,
  socketStats,
  validSockets,
  validGemBag,
  validGem,
  normalizeGemBag,
} from "../src/gems.ts";
import {
  GEM_REALMS,
  GEM_REALM_IDS,
  gemRealmReward,
  isGemRealm,
  canStoreGemReward,
} from "../src/gem-realms.ts";
import {
  PASSIVES,
  MAX_PASSIVE_RANK,
  validPassives,
  passivesFor,
  passiveBonuses,
  allocatePassive,
} from "../src/passives.ts";
import { SECTS } from "../src/sects.ts";
import { impactFragments } from "../src/skill-radiance.ts";
const piece = (changes = {}) => ({
  id: "gem-test",
  slot: "weapon",
  power: 100,
  rarity: "Thường",
  level: 160,
  enhance: 0,
  bonuses: { attack: 10 },
  balanceVersion: 2,
  ...changes,
});
const red = { kind: "ruby", level: 10, quality: "Thần Thoại" };
const blue = { kind: "sapphire", level: 3, quality: "Hiếm" };

test("rarity and equipment grade jointly cap enhancement, while every cap can be reached without overcharging", () => {
  assert.deepEqual(ENHANCEMENT_CAPS, [10, 20, 30, 40, 60, 80, 100]);
  for (let tier = 0; tier < 7; tier++)
    for (const level of [1, 10, 11, 45, 99, 160]) {
      const item = piece({ rarity: RARITIES[tier], level }),
        cap = Math.min(ENHANCEMENT_CAPS[tier], Math.ceil(level / 10) * 10);
      assert.equal(enhancementCap(item), cap);
      const owner = { gold: 1e9, refiningStones: 10000 };
      for (let n = 0; n < cap; n++) {
        const before = { ...owner },
          info = enhancementInfo(item);
        assert.equal(
          attemptEnhancement(item, owner, () => 0),
          "success",
        );
        assert.equal(item.enhance, n + 1);
        assert.equal(owner.gold, before.gold - info.cost);
        assert.equal(owner.refiningStones, before.refiningStones - info.stones);
      }
      const before = JSON.stringify([item, owner]);
      assert.equal(
        attemptEnhancement(item, owner, () => {
          throw Error("capped must not roll");
        }),
        "capped",
      );
      assert.equal(JSON.stringify([item, owner]), before);
    }
});

test("old low-grade +100 gear retains its enhancement, all ten sockets and earned stats, but cannot upgrade further", () => {
  const item = piece({ level: 1, enhance: 100 }),
    owner = { gold: 999999, refiningStones: 10 },
    before = JSON.stringify(item);
  assert.ok(enhancementInfo(item).legacy);
  assert.equal(enhancementInfo(item).cap, 10);
  assert.equal(socketCount(item), 10);
  assert.equal(enhancementMilestones(item).filter((l) => l.active).length, 10);
  assert.ok(
    gearStats(item).attack > gearStats({ ...item, enhance: 10 }).attack,
  );
  assert.equal(
    attemptEnhancement(item, owner, () => 0),
    "capped",
  );
  assert.equal(JSON.stringify(item), before);
});

test("enhancement thresholds stay sealed until the exact milestone, including red gear with every rolled stat", () => {
  for (const rarity of RARITIES) {
    const item = piece({
      rarity,
      bonuses: Object.fromEntries(Object.keys(emptyStats()).map((k) => [k, 1])),
    });
    const lines = enhancementMilestones(item);
    assert.equal(lines.length, enhancementCap(item) / 10);
    for (const line of lines) {
      item.enhance = line.threshold - 1;
      assert.equal(
        enhancementMilestones(item).find((l) => l.threshold === line.threshold)
          .active,
        false,
      );
      const before = gearStats(item);
      item.enhance++;
      assert.equal(
        enhancementMilestones(item).find((l) => l.threshold === line.threshold)
          .active,
        true,
      );
      assert.ok(gearStats(item)[line.key] >= before[line.key] + line.value);
      assert.deepEqual(
        gearStats(JSON.parse(JSON.stringify(item))),
        gearStats(item),
      );
    }
  }
});

test("failure before a socket milestone cannot open its slot or activate its line", () => {
  const item = piece({ rarity: "Thần Thoại", enhance: 9 }),
    owner = { gold: 1e9, refiningStones: 50 },
    stats = gearStats(item);
  assert.equal(
    attemptEnhancement(item, owner, () => 0.999),
    "failed",
  );
  assert.equal(item.enhance, 9);
  assert.equal(socketCount(item), 0);
  assert.ok(enhancementMilestones(item).every((l) => !l.active));
  assert.deepEqual(gearStats(item), stats);
  assert.equal(
    attemptEnhancement(item, owner, () => 0),
    "success",
  );
  assert.equal(socketCount(item), 1);
});

test("gem keys round-trip all 350 combinations and malformed saves cannot forge locked sockets or unknown gems", () => {
  for (const kind of GEM_KINDS)
    for (const quality of RARITIES)
      for (let level = 1; level <= 10; level++) {
        const gem = { kind, quality, level };
        assert.deepEqual(gemFromKey(gemKey(gem)), gem);
        assert.ok(validGem(gem));
      }
  assert.ok(validGemBag(undefined));
  assert.deepEqual(normalizeGemBag(undefined), {});
  assert.ok(validSockets({ enhance: 9 }));
  for (const bag of [
    null,
    [],
    { "ruby:01:0": 1 },
    { "ruby:1:0": -1 },
    { "ruby:1:0": 1.5 },
    { "ruby:1:0": GEM_COUNT_CAP + 1 },
    JSON.parse('{"__proto__":1}'),
  ])
    assert.equal(validGemBag(bag), false);
  for (const gems of [[red], [null], [false]])
    assert.equal(validSockets({ enhance: 9, gems }), false);
  assert.equal(validSockets({ enhance: 10, gems: [red, null] }), false);
  assert.equal(
    validSockets({ enhance: 10, gems: [{ ...red, level: 11 }] }),
    false,
  );
  assert.equal(validSockets({ enhance: 10, gems: [red] }), true);
});

test("each +10 unlocks exactly one slot, and insert, replace and remove conserve both gems and player resources", () => {
  const item = piece({ enhance: 9 }),
    bag = {};
  assert.equal(addGems(bag, [red, red, blue]), true);
  const total = () =>
    Object.values(bag).reduce((a, b) => a + b, 0) +
    (item.gems ?? []).filter(Boolean).length;
  const before = JSON.stringify([item, bag]);
  assert.equal(setSocket(item, bag, 0, gemKey(red)), false);
  assert.equal(JSON.stringify([item, bag]), before);
  item.enhance = 10;
  assert.equal(setSocket(item, bag, 0, gemKey(red)), true);
  assert.equal(total(), 3);
  assert.equal(bag[gemKey(red)], 1);
  assert.equal(setSocket(item, bag, 0, gemKey(red)), false);
  assert.equal(total(), 3);
  assert.equal(setSocket(item, bag, 0, gemKey(blue)), true);
  assert.equal(total(), 3);
  assert.equal(bag[gemKey(red)], 2);
  assert.equal(bag[gemKey(blue)], undefined);
  assert.equal(setSocket(item, bag, 0, null), true);
  assert.equal(total(), 3);
  assert.deepEqual(socketStats(item), emptyStats());
  for (let rank = 0; rank <= 100; rank++)
    assert.equal(socketCount({ enhance: rank }), Math.floor(rank / 10));
  assert.equal(setSocket(item, bag, 1, gemKey(red)), false);
  item.enhance = 20;
  assert.equal(setSocket(item, bag, 1, gemKey(red)), true);
  assert.ok(validSockets(item));
});

test("gem insertion cannot consume an absent gem or destroy the old gem when its stack is full", () => {
  const item = piece({ enhance: 10, gems: [red] }),
    bag = { [gemKey(red)]: GEM_COUNT_CAP, [gemKey(blue)]: 1 },
    before = JSON.stringify([item, bag]);
  assert.equal(setSocket(item, bag, 0, gemKey(blue)), false);
  assert.equal(setSocket(item, bag, 0, null), false);
  assert.equal(JSON.stringify([item, bag]), before);
  assert.equal(addGems(bag, [red, blue]), false);
  assert.equal(JSON.stringify([item, bag]), before);
  assert.equal(setSocket(item, {}, 0, gemKey(blue)), false);
  assert.equal(setSocket(item, bag, 99, gemKey(blue)), false);
});

test("gem level and quality improve all contributed stats; enhanced gear adds gem bonuses once without multiplying them", () => {
  for (const kind of GEM_KINDS) {
    for (let tier = 1; tier < 7; tier++) {
      const before = gemStats({ kind, quality: RARITIES[tier - 1], level: 5 }),
        after = gemStats({ kind, quality: RARITIES[tier], level: 5 });
      for (const key of Object.keys(before))
        if (before[key]) assert.ok(after[key] > before[key]);
    }
    assert.ok(
      Object.keys(gemStats({ kind, quality: "Thường", level: 10 })).some(
        (k) =>
          gemStats({ kind, quality: "Thường", level: 10 })[k] >
          gemStats({ kind, quality: "Thường", level: 1 })[k],
      ),
    );
  }
  for (const enhance of [10, 50, 100]) {
    const base = piece({ enhance }),
      socketed = { ...base, gems: [red] },
      stats = gearStats(socketed),
      noGem = gearStats(base);
    for (const key of Object.keys(stats))
      assert.equal(
        Math.round((stats[key] - noGem[key]) * 100),
        Math.round(gemStats(red)[key] * 100),
      );
    assert.deepEqual(loadoutStats([socketed]), stats);
    assert.deepEqual(gearStats(JSON.parse(JSON.stringify(socketed))), stats);
    assert.ok(gearScore(socketed) > gearScore(base));
  }
});

test("best-gear decisions include socketed gems and automatic disposal protects them", () => {
  const weak = piece({ id: "plain", enhance: 10 }),
    strong = piece({ id: "socketed", enhance: 10, gems: [red] });
  const owner = { inventory: [strong], equipment: { weapon: weak } };
  assert.equal(equipBestGear(owner), 1);
  assert.equal(owner.equipment.weapon.id, "socketed");
  assert.deepEqual(
    discardCandidates(
      { inventory: [piece({ enhance: 0, gems: [red] })], equipment: {} },
      { maxRarity: 6, maxLevel: 160, weakerOnly: false },
    ),
    [],
  );
});

test("seven playable gem maps increase level, reward count and guaranteed quality with real multiwave guardians", () => {
  assert.equal(GEM_REALM_IDS.length, 7);
  let previous = 0;
  for (const id of GEM_REALM_IDS) {
    const d = GEM_REALMS[id];
    assert.equal(isGemRealm(id), true);
    assert.ok(d.minLevel > previous);
    previous = d.minLevel;
    assert.ok(d.waves.length >= 2);
    assert.ok(d.waves.at(-1).some((e) => e.kind === "boss"));
    for (const value of [0, 0.2, 0.8, 1]) {
      const gems = gemRealmReward(id, () => value);
      assert.equal(gems.length, d.gemCount);
      assert.ok(gems.every(validGem));
      assert.equal(gems[0].quality, RARITIES[d.qualityTier]);
      assert.ok(
        gems.every(
          (g) =>
            g.level >= d.gemLevels[0] &&
            g.level <= d.gemLevels[1] &&
            RARITIES.indexOf(g.quality) <= d.qualityTier,
        ),
      );
    }
  }
  assert.equal(isGemRealm("__proto__"), false);
});

test("each of ten schools receives eight common passives and one distinct school passive", () => {
  const ids = new Set();
  for (const school of Object.keys(SECTS)) {
    const defs = passivesFor(school);
    assert.equal(defs.length, 9);
    assert.equal(defs.filter((d) => !d.school).length, 8);
    const own = defs.find((d) => d.school);
    assert.ok(own);
    ids.add(own.id);
    const ranks = Object.fromEntries(PASSIVES.map((d) => [d.id, 1])),
      ownStats = passiveBonuses(ranks, school),
      onlyMine = passiveBonuses(
        Object.fromEntries(defs.map((d) => [d.id, 1])),
        school,
      );
    assert.deepEqual(ownStats, onlyMine);
  }
  assert.equal(ids.size, 10);
  assert.ok(validPassives(undefined));
  assert.equal(validPassives(JSON.parse('{"__proto__":3}')), false);
  assert.equal(validPassives({ force: 11 }), false);
});

test("learning and refunding passives use exactly one earned skill point, respect level/rank gates and remain effective after rebirth", () => {
  const owner = { level: 1, skillPoints: 20, passiveRanks: {} };
  assert.equal(allocatePassive(owner, "cai-bang", "force"), false);
  assert.equal(allocatePassive(owner, "cai-bang", "gaibang"), false);
  owner.level = 15;
  assert.equal(allocatePassive(owner, "cai-bang", "shaolin"), false);
  for (let i = 0; i < MAX_PASSIVE_RANK; i++)
    assert.equal(allocatePassive(owner, "cai-bang", "force"), true);
  assert.equal(owner.skillPoints, 10);
  assert.equal(passiveBonuses(owner.passiveRanks, "cai-bang").attack, 120);
  const before = JSON.stringify(owner);
  assert.equal(allocatePassive(owner, "cai-bang", "force"), false);
  assert.equal(JSON.stringify(owner), before);
  owner.level = 1;
  assert.equal(passiveBonuses(owner.passiveRanks, "cai-bang").attack, 120);
  for (let i = 0; i < 10; i++)
    assert.equal(allocatePassive(owner, "cai-bang", "force", true), true);
  assert.equal(owner.skillPoints, 20);
  assert.equal(passiveBonuses(owner.passiveRanks, "cai-bang").attack, 0);
  assert.equal(allocatePassive(owner, "cai-bang", "force", true), false);
});

test("impact fragments move, fade and stay bounded, with fewer fragments at reduced quality", () => {
  for (const p of [0, 0.2, 0.5, 0.9, 1])
    for (const radius of [1, 40, 9999]) {
      const full = impactFragments(p, radius),
        simple = impactFragments(p, radius, true);
      assert.ok(simple.length < full.length);
      for (const f of full)
        assert.ok(
          Number.isFinite(f.x) &&
            Math.abs(f.x) <= 300 &&
            Math.abs(f.y) <= 300 &&
            f.alpha >= 0 &&
            f.alpha <= 1,
        );
    }
  assert.notDeepEqual(impactFragments(0.2, 40), impactFragments(0.6, 40));
  assert.ok(impactFragments(1, 40).every((f) => f.alpha === 0));
});

test("gem realms reserve reward capacity before entry and never strand a winner at a stack limit", () => {
  const low = { kind: "ruby", level: 1, quality: "Thường" },
    lowKey = gemKey(low);
  assert.equal(canStoreGemReward({}, "gem-jade"), true);
  assert.equal(
    canStoreGemReward({ [lowKey]: GEM_COUNT_CAP }, "gem-jade"),
    false,
  );
  assert.equal(
    canStoreGemReward({ [lowKey]: GEM_COUNT_CAP - 2 }, "gem-jade"),
    false,
  );
  assert.equal(
    canStoreGemReward({ [lowKey]: GEM_COUNT_CAP - 3 }, "gem-jade"),
    true,
  );
  assert.equal(
    canStoreGemReward({ [gemKey(red)]: GEM_COUNT_CAP }, "gem-jade"),
    true,
  );
  const bag = { [lowKey]: GEM_COUNT_CAP - 3 };
  assert.equal(
    addGems(
      bag,
      gemRealmReward("gem-jade", () => 0),
    ),
    true,
  );
  assert.equal(bag[lowKey], GEM_COUNT_CAP);
});
