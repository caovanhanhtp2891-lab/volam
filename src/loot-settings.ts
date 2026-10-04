import {
  RARITIES,
  rarityTier,
  discardCandidates,
  type EquipmentData,
} from "./equipment.ts";

import { MAX_GEAR_GRADE } from "./level-limits.ts";
export interface LootSettings {
  minRarity: number;
  minGrade: number;
  autoDiscard: boolean;
  maxDiscardRarity: number;
  maxDiscardGrade: number;
  weakerOnly: boolean;
  protectSpecial?: boolean;
}
export const freshLootSettings = (): LootSettings => ({
  minRarity: 0,
  minGrade: 1,
  autoDiscard: false,
  maxDiscardRarity: 1,
  maxDiscardGrade: 16,
  weakerOnly: true,
  protectSpecial: true,
});
export function validLootSettings(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as LootSettings;
  return (
    Number.isInteger(p.minRarity) &&
    p.minRarity >= 0 &&
    p.minRarity < RARITIES.length &&
    Number.isInteger(p.minGrade) &&
    p.minGrade >= 1 &&
    p.minGrade <= MAX_GEAR_GRADE &&
    Number.isInteger(p.maxDiscardRarity) &&
    p.maxDiscardRarity >= 0 &&
    p.maxDiscardRarity < RARITIES.length &&
    Number.isInteger(p.maxDiscardGrade) &&
    p.maxDiscardGrade >= 1 &&
    p.maxDiscardGrade <= MAX_GEAR_GRADE &&
    typeof p.autoDiscard === "boolean" &&
    typeof p.weakerOnly === "boolean" &&
    (p.protectSpecial === undefined || typeof p.protectSpecial === "boolean")
  );
}
export function normalizeLootSettings(value?: unknown): LootSettings {
  return value && validLootSettings(value)
    ? { ...freshLootSettings(), ...(value as LootSettings) }
    : freshLootSettings();
}
export function acceptsLoot(
  item: EquipmentData,
  settings: LootSettings,
): boolean {
  return (
    rarityTier(item.rarity) >= settings.minRarity &&
    Math.ceil(item.level / 10) >= settings.minGrade
  );
}
export function autoDiscardItems<T extends EquipmentData>(
  owner: { inventory: T[]; equipment: Partial<Record<string, T>> },
  settings: LootSettings,
): T[] {
  if (!settings.autoDiscard) return [];
  const items = discardCandidates(owner, {
    maxRarity: settings.maxDiscardRarity,
    maxLevel: settings.maxDiscardGrade * 10,
    weakerOnly: settings.weakerOnly,
    protectSpecial: settings.protectSpecial !== false,
  });
  const ids = new Set(items.map((item) => item.id));
  owner.inventory = owner.inventory.filter((item) => !ids.has(item.id));
  return items;
}
