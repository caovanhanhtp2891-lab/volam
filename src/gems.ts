import { RARITIES, RARITY_COLORS, type Rarity } from "./rarity.ts";
import { emptyStats, type GearStats, type GearStat } from "./gear-stats.ts";
export const GEM_KINDS = [
  "ruby",
  "sapphire",
  "emerald",
  "topaz",
  "diamond",
] as const;
export type GemKind = (typeof GEM_KINDS)[number];
export interface GemSpec {
  kind: GemKind;
  level: number;
  quality: Rarity;
}
export type GemBag = Record<string, number>;
export const GEM_LEVEL_CAP = 10;
export const GEM_COUNT_CAP = 1_000_000_000;
export const GEM_TYPES = {
  ruby: {
    name: "Hồng Ngọc",
    element: "Hỏa",
    color: "#ff667b",
    stats: { attack: 8, critDamage: 0.4 },
  },
  sapphire: {
    name: "Lam Ngọc",
    element: "Thủy",
    color: "#61c7ff",
    stats: { mp: 35, mpRegen: 0.25 },
  },
  emerald: {
    name: "Lục Ngọc",
    element: "Mộc",
    color: "#77ecac",
    stats: { hp: 65, hpRegen: 0.6 },
  },
  topaz: {
    name: "Hoàng Ngọc",
    element: "Thổ",
    color: "#ffcd70",
    stats: { defense: 7, damageReduction: 0.15 },
  },
  diamond: {
    name: "Kim Cương",
    element: "Kim",
    color: "#e0d6ff",
    stats: { crit: 0.2, armorPen: 0.2 },
  },
} as const;
export function validGem(value: unknown): value is GemSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as GemSpec;
  return (
    GEM_KINDS.includes(v.kind) &&
    Number.isInteger(v.level) &&
    v.level >= 1 &&
    v.level <= GEM_LEVEL_CAP &&
    RARITIES.includes(v.quality)
  );
}
export function gemKey(gem: GemSpec): string {
  return `${gem.kind}:${gem.level}:${RARITIES.indexOf(gem.quality)}`;
}
export function gemFromKey(key: string): GemSpec | null {
  const [kind, level, quality, extra] = key.split(":");
  const gem = {
    kind: kind as GemKind,
    level: Number(level),
    quality: RARITIES[Number(quality)],
  };
  return extra === undefined && validGem(gem) && gemKey(gem) === key
    ? gem
    : null;
}
export function validGemBag(value: unknown): boolean {
  return (
    value === undefined ||
    Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.entries(value).length <= 350 &&
        Object.entries(value).every(
          ([key, count]) =>
            gemFromKey(key) &&
            Number.isInteger(count) &&
            count >= 0 &&
            count <= GEM_COUNT_CAP,
        ),
    )
  );
}
export function normalizeGemBag(value?: GemBag): GemBag {
  return Object.fromEntries(
    Object.entries(value ?? {}).filter(([, n]) => n > 0),
  );
}
export function gemStats(gem: GemSpec): GearStats {
  const stats = emptyStats(),
    quality = [1, 1.4, 2, 3, 4.5, 6.8, 10][RARITIES.indexOf(gem.quality)];
  const scale = gem.level ** 1.65 * quality;
  for (const [key, value] of Object.entries(GEM_TYPES[gem.kind].stats))
    stats[key as GearStat] = Math.round(value * scale * 100) / 100;
  return stats;
}
export function socketCount(item: { enhance: number }): number {
  return Math.max(0, Math.min(10, Math.floor(item.enhance / 10)));
}
export function validSockets(item: {
  enhance: number;
  gems?: unknown;
}): boolean {
  return (
    item.gems === undefined ||
    (Array.isArray(item.gems) &&
      item.gems.length <= socketCount(item) &&
      item.gems.every((g) => g === null || validGem(g)))
  );
}
export function socketStats(item: {
  enhance: number;
  gems?: (GemSpec | null)[];
}): GearStats {
  const stats = emptyStats();
  for (const gem of (item.gems ?? []).slice(0, socketCount(item)))
    if (gem && validGem(gem)) {
      const bonus = gemStats(gem);
      for (const key of Object.keys(stats) as GearStat[])
        stats[key] += bonus[key];
    }
  return stats;
}
export function addGems(bag: GemBag, gems: readonly GemSpec[]): boolean {
  const added = new Map<string, number>();
  for (const gem of gems) {
    if (!validGem(gem)) return false;
    const key = gemKey(gem);
    added.set(key, (added.get(key) ?? 0) + 1);
  }
  if (
    [...added].some(([key, count]) => (bag[key] ?? 0) + count > GEM_COUNT_CAP)
  )
    return false;
  for (const [key, count] of added) bag[key] = (bag[key] ?? 0) + count;
  return true;
}
// Replacing and removing are atomic, cost no silver and return the old gem.
export function setSocket(
  item: { enhance: number; gems?: (GemSpec | null)[] },
  bag: GemBag,
  index: number,
  key: string | null,
): boolean {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= socketCount(item) ||
    !validSockets(item)
  )
    return false;
  const gem = key === null ? null : gemFromKey(key),
    old = item.gems?.[index] ?? null;
  if (key !== null && (!gem || (bag[key] ?? 0) < 1)) return false;
  const oldKey = old ? gemKey(old) : null;
  if (oldKey === key || (!old && !gem)) return false;
  if (oldKey && (bag[oldKey] ?? 0) >= GEM_COUNT_CAP) return false;
  if (key) {
    bag[key]--;
    if (bag[key] === 0) delete bag[key];
  }
  if (oldKey) bag[oldKey] = (bag[oldKey] ?? 0) + 1;
  item.gems ??= [];
  while (item.gems.length <= index) item.gems.push(null);
  item.gems[index] = gem;
  return true;
}
export function gemName(gem: GemSpec): string {
  return `${GEM_TYPES[gem.kind].name} · Cấp ${gem.level} · ${gem.quality}`;
}
export function gemMarkup(gem: GemSpec): string {
  const color = GEM_TYPES[gem.kind].color,
    quality = RARITY_COLORS[gem.quality];
  return `<span class="gem-art" style="--gem-color:${color};--gem-quality:${quality}" data-gem-quality="${RARITIES.indexOf(gem.quality)}" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="m32 6 18 10 8 20-26 24L6 36l8-20z" fill="${color}" stroke="${quality}" stroke-width="3"/><path d="m14 16 18 7 18-7-9 20-9 24-9-24z" fill="#ffffff40"/><path d="m6 36 17 0 9-13 9 13h17M23 36l9 24 9-24" fill="none" stroke="#fff9" stroke-width="1.5"/><path d="m20 13 3 6 7 1-6 3-2 7-3-6-6-2z" fill="#fff"/></svg><b>${gem.level}</b></span>`;
}
