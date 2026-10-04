import { MAX_POTIONS, POTIONS } from "./progression.ts";
export type LuckyGame = "wheel" | "dice" | "lottery";
export const LUCKY_COST = 50;
export const MIN_BET = 10;
export const MAX_BET = 5000;
export const MAX_SILVER = 1e9;
export const WHEEL_PRIZES = [
  {
    name: "20 bạc",
    silver: 20,
    stones: 0,
    potions: 0,
    weight: 24,
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
] as const;
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
}
export interface LuckyProgress {
  nextRound: number;
  history: LuckyReceipt[];
}
export interface LuckyWallet {
  gold: number;
  refiningStones: number;
  potions: { hp: number };
}
export const freshLuckyProgress = (): LuckyProgress => ({
  nextRound: 1,
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
    Array.isArray(p.history) &&
    p.history.length <= 30 &&
    p.history.every(
      (r, index) =>
        r &&
        integer(r.round, 1, p.nextRound - 1) &&
        (index === 0 || r.round < p.history[index - 1].round) &&
        ["wheel", "dice", "lottery"].includes(r.game) &&
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
          ? r.numbers.length === 1 && integer(r.numbers[0], 0, 7)
          : r.game === "dice"
            ? r.numbers.length === 3 && r.numbers.every((n) => integer(n, 1, 6))
            : r.numbers.length === 2 &&
              r.numbers.every((n) => integer(n, 0, 9))),
    )
  );
}
export function normalizeLuckyProgress(value?: unknown): LuckyProgress {
  if (!value || !validLuckyProgress(value)) return freshLuckyProgress();
  const p = value as LuckyProgress;
  return {
    nextRound: p.nextRound,
    history: p.history.map((r) => ({ ...r, numbers: [...r.numbers] })),
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
    !integer(wallet.refiningStones, 0, 1e9) ||
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
    let sample = roll(random) * 100,
      index = 0;
    while (
      index < WHEEL_PRIZES.length - 1 &&
      sample >= WHEEL_PRIZES[index].weight
    )
      sample -= WHEEL_PRIZES[index++].weight;
    const prize = WHEEL_PRIZES[index];
    Object.assign(receipt, {
      result: prize.name,
      silver: prize.silver,
      stones: prize.stones,
      potions: prize.potions,
      won: true,
      numbers: [index],
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
  receipt.stones = Math.min(receipt.stones, 1e9 - wallet.refiningStones);
  receipt.potions = Math.min(receipt.potions, MAX_POTIONS - wallet.potions.hp);
  wallet.gold += receipt.silver - cost;
  wallet.refiningStones += receipt.stones;
  wallet.potions.hp += receipt.potions;
  progress.nextRound++;
  progress.history.unshift(receipt);
  progress.history = progress.history.slice(0, 30);
  return receipt;
}
