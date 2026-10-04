import test from "node:test";
import assert from "node:assert/strict";
import {
  freshLuckyProgress,
  normalizeLuckyProgress,
  validLuckyProgress,
  luckyBusy,
  playLuckyEvent,
  diceOutcome,
  WHEEL_PRIZES,
} from "../src/lucky-events.ts";
import {
  beginSiege,
  settleSiege,
  freshSiegeProgress,
  normalizeSiegeProgress,
  validSiegeProgress,
  siegeBlocked,
  siegeTravelGoal,
} from "../src/siege.ts";
import { TERRITORIES } from "../src/military.ts";
import {
  BOT_TEMPLATES,
  createBot,
  chooseBotTarget,
  moveBot,
  freshBotSettings,
} from "../src/bots.ts";
import { freshMotion } from "../src/combat.ts";
import { actorBodyPose } from "../src/actor-animation.ts";
const wallet = () => ({ gold: 1000, refiningStones: 3, potions: { hp: 2 } });
const rolls = (values) => {
  let i = 0;
  return () => values[i++];
};
test("all 216 dice outcomes have 105 Tai, 105 Xiu and 6 losing triples", () => {
  const counts = { tai: 0, xiu: 0, triple: 0 };
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let c = 1; c <= 6; c++) counts[diceOutcome([a, b, c])]++;
  assert.deepEqual(counts, { tai: 105, xiu: 105, triple: 6 });
  assert.throws(() => diceOutcome([0, 3, 6]));
});
test("bets charge once, return gross payout and survive save/reload without a second claim", () => {
  const w = wallet(),
    p = freshLuckyProgress();
  const r = playLuckyEvent(
    w,
    p,
    "dice",
    50,
    "tai",
    1000,
    rolls([0.9, 0.7, 0.5]),
  );
  assert.equal(r.silver, 100);
  assert.equal(w.gold, 1050);
  assert.equal(r.result, "15 điểm · Tài");
  assert.equal(playLuckyEvent(w, p, "dice", 50, "tai", 1100), null);
  assert.equal(w.gold, 1050);
  const loaded = normalizeLuckyProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(luckyBusy(loaded, 3199), true);
  assert.equal(luckyBusy(loaded, 3200), false);
  assert.equal(w.gold, 1050);
  assert.equal(loaded.history[0].round, 1);
  const triple = playLuckyEvent(w, loaded, "dice", 100, "xiu", 3200, () => 0);
  assert.equal(triple.silver, 0);
  assert.equal(w.gold, 950);
  assert.equal(validLuckyProgress(loaded), true);
});
test("two independent digits pay 90x only on exact ordered matches", () => {
  const w = wallet(),
    p = freshLuckyProgress();
  const r = playLuckyEvent(w, p, "lottery", 10, "07", 0, rolls([0, 0.7]));
  assert.equal(r.result, "07");
  assert.equal(r.silver, 900);
  assert.equal(w.gold, 1890);
  const r2 = playLuckyEvent(w, p, "lottery", 10, "70", 2200, rolls([0, 0.7]));
  assert.equal(r2.silver, 0);
});
test("wheel uses weighted ranges, grants each item type, and converts overflow HP potions", () => {
  assert.equal(
    WHEEL_PRIZES.reduce((a, p) => a + p.weight, 0),
    100,
  );
  let start = 0;
  WHEEL_PRIZES.forEach((prize, i) => {
    const w = wallet(),
      p = freshLuckyProgress();
    const r = playLuckyEvent(w, p, "wheel", 0, "", 0, () => start / 100);
    assert.equal(r.numbers[0], i);
    assert.equal(w.gold, 1000 - 50 + prize.silver);
    assert.equal(w.refiningStones, 3 + prize.stones);
    assert.equal(w.potions.hp, 2 + prize.potions);
    start += prize.weight;
  });
  const w = wallet();
  w.potions.hp = 98;
  const p = freshLuckyProgress();
  const r = playLuckyEvent(w, p, "wheel", 0, "", 0, () => 0.8);
  assert.equal(w.potions.hp, 99);
  assert.equal(r.potions, 1);
  assert.equal(r.silver, 40);
  assert.equal(w.gold, 990);
  assert.equal(
    playLuckyEvent(wallet(), freshLuckyProgress(), "wheel", 0, "", 0, () => 1)
      .numbers[0],
    7,
  );
});
test("bad inputs, insufficient silver and invalid RNG never mutate resources or records", () => {
  for (const [g, stake, choice] of [
    ["dice", 9, "tai"],
    ["dice", 5001, "tai"],
    ["dice", 10.5, "tai"],
    ["dice", 10, "<img>"],
    ["lottery", 10, "7"],
    ["lottery", 10, "ab"],
    ["oops", 10, "00"],
  ]) {
    const w = wallet(),
      p = freshLuckyProgress();
    let rolled = false;
    assert.equal(
      playLuckyEvent(w, p, g, stake, choice, 0, () => {
        rolled = true;
        return 0;
      }),
      null,
    );
    assert.equal(rolled, false);
    assert.deepEqual(w, wallet());
    assert.deepEqual(p, freshLuckyProgress());
  }
  const w = wallet(),
    p = freshLuckyProgress();
  assert.throws(() =>
    playLuckyEvent(w, p, "dice", 10, "tai", 0, rolls([0.2, NaN])),
  );
  assert.deepEqual(w, wallet());
  assert.deepEqual(p, freshLuckyProgress());
  w.gold = 9;
  assert.equal(playLuckyEvent(w, p, "wheel", 50, "", 0), null);
});
test("history has unique decreasing rounds, finite values, bounded wallet and backward-compatible defaults", () => {
  const w = wallet(),
    p = freshLuckyProgress();
  w.gold = 1e9;
  playLuckyEvent(w, p, "lottery", 5000, "00", 0, () => 0);
  assert.equal(w.gold, 1e9);
  for (let i = 1; i < 40; i++)
    playLuckyEvent(w, p, "wheel", 50, "", i * 2200, () => 0);
  assert.equal(p.history.length, 30);
  assert.ok(validLuckyProgress(p));
  assert.deepEqual(normalizeLuckyProgress(), freshLuckyProgress());
  assert.ok(validLuckyProgress(undefined));
  for (const mutate of [
    (p) => p.history.push(p.history[0]),
    (p) => (p.history[0].numbers = [99]),
    (p) => (p.nextRound = NaN),
    (p) => (p.history[0].revealAt = -1),
  ]) {
    const bad = structuredClone(p);
    mutate(bad);
    assert.equal(validLuckyProgress(bad), false);
  }
});
test("every city is available on demand, with exactly one settlement per pending battle", () => {
  for (const city of TERRITORIES) {
    const p = freshSiegeProgress(),
      id = beginSiege(p, city.id, 1000);
    assert.equal(id, 1);
    assert.equal(beginSiege(p, city.id, 1001), null);
    const r = settleSiege(p, id, "victory", 1, 2000, 1000);
    assert.equal(r.silver, 106);
    assert.equal(r.xp, 7000);
    assert.equal(r.stones, 2);
    assert.equal(p.victories, 1);
    assert.equal(settleSiege(p, id, "victory", 1, 2001), null);
    assert.ok(validSiegeProgress(p));
    assert.equal(beginSiege(p, city.id, 2002), 2);
  }
});
test("retreat, timeout, defeat and reload interruption never give a victory reward", () => {
  for (const outcome of ["retreat", "timeout", "defeat", "interrupted"]) {
    const p = freshSiegeProgress();
    beginSiege(p, TERRITORIES[0].id, 0);
    const reloaded = normalizeSiegeProgress(JSON.parse(JSON.stringify(p)));
    const r = settleSiege(reloaded, 1, outcome, 160, 2000);
    assert.deepEqual([r.silver, r.xp, r.stones], [0, 0, 0]);
    assert.equal(reloaded.victories, 0);
    assert.ok(validSiegeProgress(reloaded));
  }
  assert.deepEqual(normalizeSiegeProgress(), freshSiegeProgress());
  const p = freshSiegeProgress();
  assert.equal(beginSiege(p, "unknown", 0), null);
});
test("siege receipts validate high-level XP buffs and reject duplicates or malformed pending state", () => {
  const p = freshSiegeProgress();
  beginSiege(p, TERRITORIES[8].id, 0);
  settleSiege(p, 1, "victory", 160, 2000, 1000);
  assert.ok(validSiegeProgress(p));
  const bad = structuredClone(p);
  bad.pending = { id: 1, city: TERRITORIES[8].id, at: 0 };
  assert.equal(validSiegeProgress(bad), false);
  assert.equal(
    validSiegeProgress({ ...p, history: [p.history[0], p.history[0]] }),
    false,
  );
});
test("bot orders switch targets between objectives, defenders and threats near the player", () => {
  const bot = { x: 0, y: 0 },
    player = { x: 500, y: 500 },
    enemies = [
      { id: "gate", x: 100, y: 0, dead: false, structure: "gate", radius: 50 },
      { id: "guard", x: 30, y: 0, dead: false, radius: 20 },
      { id: "near", x: 500, y: 510, dead: false, radius: 20 },
    ];
  assert.equal(chooseBotTarget(bot, enemies, player, "push").id, "gate");
  assert.equal(chooseBotTarget(bot, enemies, player, "guard").id, "guard");
  assert.equal(chooseBotTarget(bot, enemies, player, "rally").id, "near");
  assert.equal(
    chooseBotTarget(bot, enemies, { x: 1500, y: 1500 }, "rally"),
    undefined,
  );
});
test("bots walk with actual travel, honor obstacles, stun and slow, and have distinct combat roles", () => {
  const stats = { attack: 3000, hp: 30000, defense: 1000 },
    bot = createBot(BOT_TEMPLATES[0], 0, 1, { x: 500, y: 500 }, stats);
  const from = bot.x;
  moveBot(bot, { x: 800, y: 500 }, 0.1, 1000, () => false);
  assert.ok(bot.x > from);
  assert.ok(bot.motion.stride > 0);
  assert.ok(bot.motion.moving > 0);
  bot.stunUntil = 2000;
  const frozen = bot.x;
  moveBot(bot, { x: 800, y: 500 }, 0.1, 1100, () => false);
  assert.equal(bot.x, frozen);
  bot.stunUntil = 0;
  bot.slowUntil = 3000;
  bot.slowFactor = 0.25;
  moveBot(bot, { x: 800, y: 500 }, 0.1, 2100, () => false);
  assert.ok(bot.x - frozen < 4);
  const before = { x: bot.x, y: bot.y };
  moveBot(bot, { x: 800, y: 500 }, 0.1, 3100, () => true);
  assert.deepEqual({ x: bot.x, y: bot.y }, before);
  assert.ok(
    createBot(BOT_TEMPLATES[4], 0, 1, bot, stats).maxHp >
      createBot(BOT_TEMPLATES[1], 0, 1, bot, stats).maxHp,
  );
  assert.deepEqual(freshBotSettings(), { enabled: true, assist: false, pvp: true });
});
test("body actions have windup, release and recovery, return to rest, and keep mounted knees still", () => {
  const motion = {
    ...freshMotion(),
    action: "attack",
    actionAt: 1000,
    actionDuration: 1000,
  };
  const start = actorBodyPose(motion, "thrust", 1000),
    wind = actorBodyPose(motion, "thrust", 1150),
    release = actorBodyPose(motion, "thrust", 1450),
    rest = actorBodyPose(motion, "thrust", 2000);
  assert.equal(start.torsoShift, 0);
  assert.equal(wind.phase, "windup");
  assert.ok(wind.torsoAngle < 0);
  assert.equal(release.phase, "release");
  assert.ok(release.torsoShift > 0);
  assert.equal(rest.torsoAngle, 0);
  assert.equal(rest.crouch, 0);
  assert.ok(
    release.torsoShift > actorBodyPose(motion, "swing", 1450).torsoShift,
  );
  assert.equal(actorBodyPose(motion, "thrust", 1450, true).crouch, 0);
  motion.moving = 1;
  motion.stride = Math.PI / 2;
  assert.ok(actorBodyPose(motion, "thrust", 2000).kneeLift > 0);
});

test("castle walls block passage until the gate falls and bots route through the open doorway", () => {
  assert.ok(siegeBlocked(800, 540, 19, false));
  assert.ok(siegeBlocked(950, 540, 19, true));
  assert.equal(siegeBlocked(950, 540, 19, false), false);
  const stats = { attack: 3000, hp: 30000, defense: 1000 };
  for (const [start, destination] of [
    [
      { x: 600, y: 680 },
      { x: 800, y: 350 },
    ],
    [
      { x: 1300, y: 350 },
      { x: 1100, y: 750 },
    ],
  ]) {
    const bot = createBot(BOT_TEMPLATES[0], 0, 1, start, stats);
    Object.assign(bot, start);
    for (let i = 0; i < 500; i++)
      moveBot(
        bot,
        siegeTravelGoal(bot, destination),
        0.05,
        i * 50,
        (x, y) => siegeBlocked(x, y, 19, false),
        6,
      );
    assert.ok(
      Math.hypot(bot.x - destination.x, bot.y - destination.y) < 10,
      JSON.stringify({ bot: { x: bot.x, y: bot.y }, destination }),
    );
  }
});
