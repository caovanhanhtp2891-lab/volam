import test from "node:test";
import assert from "node:assert/strict";
import {
  WHEEL_PRIZES,
  wheelOdds,
  wheelLuckMultiplier,
  freshLuckyProgress,
  playLuckyEvent,
  normalizeLuckyProgress,
  validLuckyProgress,
  MAX_SILVER,
} from "../src/lucky-events.ts";
import {
  acceptsLoot,
  autoDiscardItems,
  freshLootSettings,
  normalizeLootSettings,
} from "../src/loot-settings.ts";
import {
  BOT_TEMPLATES,
  createRoamingBot,
  scaleRoamingBot,
  STRONG_BOT_CHANCE,
} from "../src/bots.ts";
import { combatPower } from "../src/cultivation.ts";
import { toCore } from "../src/combat-scale.ts";
import {
  currentWorldAnnouncement,
  queueWorldKill,
  worldKillText,
  WORLD_ANNOUNCEMENT_MS,
} from "../src/world-announcements.ts";
const wallet = () => ({
  gold: 1_000_000,
  refiningStones: 0,
  potions: { hp: 0 },
});
const sampleFor = (p, index) => {
  const odds = wheelOdds(p);
  return (
    (odds.slice(0, index).reduce((a, b) => a + b, 0) + odds[index] / 2) / 100
  );
};
const item = (id, extra = {}) => ({
  id,
  slot: "weapon",
  rarity: "Thường",
  level: 10,
  power: 1,
  enhance: 0,
  ...extra,
});

