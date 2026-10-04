import { emptyStats, type GearStats, type GearStat } from "./gear-stats.ts";
import type { SectId } from "./sects.ts";
export interface PassiveDefinition {
  id: string;
  name: string;
  level: number;
  glyph: string;
  school?: SectId;
  bonuses: Partial<GearStats>;
}
export const MAX_PASSIVE_RANK = 10;
export const PASSIVES: readonly PassiveDefinition[] = [
  {
    id: "meridians",
    name: "Kinh Mạch Thông Suốt",
    level: 1,
    glyph: "☯",
    bonuses: { hp: 90, mp: 45 },
  },
  {
    id: "force",
    name: "Cường Công Tâm Pháp",
    level: 5,
    glyph: "⚔",
    bonuses: { attack: 12 },
  },
  {
    id: "iron",
    name: "Thiết Cốt Công",
    level: 10,
    glyph: "◆",
    bonuses: { defense: 9, damageReduction: 0.5 },
  },
  {
    id: "agility",
    name: "Thân Pháp Linh Hoạt",
    level: 20,
    glyph: "➶",
    bonuses: { speed: 2, dodge: 0.6 },
  },
  {
    id: "renewal",
    name: "Hồi Nguyên Quyết",
    level: 30,
    glyph: "❀",
    bonuses: { hpRegen: 2, mpRegen: 1 },
  },
  {
    id: "sharpness",
    name: "Phá Giáp Chân Kinh",
    level: 45,
    glyph: "✧",
    bonuses: { armorPen: 1.2, critDamage: 2 },
  },
  {
    id: "haste",
    name: "Liên Kích Tâm Pháp",
    level: 65,
    glyph: "ϟ",
    bonuses: { attackSpeed: 2, crit: 0.5 },
  },
  {
    id: "leech",
    name: "Huyết Mạch Trường Sinh",
    level: 90,
    glyph: "♥",
    bonuses: { lifeSteal: 0.6, hp: 100 },
  },
  {
    id: "shaolin",
    school: "thieu-lam",
    name: "Kim Cang Bất Hoại",
    level: 15,
    glyph: "☸",
    bonuses: { defense: 12, damageReduction: 0.8 },
  },
  {
    id: "tianwang",
    school: "thien-vuong",
    name: "Chiến Ý Thiên Vương",
    level: 15,
    glyph: "♜",
    bonuses: { attack: 14, hp: 70 },
  },
  {
    id: "tangmen",
    school: "duong-mon",
    name: "Ám Khí Tinh Thông",
    level: 15,
    glyph: "✥",
    bonuses: { crit: 0.9, armorPen: 1 },
  },
  {
    id: "wudu",
    school: "ngu-doc",
    name: "Vạn Độc Tâm Kinh",
    level: 15,
    glyph: "❧",
    bonuses: { attack: 12, lifeSteal: 0.6 },
  },
  {
    id: "emei",
    school: "nga-mi",
    name: "Phật Tâm Từ Hựu",
    level: 15,
    glyph: "❀",
    bonuses: { hpRegen: 3, mpRegen: 1.2 },
  },
  {
    id: "cuiyan",
    school: "thuy-yen",
    name: "Băng Tâm Ngọc Cốt",
    level: 15,
    glyph: "❄",
    bonuses: { mp: 70, critDamage: 2 },
  },
  {
    id: "gaibang",
    school: "cai-bang",
    name: "Long Chiến Vu Dã",
    level: 15,
    glyph: "♨",
    bonuses: { attack: 16, critDamage: 1.5 },
  },
  {
    id: "tianren",
    school: "thien-nhan",
    name: "Ma Diệm Tâm Pháp",
    level: 15,
    glyph: "♆",
    bonuses: { attack: 12, armorPen: 1.2 },
  },
  {
    id: "wudang",
    school: "vo-dang",
    name: "Thái Cực Tâm Kinh",
    level: 15,
    glyph: "☯",
    bonuses: { attack: 10, defense: 8, mpRegen: 0.5 },
  },
  {
    id: "kunlun",
    school: "con-lon",
    name: "Lôi Động Cửu Thiên",
    level: 15,
    glyph: "ϟ",
    bonuses: { attackSpeed: 2, crit: 0.8 },
  },
];
export type PassiveRanks = Record<string, number>;
export function validPassives(value: unknown): boolean {
  return (
    value === undefined ||
    Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.entries(value).every(
          ([id, rank]) =>
            PASSIVES.some((p) => p.id === id) &&
            Number.isInteger(rank) &&
            rank >= 0 &&
            rank <= MAX_PASSIVE_RANK,
        ),
    )
  );
}
export function passivesFor(school: SectId) {
  return PASSIVES.filter((p) => !p.school || p.school === school);
}
export function passiveBonuses(ranks: PassiveRanks, school: SectId): GearStats {
  const stats = emptyStats();
  for (const p of passivesFor(school))
    for (const [key, value] of Object.entries(p.bonuses))
      stats[key as GearStat] += value * (ranks[p.id] ?? 0);
  return stats;
}
export function allocatePassive(
  owner: { level: number; skillPoints: number; passiveRanks: PassiveRanks },
  school: SectId,
  id: string,
  refund = false,
): boolean {
  const def = passivesFor(school).find((p) => p.id === id),
    rank = owner.passiveRanks[id] ?? 0;
  if (
    !def ||
    (refund && rank <= 0) ||
    (!refund &&
      (owner.level < def.level ||
        rank >= MAX_PASSIVE_RANK ||
        owner.skillPoints < 1))
  )
    return false;
  owner.passiveRanks[id] = rank + (refund ? -1 : 1);
  owner.skillPoints += refund ? 1 : -1;
  return true;
}
