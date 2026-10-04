export const ELITE_MIN_KILLS = 6;
export const ELITE_PITY_KILLS = 20;
export const CAMPFIRE_DURATION = 90000;
export const CAMPFIRE_INTERVAL = 3000;
export const CAMPFIRE_RADIUS = 120;
export const MAX_CAMPFIRES = 3;
export interface EliteHunt { normalKills: number; spawned: number }
export interface Campfire {
  id: string; area: string; x: number; y: number; level: number;
  expiresAt: number; nextTickAt: number;
}
export interface SavedWildElite { id: string; name: string; area: string; x: number; y: number; level: number; hp: number; element?: string }
export function validWildElite(value: unknown): boolean {
  if (value === undefined) return true;
  const e = value as SavedWildElite;
  return Boolean(e && typeof e.id === "string" && e.id.startsWith("wild-elite-") && e.id.length <= 180 && typeof e.name === "string" && e.name.length <= 150 && validHuntArea(e.area) && Number.isFinite(e.x) && e.x >= 24 && e.x <= 1876 && Number.isFinite(e.y) && e.y >= 24 && e.y <= 1176 && Number.isInteger(e.level) && e.level >= 1 && e.level <= 160 && Number.isFinite(e.hp) && e.hp > 0 && e.hp <= 1e9 && (e.element === undefined || ["kim", "moc", "thuy", "hoa", "tho"].includes(e.element)));
}
export const validHuntArea = (area: unknown): area is string => typeof area === "string" && (area === "world" || /^stage-([1-9]|[1-9]\d|1[0-5]\d|160)$/.test(area) || /^dungeon-(tomb|bamboo)$/.test(area));
export function normalizeEliteHunt(value: unknown): EliteHunt {
  const data = value && typeof value === "object" ? value as Partial<EliteHunt> : {};
  const count = (n: unknown, max: number) => typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
  return { normalKills: count(data.normalKills, ELITE_PITY_KILLS), spawned: count(data.spawned, 1e9) };
}
export function eliteChance(kills: number): number {
  if (kills < ELITE_MIN_KILLS) return 0;
  return kills >= ELITE_PITY_KILLS ? 1 : Math.min(.6, .15 + (kills - ELITE_MIN_KILLS) * .05);
}
export function recordNormalKill(hunt: EliteHunt, eliteAlive: boolean, random = Math.random): boolean {
  if (eliteAlive) return false;
  hunt.normalKills = Math.min(ELITE_PITY_KILLS, hunt.normalKills + 1);
  const chance = eliteChance(hunt.normalKills);
  if (!chance || random() >= chance) return false;
  hunt.normalKills = 0; hunt.spawned++;
  return true;
}
export function createCampfire(id: string, area: string, x: number, y: number, level: number, now: number): Campfire {
  return { id, area, x, y, level, expiresAt: now + CAMPFIRE_DURATION, nextTickAt: now + CAMPFIRE_INTERVAL };
}
export const campfireXp = (level: number) => 6 + level * 2;
export function nearCampfire(fire: Campfire, point: { x: number; y: number }): boolean {
  return Math.hypot(fire.x - point.x, fire.y - point.y) <= CAMPFIRE_RADIUS;
}
export function tickCampfires(fires: readonly Campfire[], area: string, point: { x: number; y: number }, now: number): number {
  let xp = 0;
  for (const fire of fires) {
    if (now >= fire.expiresAt || now < fire.nextTickAt) continue;
    // Consume the tick while away too; never catch up after background/offline.
    fire.nextTickAt = now + CAMPFIRE_INTERVAL;
    if (fire.area === area && nearCampfire(fire, point)) xp = Math.max(xp, campfireXp(fire.level));
  }
  // Synchronize future rewards, including staggered fires and changing areas.
  if (xp) for (const fire of fires) fire.nextTickAt = Math.max(fire.nextTickAt, now + CAMPFIRE_INTERVAL);
  return xp;
}
export function validCampfires(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= MAX_CAMPFIRES && value.every(fire => fire && typeof fire.id === "string" && fire.id.length <= 180 && validHuntArea(fire.area) && Number.isFinite(fire.x) && fire.x >= 24 && fire.x <= 1876 && Number.isFinite(fire.y) && fire.y >= 24 && fire.y <= 1176 && Number.isInteger(fire.level) && fire.level >= 1 && fire.level <= 160 && Number.isSafeInteger(fire.expiresAt) && fire.expiresAt >= 0 && Number.isSafeInteger(fire.nextTickAt) && fire.nextTickAt >= 0));
}
export function restoreCampfires(value: Campfire[] | undefined, now: number): Campfire[] {
  return (value ?? []).filter(fire => fire.expiresAt > now).slice(-MAX_CAMPFIRES).map(fire => ({ ...fire, expiresAt: Math.min(fire.expiresAt, now + CAMPFIRE_DURATION), nextTickAt: now + CAMPFIRE_INTERVAL }));
}
