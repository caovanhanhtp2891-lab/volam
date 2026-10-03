import { SECTS, SECT_BY_FACTION } from "./sects.ts";
export type Element = "kim" | "moc" | "thuy" | "hoa" | "tho";
export type Archetype = "kim" | "hoa" | "thuy";
export type Attribute = "strength" | "dexterity" | "vitality" | "energy";

export const ELEMENTS: Record<Element, { name: string; color: string }> = {
  kim: { name: "Kim", color: "#e4c66a" },
  moc: { name: "Mộc", color: "#84b76b" },
  thuy: { name: "Thủy", color: "#74b8df" },
  hoa: { name: "Hỏa", color: "#e58460" },
  tho: { name: "Thổ", color: "#c59d6b" },
};
const FACTION_METADATA = [
  {
    id: "shaolin",
    element: "kim",
    archetype: "kim",
    emblem: "禪",
  },
  {
    id: "tianwang",
    element: "kim",
    archetype: "kim",
    emblem: "王",
  },
  {
    id: "tangmen",
    element: "moc",
    archetype: "hoa",
    emblem: "唐",
  },
  {
    id: "wudu",
    element: "moc",
    archetype: "hoa",
    emblem: "毒",
  },
  {
    id: "emei",
    element: "thuy",
    archetype: "thuy",
    emblem: "峨",
  },
  {
    id: "cuiyan",
    element: "thuy",
    archetype: "thuy",
    emblem: "翠",
  },
  {
    id: "gaibang",
    element: "hoa",
    archetype: "kim",
    emblem: "丐",
  },
  {
    id: "tianren",
    element: "hoa",
    archetype: "hoa",
    emblem: "忍",
  },
  {
    id: "wudang",
    element: "tho",
    archetype: "thuy",
    emblem: "武",
  },
  {
    id: "kunlun",
    element: "tho",
    archetype: "hoa",
    emblem: "崑",
  },
] as const;
export const FACTIONS = FACTION_METADATA.map(faction => {
  const school = SECTS[SECT_BY_FACTION[faction.id]];
  return { ...faction, name: school.name, role: school.title, skills: [school.kit.skill1.name, school.kit.skill2.name] as const, ultimate: school.kit.ultimate.name };
});
export type FactionId = (typeof FACTIONS)[number]["id"];
export function factionOf(id: string | undefined, archetype: Archetype = "kim") {
  return FACTIONS.find((faction) => faction.id === id) ?? FACTIONS.find((faction) => faction.archetype === archetype)!;
}

export const REGIONS = [
  "Hoa Sơn",
  "Kiếm Các Tây Bắc",
  "Tần Lăng",
  "Kiếm Các Tây Nam",
  "Thanh Thành Sơn",
  "Phục Ngưu Sơn Tây",
  "Phục Ngưu Sơn Đông",
  "Vũ Lăng Sơn",
  "Thục Cương Sơn",
  "Hoành Sơn",
  "Hoàng Hà Nguyên Đầu",
  "Dược Vương Cốc",
  "Sa Mạc",
  "Lâm Du Quan",
  "Chân Núi Trường Bạch",
  "Trường Bạch Sơn",
] as const;
export const MAX_STAGE = REGIONS.length * 10;
export const ATTRIBUTES: Record<Attribute, { name: string; description: string }> = {
  strength: { name: "Sức mạnh", description: "+2 công / điểm" },
  dexterity: { name: "Thân pháp", description: "+1 phòng, +1 tốc / điểm" },
  vitality: { name: "Sinh khí", description: "+12 sinh lực / điểm" },
  energy: { name: "Nội công", description: "+8 nội lực / điểm" },
};

