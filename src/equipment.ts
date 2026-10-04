import type { Element } from "./idle";
import { gearTrait, setBonuses, type GearVariant, type GearIdentity, type SetId } from "./gear-catalog.ts";
import { STAT_LABELS, emptyStats, secondaryScore, type GearStat, type GearStats } from "./gear-stats.ts";
export { STAT_LABELS, emptyStats, statUnit, secondaryScore, combatModifiers, outgoingDamage, incomingDamage, stolenLife } from "./gear-stats.ts";
export type { GearStat, GearStats } from "./gear-stats.ts";
export const RARITIES = [
  "Thường",
  "Tốt",
  "Hiếm",
  "Cực phẩm",
  "Hoàng Kim",
  "Truyền Thuyết",
  "Thần Thoại",
] as const;
export type Rarity = (typeof RARITIES)[number];
export const RARITY_COLORS: Record<Rarity, string> = {
  Thường: "#e3e8ec",
  Tốt: "#73d19b",
  Hiếm: "#64b5f6",
  "Cực phẩm": "#cf91ff",
  "Hoàng Kim": "#ffd35a",
  "Truyền Thuyết": "#ff963f",
  "Thần Thoại": "#ff405d",
};
export const RARITY_NAMES = ["Trắng", "Lục", "Lam", "Tím", "Vàng", "Cam", "Đỏ"] as const;
// One roll per drop. Red is the rarest and only enters the pool at level 101.
export function rollEquipmentRarity(level: number, kind: "normal" | "elite" | "boss" = "normal", random = Math.random): Rarity {
  const roll = random();
  const [red, orange, gold, purple, blue, green] = kind === "boss"
    ? [.01, .04, .15, .8, 0, 0]
    : kind === "elite" ? [.002, .015, .05, .2, .733, 0]
    : [.0005, .002, .005, .02, .1, .31];
  let threshold = 0;
  for (const [rarity, chance] of [
    ["Thần Thoại", Number.isFinite(level) && level >= 101 ? red : 0],
    ["Truyền Thuyết", Number.isFinite(level) && level >= 61 ? orange : 0],
    ["Hoàng Kim", gold], ["Cực phẩm", purple], ["Hiếm", blue], ["Tốt", green],
  ] as const) {
    threshold += chance;
    if (roll < threshold) return rarity;
  }
  return kind === "boss" ? "Cực phẩm" : kind === "elite" ? "Hiếm" : "Thường";
}
export interface EquipmentData extends GearIdentity {
  id: string;
  slot: string;
  rarity: Rarity;
  level: number;
  power: number;
  enhance: number;
  bonuses?: Partial<GearStats>;
}
export function rarityTier(rarity?: string): number {
  return Math.max(0, RARITIES.indexOf(rarity as Rarity));
}
export function equipmentGrade(level: number): string {
  return `Bậc ${Math.ceil(level / 10)}`;
}
// Old items retain their primary power; bonus rolls only exist on new drops.
export function gearStats(item: EquipmentData): GearStats {
  const stats = emptyStats();
  const scale = (value: number) =>
    value + Math.ceil(value * item.enhance * 0.04);
  // Every successful rank improves the primary stat, even on low-level gear.
  stats[item.slot === "weapon" ? "attack" : "defense"] =
    item.power +
    (item.power > 0
      ? Math.max(item.enhance, Math.ceil(item.power * item.enhance * 0.04))
      : 0);
  for (const key of Object.keys(stats) as GearStat[])
    stats[key] += scale(item.bonuses?.[key] ?? 0);
  return stats;
}
export const MAX_ENHANCEMENT = 10;
export function enhancementInfo(item: EquipmentData) {
  return {
    capped: item.enhance >= MAX_ENHANCEMENT,
    cost: 45 + item.enhance * 35,
    stones: 1,
    chance:
      item.enhance < 3
        ? 1
        : item.enhance < 6
          ? 0.78
          : item.enhance < 8
            ? 0.58
            : 0.42,
  };
}
export function attemptEnhancement(
  item: EquipmentData,
  owner: { gold: number; refiningStones: number },
  random = Math.random,
): "success" | "failed" | "capped" | "poor" {
  const info = enhancementInfo(item);
  if (info.capped) return "capped";
  if (owner.gold < info.cost || owner.refiningStones < info.stones)
    return "poor";
  owner.gold -= info.cost;
  owner.refiningStones -= info.stones;
  if (random() < info.chance) {
    item.enhance++;
    return "success";
  }
  return "failed";
}
export function totalGearStats(items: readonly EquipmentData[]): GearStats {
  const total = emptyStats();
  for (const item of items) {
    const stats = gearStats(item);
    for (const key of Object.keys(total) as GearStat[])
      total[key] += stats[key];
  }
  return total;
}
export function loadoutStats(
  items: readonly EquipmentData[],
  element?: Element,
): GearStats {
  const total = totalGearStats(items),
    sets = setBonuses(items, element);
  for (const key of Object.keys(total) as GearStat[]) total[key] += sets[key];
  return total;
}
export function loadoutScore(
  items: readonly EquipmentData[],
  element?: Element,
): number {
  const s = loadoutStats(items, element);
  return (
    s.attack * 3 +
    s.defense * 2 +
    (s.hp + Math.floor(s.defense * 1.45)) * 0.15 +
    secondaryScore(s)
  );
}
// Defense also grants 1.45 HP in the existing character rules. Use the same
// weights as combat power, including usable MP, crit percentage and movement.
export function gearScore(item?: EquipmentData): number {
  if (!item) return 0;
  const s = gearStats(item);
  return (
    s.attack * 3 +
    s.defense * 2 +
    (s.hp + s.defense * 1.45) * 0.15 +
    secondaryScore(s)
  );
}
export function equipBestGear<T extends EquipmentData>(
  owner: { inventory: T[]; equipment: Partial<Record<string, T>> },
  element?: Element,
): number {
  const changed = new Set<string>();
  // Revisit earlier slots after a set activates; every swap improves the whole loadout.
  for (let pass = 0; pass < 11; pass++) {
    let improved = false;
    for (const slot of new Set(owner.inventory.map((item) => item.slot))) {
      const old = owner.equipment[slot],
        others = Object.values(owner.equipment).filter((item): item is T =>
          Boolean(item && item.slot !== slot),
        );
      let best = old,
        score = loadoutScore(old ? [...others, old] : others, element);
      for (const item of owner.inventory)
        if (item.slot === slot) {
          const candidate = loadoutScore([...others, item], element);
          if (candidate > score + 0.00001) {
            best = item;
            score = candidate;
          }
        }
      if (!best || best === old) continue;
      owner.inventory.splice(owner.inventory.indexOf(best), 1);
      owner.equipment[slot] = best;
      if (old) owner.inventory.push(old);
      changed.add(slot);
      improved = true;
    }
    if (!improved) break;
  }
  return changed.size;
}
export function equipSetPieces<T extends EquipmentData>(
  owner: { inventory: T[]; equipment: Partial<Record<string, T>> },
  setId: SetId,
): number {
  let changed = 0;
  for (const slot of new Set(
    owner.inventory
      .filter((item) => item.setId === setId)
      .map((item) => item.slot),
  )) {
    const old = owner.equipment[slot];
    let best = old?.setId === setId ? old : undefined;
    for (const item of owner.inventory)
      if (
        item.slot === slot &&
        item.setId === setId &&
        (!best || gearScore(item) > gearScore(best))
      )
        best = item;
    if (!best || best === old) continue;
    owner.inventory.splice(owner.inventory.indexOf(best), 1);
    owner.equipment[slot] = best;
    if (old) owner.inventory.push(old);
    changed++;
  }
  return changed;
}
export function rollGearBonuses(
  level: number,
  rarity: Rarity,
  slot: string,
  random = Math.random,
  variant?: GearVariant,
): Partial<GearStats> {
  const tier = rarityTier(rarity);
  const count = [2, 3, 5, 7, 10, 12, 14][tier];
  const keys = Object.keys(STAT_LABELS) as GearStat[];
  const preferred: GearStat =
    slot === "weapon"
      ? "attack"
      : slot === "boots" || slot === "horse"
        ? "speed"
        : slot === "armor" || slot === "helmet" || slot === "belt"
          ? "hp"
          : "crit";
  const chosen: GearStat[] = [preferred];
  const trait = gearTrait(variant);
  for (const key of trait?.stats ?? []) if (chosen.length < count && !chosen.includes(key)) chosen.push(key);
  const remaining = keys.filter((key) => !chosen.includes(key));
  while (chosen.length < count)
    chosen.push(
      remaining.splice(
        Math.min(remaining.length - 1, Math.floor(random() * remaining.length)),
        1,
      )[0],
    );
  const bonuses: Partial<GearStats> = {};
  for (const key of chosen) {
    const strength = (1 + tier * 0.3) * (0.85 + random() * 0.3) * ((trait?.stats as readonly GearStat[] | undefined)?.includes(key) ? 1.2 : 1);
    const base = {
      attack: 2 + level * 0.3,
      defense: 2 + level * 0.35,
      hp: 12 + level * 2,
      mp: 7 + level,
      crit: 1 + level / 80,
      speed: 1 + level / 25,
      critDamage: 2 + level / 45,
      attackSpeed: 1 + level / 90,
      lifeSteal: 1 + level / 160,
      armorPen: 1 + level / 100,
      damageReduction: 1 + level / 120,
      dodge: 1 + level / 160,
      hpRegen: 1 + level / 20,
      mpRegen: 1 + level / 60,
    }[key];
    bonuses[key] = Math.max(1, Math.floor(base * strength));
  }
  return bonuses;
}
export function validBonuses(value: unknown): boolean {
  return (
    value === undefined ||
    Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.entries(value).every(
          ([key, n]) =>
            Object.hasOwn(STAT_LABELS, key) &&
            typeof n === "number" &&
            Number.isInteger(n) &&
            n >= 0 &&
            n <= 1e6,
        ),
    )
  );
}
export interface DiscardFilter {
  maxRarity: number;
  maxLevel: number;
  weakerOnly: boolean;
}
export function discardCandidates<T extends EquipmentData>(
  owner: { inventory: T[]; equipment: Partial<Record<string, T>> },
  filter: DiscardFilter,
): T[] {
  return owner.inventory.filter(
    (item) =>
      !item.setId &&
      rarityTier(item.rarity) < rarityTier("Hoàng Kim") &&
      item.enhance === 0 &&
      rarityTier(item.rarity) <= filter.maxRarity &&
      item.level <= filter.maxLevel &&
      (!filter.weakerOnly ||
        Boolean(
          owner.equipment[item.slot] &&
            gearScore(item) <= gearScore(owner.equipment[item.slot]),
        )),
  );
}
