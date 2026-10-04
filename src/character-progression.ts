import { emptyStats, type GearStats } from "./equipment.ts";

import { MAX_LEVEL, normalizeExperienceBuff } from "./level-limits.ts";
export { MAX_LEVEL } from "./level-limits.ts";
export const xpToNext = (level: number) => Math.floor(100 + 35 * level + 8 * level * level);
export interface GamePreferences {
  damageNumbers: boolean;
  titleVisible: boolean;
  titleEffects: boolean;
  minimap: boolean;
  skillEffects: "full" | "simple";
}
export function normalizePreferences(value?: Partial<GamePreferences>): GamePreferences {
  const source = value && typeof value === "object" ? value : {};
  const bool = (key: keyof GamePreferences) => typeof source[key] === "boolean" ? source[key] as boolean : true;
  return { skillEffects: source.skillEffects === "simple" ? "simple" : "full", damageNumbers: bool("damageNumbers"), titleVisible: bool("titleVisible"), titleEffects: bool("titleEffects"), minimap: bool("minimap") };
}
export interface Journey {
  rebirths: number;
  kills: number;
  elites: number;
  bosses: number;
  highestLevel: number;
  unlockedTitles: string[];
  activeTitle: string;
}
const integer = (value: unknown, fallback = 0, max = 1e9) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback;
export function normalizeJourney(value?: Partial<Journey>, history = { level: 1, kills: 0, bosses: 0 }): Journey {
  const source = value && typeof value === "object" ? value : {};
  const unlockedTitles = Array.isArray(source.unlockedTitles) ? [...new Set(source.unlockedTitles.filter(id => TITLES.some(title => title.id === id)))] : [];
  const activeTitle = typeof source.activeTitle === "string" && unlockedTitles.includes(source.activeTitle) ? source.activeTitle : "";
  return { rebirths: integer(source.rebirths, 0, 1e6), kills: Math.max(integer(source.kills), integer(history.kills)), elites: integer(source.elites), bosses: Math.max(integer(source.bosses), integer(history.bosses)), highestLevel: Math.max(1, integer(source.highestLevel, 1, MAX_LEVEL), integer(history.level, 1, MAX_LEVEL)), unlockedTitles, activeTitle };
}
export interface ExperienceOwner {
  level: number; xp: number; attack: number; defense: number; skillPoints: number;
  idle: { attributePoints: number };
}
export function applyExperience(player: ExperienceOwner, base: number, multiplier = 1): { amount: number; levels: number } {
  if (player.level >= MAX_LEVEL) { player.xp = 0; return { amount: 0, levels: 0 }; }
  const amount = Number.isFinite(base) ? Math.floor(Math.max(0, Math.min(1e9, base)) * normalizeExperienceBuff(multiplier)) : 0;
  player.xp += amount;
  let levels = 0;
  while (player.level < MAX_LEVEL && player.xp >= xpToNext(player.level)) {
    player.xp -= xpToNext(player.level);
    player.level++; levels++; player.attack += 3; player.defense += 2;
    player.skillPoints++; player.idle.attributePoints += 5;
  }
  if (player.level === MAX_LEVEL) player.xp = 0;
  return { amount, levels };
}
export const REBIRTH_BONUS: Readonly<GearStats> = { ...emptyStats(), attack: 80, defense: 50, hp: 600, mp: 120, crit: 0, speed: 4 };
export function rebirthBonuses(count: number): GearStats {
  return Object.fromEntries(Object.entries(REBIRTH_BONUS).map(([key, value]) => [key, value * integer(count, 0, 1e6)])) as unknown as GearStats;
}
export function rebirthCharacter(player: { level: number; xp: number; attack: number; defense: number; journey: Journey }, base: { attack: number; defense: number }): boolean {
  if (player.level !== MAX_LEVEL || player.journey.rebirths >= 1e6) return false;
  player.journey.highestLevel = MAX_LEVEL;
  player.journey.rebirths++;
  player.level = 1; player.xp = 0;
  player.attack = base.attack; player.defense = base.defense;
  return true;
}