export interface IdleProgress {
  enabled: boolean;
  stage: number;
  maxStage: number;
  wave: number;
  totalKills: number;
  bossKills: number;
  push: boolean;
  inTown: boolean;
  autoSkills: boolean;
  autoPotions: boolean;
  autoLoot: boolean;
  autoEquip: boolean;
  speed: 1 | 1.5 | 2.5;
  attributePoints: number;
  attributes: Record<Attribute, number>;
  dailyClaim: string;
  dailyCount: number;
  muted: boolean;
}
const integer = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
export function normalizeIdle(value?: Partial<IdleProgress>, legacy = false): IdleProgress {
  const source = value && typeof value === "object" ? value : {};
  const bool = (key: keyof IdleProgress, fallback: boolean) =>
    typeof source[key] === "boolean" ? (source[key] as boolean) : fallback;
  const maxStage = integer(source.maxStage, 1, 1, MAX_STAGE);
  return {
    enabled: bool("enabled", !legacy),
    stage: integer(source.stage, 1, 1, maxStage),
    maxStage,
    wave: integer(source.wave, 1, 1, 4),
    totalKills: integer(source.totalKills, 0, 0, 1e9),
    bossKills: integer(source.bossKills, 0, 0, 1e9),
    push: bool("push", true),
    inTown: bool("inTown", false),
    autoSkills: bool("autoSkills", true),
    autoPotions: bool("autoPotions", true),
    autoLoot: bool("autoLoot", true),
    autoEquip: bool("autoEquip", true),
    speed: source.speed === 1.5 || source.speed === 2.5 ? source.speed : 1,
    attributePoints: integer(source.attributePoints, 0, 0, 1e5),
    attributes: Object.fromEntries(
      Object.keys(ATTRIBUTES).map((key) => [key, integer(source.attributes?.[key as Attribute], 0, 0, 1e5)]),
    ) as Record<Attribute, number>,
    dailyClaim:
      typeof source.dailyClaim === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.dailyClaim) ? source.dailyClaim : "",
    dailyCount: integer(source.dailyCount, 0, 0, 1e5),
    muted: bool("muted", true),
  };
}
export function stageInfo(stage: number) {
  const number = integer(stage, 1, 1, MAX_STAGE);
  const region = Math.floor((number - 1) / 10);
  return {
    number,
    region,
    name: REGIONS[region],
    localStage: ((number - 1) % 10) + 1,
    level: number,
    boss: number % 10 === 0,
    element: Object.keys(ELEMENTS)[(number - 1) % 5] as Element,
  };
}
export function elementalMultiplier(attacker: Element, defender: Element): number {
  const defeats: Record<Element, Element> = { kim: "moc", moc: "tho", tho: "thuy", thuy: "hoa", hoa: "kim" };
  return defeats[attacker] === defender ? 1.25 : defeats[defender] === attacker ? 0.8 : 1;
}
export function completeWave(progress: IdleProgress): { stageCleared: boolean; advanced: boolean } {
  if (progress.wave < 4) {
    progress.wave++;
    return { stageCleared: false, advanced: false };
  }
  progress.wave = 1;
  const next = Math.min(MAX_STAGE, progress.stage + 1);
  progress.maxStage = Math.max(progress.maxStage, next);
  const advanced = progress.push && progress.stage < MAX_STAGE;
  if (advanced) progress.stage = next;
  return { stageCleared: true, advanced };
}
export function goToStage(progress: IdleProgress, stage: number): boolean {
  if (!Number.isInteger(stage) || stage < 1 || stage > progress.maxStage) return false;
  progress.stage = stage;
  progress.wave = 1;
  progress.inTown = false;
  return true;
}
export function spendAttribute(progress: IdleProgress, attribute: Attribute, delta: 1 | -1): boolean {
  if (!Object.hasOwn(ATTRIBUTES, attribute) || (delta !== 1 && delta !== -1)) return false;
  if (delta === 1) {
    if (progress.attributePoints < 1) return false;
    progress.attributePoints--;
    progress.attributes[attribute]++;
  } else {
    if (progress.attributes[attribute] < 1) return false;
    progress.attributes[attribute]--;
    progress.attributePoints++;
  }
  return true;
}
export function dailyDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function claimDaily(
  progress: IdleProgress,
  today = dailyDate(),
): { gold: number; stones: number; hp: number; mp: number } | null {
  if (progress.dailyClaim === today) return null;
  progress.dailyClaim = today;
  progress.dailyCount++;
  return { gold: 100 + ((progress.dailyCount - 1) % 7) * 50, stones: 2, hp: 3, mp: 2 };
}
export function offlineReward(lastSaved: unknown, now: number, stage: number) {
  const elapsed =
    typeof lastSaved === "number" && Number.isFinite(lastSaved)
      ? Math.max(0, Math.min(4 * 3600e3, now - lastSaved))
      : 0;
  const minutes = Math.floor(elapsed / 60000);
  return { minutes, xp: minutes * (6 + stageInfo(stage).level * 2), gold: minutes * (5 + stageInfo(stage).level) };
}
