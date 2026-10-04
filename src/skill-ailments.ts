import type { SectId, SkillDefinition } from "./sects.ts";

export interface ElementalAilments {
  dead?: boolean;
  burnUntil: number;
  burnNextTick: number;
  burnDamage: number;
  burnSect: SectId;
  corrodedUntil: number;
  defenseDownUntil: number;
}
export function applyElementalAilments(enemy: ElementalAilments, definition: Pick<SkillDefinition, "burn" | "corrode">, multiplier: number, now: number, sect: SectId): void {
  if (enemy.dead) return;
  if (definition.burn) {
    const active = enemy.burnUntil > now;
    if (!active) enemy.burnNextTick = now + 1000;
    enemy.burnDamage = active ? Math.max(enemy.burnDamage, multiplier * .2) : multiplier * .2;
    enemy.burnUntil = Math.max(enemy.burnUntil, now + definition.burn * 1000);
    enemy.burnSect = sect;
  }
  if (definition.corrode) {
    enemy.corrodedUntil = Math.max(enemy.corrodedUntil, now + definition.corrode * 1000);
    enemy.defenseDownUntil = Math.max(enemy.defenseDownUntil, enemy.corrodedUntil);
  }
}
export function takeBurnTick(enemy: ElementalAilments, now: number): number {
  if (enemy.dead || enemy.burnNextTick <= 0 || enemy.burnNextTick > now || enemy.burnNextTick > enemy.burnUntil) return 0;
  enemy.burnNextTick += 1000;
  return enemy.burnDamage;
}