export type TitleMotif = "leaf" | "arrows" | "diamonds" | "crown" | "runes" | "coins" | "sparks" | "swords" | "stars" | "sun" | "lotus" | "orbit" | "dragon" | "phoenix" | "constellation" | "blade-wheel" | "clouds" | "halo";
type TitleMetric = "level" | "kills" | "elites" | "bosses" | "dungeons" | "golden" | "enhance" | "rebirths" | "tower" | "lands" | "dungeonRuns";
export interface TitleDefinition {
  id: string; name: string; color: string; glyph: string; motif: TitleMotif;
  rarity: 1 | 2 | 3 | 4 | 5; metric: TitleMetric; target: number; requirement: string; effect: string; bonuses: Partial<GearStats>;
}
export const TITLES: readonly TitleDefinition[] = [
  { id: "novice", rarity: 1, name: "Sơ Nhập Giang Hồ", color: "#97d69c", glyph: "❧", motif: "leaf", metric: "level", target: 1, requirement: "Gia nhập môn phái", effect: "Lá xanh xoay nhẹ", bonuses: { hp: 20 } },
  { id: "hunter", rarity: 2, name: "Bách Chiến Hiệp Khách", color: "#86d6c5", glyph: "➶", motif: "arrows", metric: "kills", target: 100, requirement: "Hạ 100 quái", effect: "Bốn mũi kiếm xanh", bonuses: { attack: 15, speed: 2 } },
  { id: "elite", rarity: 2, name: "Tinh Anh Liệp Thủ", color: "#ffc078", glyph: "◆", motif: "diamonds", metric: "elites", target: 5, requirement: "Hạ 5 quái tinh anh", effect: "Tinh thể hổ phách", bonuses: { attack: 20, defense: 10 } },
  { id: "boss", rarity: 3, name: "Trảm Ma Đại Hiệp", color: "#ff9292", glyph: "♛", motif: "crown", metric: "bosses", target: 10, requirement: "Hạ 10 boss", effect: "Vương miện đỏ", bonuses: { attack: 35, hp: 200 } },
  { id: "dungeon", rarity: 2, name: "Phá Trận Cao Thủ", color: "#9aaeff", glyph: "◇", motif: "runes", metric: "dungeons", target: 2, requirement: "Vượt cả Cổ Mộ và Trúc Lâm", effect: "Trận phù lam tím", bonuses: { defense: 20, mp: 60 } },
  { id: "golden", rarity: 3, name: "Hoàng Kim Liệp Thủ", color: "#ffd15f", glyph: "✦", motif: "coins", metric: "golden", target: 1, requirement: "Hạ 1 boss Hoàng Kim", effect: "Kim tiền xoay vòng", bonuses: { attack: 40, crit: 3 } },
  { id: "forge", rarity: 2, name: "Bách Luyện Thành Cương", color: "#ffae72", glyph: "⚒", motif: "sparks", metric: "enhance", target: 5, requirement: "Sở hữu trang bị +5", effect: "Tia lửa lò rèn", bonuses: { defense: 30, hp: 150 } },
  { id: "weapon", rarity: 4, name: "Thần Binh Chi Chủ", color: "#edb0ff", glyph: "⚔", motif: "swords", metric: "enhance", target: 10, requirement: "Sở hữu trang bị +10", effect: "Song kiếm tím", bonuses: { attack: 60, crit: 4 } },
  { id: "master", rarity: 3, name: "Võ Lâm Cao Thủ", color: "#88d4ff", glyph: "✧", motif: "stars", metric: "level", target: 50, requirement: "Từng đạt cấp 50", effect: "Tinh tú xanh lam", bonuses: { attack: 25, defense: 15, mp: 30 } },
  { id: "grandmaster", rarity: 4, name: "Nhất Đại Tông Sư", color: "#ffe48c", glyph: "☼", motif: "sun", metric: "level", target: MAX_LEVEL, requirement: `Từng đạt cấp ${MAX_LEVEL}`, effect: "Mặt trời kim sắc", bonuses: { attack: 80, hp: 400 } },
  { id: "reborn", rarity: 3, name: "Niết Bàn Tái Sinh", color: "#ff9ed1", glyph: "❀", motif: "lotus", metric: "rebirths", target: 1, requirement: "Trùng sinh 1 lần", effect: "Sen hồng nở quanh chân", bonuses: { hp: 300, mp: 80, speed: 5 } },
  { id: "eternal", rarity: 5, name: "Luân Hồi Chí Tôn", color: "#ccbbff", glyph: "☯", motif: "orbit", metric: "rebirths", target: 5, requirement: "Trùng sinh 5 lần", effect: "Hai quỹ đạo luân hồi", bonuses: { attack: 120, defense: 80, hp: 600, crit: 5 } },
  { id: "young-hero", rarity: 2, name: "Thiếu Niên Anh Kiệt", color: "#9cebcf", glyph: "✧", motif: "clouds", metric: "level", target: 20, requirement: "Từng đạt cấp 20", effect: "Mây ngọc nâng bước", bonuses: { attack: 8, hp: 35 } },
  { id: "sect-master", rarity: 4, name: "Chưởng Môn Đương Đại", color: "#c8b2ff", glyph: "⚔", motif: "blade-wheel", metric: "level", target: 100, requirement: "Từng đạt cấp 100", effect: "Kiếm trận xoay với viền tử kim", bonuses: { attack: 55, defense: 35, mp: 90 } },
  { id: "veteran", rarity: 3, name: "Thiên Chiến Hiệp Khách", color: "#6ee4e0", glyph: "➶", motif: "arrows", metric: "kills", target: 1000, requirement: "Hạ 1.000 quái", effect: "Bát phương kiếm khí và tinh quang", bonuses: { attack: 35, defense: 20, crit: 2 } },
  { id: "war-saint", rarity: 4, name: "Vạn Chiến Võ Thánh", color: "#ff9a72", glyph: "✹", motif: "blade-wheel", metric: "kills", target: 10000, requirement: "Hạ 10.000 quái", effect: "Luân kiếm đỏ vàng, hào quang chiến thần", bonuses: { attack: 90, armorPen: 5, crit: 4 } },
  { id: "elite-master", rarity: 3, name: "Tinh Anh Khắc Tinh", color: "#ffce96", glyph: "◆", motif: "diamonds", metric: "elites", target: 50, requirement: "Hạ 50 quái tinh anh", effect: "Kim cương ba tầng và sao băng", bonuses: { attack: 40, damageReduction: 3 } },
  { id: "demon-slayer", rarity: 5, name: "Tru Ma Chiến Thần", color: "#ff6f9e", glyph: "龍", motif: "dragon", metric: "elites", target: 500, requirement: "Hạ 500 quái tinh anh", effect: "Huyết long, trận phù và tinh quang", bonuses: { attack: 140, critDamage: 15, lifeSteal: 5 } },
  { id: "boss-master", rarity: 4, name: "Bách Ma Trảm Tướng", color: "#ffa069", glyph: "♛", motif: "crown", metric: "bosses", target: 100, requirement: "Hạ 100 boss", effect: "Vương miện hỏa kim và tia sáng", bonuses: { attack: 100, defense: 60 } },
  { id: "mythic-hunter", rarity: 5, name: "Thần Ma Bất Bại", color: "#ff83e3", glyph: "鳳", motif: "phoenix", metric: "bosses", target: 1000, requirement: "Hạ 1.000 boss", effect: "Phượng hoàng tung cánh trên trận sáng", bonuses: { attack: 180, hp: 900, crit: 7 } },
  { id: "immortal", rarity: 5, name: "Bất Diệt Chân Nhân", color: "#9aefff", glyph: "☯", motif: "halo", metric: "rebirths", target: 10, requirement: "Trùng sinh 10 lần", effect: "Thiên quang ba vòng, phù văn bất diệt", bonuses: { defense: 100, hp: 1200, mp: 200 } },
  { id: "reincarnation-sovereign", rarity: 5, name: "Vạn Kiếp Chí Tôn", color: "#d4a6ff", glyph: "✺", motif: "constellation", metric: "rebirths", target: 20, requirement: "Trùng sinh 20 lần", effect: "Tinh hà bát cực và thiên quang", bonuses: { attack: 240, armorPen: 8, dodge: 4 } },
  { id: "tower-guardian", rarity: 2, name: "Hộ Tháp Anh Hùng", color: "#bfa1ef", glyph: "塔", motif: "runes", metric: "tower", target: 10, requirement: "Vượt tầng tháp 10", effect: "Tháp trận tím sáng", bonuses: { defense: 20, hp: 120 } },
  { id: "sky-climber", rarity: 4, name: "Lăng Tiêu Chiến Tướng", color: "#b5d7ff", glyph: "✧", motif: "clouds", metric: "tower", target: 50, requirement: "Vượt tầng tháp 50", effect: "Vân long tinh quang, mây trời bốn lớp", bonuses: { attack: 80, defense: 50, speed: 6 } },
  { id: "sky-sovereign", rarity: 5, name: "Trấn Thiên Chí Tôn", color: "#edd0ff", glyph: "龍", motif: "dragon", metric: "tower", target: 100, requirement: "Vượt tầng tháp 100", effect: "Thiên long tím vàng và trận sao", bonuses: { attack: 160, defense: 100, critDamage: 12 } },
  { id: "city-lord", rarity: 3, name: "Tam Thành Bá Chủ", color: "#77e9b7", glyph: "⚑", motif: "crown", metric: "lands", target: 3, requirement: "Chiếm 3 lãnh thổ", effect: "Vương miện ngọc bích và chiến kỳ", bonuses: { hp: 450, attack: 50 } },
  { id: "unifier", rarity: 5, name: "Cửu Châu Nhất Thống", color: "#ffe18a", glyph: "帝", motif: "dragon", metric: "lands", target: 9, requirement: "Chiếm đủ 9 lãnh thổ", effect: "Kim long hộ quốc, tinh quang đế vương", bonuses: { attack: 160, hp: 900, defense: 90 } },
  { id: "expedition-master", rarity: 4, name: "Bách Luyện Bí Cảnh", color: "#91cffb", glyph: "◇", motif: "constellation", metric: "dungeonRuns", target: 100, requirement: "Hoàn thành tổng 100 lượt phụ bản", effect: "Bắc đẩu dẫn lối và vòng phù lam", bonuses: { hp: 600, dodge: 3, attack: 80 } },
];
export const TITLE_RARITIES = ["", "Thường", "Hiếm", "Quý", "Truyền Thuyết", "Chí Tôn"] as const;
export interface TitleContext {
  tower?: { highestFloor: number }; military?: { captured: readonly string[] };
  level: number; journey: Journey; dungeonClears: Record<string, number>; goldenClears: string[];
  inventory: { enhance: number }[]; equipment: Record<string, { enhance: number }>; pendingItems: { enhance: number }[];
}
export function titleProgress(title: TitleDefinition, player: TitleContext): number {
  const journey = player.journey;
  switch (title.metric) {
    case "level": return Math.max(player.level, journey.highestLevel);
    case "kills": return journey.kills;
    case "elites": return journey.elites;
    case "bosses": return journey.bosses;
    case "rebirths": return journey.rebirths;
    case "tower": return player.tower?.highestFloor ?? 0;
    case "lands": return player.military?.captured.length ?? 0;
    case "dungeonRuns": return Object.values(player.dungeonClears).reduce((sum, count) => sum + count, 0);
    case "dungeons": return ["tomb", "bamboo"].filter(id => player.dungeonClears[id] > 0).length;
    case "golden": return player.goldenClears.length;
    case "enhance": return Math.max(0, ...[...player.inventory, ...Object.values(player.equipment), ...player.pendingItems].map(item => item.enhance));
  }
}
export function unlockTitles(player: TitleContext): TitleDefinition[] {
  player.journey.highestLevel = Math.max(player.journey.highestLevel, player.level);
  const unlocked = TITLES.filter(title => !player.journey.unlockedTitles.includes(title.id) && titleProgress(title, player) >= title.target);
  player.journey.unlockedTitles.push(...unlocked.map(title => title.id));
  return unlocked;
}
export function wornTitle(journey: Journey): TitleDefinition | undefined {
  return journey.unlockedTitles.includes(journey.activeTitle) ? TITLES.find(title => title.id === journey.activeTitle) : undefined;
}
export function progressionBonuses(journey: Journey): GearStats {
  const result = rebirthBonuses(journey.rebirths), title = wornTitle(journey);
  for (const key of Object.keys(emptyStats()) as (keyof GearStats)[]) result[key] += title?.bonuses[key] ?? 0;
  return result;
}