test("strict pickup applies both selected thresholds to sets and all seven qualities", () => {
  for (let min = 0; min < 7; min++)
    for (let quality = 0; quality < 7; quality++) {
      const settings = { ...freshLootSettings(), minRarity: min, minGrade: 2 };
      const rarity = [
        "Thường",
        "Tốt",
        "Hiếm",
        "Cực phẩm",
        "Hoàng Kim",
        "Truyền Thuyết",
        "Thần Thoại",
      ][quality];
      assert.equal(
        acceptsLoot(
          item("set", { rarity, level: 11, setId: "tower", enhance: 10 }),
          settings,
        ),
        quality >= min,
      );
      assert.equal(
        acceptsLoot(item("low", { rarity, level: 10 }), settings),
        false,
      );
    }
});
test("discard may include rare sets only when explicitly selected; worn, upgraded and socketed gear survives", () => {
  const worn = item("worn");
  const bag = [
    worn,
    item("red", { rarity: "Thần Thoại" }),
    item("set", { setId: "tower" }),
    item("upgraded", { enhance: 1 }),
    item("gem", { gems: [{ kind: "ruby", quality: "Thường", level: 1 }] }),
    item("higher", { level: 11 }),
  ];
  const owner = { inventory: [...bag], equipment: { weapon: worn } };
  const settings = {
    ...freshLootSettings(),
    autoDiscard: true,
    maxDiscardRarity: 6,
    maxDiscardGrade: 1,
    weakerOnly: false,
  };
  assert.equal(autoDiscardItems(owner, settings).length, 0);
  assert.deepEqual(
    autoDiscardItems(owner, { ...settings, protectSpecial: false }).map(
      (i) => i.id,
    ),
    ["red", "set"],
  );
  const old = freshLootSettings();
  delete old.protectSpecial;
  assert.equal(normalizeLootSettings(old).protectSpecial, true);
});
test("rare odds are extremely low, sum to 100 and grow to five times at the luck cap", () => {
  for (const misses of [0, 1, 400, 1000, 1500]) {
    const p = { ...freshLuckyProgress(), wheelMisses: misses };
    const odds = wheelOdds(p);
    assert.ok(Math.abs(odds.reduce((a, b) => a + b, 0) - 100) < 1e-10);
    assert.ok(odds.every((n) => n > 0));
    WHEEL_PRIZES.forEach((prize, i) => {
      if (prize.reward)
        assert.equal(odds[i], prize.weight * wheelLuckMultiplier(p));
    });
    assert.ok(odds[10] <= 0.005);
    assert.ok(odds[13] <= 0.0025);
  }
});
test("wheel luck accumulates beyond the history window, survives reload, resets only on rare wins", () => {
  const p = freshLuckyProgress(),
    w = wallet();
  for (let i = 0; i < 1100; i++)
    playLuckyEvent(w, p, "wheel", 0, "", i * 2200, () => 0);
  assert.equal(p.wheelSpins, 1100);
  assert.equal(p.wheelMisses, 1000);
  assert.equal(p.history.length, 30);
  const loaded = normalizeLuckyProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(loaded.wheelMisses, 1000);
  assert.equal(wheelLuckMultiplier(loaded), 5);
  playLuckyEvent(w, loaded, "dice", 10, "xiu", 1100 * 2200, () => 0);
  assert.equal(loaded.wheelMisses, 1000);
  assert.equal(loaded.wheelSpins, 1100);
  const receipt = playLuckyEvent(w, loaded, "wheel", 0, "", 1101 * 2200, () =>
    sampleFor(loaded, 10),
  );
  assert.deepEqual(receipt.reward, { kind: "equipment", rarity: "Thần Thoại" });
  assert.equal(loaded.wheelMisses, 0);
  assert.equal(loaded.wheelSpins, 1101);
  assert.ok(validLuckyProgress(loaded));
});
test("every rare prize has a durable typed receipt, correct weighted range and no second payout on reload", () => {
  for (let index = 8; index < WHEEL_PRIZES.length; index++) {
    const p = freshLuckyProgress(),
      w = wallet();
    const r = playLuckyEvent(w, p, "wheel", 0, "", 1000, () =>
      sampleFor(p, index),
    );
    assert.equal(r.numbers[0], index);
    assert.deepEqual(r.reward, WHEEL_PRIZES[index].reward);
    assert.equal(w.gold, 999950);
    assert.ok(validLuckyProgress(p));
    const loaded = normalizeLuckyProgress(JSON.parse(JSON.stringify(p)));
    assert.deepEqual(loaded.history[0].reward, r.reward);
    assert.equal(playLuckyEvent(w, loaded, "wheel", 0, "", 2000), null);
    assert.equal(w.gold, 999950);
    assert.equal(loaded.wheelSpins, 1);
    const bad = structuredClone(p);
    delete bad.history[0].reward;
    assert.equal(validLuckyProgress(bad), false);
    if (r.reward.kind === "gem") {
      loaded.history[0].reward.gem.level = 1;
      assert.notEqual(r.reward.gem.level, 1);
      assert.equal(validLuckyProgress(loaded), false);
    }
  }
});
test("failed spins preserve luck, money and history; legacy saves migrate and high balances remain playable", () => {
  const old = normalizeLuckyProgress({ nextRound: 1, history: [] });
  assert.equal(old.wheelSpins, 0);
  assert.equal(old.wheelMisses, 0);
  const w = wallet();
  w.gold = MAX_SILVER;
  w.refiningStones = MAX_SILVER;
  assert.ok(playLuckyEvent(w, old, "wheel", 0, "", 0, () => 0));
  const before = structuredClone({ w, old });
  assert.equal(playLuckyEvent(w, old, "wheel", 0, "", 100), null);
  assert.deepEqual({ w, old }, before);
  assert.throws(() => playLuckyEvent(w, old, "wheel", 0, "", 2200, () => NaN));
  assert.deepEqual({ w, old }, before);
  const bad = structuredClone(old);
  bad.wheelMisses = 1001;
  assert.equal(validLuckyProgress(bad), false);
});
test("roaming BOT power follows the actual character at 90–110%, rare strong BOTs at 140–180%", () => {
  const stats = { attack: 30000, defense: 9000, hp: 2000000 };
  const power = combatPower(
    toCore(stats.attack),
    toCore(stats.defense),
    toCore(stats.hp),
    2000,
  );
  for (const profile of BOT_TEMPLATES) {
    for (const values of [
      [STRONG_BOT_CHANCE, 0],
      [0.9, 1],
      [STRONG_BOT_CHANCE - 0.00001, 0],
      [0, 1],
    ]) {
      let i = 0;
      const bot = createRoamingBot(
        profile,
        0,
        50,
        { x: 500, y: 500 },
        stats,
        power,
        () => values[i++],
      );
      const range = bot.strong ? [1.4, 1.8] : [0.9, 1.1];
      assert.ok(
        bot.combatPower >= power * range[0] - 2 &&
          bot.combatPower <= power * range[1] + 2,
      );
      assert.equal(
        bot.combatPower,
        combatPower(toCore(bot.attack), toCore(bot.defense), toCore(bot.maxHp)),
      );
      assert.equal(bot.mounted, true);
      assert.ok(bot.speed > 145);
      bot.hp = bot.maxHp / 2;
      scaleRoamingBot(bot, stats, power * 2);
      assert.ok(Math.abs(bot.hp / bot.maxHp - 0.5) < 0.0001);
      assert.ok(Math.abs(bot.combatPower - power * 2 * bot.powerRatio) < 3);
    }
  }
});
test("world speaker displays ordered, bounded kill messages once with both character names", () => {
  const queue = [];
  const first = queueWorldKill(queue, "Anh Hùng", "Hàn Phong · BOT", 1000);
  const second = queueWorldKill(queue, "Liệt Hỏa · BOT", "Anh Hùng", 1100);
  assert.equal(currentWorldAnnouncement(queue, 1000), first);
  assert.match(worldKillText(first), /Anh Hùng đã tiêu diệt Hàn Phong · BOT/);
  assert.equal(
    currentWorldAnnouncement(queue, 1000 + WORLD_ANNOUNCEMENT_MS),
    second,
  );
  assert.match(worldKillText(second), /Liệt Hỏa · BOT đã tiêu diệt Anh Hùng/);
  assert.equal(
    currentWorldAnnouncement(queue, 1000 + WORLD_ANNOUNCEMENT_MS * 2),
    undefined,
  );
  for (let i = 0; i < 100; i++) queueWorldKill(queue, "A", `B${i}`, 100000);
  assert.equal(queue.length, 6);
  assert.equal(queue[0].victim, "B0");
  assert.equal(queue.at(-1).victim, "B99");
  assert.equal(queue.at(-1).at, 100000 + 5 * WORLD_ANNOUNCEMENT_MS);
});
