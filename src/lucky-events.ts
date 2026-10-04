import { MAX_POTIONS, POTIONS } from "./progression.ts";
import { validGem, type GemSpec } from "./gems.ts";
import type { Rarity } from "./rarity.ts";
export type LuckyGame = "wheel" | "dice" | "lottery";
export const LUCKY_COST = 50;
export const MIN_BET = 10;
export const MAX_BET = 5000;
export const MAX_SILVER = 1e12;
export type WheelReward =
  | { kind: "equipment"; rarity: Rarity }
  | { kind: "gem"; gem: GemSpec };
export interface WheelPrize {
  name: string;
  silver: number;
  stones: number;
  potions: number;
  weight: number;
  color: string;
  reward?: WheelReward;
}
export const MAX_WHEEL_LUCK = 1000;
export const WHEEL_PRIZES: readonly WheelPrize[] = [
  {
    name: "20 bạc",
    silver: 20,
    stones: 0,
    potions: 0,
    weight: 23.8785,
    color: "#90b8b2",
  },
  {
    name: "40 bạc",
    silver: 40,
    stones: 0,
    potions: 0,
    weight: 22,
    color: "#77b883",
  },
  {
    name: "80 bạc",
    silver: 80,
    stones: 0,
    potions: 0,
    weight: 18,
    color: "#65bce0",
  },
  {
    name: "150 bạc",
    silver: 150,
    stones: 0,
    potions: 0,
    weight: 12,
    color: "#b48ce0",
  },
  {
    name: "500 bạc",
    silver: 500,
    stones: 0,
    potions: 0,
    weight: 3,
    color: "#ed9f59",
  },
  {
    name: "3 bình HP",
    silver: 0,
    stones: 0,
    potions: 3,
    weight: 10,
    color: "#cb7061",
  },
  {
    name: "1 đá tinh luyện",
    silver: 0,
    stones: 1,
    potions: 0,
    weight: 8,
    color: "#649cd5",
  },
  {
    name: "3 đá tinh luyện",
    silver: 0,
    stones: 3,
    potions: 0,
    weight: 3,
    color: "#e7c064",
  },
  {
    name: "Trang bị Vàng",
    silver: 0,
    stones: 0,
    potions: 0,
    weight: 0.08,
    color: "#ffd35a",
    reward: { kind: "equipment", rarity: "Hoàng Kim" },
  },
  {
    name: "Trang bị Cam",
    silver: 0,
    stones: 0,
    potions: 0,
    weight: 0.015,
    color: "#ff963f",
    reward: { kind: "equipment", rarity: "Truyền Thuyết" },
  },
  {
    name: "Trang bị Đỏ",
    silver: 0,
    stones: 0,
    potions: 0,
    weight: 0.001,
    color: "#ff405d",
    reward: { kind: "equipment", rarity: "Thần Thoại" },
  },
  {
    name: "Hồng Ngọc Vàng cấp 6",
    silver: 0,
    stones: 0,
    potions: 0,
    weight: 0.02,
    color: "#ffd35a",
    reward: {
      kind: "gem",
      gem: { kind: "ruby", level: 6, quality: "Hoàng Kim" },
    },
  },
  {
    name: "Kim Cương Cam cấp 8",
    silver: 0,
    stones: 0,
    potions: 0,
    weight: 0.005,
    color: "#ff963f",
    reward: {
      kind: "gem",
      gem: { kind: "diamond", level: 8, quality: "Truyền Thuyết" },
    },
  },
  {
    name: "Kim Cương Đỏ cấp 10",
    silver: 0,
    stones: 0,
    potions: 0,
    weight: 0.0005,
    color: "#ff405d",
    reward: {
      kind: "gem",
      gem: { kind: "diamond", level: 10, quality: "Thần Thoại" },
    },
  },
];
// Luck affects only rare rewards. Ordinary outcomes share the remaining mass,
// so the published probabilities always sum to 100%, even at maximum luck.
export function wheelLuckMultiplier(progress: LuckyProgress): number {
  return 1 + Math.min(MAX_WHEEL_LUCK, progress.wheelMisses ?? 0) * 0.004;
}
export function wheelOdds(progress: LuckyProgress): number[] {
  const multiplier = wheelLuckMultiplier(progress);
  const rareBase = WHEEL_PRIZES.reduce(
    (sum, p) => sum + (p.reward ? p.weight : 0),
    0,
  );
  return WHEEL_PRIZES.map((p) =>
    p.reward
      ? p.weight * multiplier
      : (p.weight * (100 - rareBase * multiplier)) / (100 - rareBase),
  );
}
export interface LuckyReceipt {
  round: number;
  game: LuckyGame;
  at: number;
  revealAt: number;
  stake: number;
  choice: string;
  result: string;
  won: boolean;
  silver: number;
  stones: number;
  potions: number;
  numbers: number[];
  reward?: WheelReward;
}
export interface LuckyProgress {
  nextRound: number;
  wheelSpins?: number;
  wheelMisses?: number;
  history: LuckyReceipt[];
}
export interface LuckyWallet {
  gold: number;
  refiningStones: number;
  potions: { hp: number };
}
export const freshLuckyProgress = (): LuckyProgress => ({
  nextRound: 1,
  wheelSpins: 0,
  wheelMisses: 0,
  history: [],
});
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= min &&
  value <= max;
