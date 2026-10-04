import type { Element } from "./idle";
import type { EquipmentData } from "./equipment";
import { emptyStats, PERCENT_STATS, type GearStats } from "./gear-stats.ts";

export const GEAR_VARIANTS = {
  sword: { slot: "weapon", name: "Trường Kiếm" },
  blade: { slot: "weapon", name: "Đại Đao" },
  spear: { slot: "weapon", name: "Ngân Thương" },
  staff: { slot: "weapon", name: "Pháp Trượng" },
  crossbow: { slot: "weapon", name: "Liên Nỏ" },
  fan: { slot: "weapon", name: "Ngọc Phiến" },
  axe: { slot: "weapon", name: "Khai Sơn Phủ" },
  halberd: { slot: "weapon", name: "Phương Thiên Kích" },
  daggers: { slot: "weapon", name: "Uyên Ương Song Nhận" },
  bow: { slot: "weapon", name: "Long Cốt Cung" },
  chakram: { slot: "weapon", name: "Nhật Nguyệt Luân" },
  flute: { slot: "weapon", name: "Bích Ngọc Tiêu" },
  whip: { slot: "weapon", name: "Cửu Tiết Tiên" },
  hammer: { slot: "weapon", name: "Lôi Đình Chùy" },
  dragonstaff: { slot: "weapon", name: "Bàn Long Côn" },
  firesaber: { slot: "weapon", name: "Liệt Diễm Đao" },
  poisondarts: { slot: "weapon", name: "Bạo Vũ Phi Châm" },
  frostsword: { slot: "weapon", name: "Hàn Ngọc Kiếm" },
  thundersword: { slot: "weapon", name: "Tử Điện Kiếm" },
  lotusfan: { slot: "weapon", name: "Liên Hoa Phiến" },
  plate: { slot: "armor", name: "Chiến Giáp" },
  robe: { slot: "armor", name: "Đạo Bào" },
  mail: { slot: "armor", name: "Khinh Giáp" },
  lamellar: { slot: "armor", name: "Long Lân Giáp" },
  cloak: { slot: "armor", name: "Dạ Hành Y" },
  brocade: { slot: "armor", name: "Cẩm Tú Bào" },
  dragonrobe: { slot: "armor", name: "Hàng Long Bào" },
  phoenixmail: { slot: "armor", name: "Phượng Vũ Giáp" },
  shadowrobe: { slot: "armor", name: "U Ảnh Y" },
  helm: { slot: "helmet", name: "Chiến Khôi" },
  crown: { slot: "helmet", name: "Ngọc Quan" },
  hood: { slot: "helmet", name: "Trùm Đầu" },
  dragonhelm: { slot: "helmet", name: "Long Giác Khôi" },
  veiledhat: { slot: "helmet", name: "Mịch Ly Đấu Lạp" },
  lotuscoronet: { slot: "helmet", name: "Liên Hoa Quan" },
  mask: { slot: "helmet", name: "Tu La Diện" },
  thundercrest: { slot: "helmet", name: "Tử Lôi Quan" },
  phoenixcrown: { slot: "helmet", name: "Phượng Linh Quan" },
  greaves: { slot: "boots", name: "Chiến Ngoa" },
  slippers: { slot: "boots", name: "Vân Hài" },
  cloudboots: { slot: "boots", name: "Phi Vân Ngoa" },
  sandboots: { slot: "boots", name: "Sa Mạc Ngoa" },
  lotusboots: { slot: "boots", name: "Liên Bộ Hài" },
  shadowboots: { slot: "boots", name: "Ảnh Phong Ngoa" },
  metalbelt: { slot: "belt", name: "Chiến Đai" },
  jadebelt: { slot: "belt", name: "Ngọc Đai" },
  silkbelt: { slot: "belt", name: "Lưu Vân Đai" },
  dragonbelt: { slot: "belt", name: "Bàn Long Đai" },
  starbelt: { slot: "belt", name: "Thất Tinh Đai" },
  emberbelt: { slot: "belt", name: "Hỏa Ngọc Đai" },
  chain: { slot: "necklace", name: "Bảo Liên" },
  amulet: { slot: "necklace", name: "Hộ Tâm Liên" },
  moonchain: { slot: "necklace", name: "Nguyệt Nha Liên" },
  fangchain: { slot: "necklace", name: "Lang Nha Liên" },
  lotuschain: { slot: "necklace", name: "Liên Tâm Liên" },
  venomchain: { slot: "necklace", name: "Bích Độc Liên" },
  rubyring: { slot: "ring", name: "Bảo Giới" },
  jadering: { slot: "ring", name: "Ngọc Giới" },
  dragonring: { slot: "ring", name: "Bàn Long Giới" },
  signetring: { slot: "ring", name: "Thiên Ấn Giới" },
  twinring: { slot: "ring", name: "Âm Dương Giới" },
  frostring: { slot: "ring", name: "Băng Tinh Giới" },
  phoenixring: { slot: "ring", name: "Phượng Huyết Giới" },
  guards: { slot: "bracelet", name: "Hộ Uyển" },
  beads: { slot: "bracelet", name: "Linh Châu" },
  silvercuff: { slot: "bracelet", name: "Ngân Nguyệt Trạc" },
  chainbracelet: { slot: "bracelet", name: "Thất Tinh Xuyến" },
  thunderbracer: { slot: "bracelet", name: "Lôi Văn Uyển" },
  lotusbeads: { slot: "bracelet", name: "Liên Hoa Châu" },
  seal: { slot: "pendant", name: "Ngọc Ấn" },
  talisman: { slot: "pendant", name: "Linh Phù" },
  gourd: { slot: "pendant", name: "Càn Khôn Hồ Lô" },
  mirror: { slot: "pendant", name: "Bát Quái Kính" },
  scroll: { slot: "pendant", name: "Thiên Thư" },
  bell: { slot: "pendant", name: "Trấn Hồn Linh" },
  dragonseal: { slot: "pendant", name: "Long Hồn Ấn" },
  taijicharm: { slot: "pendant", name: "Thái Cực Bội" },
  venomvial: { slot: "pendant", name: "Ngũ Độc Bình" },
  bay: { slot: "horse", name: "Tuấn Mã" },
  white: { slot: "horse", name: "Bạch Long Mã" },
  warhorse: { slot: "horse", name: "Thiết Giáp Mã" },
  ember: { slot: "horse", name: "Hỏa Vân Mã" },
  dapple: { slot: "horse", name: "Đạp Tuyết Mã" },
  night: { slot: "horse", name: "Ô Truy Mã" },
  meteorhammer: { slot: "weapon", name: "Lưu Tinh Chùy" },
  scimitar: { slot: "weapon", name: "Huyết Nguyệt Loan Đao" },
  iceglaive: { slot: "weapon", name: "Băng Phách Trường Kích" },
  sunblade: { slot: "weapon", name: "Thái Dương Thần Kiếm" },
  serpentstaff: { slot: "weapon", name: "Xà Vương Pháp Trượng" },
  jadebow: { slot: "weapon", name: "Bích Vân Thần Cung" },
  tigerarmor: { slot: "armor", name: "Bạch Hổ Chiến Giáp" },
  celestialrobe: { slot: "armor", name: "Tinh Hà Tiên Bào" },
  infernomail: { slot: "armor", name: "Xích Diễm Ma Giáp" },
  tigerhelm: { slot: "helmet", name: "Hổ Vương Khôi" },
  crystalcrown: { slot: "helmet", name: "Băng Tinh Tiên Quan" },
  demonmask: { slot: "helmet", name: "Quỷ Vương Diện" },
  stormboots: { slot: "boots", name: "Lôi Ảnh Ngoa" },
  frostgreaves: { slot: "boots", name: "Băng Phách Chiến Ngoa" },
  serpentbelt: { slot: "belt", name: "Bích Xà Đai" },
  aurorabelt: { slot: "belt", name: "Cực Quang Đai" },
  sunamulet: { slot: "necklace", name: "Thái Dương Hộ Tâm" },
  serpentchain: { slot: "necklace", name: "Xà Linh Liên" },
  thunderring: { slot: "ring", name: "Cửu Lôi Giới" },
  bloodring: { slot: "ring", name: "Huyết Sát Giới" },
  frostbracer: { slot: "bracelet", name: "Hàn Ngọc Hộ Uyển" },
  dragonbeads: { slot: "bracelet", name: "Long Hồn Châu" },
  phoenixseal: { slot: "pendant", name: "Phượng Hoàng Thần Ấn" },
  starcompass: { slot: "pendant", name: "Tinh Hà La Bàn" },
} as const;
export type GearVariant = keyof typeof GEAR_VARIANTS;
export const EQUIPMENT_SLOTS = [
  "weapon",
  "armor",
  "helmet",
  "boots",
  "belt",
  "necklace",
  "ring",
  "bracelet",
  "ring2",
  "pendant",
  "horse",
] as const;
export const SET_IDS = [
  "kim-phong",
  "thanh-truc",
  "han-nguyet",
  "xich-diem",
  "huyen-nham",
  "kim-cang", "ba-vuong", "bao-vu", "ngu-doc", "lien-hoa",
  "bang-phach", "hang-long", "ma-diem", "thai-cuc", "tu-loi",
] as const;
export type SetId = (typeof SET_IDS)[number];
export type SetCrest = "blade" | "bamboo" | "moon" | "flame" | "mountain" | "bell" | "spear" | "dart" | "serpent" | "lotus" | "crystal" | "dragon" | "taiji" | "thunder";
interface GearSet {
  name: string; element: Element; color: string; glyph: string;
  hidden: string; description: string; specialty: keyof GearStats;
  full: Partial<GearStats>; crest: SetCrest; weapon: GearVariant; sect?: string;
}
export const GEAR_SETS: Record<SetId, GearSet> = {
  "kim-phong": {
    name: "Kim Phong",
    element: "kim",
    color: "#ffe392",
    glyph: "金",
    hidden: "Kiếm Tâm",
    description: "Công kích và chí mạng",
    specialty: "crit",
    full: { attack: 30, crit: 5 },
    crest: "blade", weapon: "sword",
  },
  "thanh-truc": {
    name: "Thanh Trúc",
    element: "moc",
    color: "#87e7a5",
    glyph: "木",
    hidden: "Sinh Sinh Bất Tức",
    description: "Sinh lực và tốc độ",
    specialty: "speed",
    full: { hp: 250, speed: 12 },
    crest: "bamboo", weapon: "crossbow",
  },
  "han-nguyet": {
    name: "Hàn Nguyệt",
    element: "thuy",
    color: "#8dddff",
    glyph: "水",
    hidden: "Băng Tâm",
    description: "Nội lực và sinh lực",
    specialty: "mp",
    full: { hp: 160, mp: 120 },
    crest: "moon", weapon: "fan",
  },
  "xich-diem": {
    name: "Xích Diệm",
    element: "hoa",
    color: "#ff986d",
    glyph: "火",
    hidden: "Liệt Diễm",
    description: "Công kích và tốc độ",
    specialty: "attack",
    full: { attack: 40, speed: 8 },
    crest: "flame", weapon: "blade",
  },
  "huyen-nham": {
    name: "Huyền Nham",
    element: "tho",
    color: "#e7bf88",
    glyph: "土",
    hidden: "Bất Động Sơn",
    description: "Phòng ngự và sinh lực",
    specialty: "defense",
    full: { defense: 30, hp: 250 },
    crest: "mountain", weapon: "staff",
  },
  "kim-cang": { name: "Kim Cang", element: "kim", color: "#ffd777", glyph: "禪", sect: "Thiếu Lâm", crest: "bell", weapon: "dragonstaff", hidden: "Kim Cang Bất Hoại", description: "Giảm sát thương và hồi sinh lực", specialty: "damageReduction", full: { defense: 24, hp: 180, damageReduction: 6, hpRegen: 6 } },
  "ba-vuong": { name: "Bá Vương", element: "kim", color: "#79e7df", glyph: "戟", sect: "Thiên Vương", crest: "spear", weapon: "halberd", hidden: "Phá Trận Bá Vương", description: "Xuyên giáp và công kích", specialty: "armorPen", full: { attack: 30, hp: 120, armorPen: 8, attackSpeed: 6 } },
  "bao-vu": { name: "Bạo Vũ", element: "moc", color: "#62e6ba", glyph: "鏢", sect: "Đường Môn", crest: "dart", weapon: "poisondarts", hidden: "Bạo Vũ Truy Hồn", description: "Tốc độ đánh và chí mạng", specialty: "attackSpeed", full: { attack: 20, crit: 4, attackSpeed: 10, armorPen: 6 } },
  "ngu-doc": { name: "Ngũ Độc", element: "moc", color: "#bb90ff", glyph: "毒", sect: "Ngũ Độc", crest: "serpent", weapon: "daggers", hidden: "Vạn Độc Quy Tâm", description: "Hút sinh lực và hồi nội lực", specialty: "lifeSteal", full: { attack: 20, mp: 80, lifeSteal: 5, mpRegen: 4 } },
  "lien-hoa": { name: "Liên Hoa", element: "thuy", color: "#ffc2dc", glyph: "蓮", sect: "Nga Mi", crest: "lotus", weapon: "lotusfan", hidden: "Liên Tâm Hộ Thể", description: "Hồi sinh lực và giảm sát thương", specialty: "hpRegen", full: { hp: 220, mp: 100, hpRegen: 8, damageReduction: 5 } },
  "bang-phach": { name: "Băng Phách", element: "thuy", color: "#98ebff", glyph: "冰", sect: "Thúy Yên", crest: "crystal", weapon: "frostsword", hidden: "Băng Tâm Tuyết Ảnh", description: "Né tránh và sát thương chí mạng", specialty: "dodge", full: { mp: 100, speed: 8, dodge: 6, critDamage: 18 } },
  "hang-long": { name: "Hàng Long", element: "hoa", color: "#ffc066", glyph: "龍", sect: "Cái Bang", crest: "dragon", weapon: "dragonstaff", hidden: "Hàng Long Chân Khí", description: "Sát thương chí mạng và hút sinh lực", specialty: "critDamage", full: { attack: 35, hp: 140, critDamage: 20, lifeSteal: 4 } },
  "ma-diem": { name: "Ma Diệm", element: "hoa", color: "#ff7863", glyph: "焰", sect: "Thiên Nhẫn", crest: "flame", weapon: "firesaber", hidden: "Ma Diệm Phần Thiên", description: "Xuyên giáp và sát thương chí mạng", specialty: "armorPen", full: { attack: 35, armorPen: 8, critDamage: 15, attackSpeed: 6 } },
  "thai-cuc": { name: "Thái Cực", element: "tho", color: "#a4ddff", glyph: "☯", sect: "Võ Đang", crest: "taiji", weapon: "sword", hidden: "Âm Dương Hợp Nhất", description: "Hồi nội lực và giảm sát thương", specialty: "mpRegen", full: { attack: 20, mp: 120, mpRegen: 6, damageReduction: 6 } },
  "tu-loi": { name: "Tử Lôi", element: "tho", color: "#d2b4ff", glyph: "雷", sect: "Côn Lôn", crest: "thunder", weapon: "thundersword", hidden: "Cửu Thiên Lôi Đình", description: "Chí mạng và tốc độ đánh", specialty: "crit", full: { attack: 28, crit: 4, critDamage: 16, attackSpeed: 8 } },
};
export interface GearIdentity {
  variant?: GearVariant;
  element?: Element;
  setId?: SetId;
}
export const SET_THRESHOLDS = [2, 4, 6, 11] as const;
export interface SetStatus {
  id: SetId;
  pieces: number;
  grade: number;
  aligned: boolean;
  full: boolean;
  bonuses: GearStats;
}
const blank = emptyStats;
export function variantsForSlot(slot: string): GearVariant[] {
  return (Object.keys(GEAR_VARIANTS) as GearVariant[]).filter(
    (key) => GEAR_VARIANTS[key].slot === (slot === "ring2" ? "ring" : slot),
  );
}
export function variantOf(item: {
  slot: string;
  variant?: GearVariant;
}): GearVariant {
  return item.variant && variantsForSlot(item.slot).includes(item.variant)
    ? item.variant
    : (variantsForSlot(item.slot)[0] ?? "sword");
}
export function setForElement(element: Element): SetId {
  return SET_IDS.find((id) => GEAR_SETS[id].element === element)!;
}
export function rollGearIdentity(
  slot: string,
  rarity: string,
  preferred?: Element,
  random = Math.random,
): GearIdentity {
  const pick = <T>(values: readonly T[]) =>
    values[Math.min(values.length - 1, Math.floor(random() * values.length))];
  const element =
    preferred && random() < 0.6
      ? preferred
      : pick(["kim", "moc", "thuy", "hoa", "tho"] as const);
  const setId =
    ["Hoàng Kim", "Truyền Thuyết", "Thần Thoại"].includes(rarity) || random() < (rarity === "Thường" ? 0.2 : 0.65)
      ? pick(SET_IDS.filter(id => GEAR_SETS[id].element === element))
      : undefined;
  return {
    variant: pick(variantsForSlot(slot)),
    element,
    ...(setId ? { setId } : {}),
  };
}
export function validGearIdentity(
  item: { slot: string } & GearIdentity,
): boolean {
  return (
    (item.variant === undefined ||
      (typeof item.variant === "string" &&
        Object.hasOwn(GEAR_VARIANTS, item.variant) &&
        variantsForSlot(item.slot).includes(item.variant))) &&
    (item.element === undefined ||
      ["kim", "moc", "thuy", "hoa", "tho"].includes(item.element)) &&
    (item.setId === undefined ||
      (typeof item.setId === "string" &&
        Object.hasOwn(GEAR_SETS, item.setId) &&
        item.element === GEAR_SETS[item.setId].element))
  );
}
export function setStatuses(
  items: readonly (EquipmentData & GearIdentity)[],
  element?: Element,
): SetStatus[] {
  const slots = new Map(
    items
      .filter(
        (item) =>
          validGearIdentity(item) &&
          (EQUIPMENT_SLOTS as readonly string[]).includes(item.slot),
      )
      .map((item) => [item.slot, item]),
  );
  return SET_IDS.flatMap((id) => {
    const pieces = [...slots.values()].filter((item) => item.setId === id);
    if (!pieces.length) return [];
    const count = pieces.length,
      grade = Math.max(
        1,
        Math.min(...pieces.map((item) => Math.ceil(item.level / 10))),
      ),
      set = GEAR_SETS[id];
    const stats = blank();
    if (count >= 2) {
      stats.attack += 6 * grade;
      stats.defense += 4 * grade;
    }
    if (count >= 4) {
      stats.hp += 90 * grade;
      stats.mp += 24 * grade;
    }
    if (count >= 6) {
      if (set.specialty === "crit") stats.crit += 3 + Math.floor(grade / 4);
      else if (set.specialty === "speed") stats.speed += 8 + grade * 2;
      else if (PERCENT_STATS.includes(set.specialty)) stats[set.specialty] += (set.specialty === "critDamage" ? 10 : 3) + Math.floor(grade / 4);
      else if (set.specialty === "hpRegen" || set.specialty === "mpRegen") stats[set.specialty] += (set.specialty === "hpRegen" ? 4 : 2) * grade;
      else stats[set.specialty] += (set.specialty === "mp" ? 80 : 14) * grade;
    }
    if (count === 11)
      for (const [key, value] of Object.entries(set.full))
        stats[key as keyof GearStats] +=
          value! * (PERCENT_STATS.includes(key as keyof GearStats) || key === "speed" ? 1 : grade);
    const aligned = element === set.element;
    if (aligned)
      for (const key of Object.keys(stats) as (keyof GearStats)[])
        stats[key] = Math.ceil(stats[key] * 1.2);
    return [
      { id, pieces: count, grade, aligned, full: count === 11, bonuses: stats },
    ];
  });
}
export function setBonuses(
  items: readonly (EquipmentData & GearIdentity)[],
  element?: Element,
): GearStats {
  const stats = blank();
  for (const set of setStatuses(items, element))
    for (const key of Object.keys(stats) as (keyof GearStats)[])
      stats[key] += set.bonuses[key];
  return stats;
}

