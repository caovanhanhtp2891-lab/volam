import test from "node:test";
import assert from "node:assert/strict";
import {
  parseChatInput,
  appendChat,
  MAX_CHAT_HISTORY,
  validChatMessage,
} from "../src/chat.ts";
import {
  MAX_LEVEL,
  MAX_GEAR_GRADE,
  normalizeExperienceBuff,
} from "../src/level-limits.ts";
import { normalizeIdle } from "../src/idle.ts";
import {
  normalizePreferences,
  normalizeJourney,
  applyExperience,
  unlockTitles,
  rebirthCharacter,
} from "../src/character-progression.ts";
import {
  freshLootSettings,
  validLootSettings,
  acceptsLoot,
} from "../src/loot-settings.ts";
import {
  freshSiegeProgress,
  beginSiege,
  settleSiege,
  validSiegeProgress,
} from "../src/siege.ts";

test("chat XP command accepts integers 1–1000 and rejects malformed commands without mutating anything", () => {
  for (const n of [1, 2, 7, 999, 1000])
    assert.deepEqual(parseChatInput(` /KN ${n} `), {
      kind: "experience",
      multiplier: n,
    });
  for (const raw of [
    "",
    "/kn",
    "/kn 0",
    "/kn -1",
    "/kn 1.5",
    "/kn 1001",
    "/kn Infinity",
    "/kn 1 extra",
    "/kn 1e2",
    "/speed 3",
    "a".repeat(161),
  ])
    assert.equal(parseChatInput(raw).kind, "error");
  assert.deepEqual(parseChatInput("xin\nchào"), {
    kind: "message",
    text: "xin chào",
  });
  assert.deepEqual(parseChatInput("<img src=x onerror=alert(1)>"), {
    kind: "message",
    text: "<img src=x onerror=alert(1)>",
  });
  for (const n of [0, -1, NaN, Infinity, 1001, "7", null])
    assert.equal(normalizeExperienceBuff(n), 1);
});
test("chat history is bounded, ignores duplicate or malformed server messages, and owns its data", () => {
  const history = [];
  for (let i = 0; i < 100; i++)
    assert.equal(
      appendChat(history, {
        id: String(i),
        name: "Hiệp khách",
        text: "Chào",
        kind: "player",
        at: i,
      }),
      true,
    );
  assert.equal(history.length, MAX_CHAT_HISTORY);
  assert.equal(history[0].id, "20");
  const last = history.at(-1);
  assert.equal(appendChat(history, last), false);
  for (const bad of [
    { ...last, kind: "admin" },
    { ...last, text: "\0" },
    { ...last, at: NaN },
    { ...last, name: "" },
  ])
    assert.equal(validChatMessage(bad), false);
  const message = {
    id: "new",
    name: "BOT",
    text: "test",
    kind: "bot",
    at: 100,
  };
  appendChat(history, message);
  message.text = "changed";
  assert.equal(history.at(-1).text, "test");
});
test("old speed and XP presets are removed without changing saved progression or historical titles", () => {
  const idle = normalizeIdle({
    enabled: true,
    stage: 120,
    maxStage: 160,
    speed: 2.5,
    attributePoints: 100,
  });
  assert.equal("speed" in idle, false);
  assert.equal(idle.stage, 120);
  assert.equal(idle.attributePoints, 100);
  assert.equal(
    "xpMultiplier" in normalizePreferences({ xpMultiplier: 1000 }),
    false,
  );
  const journey = normalizeJourney({
    highestLevel: 160,
    unlockedTitles: ["grandmaster"],
    activeTitle: "grandmaster",
  });
  assert.equal(journey.activeTitle, "grandmaster");
  assert.equal(journey.highestLevel, 160);
});
test("a saved level-160 hero can progress to 200; rebirth is gated until the new cap", () => {
  const p = {
    level: 160,
    xp: 0,
    attack: 100,
    defense: 100,
    skillPoints: 0,
    idle: { attributePoints: 0 },
    journey: normalizeJourney(),
    dungeonClears: {},
    goldenClears: [],
    inventory: [],
    equipment: {},
    pendingItems: [],
  };
  assert.equal(rebirthCharacter(p, { attack: 20, defense: 10 }), false);
  assert.ok(!unlockTitles(p).some((t) => t.id === "grandmaster"));
  const reward = applyExperience(p, 1e9, 7);
  assert.equal(reward.levels, 40);
  assert.equal(p.level, MAX_LEVEL);
  assert.equal(p.xp, 0);
  assert.equal(p.skillPoints, 40);
  assert.equal(p.idle.attributePoints, 200);
  assert.ok(unlockTitles(p).some((t) => t.id === "grandmaster"));
  assert.equal(rebirthCharacter(p, { attack: 20, defense: 10 }), true);
});
test("grade 20 loot and level 200 siege payouts can be saved and validated", () => {
  assert.equal(MAX_GEAR_GRADE, 20);
  const filters = {
    ...freshLootSettings(),
    minGrade: 20,
    maxDiscardGrade: 20,
    minRarity: 0,
  };
  assert.equal(validLootSettings(filters), true);
  assert.equal(acceptsLoot({ level: 200, rarity: "Thường" }, filters), true);
  assert.equal(acceptsLoot({ level: 190, rarity: "Thường" }, filters), false);
  for (const rate of [7, 1000]) {
    const p = freshSiegeProgress(),
      id = beginSiege(p, "bien-kinh", 1000);
    assert.ok(id);
    const r = settleSiege(p, id, "victory", 200, 2000, rate);
    assert.equal(r.xp, 200 * 7 * rate);
    assert.equal(validSiegeProgress(p), true);
  }
});
