import { ATTRIBUTES, type Attribute, type IdleProgress, type FactionId } from "./idle.ts";
import { SECTS, SECT_BY_FACTION, SKILL_KEYS, type SkillKey } from "./sects.ts";

export const MAX_SKILL_RANK = 20;
const LIMIT = 100_000;
export const ATTRIBUTE_BUILDS: Record<FactionId, readonly [number, number, number, number]> = {
  shaolin: [4, 1, 4, 1], tianwang: [5, 2, 2, 1], tangmen: [5, 3, 1, 1], wudu: [4, 1, 3, 2],
  emei: [3, 1, 4, 2], cuiyan: [4, 2, 2, 2], gaibang: [5, 1, 2, 2], tianren: [5, 2, 2, 1],
  wudang: [4, 2, 2, 2], kunlun: [4, 1, 3, 2],
};
export const SKILL_BUILDS: Record<FactionId, readonly [number, number, number]> = {
  shaolin: [5, 2, 3], tianwang: [5, 2, 3], tangmen: [5, 2, 3], wudu: [3, 3, 4],
  emei: [4, 3, 3], cuiyan: [4, 2, 4], gaibang: [4, 2, 4], tianren: [4, 3, 3],
  wudang: [4, 2, 4], kunlun: [4, 2, 4],
};
export type PointAmount = number | "max";
function amountToSpend(amount: PointAmount, available: number, room: number): number {
  if (amount === "max") return Math.max(0, Math.min(available, room));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= available && amount <= room ? amount : 0;
}
export function allocateAttribute(progress: IdleProgress, attribute: Attribute, amount: PointAmount): number {
  if (!Object.hasOwn(ATTRIBUTES, attribute)) return 0;
  const count = amountToSpend(amount, progress.attributePoints, LIMIT - progress.attributes[attribute]);
  progress.attributes[attribute] += count; progress.attributePoints -= count;
  return count;
}
export interface SkillPoints { level: number; factionId: FactionId; skillPoints: number; skillRanks: Record<SkillKey, number> }
export function allocateSkill(player: SkillPoints, skill: SkillKey, amount: PointAmount): number {
  if (!SKILL_KEYS.includes(skill) || !Object.hasOwn(SECT_BY_FACTION, player.factionId)) return 0;
  if (player.level < SECTS[SECT_BY_FACTION[player.factionId]].kit[skill].unlock) return 0;
  const count = amountToSpend(amount, player.skillPoints, MAX_SKILL_RANK - player.skillRanks[skill]);
  player.skillRanks[skill] += count; player.skillPoints -= count;
  return count;
}
// Balance toward the school's proportions, including previously assigned points.
// Existing points are never removed; unavailable skills retain unspent points.
function distribution<K extends string>(keys: readonly K[], weights: readonly number[], values: Record<K, number>, budget: number, cap: number, allowed: (key: K) => boolean): Record<K, number> {
  const plan = Object.fromEntries(keys.map(key => [key, 0])) as Record<K, number>;
  for (let n = 0; n < Math.min(LIMIT, Math.max(0, Math.floor(budget))); n++) {
    let chosen = -1, score = Infinity;
    keys.forEach((key, i) => {
      const value = values[key] + plan[key];
      if (allowed(key) && value < cap && value / weights[i] < score) { chosen = i; score = value / weights[i]; }
    });
    if (chosen < 0) break;
    plan[keys[chosen]]++;
  }
  return plan;
}
export function recommendAttributes(progress: IdleProgress, faction: FactionId): Record<Attribute, number> {
  return distribution(Object.keys(ATTRIBUTES) as Attribute[], ATTRIBUTE_BUILDS[faction], progress.attributes, progress.attributePoints, LIMIT, () => true);
}
export function recommendSkills(player: SkillPoints): Record<SkillKey, number> {
  const kit = SECTS[SECT_BY_FACTION[player.factionId]].kit;
  return distribution(SKILL_KEYS, SKILL_BUILDS[player.factionId], player.skillRanks, player.skillPoints, MAX_SKILL_RANK, key => player.level >= kit[key].unlock);
}
export function applyAttributeRecommendation(progress: IdleProgress, faction: FactionId): number {
  const plan = recommendAttributes(progress, faction);
  return (Object.keys(plan) as Attribute[]).reduce((sum, key) => sum + (plan[key] ? allocateAttribute(progress, key, plan[key]) : 0), 0);
}
export function applySkillRecommendation(player: SkillPoints): number {
  const plan = recommendSkills(player);
  return SKILL_KEYS.reduce((sum, key) => sum + (plan[key] ? allocateSkill(player, key, plan[key]) : 0), 0);
}