export function validLuckyProgress(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const p = value as LuckyProgress;
  return (
    integer(p.nextRound, 1, 1e9) &&
    (p.wheelSpins === undefined || integer(p.wheelSpins, 0, p.nextRound - 1)) &&
    (p.wheelMisses === undefined ||
      integer(p.wheelMisses, 0, Math.min(MAX_WHEEL_LUCK, p.wheelSpins ?? 0))) &&
    Array.isArray(p.history) &&
    p.history.length <= 30 &&
    p.history.every(
      (r, index) =>
        r &&
        integer(r.round, 1, p.nextRound - 1) &&
        (index === 0 || r.round < p.history[index - 1].round) &&
        ["wheel", "dice", "lottery"].includes(r.game) &&
        (r.game === "wheel" || r.reward === undefined) &&
        integer(r.at, 0, 1e15) &&
        r.revealAt === r.at + 2200 &&
        integer(r.stake, MIN_BET, MAX_BET) &&
        typeof r.choice === "string" &&
        r.choice.length <= 12 &&
        typeof r.result === "string" &&
        r.result.length <= 100 &&
        typeof r.won === "boolean" &&
        integer(r.silver, 0, MAX_BET * 90) &&
        integer(r.stones, 0, 3) &&
        integer(r.potions, 0, 3) &&
        Array.isArray(r.numbers) &&
        (r.game === "wheel"
          ? r.numbers.length === 1 &&
            integer(r.numbers[0], 0, WHEEL_PRIZES.length - 1) &&
            validWheelReward(r.reward, WHEEL_PRIZES[r.numbers[0]].reward)
          : r.game === "dice"
            ? r.numbers.length === 3 && r.numbers.every((n) => integer(n, 1, 6))
            : r.numbers.length === 2 &&
              r.numbers.every((n) => integer(n, 0, 9))),
    )
  );
}
function validWheelReward(
  value: WheelReward | undefined,
  expected: WheelReward | undefined,
): boolean {
  if (!expected) return value === undefined;
  if (!value || value.kind !== expected.kind) return false;
  return value.kind === "equipment" && expected.kind === "equipment"
    ? value.rarity === expected.rarity
    : value.kind === "gem" &&
        expected.kind === "gem" &&
        validGem(value.gem) &&
        value.gem.kind === expected.gem.kind &&
        value.gem.level === expected.gem.level &&
        value.gem.quality === expected.gem.quality;
}
function cloneReward(reward: WheelReward): WheelReward {
  return reward.kind === "gem"
    ? { ...reward, gem: { ...reward.gem } }
    : { ...reward };
}
export function normalizeLuckyProgress(value?: unknown): LuckyProgress {
  if (!value || !validLuckyProgress(value)) return freshLuckyProgress();
  const p = value as LuckyProgress;
  return {
    nextRound: p.nextRound,
    wheelSpins: p.wheelSpins ?? 0,
    wheelMisses: p.wheelMisses ?? 0,
    history: p.history.map((r) => ({
      ...r,
      numbers: [...r.numbers],
      ...(r.reward ? { reward: cloneReward(r.reward) } : {}),
    })),
  };
}
export function luckyBusy(progress: LuckyProgress, now: number): boolean {
  return (progress.history[0]?.revealAt ?? 0) > now;
}
const roll = (random: () => number) => {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new Error("random-invalid");
  return Math.min(1 - Number.EPSILON, value);
};
export function diceOutcome(dice: readonly number[]): "tai" | "xiu" | "triple" {
  if (dice.length !== 3 || !dice.every((n) => integer(n, 1, 6)))
    throw new Error("dice-invalid");
  if (dice.every((n) => n === dice[0])) return "triple";
  return dice.reduce((sum, n) => sum + n, 0) <= 10 ? "xiu" : "tai";
}
export function playLuckyEvent(
  wallet: LuckyWallet,
  progress: LuckyProgress,
  game: LuckyGame,
  stake: number,
  choice: string,
  now: number,
  random = Math.random,
): LuckyReceipt | null {
  if (
    !["wheel", "dice", "lottery"].includes(game) ||
    !integer(now, 0, 1e15 - 2200) ||
    luckyBusy(progress, now) ||
    progress.nextRound >= 1e9
  )
    return null;
  const cost = game === "wheel" ? LUCKY_COST : stake;
  if (
    !integer(cost, MIN_BET, MAX_BET) ||
    !integer(wallet.gold, 0, MAX_SILVER) ||
    wallet.gold < cost ||
    !integer(wallet.refiningStones, 0, MAX_SILVER) ||
    !integer(wallet.potions.hp, 0, MAX_POTIONS) ||
    (game === "dice" && !["tai", "xiu"].includes(choice)) ||
    (game === "lottery" && !/^\d{2}$/.test(choice))
  )
    return null;
  const receipt: LuckyReceipt = {
    round: progress.nextRound,
    game,
    at: now,
    revealAt: now + 2200,
    stake: cost,
    choice: game === "wheel" ? "Quay" : choice,
    result: "",
    won: false,
    silver: 0,
    stones: 0,
    potions: 0,
    numbers: [],
  };
  if (game === "wheel") {
    const odds = wheelOdds(progress);
    let sample = roll(random) * 100,
      index = 0;
    while (index < WHEEL_PRIZES.length - 1 && sample >= odds[index])
      sample -= odds[index++];
    const prize = WHEEL_PRIZES[index];
    Object.assign(receipt, {
      result: prize.name,
      silver: prize.silver,
      stones: prize.stones,
      potions: prize.potions,
      won: true,
      numbers: [index],
      ...(prize.reward ? { reward: cloneReward(prize.reward) } : {}),
    });
  } else if (game === "dice") {
    receipt.numbers = Array.from(
      { length: 3 },
      () => 1 + Math.floor(roll(random) * 6),
    );
    const result = diceOutcome(receipt.numbers),
      sum = receipt.numbers.reduce((a, b) => a + b, 0);
    receipt.result = `${sum} điểm · ${result === "triple" ? "Bộ ba đồng số" : result === "tai" ? "Tài" : "Xỉu"}`;
    receipt.won = result === choice;
    receipt.silver = receipt.won ? cost * 2 : 0;
  } else {
    receipt.numbers = [
      Math.floor(roll(random) * 10),
      Math.floor(roll(random) * 10),
    ];
    receipt.result = receipt.numbers.join("");
    receipt.won = receipt.result === choice;
    receipt.silver = receipt.won ? cost * 90 : 0;
  }
  const potionOverflow = Math.max(
    0,
    receipt.potions - (MAX_POTIONS - wallet.potions.hp),
  );
  if (potionOverflow) {
    receipt.silver += potionOverflow * POTIONS.hp.price;
    receipt.result += ` · ${potionOverflow} bình vượt giới hạn đổi thành ${potionOverflow * POTIONS.hp.price} bạc`;
  }
  receipt.silver = Math.min(receipt.silver, MAX_SILVER - wallet.gold + cost);
  receipt.stones = Math.min(receipt.stones, MAX_SILVER - wallet.refiningStones);
  receipt.potions = Math.min(receipt.potions, MAX_POTIONS - wallet.potions.hp);
  wallet.gold += receipt.silver - cost;
  wallet.refiningStones += receipt.stones;
  wallet.potions.hp += receipt.potions;
  if (game === "wheel") {
    progress.wheelSpins = (progress.wheelSpins ?? 0) + 1;
    progress.wheelMisses = receipt.reward
      ? 0
      : Math.min(MAX_WHEEL_LUCK, (progress.wheelMisses ?? 0) + 1);
  }
  progress.nextRound++;
  progress.history.unshift(receipt);
  progress.history = progress.history.slice(0, 30);
  return receipt;
}
