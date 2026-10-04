import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import {
  SPECIES,
  MONSTERS,
  REGION_FAUNA,
  monsterFrame,
  monsterForStage,
} from "../src/bestiary.ts";
import { REGIONS, normalizeIdle } from "../src/idle.ts";
import {
  EXPLORATION_WIDTH,
  EXPLORATION_HEIGHT,
  explorationZones,
  explorationSpawns,
  zoneAt,
  canExplore,
  freshExploration,
  validExploration,
  normalizeExploration,
} from "../src/exploration.ts";
import {
  DUNGEONS,
  DUNGEON_IDS,
  canEnterDungeon,
  freshDungeonClears,
  normalizeDungeonClears,
  dungeonDropRarity,
  BAG_CAPACITY,
  storeRewardItems,
} from "../src/progression.ts";
import { RARITIES, rollEquipmentRarity } from "../src/equipment.ts";
import { createBot, moveBot, BOT_TEMPLATES } from "../src/bots.ts";
import {
  createCampfire,
  validCampfires,
  validWildElite,
  validHuntArea,
  restoreCampfires,
  tickCampfires,
} from "../src/elite-hunt.ts";

test("32 readable atlas cells fit exactly and the compressed asset stays under 1 MB", () => {
  assert.equal(SPECIES.length, 32);
  assert.equal(new Set(SPECIES).size, 32);
  assert.ok(
    statSync(new URL("../src/assets/monsters.webp", import.meta.url)).size <
      1_000_000,
  );
  const frames = SPECIES.map((id) => monsterFrame(id, 1774, 887));
  assert.equal(new Set(frames.map((f) => `${f.x}/${f.y}`)).size, 32);
  for (const f of frames) {
    assert.equal(f.width, 221.75);
    assert.equal(f.height, 221.75);
    assert.ok(
      f.x >= 0 && f.y >= 0 && f.x + f.width <= 1774 && f.y + f.height <= 887,
    );
  }
  assert.equal(Object.values(MONSTERS).filter((m) => m.boss).length, 8);
});

test("all species occur in real maps, with six ordinary species and a distinct boss per region", () => {
  assert.equal(REGION_FAUNA.length, REGIONS.length);
  const seen = new Set();
  for (const [r, fauna] of REGION_FAUNA.entries()) {
    assert.equal(new Set(fauna.species).size, 6);
    for (const id of fauna.species) {
      assert.equal(MONSTERS[id].boss, false);
      seen.add(id);
    }
    assert.equal(MONSTERS[fauna.boss].boss, true);
    seen.add(fauna.boss);
    assert.equal(monsterForStage(r, 20, true), fauna.boss);
    assert.equal(
      new Set(Array.from({ length: 6 }, (_, i) => monsterForStage(r, i, false)))
        .size,
      6,
    );
  }
  assert.deepEqual([...seen].sort(), [...SPECIES].sort());
});

test("64 named zones and 448 stable spawns fit the expanded world, with progression inside each map", () => {
  const ids = new Set(),
    names = new Set();
  assert.ok(EXPLORATION_WIDTH > 1900 && EXPLORATION_HEIGHT > 1200);
  for (let r = 0; r < 16; r++) {
    const zones = explorationZones(r),
      spawns = explorationSpawns(r);
    assert.equal(zones.length, 4);
    assert.equal(spawns.length, 28);
    assert.deepEqual(spawns, explorationSpawns(r));
    assert.equal(spawns.filter((e) => e.kind === "boss").length, 1);
    assert.equal(spawns.filter((e) => e.kind === "elite").length, 3);
    assert.ok(zones[3].minLevel > zones[0].maxLevel);
    for (const z of zones) {
      names.add(`${r}/${z.name}`);
      assert.equal(zoneAt(r, z).index, z.index);
      assert.ok(spawns.filter((e) => e.zone === z.index).length >= 6);
    }
    for (const e of spawns) {
      assert.equal(ids.has(e.id), false);
      ids.add(e.id);
      assert.ok(
        e.x > 100 &&
          e.x < EXPLORATION_WIDTH - 100 &&
          e.y > 100 &&
          e.y < EXPLORATION_HEIGHT - 100,
      );
      assert.ok(
        e.level >= zones[e.zone].minLevel && e.level <= zones[e.zone].maxLevel,
      );
      assert.ok(MONSTERS[e.species]);
    }
  }
  assert.equal(ids.size, 448);
  assert.equal(names.size, 64);
});

