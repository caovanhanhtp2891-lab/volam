import { emptyStats, type GearStats } from "./gear-stats.ts";
import type { Element } from "./idle.ts";
import type { SectId as SchoolId } from "./sects.ts";

export const COMPANION_IDS = [
  "linh-lan",
  "tu-yen",
  "bich-dao",
  "hong-lien",
  "tuyet-nhi",
  "kim-van",
  "nguyet-anh",
  "loi-tam",
  "phuong-nghi",
  "thien-co",
] as const;
export type CompanionId = (typeof COMPANION_IDS)[number];
export interface CompanionDefinition {
  id: CompanionId;
  name: string;
  frame: number;
  level: number;
  region: number;
  realmName: string;
  element: Element;
  color: string;
  school: SchoolId;
  role: "attack" | "heal";
  skill: string;
  chance: number;
  pity: number;
  bonuses: GearStats;
}
const data = [
  [
    "Linh Lan",
    5,
    3,
    "Trúc Uyển Kỳ Duyên",
    "kim",
    "#a2e2c5",
    "vo-dang",
    "attack",
    "Thanh Trúc Kiếm",
    0.7,
    5,
  ],
  [
    "Tử Yên",
    12,
    4,
    "Tử Trúc Âm Cốc",
    "thuy",
    "#c0a3ff",
    "thuy-yen",
    "attack",
    "Tử Ngọc Tiêu Âm",
    0.64,
    5,
  ],
  [
    "Bích Dao",
    20,
    11,
    "Bích Liên Dược Viên",
    "moc",
    "#86e8aa",
    "nga-mi",
    "heal",
    "Bích Liên Hồi Xuân",
    0.58,
    6,
  ],
  [
    "Hồng Liên",
    35,
    6,
    "Hồng Liên Hỏa Cốc",
    "hoa",
    "#ff946d",
    "thien-nhan",
    "attack",
    "Hồng Liên Liệt Hỏa",
    0.52,
    6,
  ],
  [
    "Tuyết Nhi",
    50,
    14,
    "Tuyết Liên Băng Cung",
    "thuy",
    "#8edfff",
    "thuy-yen",
    "attack",
    "Băng Tâm Kiếm Vũ",
    0.46,
    7,
  ],
  [
    "Kim Vân",
    70,
    1,
    "Kim Vân Chiến Đài",
    "kim",
    "#ffe088",
    "thien-vuong",
    "attack",
    "Kim Vân Phá Trận",
    0.4,
    7,
  ],
  [
    "Nguyệt Anh",
    90,
    15,
    "Nguyệt Ảnh Thiên Hồ",
    "thuy",
    "#b8d5ff",
    "vo-dang",
    "attack",
    "Nguyệt Ảnh Xuyên Tâm",
    0.35,
    8,
  ],
  [
    "Lôi Tâm",
    110,
    7,
    "Lôi Âm Huyền Điện",
    "tho",
    "#c7a0ff",
    "con-lon",
    "attack",
    "Lôi Tâm Thiên Phạt",
    0.3,
    8,
  ],
  [
    "Phượng Nghi",
    135,
    12,
    "Phượng Hoàng Tiên Cảnh",
    "hoa",
    "#ffbe80",
    "cai-bang",
    "attack",
    "Phượng Hỏa Niết Bàn",
    0.25,
    9,
  ],
  [
    "Thiên Cơ",
    155,
    15,
    "Thiên Cơ Vân Đỉnh",
    "kim",
    "#fff1b3",
    "vo-dang",
    "attack",
    "Thiên Cơ Tinh Kiếm",
    0.2,
    10,
  ],
] as const;
export const COMPANIONS = Object.fromEntries(
  COMPANION_IDS.map((id, i) => {
    const [
      name,
      level,
      region,
      realmName,
      element,
      color,
      school,
      role,
      skill,
      chance,
      pity,
    ] = data[i];
    return [
      id,
      {
        id,
        name,
        frame: i,
        level,
        region,
        realmName,
        element,
        color,
        school,
        role,
        skill,
        chance,
        pity,
        bonuses: {
          ...emptyStats(),
          attack: 24 + i * 24 + level,
          defense: 16 + i * 18 + Math.floor(level * 0.7),
          hp: 200 + i * 200 + level * 12,
          mp: 80 + i * 30 + level * 2,
          crit: Math.round((1 + i * 0.3) * 10) / 10,
          hpRegen: role === "heal" ? 12 : 0,
          mpRegen: role === "heal" ? 3 : 0,
        },
      },
    ];
  }),
) as Record<CompanionId, CompanionDefinition>;
export interface CompanionProgress {
  owned: CompanionId[];
  equipped: CompanionId | null;
  affinity: Partial<Record<CompanionId, number>>;
  victories: Partial<Record<CompanionId, number>>;
  failures: Partial<Record<CompanionId, number>>;
}
export const freshCompanions = (): CompanionProgress => ({
  owned: [],
  equipped: null,
  affinity: {},
  victories: {},
  failures: {},
});
export function isCompanionId(value: unknown): value is CompanionId {
  return typeof value === "string" && Object.hasOwn(COMPANIONS, value);
}
export function validCompanions(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const p = value as CompanionProgress;
  if (
    !Array.isArray(p.owned) ||
    p.owned.length > 10 ||
    !p.owned.every(isCompanionId) ||
    new Set(p.owned).size !== p.owned.length
  )
    return false;
  if (
    p.equipped !== null &&
    (!isCompanionId(p.equipped) || !p.owned.includes(p.equipped))
  )
    return false;
  for (const key of ["affinity", "victories", "failures"] as const) {
    const counts = p[key];
    if (!counts || typeof counts !== "object" || Array.isArray(counts))
      return false;
    if (
      !Object.entries(counts).every(
        ([id, n]) =>
          isCompanionId(id) &&
          Number.isInteger(n) &&
          n! >= 0 &&
          n! <=
            (key === "affinity"
              ? 5
              : key === "failures"
                ? COMPANIONS[id].pity - 1
                : 1e9),
      )
    )
      return false;
  }
  return (
    p.owned.every((id) => (p.affinity[id] ?? 0) >= 1) &&
    Object.keys(p.affinity).every((id) => p.owned.includes(id as CompanionId))
  );
}
export function normalizeCompanions(
  value?: CompanionProgress,
): CompanionProgress {
  return value && validCompanions(value)
    ? {
        owned: [...value.owned],
        equipped: value.equipped,
        affinity: { ...value.affinity },
        victories: { ...value.victories },
        failures: { ...value.failures },
      }
    : freshCompanions();
}
export function equipCompanion(
  p: CompanionProgress,
  id: CompanionId | null,
): boolean {
  if (id !== null && (!isCompanionId(id) || !p.owned.includes(id)))
    return false;
  p.equipped = id;
  return true;
}
export function companionBonuses(p: CompanionProgress): GearStats {
  if (!p.equipped || !p.owned.includes(p.equipped)) return emptyStats();
  const def = COMPANIONS[p.equipped],
    scale = 1 + ((p.affinity[def.id] ?? 1) - 1) * 0.15;
  return Object.fromEntries(
    Object.entries(def.bonuses).map(([key, value]) => [
      key,
      Math.round(value * scale * 10) / 10,
    ]),
  ) as GearStats;
}
export interface CompanionCapture {
  id: CompanionId;
  captured: boolean;
  guaranteed: boolean;
  first: boolean;
  affinity: number;
  chance: number;
}
export function captureChance(p: CompanionProgress, id: CompanionId): number {
  return Math.min(0.95, COMPANIONS[id].chance + (p.failures[id] ?? 0) * 0.05);
}
// Call once after a completed trial. Merely entering, losing or retreating
// cannot change the collection, probability or victory count.
export function settleCompanionVictory(
  p: CompanionProgress,
  id: CompanionId,
  random = Math.random,
): CompanionCapture | null {
  if (!isCompanionId(id)) return null;
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample > 1) return null;
  const def = COMPANIONS[id],
    failures = p.failures[id] ?? 0,
    chance = captureChance(p, id),
    guaranteed = failures + 1 >= def.pity,
    captured = guaranteed || sample < chance,
    first = captured && !p.owned.includes(id);
  p.victories[id] = Math.min(1e9, (p.victories[id] ?? 0) + 1);
  if (captured) {
    if (first) p.owned.push(id);
    p.affinity[id] = Math.min(5, (p.affinity[id] ?? 0) + 1);
    p.failures[id] = 0;
  } else p.failures[id] = failures + 1;
  return {
    id,
    captured,
    guaranteed,
    first,
    affinity: p.affinity[id] ?? 0,
    chance,
  };
}
export function companionFrame(id: CompanionId, width: number, height: number) {
  const i = COMPANIONS[id].frame;
  return {
    x: ((i % 5) * width) / 5,
    y: (Math.floor(i / 5) * height) / 2,
    width: width / 5,
    height: height / 2,
  };
}
