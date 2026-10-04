import type { Element } from "./idle.ts";
export const SPECIES = [
  "wolf",
  "tiger",
  "boar",
  "bear",
  "snake",
  "beetle",
  "scorpion",
  "spider",
  "bandit",
  "archer",
  "mercenary",
  "tombguard",
  "skeleton",
  "jiangshi",
  "ghost",
  "snowape",
  "icewolf",
  "leopard",
  "sandworm",
  "eagle",
  "golem",
  "treant",
  "salamander",
  "thunderhawk",
  "alpha",
  "tigerking",
  "tombgeneral",
  "snakequeen",
  "demonlord",
  "scorpionking",
  "yetiking",
  "dragon",
] as const;
export type SpeciesId = (typeof SPECIES)[number];
const names = [
  "Sơn Lang",
  "Vằn Hổ",
  "Nanh Trư",
  "Hắc Hùng",
  "Bích Xà",
  "Giáp Trùng",
  "Độc Hạt",
  "Huyết Chu",
  "Sơn Tặc Đao Thủ",
  "Lục Lâm Cung Thủ",
  "Thiết Giáp Thương Binh",
  "Thạch Binh Cổ Mộ",
  "Khô Cốt Chiến Binh",
  "Cương Thi",
  "Huyết Y Oán Linh",
  "Bạch Viên",
  "Băng Lang",
  "Tuyết Báo",
  "Sa Trùng",
  "Kim Điêu",
  "Thạch Linh",
  "Mộc Yêu",
  "Hỏa Tích",
  "Lôi Ưng",
  "Ngân Lang Vương",
  "Huyết Hổ Vương",
  "Cổ Mộ Đại Tướng",
  "Bích Xà Nữ Vương",
  "Xích Ma Thống Lĩnh",
  "Sa Hạt Đế Vương",
  "Băng Viên Vương",
  "Thương Long",
];
export interface MonsterDefinition {
  id: SpeciesId;
  name: string;
  frame: number;
  element: Element;
  behavior: "melee" | "ranged" | "venom" | "charger";
  boss: boolean;
  skill: string;
}
export const MONSTERS = Object.fromEntries(
  SPECIES.map((id, frame) => [
    id,
    {
      id,
      name: names[frame],
      frame,
      element: ([
        "snake",
        "beetle",
        "scorpion",
        "spider",
        "treant",
        "snakequeen",
        "scorpionking",
      ].includes(id)
        ? "moc"
        : ["snowape", "icewolf", "leopard", "yetiking", "dragon"].includes(id)
          ? "thuy"
          : ["ghost", "salamander", "demonlord"].includes(id)
            ? "hoa"
            : [
                  "mercenary",
                  "tombguard",
                  "skeleton",
                  "tombgeneral",
                  "thunderhawk",
                ].includes(id)
              ? "kim"
              : "tho") as Element,
      behavior: (["archer", "ghost", "eagle", "thunderhawk"].includes(id)
        ? "ranged"
        : ["snake", "scorpion", "spider"].includes(id)
          ? "venom"
          : ["boar", "tiger", "bear", "snowape", "icewolf"].includes(id)
            ? "charger"
            : "melee") as MonsterDefinition["behavior"],
      boss: frame >= 24,
      skill:
        [
          "Ngân Nguyệt Khiếu",
          "Huyết Hổ Chấn",
          "Trấn Mộ Địa Chấn",
          "Vạn Xà Độc Vụ",
          "Xích Diệm Diệt",
          "Sa Bạo Độc Châm",
          "Băng Phong Nộ",
          "Thương Long Triều",
        ][frame - 24] ?? "Truy Kích",
    },
  ]),
) as Record<SpeciesId, MonsterDefinition>;
export const REGION_FAUNA: readonly {
  species: readonly SpeciesId[];
  boss: SpeciesId;
}[] = [
  {
    species: ["wolf", "boar", "bear", "bandit", "archer", "eagle"],
    boss: "alpha",
  },
  {
    species: ["tiger", "bear", "mercenary", "archer", "golem", "eagle"],
    boss: "tigerking",
  },
  {
    species: ["tombguard", "skeleton", "jiangshi", "ghost", "beetle", "spider"],
    boss: "tombgeneral",
  },
  {
    species: ["snake", "spider", "bandit", "boar", "treant", "beetle"],
    boss: "snakequeen",
  },
  {
    species: ["tiger", "treant", "golem", "wolf", "eagle", "snake"],
    boss: "tigerking",
  },
  {
    species: ["boar", "bear", "wolf", "eagle", "bandit", "tiger"],
    boss: "alpha",
  },
  {
    species: [
      "bandit",
      "mercenary",
      "archer",
      "salamander",
      "thunderhawk",
      "bear",
    ],
    boss: "demonlord",
  },
  {
    species: ["snake", "ghost", "treant", "beetle", "spider", "tiger"],
    boss: "snakequeen",
  },
  {
    species: ["tiger", "golem", "beetle", "wolf", "bandit", "archer"],
    boss: "tigerking",
  },
  {
    species: ["tombguard", "treant", "mercenary", "eagle", "golem", "skeleton"],
    boss: "tombgeneral",
  },
  {
    species: ["snake", "eagle", "bandit", "mercenary", "golem", "thunderhawk"],
    boss: "dragon",
  },
  {
    species: ["scorpion", "snake", "beetle", "spider", "ghost", "treant"],
    boss: "snakequeen",
  },
  {
    species: [
      "sandworm",
      "scorpion",
      "archer",
      "salamander",
      "skeleton",
      "eagle",
    ],
    boss: "scorpionking",
  },
  {
    species: ["mercenary", "bandit", "archer", "tiger", "eagle", "skeleton"],
    boss: "demonlord",
  },
  {
    species: ["snowape", "icewolf", "leopard", "eagle", "bear", "golem"],
    boss: "yetiking",
  },
  {
    species: ["icewolf", "leopard", "snowape", "thunderhawk", "golem", "ghost"],
    boss: "dragon",
  },
];
export function faunaOf(region: number) {
  return REGION_FAUNA[
    Number.isInteger(region) && region >= 0 && region < 16 ? region : 0
  ];
}
export function monsterForStage(
  region: number,
  index: number,
  boss: boolean,
): SpeciesId {
  const fauna = faunaOf(region);
  return boss
    ? fauna.boss
    : fauna.species[Math.abs(index) % fauna.species.length];
}
export function monsterFrame(id: SpeciesId, width: number, height: number) {
  const i = MONSTERS[id].frame;
  return {
    x: ((i % 8) * width) / 8,
    y: (Math.floor(i / 8) * height) / 4,
    width: width / 8,
    height: height / 4,
  };
}
