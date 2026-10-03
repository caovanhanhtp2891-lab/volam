import type { EquipmentData } from "./equipment.ts";
import { rarityTier } from "./equipment.ts";
export const BASIC_HORSE_PRICE = 200;
export function mountSpeedBonus(horse?: EquipmentData): number {
  return horse?.slot === "horse"
    ? 30 +
        rarityTier(horse.rarity) * 5 +
        Math.max(1, Math.min(16, Math.ceil(horse.level / 10)))
    : 0;
}
export function ridingSpeed(
  base: number,
  horse?: EquipmentData,
  mounted = false,
): number {
  return mounted && horse?.slot === "horse"
    ? Math.round(base * (1 + mountSpeedBonus(horse) / 100))
    : base;
}
export function normalizeMounted(
  value: unknown,
  horse?: EquipmentData,
): boolean {
  return value === true && horse?.slot === "horse";
}
