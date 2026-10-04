import { incomingDamage, outgoingDamage, type GearStat, type GearStats } from "./gear-stats.ts";

// Gear rolls and saved base attributes keep their original units. Combat
// resources use a larger scale; normalize only at armor and power boundaries.
export const COMBAT_STAT_SCALE = 100;
export const COMBAT_SCALE_VERSION = 1;
export const toCombat = (value: number) => value * COMBAT_STAT_SCALE;
export const toCore = (value: number) => value / COMBAT_STAT_SCALE;
export function displayedStat(key: GearStat, value: number): number {
  return ["attack", "defense", "hp", "mp", "hpRegen", "mpRegen"].includes(key) ? toCombat(value) : value;
}
export function scaledOutgoingDamage(raw: number, defense: number, level: number, critical: boolean, stats: Partial<GearStats>): number {
  return toCombat(outgoingDamage(toCore(raw), toCore(defense), level, critical, stats));
}
export function scaledIncomingDamage(raw: number, defense: number, level: number, stats: Partial<GearStats>): number {
  return toCombat(incomingDamage(toCore(raw), toCore(defense), level, stats));
}
interface CombatSnapshot {
  combatScaleVersion?: number;
  player: { hp: number; maxHp: number; mp: number; maxMp: number; shield?: number };
  enemies?: { hp: number; maxHp: number; attack: number; defense: number }[];
  wildElite?: { hp: number };
}
// Mutating a validated snapshot makes repeated import/load validation idempotent.
export function migrateCombatScale<T extends CombatSnapshot>(snapshot: T): T {
  const version = snapshot.combatScaleVersion === undefined ? 0 : snapshot.combatScaleVersion;
  if (version !== 0 && version !== COMBAT_SCALE_VERSION) throw new Error("save-invalid");
  if (version === COMBAT_SCALE_VERSION) return snapshot;
  const fields: [object, string][] = [
    ...["hp", "maxHp", "mp", "maxMp"].map(key => [snapshot.player, key] as [object, string]),
    ...(snapshot.player.shield === undefined ? [] : [[snapshot.player, "shield"] as [object, string]]),
    ...(snapshot.enemies ?? []).flatMap(enemy => ["hp", "maxHp", "attack", "defense"].map(key => [enemy, key] as [object, string])),
    ...(snapshot.wildElite ? [[snapshot.wildElite, "hp"] as [object, string]] : []),
  ];
  for (const [object, key] of fields) {
    const value = (object as Record<string, number>)[key];
    if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER / COMBAT_STAT_SCALE) throw new Error("save-invalid");
  }
  for (const [object, key] of fields) (object as Record<string, number>)[key] = toCombat((object as Record<string, number>)[key]);
  snapshot.combatScaleVersion = COMBAT_SCALE_VERSION;
  return snapshot;
}
