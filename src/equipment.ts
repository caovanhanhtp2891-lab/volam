import type { Element } from "./idle";
import { gearTrait, setBonuses, type GearVariant, type GearIdentity, type SetId } from "./gear-catalog.ts";
import { STAT_LABELS, PERCENT_STATS, emptyStats, secondaryScore, type GearStat, type GearStats } from "./gear-stats.ts";
export { STAT_LABELS, emptyStats, statUnit, secondaryScore, combatModifiers, outgoingDamage, incomingDamage, stolenLife } from "./gear-stats.ts";
export type { GearStat, GearStats } from "./gear-stats.ts";
import { RARITIES, RARITY_COLORS, type Rarity } from "./rarity.ts";
export { RARITIES, RARITY_COLORS, RARITY_NAMES } from "./rarity.ts";
export type { Rarity } from "./rarity.ts";
import { socketStats, socketCount, type GemSpec } from "./gems.ts";
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
  balanceVersion?: number;
  gems?: (GemSpec | null)[];
}
export function rarityTier(rarity?: string): number {
  return Math.max(0, RARITIES.indexOf(rarity as Rarity));
}
export function equipmentGrade(level: number): string {
  return `Bậc ${Math.ceil(level / 10)}`;
}
export const EQUIPMENT_BALANCE_VERSION = 2;
export const RARITY_STRENGTH = [1, 1.4, 2, 3, 4.5, 6.8, 10] as const;
const UTILITY_STRENGTH = [1, 1.4, 1.9, 2.5, 3.2, 4, 5] as const;
const LEGACY_PRIMARY_STRENGTH = [1, 1.18, 1.42, 1.8, 2.5, 3.2, 4.2];
export function rarityStatStrength(rarity: Rarity, key: GearStat): number {
  return (PERCENT_STATS.includes(key) || key === "speed" ? UTILITY_STRENGTH : RARITY_STRENGTH)[rarityTier(rarity)];
}
export function equipmentPrimaryPower(level: number, rarity: Rarity, slot: string, random = Math.random): number {
  const base = slot === "weapon" ? 9 + level * 2.1 : 8 + level * 2.4;
  return Math.max(1, Math.floor(base * RARITY_STRENGTH[rarityTier(rarity)] * (.95 + random() * .1)));
}
// Preserve item identity, rolls and enhancement. Rebalance every storage location
// once so importing or loading the same updated save cannot multiply stats again.
export function migrateEquipmentBalance<T extends EquipmentData>(item: T): T {
  if (item.balanceVersion === EQUIPMENT_BALANCE_VERSION) return item;
  if (item.balanceVersion !== undefined && item.balanceVersion !== 0) throw new Error("save-invalid");
  const tier = rarityTier(item.rarity);
  item.power = Math.min(1e7, Math.ceil(item.power * RARITY_STRENGTH[tier] / LEGACY_PRIMARY_STRENGTH[tier]));
  if (item.bonuses) for (const key of Object.keys(item.bonuses) as GearStat[]) {
    item.bonuses[key] = Math.min(1e6, Math.ceil(item.bonuses[key]! * rarityStatStrength(item.rarity, key) / (1 + tier * .3)));
  }
  item.balanceVersion = EQUIPMENT_BALANCE_VERSION;
  return item;
}
const statBase = (level: number, key: GearStat): number => ({
  attack: 2 + level * .3, defense: 2 + level * .35, hp: 12 + level * 2, mp: 7 + level,
  crit: 1 + level / 80, speed: 1 + level / 25, critDamage: 2 + level / 45,
  attackSpeed: 1 + level / 90, lifeSteal: 1 + level / 160, armorPen: 1 + level / 100,
  damageReduction: 1 + level / 120, dodge: 1 + level / 160, hpRegen: 1 + level / 20, mpRegen: 1 + level / 60,
})[key];
export const MAX_ENHANCEMENT = 100;
export const ENHANCEMENT_CAPS = [10, 20, 30, 40, 60, 80, 100] as const;
export function enhancementCap(item: Pick<EquipmentData, "rarity" | "level">): number {
  return Math.min(ENHANCEMENT_CAPS[rarityTier(item.rarity)], Math.max(10, Math.min(100, Math.ceil(item.level / 10) * 10)));
}
// Threshold lines also exist on red equipment that already rolled all 14 stats.
// Values are deterministic; previews, reloads and failures cannot reroll them.
export function enhancementMilestones(item: EquipmentData) {
  const keys: readonly GearStat[] = ["attack", "hp", "defense", "mp", "armorPen", "critDamage", "lifeSteal", "damageReduction", "hpRegen", "crit"];
  const offset = item.slot === "weapon" ? 0 : ["armor", "helmet", "boots", "belt", "necklace", "ring", "ring2", "bracelet", "pendant", "horse"].indexOf(item.slot) + 1;
  return Array.from({ length: Math.floor(Math.max(enhancementCap(item), item.enhance) / 10) }, (_, i) => {
    const threshold = (i + 1) * 10, key = keys[(i + offset) % keys.length];
    const value = Math.max(1, Math.floor(statBase(item.level, key) * rarityStatStrength(item.rarity, key) * (.6 + threshold / 100)));
    return { threshold, key, value, active: item.enhance >= threshold };
  });
}
export function enhancementMultiplier(enhance: number, key: GearStat): number {
  const rank = Math.max(0, Math.min(MAX_ENHANCEMENT, Math.floor(enhance)));
  return 1 + (key === "speed" ? rank * .002 + rank ** 2 * .00001
    : PERCENT_STATS.includes(key) ? rank * .015 + rank ** 2 * .0001
    : rank * .05 + rank ** 2 * .0007);
}
const ENHANCEMENT_AFFIXES: readonly GearStat[] = ["hp", "mp", "attack", "defense", "crit", "armorPen", "attackSpeed", "damageReduction", "lifeSteal", "critDamage", "dodge", "hpRegen", "mpRegen", "speed"];
export function enhancementAffixes(item: EquipmentData): Partial<GearStats> {
  const missing = ENHANCEMENT_AFFIXES.filter(key => !(item.bonuses?.[key] ?? 0));
  return Object.fromEntries(missing.slice(0, Math.floor(Math.min(MAX_ENHANCEMENT, item.enhance) / 10)).map(key =>
    [key, Math.max(1, Math.floor(statBase(item.level, key) * rarityStatStrength(item.rarity, key) * .5))]));
}
export function gearStats(item: EquipmentData): GearStats {
  const stats = emptyStats();
  const rank = Math.max(0, Math.min(MAX_ENHANCEMENT, item.enhance));
  const affixes = enhancementAffixes(item);
  // Every successful rank improves the primary stat, even on low-level gear.
  stats[item.slot === "weapon" ? "attack" : "defense"] =
    item.power +
    (item.power > 0
      ? Math.max(rank, Math.ceil(item.power * (enhancementMultiplier(rank, "attack") - 1)))
      : 0);
  for (const key of Object.keys(stats) as GearStat[])
    stats[key] += Math.ceil(((item.bonuses?.[key] ?? 0) + (affixes[key] ?? 0)) * enhancementMultiplier(rank, key));
  for (const line of enhancementMilestones(item)) if (line.active) stats[line.key] += line.value;
  const gems = socketStats(item);
  for (const key of Object.keys(stats) as GearStat[]) stats[key] += gems[key];
  return stats;
}
export function enhancementInfo(item: EquipmentData) {
  const rank = Math.max(0, Math.min(MAX_ENHANCEMENT, item.enhance));
  return {
    cap: enhancementCap(item),
    sockets: socketCount(item),
    legacy: rank > enhancementCap(item),
    capped: rank >= enhancementCap(item),
    cost: 45 + rank * 35 + rank ** 2 * 8,
    stones: 1 + Math.floor(rank / 10),
    chance: .015 + .985 * (1 - Math.min(99, rank) / 99) ** 2.2,
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
    const strength = rarityStatStrength(rarity, key) * (0.85 + random() * 0.3) * ((trait?.stats as readonly GearStat[] | undefined)?.includes(key) ? 1.2 : 1);
    const base = statBase(level, key);
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
      !item.gems?.some(Boolean) &&
      rarityTier(item.rarity) <= filter.maxRarity &&
      item.level <= filter.maxLevel &&
      (!filter.weakerOnly ||
        Boolean(
          owner.equipment[item.slot] &&
            gearScore(item) <= gearScore(owner.equipment[item.slot]),
        )),
  );
}
