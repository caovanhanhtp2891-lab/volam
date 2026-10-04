import { emptyStats, type GearStats } from "./gear-stats.ts";

export const TERRITORIES = [
  { id: "bien-thanh", name: "Biên Thành", level: 10, merit: 80, color: "#96b29a", x: 18, y: 78, description: "Phá chốt biên quân, mở đường vào trung nguyên." },
  { id: "tuong-duong", name: "Tương Dương", level: 20, merit: 120, color: "#c1be86", x: 35, y: 68, description: "Đoạt thành bên Hán Thủy, khống chế tuyến vận lương." },
  { id: "dai-ly", name: "Đại Lý", level: 30, merit: 180, color: "#8fcac2", x: 16, y: 50, description: "Vượt hộ vệ nam cương, nắm giữ đường thương lộ." },
  { id: "phuong-tuong", name: "Phượng Tường", level: 45, merit: 260, color: "#dbad82", x: 37, y: 43, description: "Phá trận thiết kỵ, dựng cờ tại cửa tây." },
  { id: "thanh-do", name: "Thành Đô", level: 60, merit: 360, color: "#9ab77e", x: 55, y: 76, description: "Chiếm kho quân lương của đất Thục." },
  { id: "duong-chau", name: "Dương Châu", level: 80, merit: 500, color: "#8dbbd0", x: 73, y: 60, description: "Dẹp thủy quân, giữ cửa ngõ Giang Nam." },
  { id: "lam-an", name: "Lâm An", level: 100, merit: 700, color: "#c4b0dc", x: 83, y: 37, description: "Công phá cấm vệ, mở đường tiến kinh." },
  { id: "bien-kinh", name: "Biện Kinh", level: 125, merit: 900, color: "#e6c679", x: 61, y: 30, description: "Hạ đại tướng trấn kinh, nắm quyền triều chính." },
  { id: "hoang-thanh", name: "Hoàng Thành", level: 150, merit: 1200, color: "#ffda83", x: 49, y: 13, description: "Đánh bại Hoàng Thành Thống Lĩnh, thống nhất cửu thành." },
] as const;
export type TerritoryId = (typeof TERRITORIES)[number]["id"];
export const MILITARY_RANKS = [
  { id: "huong-truong", name: "Hương Trưởng", glyph: "鄉", merit: 80, lands: 1, color: "#9dc9a5", crest: "bamboo", bonuses: { attack: 5, defense: 4, hp: 60 } },
  { id: "huyen-lenh", name: "Huyện Lệnh", glyph: "令", merit: 200, lands: 2, color: "#85c9e5", crest: "mountain", bonuses: { attack: 10, defense: 8, hp: 120, mp: 30 } },
  { id: "thai-thu", name: "Thái Thú", glyph: "守", merit: 380, lands: 3, color: "#bba2ed", crest: "spear", bonuses: { attack: 20, defense: 15, hp: 200, mp: 50, crit: 3 } },
  { id: "tong-doc", name: "Tổng Đốc", glyph: "督", merit: 1000, lands: 5, color: "#e2a981", crest: "blade", bonuses: { attack: 35, defense: 25, hp: 300, mp: 70, armorPen: 4 } },
  { id: "dai-tuong-quan", name: "Đại Tướng Quân", glyph: "將", merit: 1500, lands: 6, color: "#ff7990", crest: "spear", bonuses: { attack: 50, defense: 35, hp: 450, mp: 100, attackSpeed: 6, critDamage: 10 } },
  { id: "thua-tuong", name: "Thừa Tướng", glyph: "相", merit: 3000, lands: 8, color: "#80efff", crest: "taiji", bonuses: { attack: 70, defense: 50, hp: 600, mp: 160, damageReduction: 6, mpRegen: 4 } },
  { id: "hoang-de", name: "Hoàng Đế", glyph: "帝", merit: 4300, lands: 9, color: "#ffe083", crest: "dragon", bonuses: { attack: 100, defense: 75, hp: 900, mp: 200, critDamage: 20, armorPen: 8, lifeSteal: 4 } },
] as const;
export type MilitaryRankId = (typeof MILITARY_RANKS)[number]["id"];
export interface MilitaryProgress {
  captured: TerritoryId[];
  seals: MilitaryRankId[];
  equipped: MilitaryRankId | null;
}
export const freshMilitary = (): MilitaryProgress => ({ captured: [], seals: [], equipped: null });
export const territoryOf = (id: string) => TERRITORIES.find(land => land.id === id);
export const militaryRankOf = (id: string | null | undefined) => MILITARY_RANKS.find(rank => rank.id === id);
export function militaryMerit(progress: MilitaryProgress): number {
  return TERRITORIES.filter(land => progress.captured.includes(land.id)).reduce((sum, land) => sum + land.merit, 0);
}
export function canClaimRank(progress: MilitaryProgress, id: string): boolean {
  const rank = militaryRankOf(id);
  return Boolean(rank && militaryMerit(progress) >= rank.merit && progress.captured.length >= rank.lands);
}
export function claimMilitaryRank(progress: MilitaryProgress, id: MilitaryRankId): boolean {
  if (!canClaimRank(progress, id) || progress.seals.includes(id)) return false;
  progress.seals.push(id);
  return true;
}
export function wearMilitarySeal(progress: MilitaryProgress, id: MilitaryRankId | null): boolean {
  if (id !== null && (!progress.seals.includes(id) || !canClaimRank(progress, id))) return false;
  if (progress.equipped === id) return false;
  progress.equipped = id;
  return true;
}
export function militaryBonuses(progress: MilitaryProgress): GearStats {
  const rank = militaryRankOf(progress.equipped);
  return rank && progress.seals.includes(rank.id) && canClaimRank(progress, rank.id)
    ? { ...emptyStats(), ...rank.bonuses } : emptyStats();
}
export function canChallengeTerritory(progress: MilitaryProgress, id: string, level: number): boolean {
  const index = TERRITORIES.findIndex(land => land.id === id);
  return index >= 0 && Number.isFinite(level) && level >= TERRITORIES[index].level &&
    !progress.captured.includes(TERRITORIES[index].id) &&
    (index === 0 || progress.captured.includes(TERRITORIES[index - 1].id));
}
export function captureTerritory(progress: MilitaryProgress, id: TerritoryId, level: number): boolean {
  if (!canChallengeTerritory(progress, id, level)) return false;
  progress.captured.push(id);
  return true;
}
export function validMilitary(value: unknown): boolean {
  if (value === undefined) return true; // Migrate old characters without awarding titles or seals.
  if (!value || typeof value !== "object") return false;
  const data = value as MilitaryProgress;
  if (!Array.isArray(data.captured) || !Array.isArray(data.seals) ||
    data.captured.length > TERRITORIES.length || data.seals.length > MILITARY_RANKS.length ||
    new Set(data.captured).size !== data.captured.length || new Set(data.seals).size !== data.seals.length) return false;
  // A campaign owns a contiguous route, never a capital without its approach.
  if (!data.captured.every((id, index) => id === TERRITORIES[index].id)) return false;
  if (!data.seals.every(id => typeof id === "string" && canClaimRank(data, id))) return false;
  return data.equipped === null || (typeof data.equipped === "string" && data.seals.includes(data.equipped) && canClaimRank(data, data.equipped));
}
export function normalizeMilitary(value?: unknown): MilitaryProgress {
  if (!value || !validMilitary(value)) return freshMilitary();
  const data = value as MilitaryProgress;
  return { captured: [...data.captured], seals: [...data.seals], equipped: data.equipped };
}