// Relic blueprints favor a distinct build while retaining rarity affix limits.
export const GEAR_TRAITS = {
  wind: { name: "Cuồng Phong", stats: ["speed", "attackSpeed"] },
  blood: { name: "Huyết Sát", stats: ["attack", "lifeSteal"] },
  fortress: { name: "Thiết Bích", stats: ["hp", "defense", "damageReduction"] },
  frost: { name: "Băng Tâm", stats: ["mp", "mpRegen"] },
  storm: { name: "Thiên Lôi", stats: ["crit", "critDamage"] },
  vital: { name: "Dưỡng Sinh", stats: ["hp", "hpRegen"] },
} as const;
export const RELIC_TRAITS = {
  meteorhammer: "storm",
  scimitar: "blood",
  iceglaive: "frost",
  sunblade: "storm",
  serpentstaff: "vital",
  jadebow: "wind",
  tigerarmor: "fortress",
  celestialrobe: "frost",
  infernomail: "blood",
  tigerhelm: "fortress",
  crystalcrown: "frost",
  demonmask: "blood",
  stormboots: "wind",
  frostgreaves: "fortress",
  serpentbelt: "vital",
  aurorabelt: "frost",
  sunamulet: "storm",
  serpentchain: "vital",
  thunderring: "storm",
  bloodring: "blood",
  frostbracer: "fortress",
  dragonbeads: "vital",
  phoenixseal: "blood",
  starcompass: "wind",
} as const;
export function gearTrait(variant?: GearVariant) {
  const key = variant && RELIC_TRAITS[variant as keyof typeof RELIC_TRAITS];
  return key ? GEAR_TRAITS[key] : undefined;
}
const RELIC_WEAPON_BASES: Partial<Record<GearVariant, GearVariant>> = {
  meteorhammer: "hammer",
  scimitar: "blade",
  iceglaive: "halberd",
  sunblade: "sword",
  serpentstaff: "staff",
  jadebow: "bow",
};
export function weaponBaseVariant(variant: GearVariant): GearVariant {
  return RELIC_WEAPON_BASES[variant] ?? variant;
}
