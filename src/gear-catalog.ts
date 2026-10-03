import type { Element } from "./idle";
import type { EquipmentData, GearStats } from "./equipment";

export const GEAR_VARIANTS = {
  sword: { slot: "weapon", name: "Trường Kiếm" },
  blade: { slot: "weapon", name: "Đại Đao" },
  spear: { slot: "weapon", name: "Ngân Thương" },
  staff: { slot: "weapon", name: "Pháp Trượng" },
  crossbow: { slot: "weapon", name: "Liên Nỏ" },
  fan: { slot: "weapon", name: "Ngọc Phiến" },
  plate: { slot: "armor", name: "Chiến Giáp" },
  robe: { slot: "armor", name: "Đạo Bào" },
  mail: { slot: "armor", name: "Khinh Giáp" },
  helm: { slot: "helmet", name: "Chiến Khôi" },
  crown: { slot: "helmet", name: "Ngọc Quan" },
  hood: { slot: "helmet", name: "Trùm Đầu" },
  greaves: { slot: "boots", name: "Chiến Ngoa" },
  slippers: { slot: "boots", name: "Vân Hài" },
  metalbelt: { slot: "belt", name: "Chiến Đai" },
  jadebelt: { slot: "belt", name: "Ngọc Đai" },
  chain: { slot: "necklace", name: "Bảo Liên" },
  amulet: { slot: "necklace", name: "Hộ Tâm Liên" },
  rubyring: { slot: "ring", name: "Bảo Giới" },
  jadering: { slot: "ring", name: "Ngọc Giới" },
  guards: { slot: "bracelet", name: "Hộ Uyển" },
  beads: { slot: "bracelet", name: "Linh Châu" },
  seal: { slot: "pendant", name: "Ngọc Ấn" },
  talisman: { slot: "pendant", name: "Linh Phù" },
  bay: { slot: "horse", name: "Tuấn Mã" },
  white: { slot: "horse", name: "Bạch Long Mã" },
  warhorse: { slot: "horse", name: "Thiết Giáp Mã" },
  ember: { slot: "horse", name: "Hỏa Vân Mã" },
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
] as const;
export type SetId = (typeof SET_IDS)[number];
export const GEAR_SETS = {
  "kim-phong": {
    name: "Kim Phong",
    element: "kim",
    color: "#ffe392",
    glyph: "金",
    hidden: "Kiếm Tâm",
    description: "Công kích và chí mạng",
    specialty: "crit",
    full: { attack: 30, crit: 5 },
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
  },
} as const;
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
const blank = (): GearStats => ({
  attack: 0,
  defense: 0,
  hp: 0,
  mp: 0,
  crit: 0,
  speed: 0,
});
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
    rarity === "Hoàng Kim" || random() < (rarity === "Thường" ? 0.2 : 0.65)
      ? setForElement(element)
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
      else stats[set.specialty] += (set.specialty === "mp" ? 80 : 14) * grade;
    }
    if (count === 11)
      for (const [key, value] of Object.entries(set.full))
        stats[key as keyof GearStats] +=
          value * (key === "crit" || key === "speed" ? 1 : grade);
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
