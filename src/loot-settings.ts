import { RARITIES, rarityTier, discardCandidates, type EquipmentData } from "./equipment.ts";

export interface LootSettings {
  minRarity: number;
  minGrade: number;
  autoDiscard: boolean;
  maxDiscardRarity: number;
  maxDiscardGrade: number;
  weakerOnly: boolean;
}
export const freshLootSettings = (): LootSettings => ({
  minRarity: 0, minGrade: 1, autoDiscard: false,
  maxDiscardRarity: 1, maxDiscardGrade: 16, weakerOnly: true,
});
export function validLootSettings(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as LootSettings;
  return Number.isInteger(p.minRarity) && p.minRarity >= 0 && p.minRarity < RARITIES.length
    && Number.isInteger(p.minGrade) && p.minGrade >= 1 && p.minGrade <= 16
    && Number.isInteger(p.maxDiscardRarity) && p.maxDiscardRarity >= 0 && p.maxDiscardRarity <= 3
    && Number.isInteger(p.maxDiscardGrade) && p.maxDiscardGrade >= 1 && p.maxDiscardGrade <= 16
    && typeof p.autoDiscard === "boolean" && typeof p.weakerOnly === "boolean";
}
export function normalizeLootSettings(value?: unknown): LootSettings {
  return value && validLootSettings(value) ? { ...(value as LootSettings) } : freshLootSettings();
}
// Special rewards and valuable drops always survive restrictive pickup filters.
export function protectedLoot(item: EquipmentData): boolean {
  return Boolean(item.setId) || item.enhance > 0 || rarityTier(item.rarity) >= 4;
}
export function acceptsLoot(item: EquipmentData, settings: LootSettings): boolean {
  return protectedLoot(item) || (rarityTier(item.rarity) >= settings.minRarity
    && Math.ceil(item.level / 10) >= settings.minGrade);
}
export function autoDiscardItems<T extends EquipmentData>(
  owner: { inventory: T[]; equipment: Partial<Record<string, T>> }, settings: LootSettings,
): T[] {
  if (!settings.autoDiscard) return [];
  const items = discardCandidates(owner, {
    maxRarity: settings.maxDiscardRarity,
    maxLevel: settings.maxDiscardGrade * 10,
    weakerOnly: settings.weakerOnly,
  });
  const ids = new Set(items.map(item => item.id));
  owner.inventory = owner.inventory.filter(item => !ids.has(item.id));
  return items;
}
