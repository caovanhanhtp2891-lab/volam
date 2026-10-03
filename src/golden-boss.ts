export const GOLDEN_DURATION = 20 * 60 * 1000;
export const GOLDEN_SCHEDULE = [
  { hour: 12, name: "Kim Giáp Lang Vương", element: "kim", sprite: "alpha" },
  { hour: 19, name: "Hoàng Kim Thủ Vệ", element: "tho", sprite: "guardian" },
  { hour: 21, name: "Xích Diệm Ma Vương", element: "hoa", sprite: "undead" },
] as const;
export type GoldenDefinition = (typeof GOLDEN_SCHEDULE)[number];
export interface GoldenWindow { id: string; boss: GoldenDefinition; startsAt: number; endsAt: number }
export function goldenWindows(now: number): GoldenWindow[] {
  const vietnam = new Date(now + 7 * 3600000);
  const date = vietnam.toISOString().slice(0, 10);
  const midnight = Date.parse(`${date}T00:00:00+07:00`);
  return GOLDEN_SCHEDULE.map(boss => ({ id: `${date}-${boss.hour}`, boss, startsAt: midnight + boss.hour * 3600000, endsAt: midnight + boss.hour * 3600000 + GOLDEN_DURATION }));
}
export function goldenStatus(now: number, cleared: readonly string[] = []) {
  const windows = goldenWindows(now);
  const active = windows.find(w => now >= w.startsAt && now < w.endsAt) ?? null;
  const next = windows.find(w => w.startsAt > now) ?? goldenWindows(now + 86400000)[0];
  return { active, next, defeated: active ? cleared.includes(active.id) : false };
}
export function normalizeGoldenClears(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && /^\d{4}-\d{2}-\d{2}-(12|19|21)$/.test(id)))].slice(-24) : [];
}
export function claimGoldenKill(cleared: string[], window: GoldenWindow, now: number): boolean {
  if (now < window.startsAt || now >= window.endsAt || cleared.includes(window.id)) return false;
  cleared.push(window.id);
  if (cleared.length > 24) cleared.splice(0, cleared.length - 24);
  return true;
}
export function countdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return seconds >= 3600 ? `${Math.floor(seconds / 3600)}g ${Math.floor(seconds % 3600 / 60)}p` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
