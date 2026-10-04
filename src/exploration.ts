import { REGIONS, canEnterStage, type IdleProgress } from "./idle.ts";
import { MONSTERS, faunaOf, type SpeciesId } from "./bestiary.ts";
export const EXPLORATION_WIDTH = 3600,
  EXPLORATION_HEIGHT = 2400;
export interface ExplorationProgress {
  active: boolean;
  region: number;
  zone: number;
  returnTraining: boolean;
  returnTown: boolean;
}
export const freshExploration = (): ExplorationProgress => ({
  active: false,
  region: 0,
  zone: 0,
  returnTraining: true,
  returnTown: false,
});
export function validExploration(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const p = value as ExplorationProgress;
  return (
    typeof p.active === "boolean" &&
    typeof p.returnTraining === "boolean" &&
    typeof p.returnTown === "boolean" &&
    Number.isInteger(p.region) &&
    p.region >= 0 &&
    p.region < 16 &&
    Number.isInteger(p.zone) &&
    p.zone >= 0 &&
    p.zone < 4
  );
}
export function normalizeExploration(value?: unknown): ExplorationProgress {
  return value && validExploration(value)
    ? { ...(value as ExplorationProgress) }
    : freshExploration();
}
const locations = [
  ["Sơn Lộ", "Rừng Thông", "Cổ Tự", "Đỉnh Ngân Lang"],
  ["Chân Núi", "Hẻm Kiếm", "Trại Thương Binh", "Huyết Hổ Lĩnh"],
  ["Mộ Khẩu", "Hành Lang Khô Cốt", "Thi Điện", "Trấn Mộ Cung"],
  ["Bờ Suối", "Trúc Lâm", "Động Độc Chu", "Xà Vương Đàm"],
  ["Sơn Môn", "Mộc Linh Viên", "Thanh Vân Quán", "Hổ Vương Đài"],
  ["Nanh Trư Lâm", "Hùng Cốc", "Thiết Nhai", "Ngân Lang Lĩnh"],
  ["Lục Lâm Trại", "Hỏa Thạch Cốc", "Lôi Ưng Nhai", "Xích Ma Đài"],
  ["Hoa Cốc", "U Linh Lâm", "Độc Trùng Động", "Bích Xà Cung"],
  ["Trà Sơn", "Giáp Trùng Viên", "Thạch Linh Cốc", "Huyết Hổ Động"],
  ["Thiền Lộ", "Mộc Yêu Lâm", "Thạch Binh Trại", "Trấn Sơn Đài"],
  ["Bến Hoàng Hà", "Ghềnh Kim Điêu", "Thủy Thạch Cốc", "Long Uyên"],
  ["Dược Viên", "Bách Độc Lâm", "Huyết Y Cốc", "Xà Hậu Cung"],
  ["Cát Ngoại", "Sa Trùng Địa", "Liệt Hỏa Di Tích", "Sa Hạt Vương Đình"],
  ["Biên Lộ", "Lục Lâm Doanh", "Thiết Giáp Quan", "Xích Ma Thành"],
  ["Tuyết Lộ", "Bạch Viên Lâm", "Băng Lang Cốc", "Viên Vương Lĩnh"],
  ["Chân Băng Nhai", "Tuyết Báo Lĩnh", "Lôi Ưng Phong", "Thương Long Đỉnh"],
];
export interface ExplorationZone {
  index: number;
  name: string;
  x: number;
  y: number;
  minLevel: number;
  maxLevel: number;
  boss: boolean;
}
export function explorationZones(region: number): ExplorationZone[] {
  const r = Number.isInteger(region) && region >= 0 && region < 16 ? region : 0;
  const points = [
      [650, 1750],
      [650, 650],
      [2700, 650],
      [2700, 1750],
    ],
    levels = [
      [1, 3],
      [4, 5],
      [6, 8],
      [9, 10],
    ];
  return points.map(([x, y], index) => ({
    index,
    name: locations[r][index],
    x,
    y,
    minLevel: r * 10 + levels[index][0],
    maxLevel: r * 10 + levels[index][1],
    boss: index === 3,
  }));
}
export function canExplore(
  region: number,
  level: number,
  idle: IdleProgress,
): boolean {
  return (
    Number.isInteger(region) &&
    region >= 0 &&
    region < REGIONS.length &&
    canEnterStage(idle, region * 10 + 1, level)
  );
}
export function zoneAt(
  region: number,
  point: { x: number; y: number },
): ExplorationZone {
  return explorationZones(region).reduce((best, z) =>
    Math.hypot(z.x - point.x, z.y - point.y) <
    Math.hypot(best.x - point.x, best.y - point.y)
      ? z
      : best,
  );
}
export function explorationSpawns(region: number) {
  const fauna = faunaOf(region),
    offsets = [
      [-140, -100],
      [150, -100],
      [-230, 60],
      [230, 70],
      [-90, 190],
      [110, 190],
    ];
  return explorationZones(region).flatMap((zone) => {
    const units = offsets.map(([dx, dy], i) => {
      const species =
        fauna.species[(i + zone.index * 2) % fauna.species.length];
      return {
        id: `explore-${region}-${zone.index}-${i}`,
        name: MONSTERS[species].name,
        species,
        kind: "normal" as "normal" | "elite" | "boss",
        x: zone.x + dx,
        y: zone.y + dy,
        level: zone.minLevel + (i % (zone.maxLevel - zone.minLevel + 1)),
        zone: zone.index,
      };
    });
    if (zone.index > 0) {
      const species = fauna.species[(zone.index + 1) % fauna.species.length];
      units.push({
        id: `explore-${region}-${zone.index}-elite`,
        name: `${MONSTERS[species].name} · Tinh anh`,
        species,
        kind: "elite",
        x: zone.x,
        y: zone.y - 250,
        level: zone.maxLevel,
        zone: zone.index,
      });
    }
    if (zone.boss) {
      const species: SpeciesId = fauna.boss;
      units.push({
        id: `explore-${region}-boss`,
        name: MONSTERS[species].name,
        species,
        kind: "boss",
        x: zone.x + 90,
        y: zone.y - 380,
        level: zone.maxLevel,
        zone: zone.index,
      });
    }
    return units;
  });
}