test("level unlocks exploration without requiring previous maps; rebirth retains unlocked maps", () => {
  const p = normalizeIdle({ maxStage: 1 });
  for (let r = 0; r < 16; r++) {
    assert.equal(canExplore(r, r * 10 + 1, p), true);
    if (r > 0) assert.equal(canExplore(r, r * 10, p), false);
    assert.equal(
      canExplore(r, 1, normalizeIdle({ maxStage: r * 10 + 1 })),
      true,
    );
  }
  for (const r of [-1, 16, NaN, 1.5])
    assert.equal(canExplore(r, 160, p), false);
});

test("old exploration saves default safely, while active progress survives a deep copy", () => {
  assert.equal(validExploration(undefined), true);
  assert.deepEqual(normalizeExploration(), freshExploration());
  const p = { ...freshExploration(), active: true, region: 15, zone: 3 };
  const copied = normalizeExploration(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(copied, p);
  assert.notEqual(copied, p);
  for (const invalid of [
    null,
    {},
    { ...p, region: 16 },
    { ...p, region: -1 },
    { ...p, zone: 4 },
    { ...p, active: "true" },
    { ...p, returnTown: 1 },
  ])
    assert.equal(validExploration(invalid), false);
});

test("12 dungeons have increasing completion rewards and actual level gates", () => {
  assert.equal(DUNGEON_IDS.length, 12);
  let previous = null;
  for (const id of DUNGEON_IDS) {
    const d = DUNGEONS[id];
    assert.equal(canEnterDungeon(id, d.minLevel - 1, { tomb: 1 }), false);
    assert.equal(canEnterDungeon(id, d.minLevel, { tomb: 1 }), true);
    assert.ok(d.reward.itemLevel >= d.minLevel);
    if (previous) {
      for (const field of ["xp", "gold", "stones", "tokens"])
        assert.ok(d.reward[field] > previous.reward[field]);
      assert.ok(d.reward.itemCount >= previous.reward.itemCount);
      assert.ok(
        RARITIES.indexOf(d.reward.rarity) >=
          RARITIES.indexOf(previous.reward.rarity),
      );
      assert.ok(d.waves.length >= previous.waves.length);
    }
    previous = d;
  }
  assert.equal(DUNGEONS.frost.reward.rarity, "Thần Thoại");
  assert.equal(DUNGEONS.frost.reward.itemCount, 4);
  assert.equal(DUNGEONS.celestial.reward.itemCount, 5);
});

test("new dungeons combine distinct species, guards, elites, multiple bosses and more enemies", () => {
  const ids = new Set();
  for (const id of DUNGEON_IDS.slice(2)) {
    const d = DUNGEONS[id],
      spawns = d.waves.flat(),
      bosses = spawns.filter((e) => e.kind === "boss");
    assert.ok(spawns.length > DUNGEONS.bamboo.waves.flat().length);
    assert.ok(d.waves.length >= 3 && d.waves.length <= 6);
    assert.ok(bosses.length >= 2 && bosses.length <= 3);
    assert.ok(new Set(spawns.map((e) => e.species)).size >= 5);
    for (const wave of d.waves) {
      assert.ok(wave.length >= 3);
      if (wave.some((e) => e.kind === "boss"))
        assert.ok(wave.some((e) => e.kind === "normal"));
      for (const e of wave) {
        assert.equal(ids.has(e.id), false);
        ids.add(e.id);
        assert.ok(e.level <= 160 && e.level >= d.minLevel);
        assert.ok(e.x >= 160 && e.x <= 1610 && e.y >= 500 && e.y <= 970);
        assert.equal(MONSTERS[e.species].boss, e.kind === "boss");
      }
    }
  }
  assert.equal(
    DUNGEONS.celestial.waves.filter((w) => w.some((e) => e.kind === "boss"))
      .length,
    3,
  );
});

test("dungeon quality floors improve with difficulty and preserve luckier rarity rolls", () => {
  const expected = {
    wolfden: "Cực phẩm",
    forest: "Hoàng Kim",
    inferno: "Truyền Thuyết",
    frost: "Thần Thoại",
  };
  for (const [id, rarity] of Object.entries(expected)) {
    assert.equal(
      dungeonDropRarity(id, "boss", DUNGEONS[id].minLevel, () => 0.999),
      rarity,
    );
  }
  assert.equal(
    dungeonDropRarity("forest", "boss", 160, () => 0),
    "Thần Thoại",
  );
  assert.equal(
    dungeonDropRarity("celestial", "elite", 160, () => 0.999),
    "Truyền Thuyết",
  );
  assert.equal(
    dungeonDropRarity("celestial", "normal", 160, () => 0.999),
    "Hiếm",
  );
  for (const kind of ["normal", "elite", "boss"])
    for (const sample of [0, 0.004, 0.03, 0.1, 0.9]) {
      assert.ok(
        RARITIES.indexOf(dungeonDropRarity("tomb", kind, 160, () => sample)) >=
          RARITIES.indexOf(rollEquipmentRarity(160, kind, () => sample)),
      );
    }
});

test("old tomb and bamboo completions are retained and extra records initialize to zero", () => {
  const old = { tomb: 8, bamboo: 3 },
    p = normalizeDungeonClears(old);
  assert.equal(p.tomb, 8);
  assert.equal(p.bamboo, 3);
  assert.equal(Object.keys(p).length, 12);
  assert.ok(DUNGEON_IDS.slice(2).every((id) => p[id] === 0));
  assert.deepEqual(normalizeDungeonClears(), freshDungeonClears());
  assert.equal(normalizeDungeonClears(undefined, 5).tomb, 1);
  assert.equal(
    normalizeDungeonClears({ frost: 2.5, abyss: Infinity, celestial: -2 })
      .frost,
    2,
  );
  assert.equal(
    normalizeDungeonClears({ frost: 2.5, abyss: Infinity, celestial: -2 })
      .abyss,
    0,
  );
  assert.equal(
    normalizeDungeonClears({ frost: 2.5, abyss: Infinity, celestial: -2 })
      .celestial,
    0,
  );
  assert.deepEqual(old, { tomb: 8, bamboo: 3 });
});

test("five valuable completion items all survive a full bag and save round trip", () => {
  const owner = {
    inventory: Array(BAG_CAPACITY).fill("old"),
    pendingItems: [],
  };
  const gear = Array.from(
    { length: DUNGEONS.celestial.reward.itemCount },
    (_, i) => ({ id: i, rarity: "Thần Thoại" }),
  );
  storeRewardItems(owner, gear);
  assert.deepEqual(JSON.parse(JSON.stringify(owner)).pendingItems, gear);
  assert.equal(owner.inventory.length, BAG_CAPACITY);
});

test("bots follow into the expanded world while default maps keep their existing bounds", () => {
  const stats = { attack: 3000, hp: 30000, defense: 1000 },
    bot = createBot(BOT_TEMPLATES[0], 0, 1, { x: 2600, y: 1700 }, stats);
  moveBot(bot, { x: 3200, y: 2100 }, 1, 1000, () => false, 12, {
    width: EXPLORATION_WIDTH,
    height: EXPLORATION_HEIGHT,
  });
  assert.ok(bot.x > 2600 && bot.y > 1700);
  const old = createBot(BOT_TEMPLATES[0], 0, 1, { x: 1860, y: 1160 }, stats);
  moveBot(old, { x: 3200, y: 2100 }, 1, 1000, () => false);
  assert.ok(old.x <= 1870 && old.y <= 1170);
});

test("campfire and wild elite saves accept far exploration coordinates without widening legacy maps", () => {
  const fire = createCampfire("far-fire", "explore-15", 2700, 1750, 160, 1000);
  assert.equal(validCampfires([fire]), true);
  assert.equal(validCampfires([{ ...fire, area: "world" }]), false);
  assert.equal(validCampfires([{ ...fire, x: 3600 }]), false);
  assert.equal(validCampfires([{ ...fire, area: "explore-16" }]), false);
  const elite = {
    id: "wild-elite-123",
    name: "Băng Lang",
    area: "explore-15",
    x: 2700,
    y: 1750,
    level: 155,
    hp: 3000,
    monsterId: "icewolf",
  };
  assert.equal(validWildElite(elite), true);
  assert.equal(validWildElite({ ...elite, monsterId: "invalid" }), false);
  assert.equal(validWildElite({ ...elite, area: "world" }), false);
  const restored = restoreCampfires([fire], 2000);
  assert.equal(tickCampfires(restored, "explore-15", fire, 5000), 326);
  for (const id of DUNGEON_IDS)
    assert.equal(validHuntArea(`dungeon-${id}`), true);
});
