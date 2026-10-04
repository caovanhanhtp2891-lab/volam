import { EQUIPMENT_SLOTS } from "./gear-catalog.ts";

export const TOWER_FLOORS = 100;
export const TOWER_MIN_LEVEL = 5;
export const TOWER_SET = "tran-thien" as const;
export const TOWER_EXCHANGE_COST = 20;
export interface TowerProgress { highestFloor: number; clears: number[]; sigils: number }
export const freshTower = (): TowerProgress => ({ highestFloor: 0, clears: Array(TOWER_FLOORS).fill(0), sigils: 0 });
export function validTower(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const data = value as TowerProgress;
  return Number.isInteger(data.highestFloor) && data.highestFloor >= 0 && data.highestFloor <= TOWER_FLOORS &&
    Number.isInteger(data.sigils) && data.sigils >= 0 && data.sigils <= 1e9 &&
    Array.isArray(data.clears) && data.clears.length === TOWER_FLOORS && data.clears.every((count, i) =>
      Number.isInteger(count) && count >= 0 && count <= 1e6 && (i < data.highestFloor ? count > 0 : count === 0));
}
export function normalizeTower(value?: unknown): TowerProgress {
  return value && validTower(value) ? { ...(value as TowerProgress), clears: [...(value as TowerProgress).clears] } : freshTower();
}
export function towerFloor(floor: number) {
  if (!Number.isInteger(floor) || floor < 1 || floor > TOWER_FLOORS) return null;
  return { floor, level: Math.min(160, 5 + Math.floor(floor * 1.5)), timeLimit: 180,
    boss: floor % 10 === 0, healthScale: 1 + floor * .12, attackScale: 1 + floor * .045,
    rarity: floor >= 60 ? "Hoàng Kim" as const : floor >= 25 ? "Cực phẩm" as const : "Hiếm" as const };
}
export function canEnterTower(progress: TowerProgress, floor: number, level: number): boolean {
  return !!towerFloor(floor) && level >= TOWER_MIN_LEVEL && floor <= Math.min(TOWER_FLOORS, progress.highestFloor + 1) && progress.clears[floor - 1] < 1e6;
}
export function towerReward(progress: TowerProgress, floor: number) {
  const info = towerFloor(floor);
  if (!info) return null;
  const first = progress.clears[floor - 1] === 0, multiplier = first ? 2 : 1;
  return { first, gold: (150 + floor * 50 + floor ** 2 * 3) * multiplier,
    xp: (80 + floor * 28 + floor ** 2 * 2) * multiplier,
    stones: 1 + Math.floor(floor / 10) + (first ? 1 : 0),
    sigils: 2 + Math.floor(floor / 10) + (first ? 1 : 0),
    slot: EQUIPMENT_SLOTS[(floor - 1 + progress.clears[floor - 1]) % EQUIPMENT_SLOTS.length],
    itemLevel: info.level, rarity: info.rarity };
}
// Invoke only after the active encounter has defeated both waves. Clearing the
// encounter before awarding its transaction prevents repeat-click rewards.
export function completeTowerFloor(progress: TowerProgress, floor: number) {
  if (!canEnterTower(progress, floor, TOWER_MIN_LEVEL)) return null;
  const reward = towerReward(progress, floor)!;
  if (progress.sigils + reward.sigils > 1e9) return null;
  progress.clears[floor - 1]++; progress.highestFloor = Math.max(progress.highestFloor, floor);
  progress.sigils += reward.sigils;
  return reward;
}
export function spendTowerSigils(progress: TowerProgress, slot: string): boolean {
  if (!(EQUIPMENT_SLOTS as readonly string[]).includes(slot) || progress.highestFloor < 1 || progress.sigils < TOWER_EXCHANGE_COST) return false;
  progress.sigils -= TOWER_EXCHANGE_COST;
  return true;
}
