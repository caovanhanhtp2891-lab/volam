export const RARITIES = ["Thường", "Tốt", "Hiếm", "Cực phẩm", "Hoàng Kim"] as const;
export type Rarity = (typeof RARITIES)[number];
export const RARITY_COLORS: Record<Rarity, string> = {
  Thường: "#a6b3bd", Tốt: "#73d19b", Hiếm: "#64b5f6", "Cực phẩm": "#cf91ff", "Hoàng Kim": "#ffd35a",
};
export const STAT_LABELS = { attack: "Tấn công", defense: "Phòng thủ", hp: "Sinh lực", mp: "Nội lực", crit: "Chí mạng", speed: "Tốc độ" } as const;
export type GearStat = keyof typeof STAT_LABELS;
export type GearStats = Record<GearStat, number>;
export interface EquipmentData {
  id: string; slot: string; rarity: Rarity; level: number; power: number; enhance: number;
  bonuses?: Partial<GearStats>;
}
export const emptyStats = (): GearStats => ({ attack: 0, defense: 0, hp: 0, mp: 0, crit: 0, speed: 0 });
export function rarityTier(rarity?: string): number {
  return Math.max(0, RARITIES.indexOf(rarity as Rarity));
}
export function equipmentGrade(level: number): string {
  return `Bậc ${Math.ceil(level / 10)}`;
}
// Old items retain their primary power; bonus rolls only exist on new drops.
export function gearStats(item: EquipmentData): GearStats {
  const stats = emptyStats();
  const scale = (value: number) => value + Math.floor(value * item.enhance * .04);
  stats[item.slot === "weapon" ? "attack" : "defense"] = scale(item.power);
  for (const key of Object.keys(stats) as GearStat[]) stats[key] += scale(item.bonuses?.[key] ?? 0);
  return stats;
}
export function totalGearStats(items: readonly EquipmentData[]): GearStats {
  const total = emptyStats();
  for (const item of items) {
    const stats = gearStats(item);
    for (const key of Object.keys(total) as GearStat[]) total[key] += stats[key];
  }
  return total;
}
// Defense also grants 1.45 HP in the existing character rules. Use the same
// weights as combat power, including usable MP, crit percentage and movement.
export function gearScore(item?: EquipmentData): number {
  if (!item) return 0;
  const s = gearStats(item);
  return s.attack * 3 + s.defense * 2 + (s.hp + s.defense * 1.45) * .15 + s.mp * .1 + s.crit * 8 + s.speed * 2;
}
export function equipBestGear<T extends EquipmentData>(owner: { inventory: T[]; equipment: Partial<Record<string, T>> }): number {
  let changed = 0;
  for (const slot of new Set(owner.inventory.map(item => item.slot))) {
    const old = owner.equipment[slot];
    let best = old;
    for (const item of owner.inventory) if (item.slot === slot && gearScore(item) > gearScore(best)) best = item;
    if (!best || best === old) continue;
    owner.inventory.splice(owner.inventory.indexOf(best), 1);
    owner.equipment[slot] = best;
    if (old) owner.inventory.push(old);
    changed++;
  }
  return changed;
}
export function rollGearBonuses(level: number, rarity: Rarity, slot: string, random = Math.random): Partial<GearStats> {
  const tier = rarityTier(rarity);
  const count = [1, 2, 3, 4, 6][tier];
  const keys = Object.keys(STAT_LABELS) as GearStat[];
  const preferred: GearStat = slot === "weapon" ? "attack" : slot === "boots" || slot === "horse" ? "speed" : slot === "armor" || slot === "helmet" || slot === "belt" ? "hp" : "crit";
  const chosen: GearStat[] = [preferred];
  const remaining = keys.filter(key => key !== preferred);
  while (chosen.length < count) chosen.push(remaining.splice(Math.min(remaining.length - 1, Math.floor(random() * remaining.length)), 1)[0]);
  const bonuses: Partial<GearStats> = {};
  for (const key of chosen) {
    const strength = (1 + tier * .3) * (.85 + random() * .3);
    const base = ({ attack: 2 + level * .3, defense: 2 + level * .35, hp: 12 + level * 2, mp: 7 + level, crit: 1 + level / 80, speed: 1 + level / 25 })[key];
    bonuses[key] = Math.max(1, Math.floor(base * strength));
  }
  return bonuses;
}
export function validBonuses(value: unknown): boolean {
  return value === undefined || Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([key, n]) => Object.hasOwn(STAT_LABELS, key) && typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 1e6));
}
export interface DiscardFilter { maxRarity: number; maxLevel: number; weakerOnly: boolean }
export function discardCandidates<T extends EquipmentData>(owner: { inventory: T[]; equipment: Partial<Record<string, T>> }, filter: DiscardFilter): T[] {
  return owner.inventory.filter(item => item.rarity !== "Hoàng Kim" && item.enhance === 0 && rarityTier(item.rarity) <= filter.maxRarity && item.level <= filter.maxLevel && (!filter.weakerOnly || Boolean(owner.equipment[item.slot] && gearScore(item) <= gearScore(owner.equipment[item.slot]))));
}
