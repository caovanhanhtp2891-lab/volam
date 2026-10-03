import { emptyStats, type GearStats } from "./equipment.ts";

export const MAX_LEVEL = 160;
export const XP_MULTIPLIERS = [1, 5, 10, 100, 1000] as const;
export const xpToNext = (level: number) => Math.floor(100 + 35 * level + 8 * level * level);
export interface GamePreferences {
  xpMultiplier: (typeof XP_MULTIPLIERS)[number];
  damageNumbers: boolean;
  titleVisible: boolean;
  titleEffects: boolean;
  minimap: boolean;
  skillEffects: "full" | "simple";
}
export function normalizePreferences(value?: Partial<GamePreferences>): GamePreferences {
  const source = value && typeof value === "object" ? value : {};
  const bool = (key: keyof GamePreferences) => typeof source[key] === "boolean" ? source[key] as boolean : true;
  return { skillEffects: source.skillEffects === "simple" ? "simple" : "full", xpMultiplier: XP_MULTIPLIERS.includes(source.xpMultiplier!) ? source.xpMultiplier! : 1, damageNumbers: bool("damageNumbers"), titleVisible: bool("titleVisible"), titleEffects: bool("titleEffects"), minimap: bool("minimap") };
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
export function applyExperience(player: ExperienceOwner, base: number, multiplier: GamePreferences["xpMultiplier"]): { amount: number; levels: number } {
  if (player.level >= MAX_LEVEL) { player.xp = 0; return { amount: 0, levels: 0 }; }
  const amount = Number.isFinite(base) ? Math.floor(Math.max(0, Math.min(1e9, base)) * (XP_MULTIPLIERS.includes(multiplier) ? multiplier : 1)) : 0;
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
export const REBIRTH_BONUS: Readonly<GearStats> = { attack: 80, defense: 50, hp: 600, mp: 120, crit: 0, speed: 4 };
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

export type TitleMotif = "leaf" | "arrows" | "diamonds" | "crown" | "runes" | "coins" | "sparks" | "swords" | "stars" | "sun" | "lotus" | "orbit";
type TitleMetric = "level" | "kills" | "elites" | "bosses" | "dungeons" | "golden" | "enhance" | "rebirths";
export interface TitleDefinition {
  id: string; name: string; color: string; glyph: string; motif: TitleMotif;
  metric: TitleMetric; target: number; requirement: string; effect: string; bonuses: Partial<GearStats>;
}
export const TITLES: readonly TitleDefinition[] = [
  { id: "novice", name: "Sơ Nhập Giang Hồ", color: "#97d69c", glyph: "❧", motif: "leaf", metric: "level", target: 1, requirement: "Gia nhập môn phái", effect: "Lá xanh xoay nhẹ", bonuses: { hp: 20 } },
  { id: "hunter", name: "Bách Chiến Hiệp Khách", color: "#86d6c5", glyph: "➶", motif: "arrows", metric: "kills", target: 100, requirement: "Hạ 100 quái", effect: "Bốn mũi kiếm xanh", bonuses: { attack: 15, speed: 2 } },
  { id: "elite", name: "Tinh Anh Liệp Thủ", color: "#ffc078", glyph: "◆", motif: "diamonds", metric: "elites", target: 5, requirement: "Hạ 5 quái tinh anh", effect: "Tinh thể hổ phách", bonuses: { attack: 20, defense: 10 } },
  { id: "boss", name: "Trảm Ma Đại Hiệp", color: "#ff9292", glyph: "♛", motif: "crown", metric: "bosses", target: 10, requirement: "Hạ 10 boss", effect: "Vương miện đỏ", bonuses: { attack: 35, hp: 200 } },
  { id: "dungeon", name: "Phá Trận Cao Thủ", color: "#9aaeff", glyph: "◇", motif: "runes", metric: "dungeons", target: 2, requirement: "Vượt cả Cổ Mộ và Trúc Lâm", effect: "Trận phù lam tím", bonuses: { defense: 20, mp: 60 } },
  { id: "golden", name: "Hoàng Kim Liệp Thủ", color: "#ffd15f", glyph: "✦", motif: "coins", metric: "golden", target: 1, requirement: "Hạ 1 boss Hoàng Kim", effect: "Kim tiền xoay vòng", bonuses: { attack: 40, crit: 3 } },
  { id: "forge", name: "Bách Luyện Thành Cương", color: "#ffae72", glyph: "⚒", motif: "sparks", metric: "enhance", target: 5, requirement: "Sở hữu trang bị +5", effect: "Tia lửa lò rèn", bonuses: { defense: 30, hp: 150 } },
  { id: "weapon", name: "Thần Binh Chi Chủ", color: "#edb0ff", glyph: "⚔", motif: "swords", metric: "enhance", target: 10, requirement: "Sở hữu trang bị +10", effect: "Song kiếm tím", bonuses: { attack: 60, crit: 4 } },
  { id: "master", name: "Võ Lâm Cao Thủ", color: "#88d4ff", glyph: "✧", motif: "stars", metric: "level", target: 50, requirement: "Từng đạt cấp 50", effect: "Tinh tú xanh lam", bonuses: { attack: 25, defense: 15, mp: 30 } },
  { id: "grandmaster", name: "Nhất Đại Tông Sư", color: "#ffe48c", glyph: "☼", motif: "sun", metric: "level", target: MAX_LEVEL, requirement: "Từng đạt cấp 160", effect: "Mặt trời kim sắc", bonuses: { attack: 80, hp: 400 } },
  { id: "reborn", name: "Niết Bàn Tái Sinh", color: "#ff9ed1", glyph: "❀", motif: "lotus", metric: "rebirths", target: 1, requirement: "Trùng sinh 1 lần", effect: "Sen hồng nở quanh chân", bonuses: { hp: 300, mp: 80, speed: 5 } },
  { id: "eternal", name: "Luân Hồi Chí Tôn", color: "#ccbbff", glyph: "☯", motif: "orbit", metric: "rebirths", target: 5, requirement: "Trùng sinh 5 lần", effect: "Hai quỹ đạo luân hồi", bonuses: { attack: 120, defense: 80, hp: 600, crit: 5 } },
];
export interface TitleContext {
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
