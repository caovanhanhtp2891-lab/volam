export const STAT_LABELS = {
  attack: "Tấn công", defense: "Phòng thủ", hp: "Sinh lực", mp: "Nội lực",
  crit: "Chí mạng", speed: "Tốc độ di chuyển",
  critDamage: "Sát thương chí mạng", attackSpeed: "Tốc độ đánh",
  lifeSteal: "Hút sinh lực", armorPen: "Xuyên giáp",
  damageReduction: "Giảm sát thương", dodge: "Né tránh",
  hpRegen: "Hồi sinh lực", mpRegen: "Hồi nội lực",
} as const;
export type GearStat = keyof typeof STAT_LABELS;
export type GearStats = Record<GearStat, number>;
export const emptyStats = (): GearStats => Object.fromEntries(
  Object.keys(STAT_LABELS).map(key => [key, 0]),
) as GearStats;
export const PERCENT_STATS: readonly GearStat[] = [
  "crit", "critDamage", "attackSpeed", "lifeSteal", "armorPen", "damageReduction", "dodge",
];
export function statUnit(key: GearStat): string {
  return PERCENT_STATS.includes(key) ? "%" : key === "hpRegen" || key === "mpRegen" ? "/giây" : "";
}
// Limits keep a large collection of enhanced affixes from granting immunity or
// unbounded attack rates. Display these effective values on the character sheet.
export function combatModifiers(stats: Partial<GearStats>) {
  const cap = (key: GearStat, limit: number) => Math.max(0, Math.min(limit, stats[key] ?? 0));
  return {
    critDamage: cap("critDamage", 150), attackSpeed: cap("attackSpeed", 80),
    lifeSteal: cap("lifeSteal", 20), armorPen: cap("armorPen", 60),
    damageReduction: cap("damageReduction", 50), dodge: cap("dodge", 35),
    hpRegen: cap("hpRegen", 1000), mpRegen: cap("mpRegen", 300),
  };
}
export function outgoingDamage(raw: number, defense: number, level: number, critical: boolean, stats: Partial<GearStats>): number {
  const mods = combatModifiers(stats), armor = Math.max(0, defense) * (1 - mods.armorPen / 100);
  const reduced = Math.max(1, Math.floor(raw * (1 - armor / (armor + 80 + level * 12))));
  return critical ? Math.floor(reduced * (1.5 + mods.critDamage / 100)) : reduced;
}
export function incomingDamage(amount: number, defense: number, level: number, stats: Partial<GearStats>): number {
  const armor = Math.max(0, defense), mods = combatModifiers(stats);
  return Math.max(1, Math.floor(amount * (1 - armor / (armor + 100 + level * 12)) * (1 - mods.damageReduction / 100)));
}
export function stolenLife(damage: number, remainingHp: number, stats: Partial<GearStats>): number {
  return Math.max(0, Math.min(damage, remainingHp)) * combatModifiers(stats).lifeSteal / 100;
}
export function secondaryScore(stats: GearStats): number {
  const mods = combatModifiers(stats);
  return stats.mp * .1 + stats.crit * 8 + stats.speed * 2 +
    mods.critDamage * 2 + mods.attackSpeed * 5 + mods.lifeSteal * 10 +
    mods.armorPen * 5 + mods.damageReduction * 8 + mods.dodge * 8 +
    mods.hpRegen * 2 + mods.mpRegen * 3;
}
