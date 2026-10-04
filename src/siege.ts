import { territoryOf, type TerritoryId } from "./military.ts";
import type { Point } from "./combat.ts";

export const SIEGE_CAPTURE_SECONDS = 12;
export interface SiegeCapture { progress: number; reinforcements: number }
export const freshSiegeCapture = (): SiegeCapture => ({ progress: 0, reinforcements: 0 });
export function tickSiegeCapture(state: SiegeCapture, dt: number, allied: boolean, contested: boolean): boolean {
  if (!Number.isFinite(dt) || dt <= 0) return false;
  const elapsed = Math.min(dt, 0.25);
  state.progress = Math.max(0, Math.min(SIEGE_CAPTURE_SECONDS,
    state.progress + (contested ? -elapsed * 0.5 : allied ? elapsed : 0)));
  if (state.reinforcements < 2 && state.progress >= (state.reinforcements + 1) * 4) {
    state.reinforcements++;
    return true;
  }
  return false;
}

export function siegeBlocked(
  x: number,
  y: number,
  radius: number,
  gateAlive: boolean,
): boolean {
  const walls = [
    [300, 185, 1300, 60],
    [300, 185, 55, 750],
    [1545, 185, 55, 750],
    [300, 520, 565, 50],
    [1035, 520, 565, 50],
  ];
  if (gateAlive) walls.push([865, 520, 170, 50]);
  return walls.some(
    ([left, top, width, height]) =>
      Math.hypot(
        x - Math.max(left, Math.min(left + width, x)),
        y - Math.max(top, Math.min(top + height, y)),
      ) < radius,
  );
}
export function siegeTravelGoal(source: Point, destination: Point): Point {
  const crossingUp = source.y > 495 && destination.y < 520,
    crossingDown = source.y < 595 && destination.y > 570;
  if (crossingUp && source.y > 575)
    return Math.abs(source.x - 950) > 40
      ? { x: 950, y: 605 }
      : { x: 950, y: 475 };
  if (crossingUp) return { x: 950, y: 475 };
  if (crossingDown && source.y < 515)
    return Math.abs(source.x - 950) > 40
      ? { x: 950, y: 485 }
      : { x: 950, y: 615 };
  if (crossingDown) return { x: 950, y: 615 };
  return destination;
}
export type SiegeOutcome =
  | "victory"
  | "defeat"
  | "retreat"
  | "timeout"
  | "interrupted";
export const SIEGE_PHASES = [
  "Phá cổng thành",
  "Đoạt chiến kỳ",
  "Hạ Thống lĩnh",
] as const;
export interface SiegeRecord {
  id: number;
  city: TerritoryId;
  outcome: SiegeOutcome;
  at: number;
  silver: number;
  xp: number;
  stones: number;
}
export interface SiegeProgress {
  nextBattle: number;
  victories: number;
  history: SiegeRecord[];
  pending?: { id: number; city: TerritoryId; at: number };
}
export const freshSiegeProgress = (): SiegeProgress => ({
  nextBattle: 1,
  victories: 0,
  history: [],
});
const integer = (n: unknown, low: number, high: number): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= low && n <= high;
export function validSiegeProgress(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const p = value as SiegeProgress;
  return (
    integer(p.nextBattle, 1, 1e9) &&
    integer(p.victories, 0, p.nextBattle - 1) &&
    Array.isArray(p.history) &&
    p.history.length <= 20 &&
    p.history.every(
      (r, i) =>
        r &&
        integer(r.id, 1, p.nextBattle - 1) &&
        (i === 0 || r.id < p.history[i - 1].id) &&
        territoryOf(r.city) &&
        ["victory", "defeat", "retreat", "timeout", "interrupted"].includes(
          r.outcome,
        ) &&
        integer(r.at, 0, 1e15) &&
        integer(r.silver, 0, 10000) &&
        integer(r.xp, 0, 1120000) &&
        integer(r.stones, 0, 2),
    ) &&
    (!p.pending ||
      (integer(p.pending.id, 1, p.nextBattle - 1) &&
        p.pending.id === p.nextBattle - 1 &&
        Boolean(territoryOf(p.pending.city)) &&
        integer(p.pending.at, 0, 1e15) &&
        !p.history.some((r) => r.id === p.pending!.id)))
  );
}
export function normalizeSiegeProgress(value?: unknown): SiegeProgress {
  if (!value || !validSiegeProgress(value)) return freshSiegeProgress();
  const p = value as SiegeProgress;
  return {
    nextBattle: p.nextBattle,
    victories: p.victories,
    history: p.history.map((r) => ({ ...r })),
    ...(p.pending ? { pending: { ...p.pending } } : {}),
  };
}
export function beginSiege(
  progress: SiegeProgress,
  city: TerritoryId,
  now: number,
): number | null {
  if (
    progress.pending ||
    !territoryOf(city) ||
    !integer(now, 0, 1e15) ||
    progress.nextBattle >= 1e9
  )
    return null;
  const id = progress.nextBattle++;
  progress.pending = { id, city, at: now };
  return id;
}
export function settleSiege(
  progress: SiegeProgress,
  id: number,
  outcome: SiegeOutcome,
  level: number,
  now: number,
  xpMultiplier = 1,
): SiegeRecord | null {
  if (
    !progress.pending ||
    progress.pending.id !== id ||
    progress.history.some((r) => r.id === id) ||
    !integer(level, 1, 160) ||
    !integer(now, 0, 1e15) ||
    ![1, 5, 10, 100, 1000].includes(xpMultiplier) ||
    !["victory", "defeat", "retreat", "timeout", "interrupted"].includes(
      outcome,
    )
  )
    return null;
  const victory = outcome === "victory";
  const record: SiegeRecord = {
    id,
    city: progress.pending.city,
    outcome,
    at: now,
    silver: victory ? 100 + level * 6 : 0,
    xp: victory ? level * 7 * xpMultiplier : 0,
    stones: victory ? 2 : 0,
  };
  if (victory) progress.victories++;
  progress.history.unshift(record);
  progress.history = progress.history.slice(0, 20);
  delete progress.pending;
  return record;
}
