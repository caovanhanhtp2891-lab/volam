import { ELEMENTS } from "./idle.ts";
import { MONSTERS, type SpeciesId } from "./bestiary.ts";
import { RARITIES, rollEquipmentRarity, type Rarity } from "./equipment.ts";
// Local prototype rules. These are not authoritative online transactions.
export const BAG_CAPACITY = 60;
export const MAX_POTIONS = 99;
export const POTION_COOLDOWN = 8;
export type PotionKind = "hp" | "mp";
export type DungeonId =
  | "tomb"
  | "bamboo"
  | "wolfden"
  | "venom"
  | "necropolis"
  | "forest"
  | "inferno"
  | "desert"
  | "thunder"
  | "frost"
  | "abyss"
  | "celestial";

export const POTIONS = {
  hp: {
    name: "Kim Sang Dược",
    price: 20,
    fraction: 0.4,
    label: "HP",
    color: "#df8077",
  },
  mp: {
    name: "Hồi Khí Đan",
    price: 15,
    fraction: 0.4,
    label: "MP",
    color: "#7bbcdf",
  },
} as const;

export interface Supplies {
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  potions: Record<PotionKind, number>;
  potionCooldown: number;
}

export function normalizeSupplies(source: {
  potions?: Partial<Record<PotionKind, number>>;
  potionCooldown?: number;
}) {
  const count = (kind: PotionKind, initial: number) => {
    const value = source.potions?.[kind];
    return value === undefined
      ? initial
      : Number.isFinite(value)
        ? Math.max(0, Math.min(MAX_POTIONS, Math.floor(value)))
        : 0;
  };
  return {
    potions: { hp: count("hp", 3), mp: count("mp", 2) },
    potionCooldown: Number.isFinite(source.potionCooldown)
      ? Math.max(0, Math.min(POTION_COOLDOWN, source.potionCooldown!))
      : 0,
  };
}

export function buyPotion(
  player: Supplies,
  kind: PotionKind,
  quantity: number,
): "bought" | "invalid" | "full" | "poor" {
  if (
    !Object.hasOwn(POTIONS, kind) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 5
  )
    return "invalid";
  const cost = POTIONS[kind].price * quantity;
  if (player.potions[kind] + quantity > MAX_POTIONS) return "full";
  if (player.gold < cost) return "poor";
  player.gold -= cost;
  player.potions[kind] += quantity;
  return "bought";
}

export function usePotion(
  player: Supplies,
  kind: PotionKind,
): "used" | "invalid" | "cooldown" | "empty" | "full" {
  if (!Object.hasOwn(POTIONS, kind)) return "invalid";
  if (player.potionCooldown > 0) return "cooldown";
  if (player.potions[kind] < 1) return "empty";
  const current = kind === "hp" ? player.hp : player.mp;
  const maximum = kind === "hp" ? player.maxHp : player.maxMp;
  if (current >= maximum) return "full";
  const restored = Math.min(
    maximum,
    current + Math.ceil(maximum * POTIONS[kind].fraction),
  );
  if (kind === "hp") player.hp = restored;
  else player.mp = restored;
  player.potions[kind] -= 1;
  player.potionCooldown = POTION_COOLDOWN;
  return "used";
}

export function itemSalePrice(item: {
  power: number;
  level: number;
  enhance: number;
}): number {
  return Math.max(
    5,
    Math.floor(item.power * 2 + item.level * 3 + item.enhance * 15),
  );
}

export function storeRewardItems<T>(
  owner: { inventory: T[]; pendingItems: T[] },
  items: readonly T[],
): void {
  for (const item of items) {
    if (owner.inventory.length < BAG_CAPACITY) owner.inventory.push(item);
    else owner.pendingItems.push(item);
  }
}

export function recoverPendingItems<T>(owner: {
  inventory: T[];
  pendingItems: T[];
}): number {
  const count = Math.min(
    Math.max(0, BAG_CAPACITY - owner.inventory.length),
    owner.pendingItems.length,
  );
  owner.inventory.push(...owner.pendingItems.splice(0, count));
  return count;
}

interface EnemySpawn {
  species?: SpeciesId;
  id: string;
  name: string;
  kind: "normal" | "elite" | "boss";
  x: number;
  y: number;
  level: number;
  color: string;
}

export interface DungeonDefinition {
  id: DungeonId;
  name: string;
  shortName: string;
  minLevel: number;
  region: number;
  tier: number;
  prerequisite?: DungeonId;
  timeLimit: number;
  description: string;
  mechanic: string;
  reward: {
    xp: number;
    gold: number;
    stones: number;
    tokens: number;
    itemLevel: number;
    itemCount: number;
    rarity: Rarity;
  };
  waves: readonly (readonly EnemySpawn[])[];
}

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = Object.assign(
  Object.create(null),
  {
    tomb: {
      id: "tomb",
      name: "Cổ Mộ Bí Ẩn",
      shortName: "CỔ MỘ",
      minLevel: 3,
      region: 2,
      tier: 0,
      timeLimit: 180,
      description: "Dọn U Binh và Mộ Tướng để mở cửa gặp Cổ Mộ Thủ Vệ.",
      mechanic:
        "Né bẫy đất màu đỏ. Khi còn nửa HP, Thủ Vệ đánh thêm vùng quanh mình.",
      reward: {
        xp: 320,
        gold: 420,
        stones: 3,
        tokens: 1,
        itemLevel: 8,
        itemCount: 1,
        rarity: "Hiếm",
      },
      waves: [
        [
          {
            id: "tomb-guard-1",
            name: "Cổ Mộ U Binh",
            kind: "normal",
            x: 560,
            y: 690,
            level: 4,
            color: "#697fa9",
          },
          {
            id: "tomb-guard-2",
            name: "Cổ Mộ U Binh",
            kind: "normal",
            x: 760,
            y: 600,
            level: 4,
            color: "#697fa9",
          },
          {
            id: "tomb-guard-3",
            name: "Độc Thi Trùng",
            kind: "normal",
            x: 930,
            y: 780,
            level: 5,
            color: "#6f9b70",
          },
          {
            id: "tomb-elite",
            name: "Mộ Tướng Trấn Quan",
            kind: "elite",
            x: 1120,
            y: 610,
            level: 6,
            color: "#c78853",
          },
        ],
        [
          {
            id: "tomb-boss",
            name: "Cổ Mộ Thủ Vệ",
            kind: "boss",
            x: 1430,
            y: 730,
            level: 8,
            color: "#5f7fd2",
          },
        ],
      ],
    },
    bamboo: {
      id: "bamboo",
      name: "Trúc Lâm Thí Luyện",
      shortName: "TRÚC LÂM",
      minLevel: 5,
      region: 3,
      tier: 1,
      prerequisite: "tomb",
      timeLimit: 240,
      description:
        "Vượt 3 đợt: đàn Trúc Lang, hộ vệ tinh anh và Lang Vương Thí Luyện.",
      mechanic:
        "Đợt sau chỉ xuất hiện khi dọn hết đợt trước. Lang Vương nổi giận dưới 50% HP.",
      reward: {
        xp: 500,
        gold: 650,
        stones: 5,
        tokens: 2,
        itemLevel: 10,
        itemCount: 1,
        rarity: "Hiếm",
      },
      waves: [
        [
          {
            id: "trial-wolf-1",
            name: "Trúc Lang Thí Luyện",
            kind: "normal",
            x: 580,
            y: 630,
            level: 5,
            color: "#7d98a6",
          },
          {
            id: "trial-wolf-2",
            name: "Trúc Lang Thí Luyện",
            kind: "normal",
            x: 700,
            y: 740,
            level: 5,
            color: "#7d98a6",
          },
          {
            id: "trial-wolf-3",
            name: "Trúc Lang Thí Luyện",
            kind: "normal",
            x: 860,
            y: 650,
            level: 5,
            color: "#7d98a6",
          },
        ],
        [
          {
            id: "trial-elite-1",
            name: "Trúc Lâm Hộ Vệ",
            kind: "elite",
            x: 1020,
            y: 620,
            level: 6,
            color: "#d59d4c",
          },
          {
            id: "trial-elite-2",
            name: "Trúc Lâm Hộ Vệ",
            kind: "elite",
            x: 1130,
            y: 790,
            level: 6,
            color: "#d59d4c",
          },
        ],
        [
          {
            id: "trial-boss",
            name: "Lang Vương Thí Luyện",
            kind: "boss",
            x: 1430,
            y: 730,
            level: 10,
            color: "#8d5bd1",
          },
        ],
      ],
    },
  },
);

const EXTRA_DUNGEONS = [
  {
    id: "wolfden",
    name: "Huyết Hổ Sơn Trại",
    shortName: "HỔ TRẠI",
    minLevel: 12,
    region: 0,
    pool: ["wolf", "tiger", "bandit", "archer"],
    bosses: ["alpha", "tigerking"],
    reward: [1500, 1800, 8, 3, 2, "Cực phẩm"],
    mechanic:
      "Cung thủ đánh xa; Hổ Vương tạo chấn động và nổi giận khi còn nửa máu.",
  },
  {
    id: "venom",
    name: "Vạn Độc Xà Cốc",
    shortName: "ĐỘC CỐC",
    minLevel: 20,
    region: 11,
    pool: ["snake", "spider", "beetle", "scorpion"],
    bosses: ["scorpionking", "snakequeen"],
    reward: [2800, 3500, 10, 4, 2, "Cực phẩm"],
    mechanic: "Xà, nhện và bọ cạp áp sát nhanh. Né vùng độc của Xà Hậu.",
  },
  {
    id: "necropolis",
    name: "U Minh Quỷ Điện",
    shortName: "QUỶ ĐIỆN",
    minLevel: 30,
    region: 2,
    pool: ["tombguard", "skeleton", "jiangshi", "ghost"],
    bosses: ["tombgeneral", "demonlord"],
    reward: [5000, 6000, 13, 6, 2, "Hoàng Kim"],
    mechanic: "Oán linh đánh xa; các đại tướng có quân hộ vệ cùng xuất trận.",
  },
  {
    id: "forest",
    name: "Mộc Linh Cổ Giới",
    shortName: "MỘC LINH",
    minLevel: 45,
    region: 4,
    pool: ["treant", "golem", "tiger", "beetle"],
    bosses: ["tigerking", "snakequeen"],
    reward: [8500, 10000, 16, 8, 3, "Hoàng Kim"],
    mechanic:
      "Thạch linh chịu đòn, Mộc Yêu giữ đường; dọn hộ vệ để tập trung đánh thủ lĩnh.",
  },
  {
    id: "inferno",
    name: "Xích Diệm Ma Vực",
    shortName: "MA VỰC",
    minLevel: 60,
    region: 6,
    pool: ["salamander", "mercenary", "ghost", "thunderhawk"],
    bosses: ["tombgeneral", "demonlord"],
    reward: [13000, 16000, 20, 10, 3, "Truyền Thuyết"],
    mechanic:
      "Liệt hỏa báo trước vị trí nổ. Ma Vương cuồng nộ tạo thêm vùng sát thương.",
  },
  {
    id: "desert",
    name: "Sa Hải Vương Lăng",
    shortName: "SA HẢI",
    minLevel: 80,
    region: 12,
    pool: ["sandworm", "scorpion", "skeleton", "archer"],
    bosses: ["tombgeneral", "scorpionking"],
    reward: [20000, 24000, 24, 13, 3, "Truyền Thuyết"],
    mechanic:
      "Sa trùng và độc hạt bao vây; hai trùm phụ xuất hiện trước Sa Hạt Đế Vương.",
  },
  {
    id: "thunder",
    name: "Lôi Ưng Thiên Đài",
    shortName: "LÔI ĐÀI",
    minLevel: 100,
    region: 1,
    pool: ["thunderhawk", "eagle", "golem", "mercenary"],
    bosses: ["tigerking", "dragon"],
    reward: [30000, 36000, 28, 16, 4, "Truyền Thuyết"],
    mechanic:
      "Lôi Ưng đánh xa, Thương Long quét nhiều vùng. Giữ đường né giữa các đợt.",
  },
  {
    id: "frost",
    name: "Băng Viên Thần Cung",
    shortName: "BĂNG CUNG",
    minLevel: 120,
    region: 14,
    pool: ["snowape", "icewolf", "leopard", "golem"],
    bosses: ["alpha", "yetiking"],
    reward: [44000, 52000, 33, 20, 4, "Thần Thoại"],
    mechanic:
      "Bạch Viên và Tuyết Báo lao vào; Băng Viên Vương có vùng băng lớn và hộ vệ.",
  },
  {
    id: "abyss",
    name: "Thâm Uyên Long Điện",
    shortName: "LONG ĐIỆN",
    minLevel: 140,
    region: 10,
    pool: ["ghost", "golem", "mercenary", "snake"],
    bosses: ["snakequeen", "dragon"],
    reward: [65000, 80000, 39, 25, 5, "Thần Thoại"],
    mechanic:
      "Ba thủ lĩnh cùng các đội hộ vệ qua sáu đợt; càng cuối trận càng nhiều vùng nguy hiểm.",
  },
  {
    id: "celestial",
    name: "Thiên Kiếp Cổ Cảnh",
    shortName: "THIÊN KIẾP",
    minLevel: 155,
    region: 15,
    pool: ["thunderhawk", "icewolf", "snowape", "salamander"],
    bosses: ["yetiking", "dragon"],
    reward: [90000, 120000, 45, 30, 5, "Thần Thoại"],
    mechanic:
      "Trùm phụ và Thương Long cấp 160. Chuẩn bị bình trước trận; né các vùng cuồng nộ.",
  },
] as const;
for (const [index, spec] of EXTRA_DUNGEONS.entries()) {
  const tier = index + 2,
    waveCount = tier >= 7 ? 6 : tier >= 5 ? 5 : tier >= 4 ? 4 : 3;
  const waves: EnemySpawn[][] = Array.from({ length: waveCount }, (_, wave) => {
    const final = wave === waveCount - 1,
      mini = wave === 1 || (wave === 3 && waveCount >= 5);
    const units: EnemySpawn[] = [];
    if (final || mini) {
      const species = spec.bosses[final ? 1 : 0];
      units.push({
        id: `rift-${spec.id}-${wave}-boss`,
        name: `${MONSTERS[species].name}${mini ? " · Trùm phụ" : ""}`,
        kind: "boss",
        x: 1250,
        y: 660,
        level: Math.min(160, spec.minLevel + wave + 3),
        color: ELEMENTS[MONSTERS[species].element].color,
        species,
      });
    }
    const count =
      final || mini
        ? Math.min(4, 2 + Math.floor(tier / 3))
        : Math.min(9, 4 + Math.floor(tier / 2));
    for (let i = 0; i < count; i++) {
      const species = spec.pool[(i + wave) % spec.pool.length],
        elite = !(final || mini) && i === 0 && wave > 0;
      units.push({
        id: `rift-${spec.id}-${wave}-${i}`,
        name: `${MONSTERS[species].name}${elite ? " · Tinh anh" : ""}`,
        kind: elite ? "elite" : "normal",
        x: 640 + (i % 4) * 220,
        y: 570 + Math.floor(i / 4) * 145,
        level: Math.min(160, spec.minLevel + wave + (i % 3)),
        color: ELEMENTS[MONSTERS[species].element].color,
        species,
      });
    }
    return units;
  });
  const [xp, gold, stones, tokens, itemCount, rarity] = spec.reward;
  DUNGEONS[spec.id] = {
    id: spec.id,
    name: spec.name,
    shortName: spec.shortName,
    minLevel: spec.minLevel,
    region: spec.region,
    tier,
    timeLimit: 300 + tier * 35,
    description: `${waveCount} đợt, ${waves.flat().length} quái và ${waves.flat().filter((e) => e.kind === "boss").length} boss.`,
    mechanic: spec.mechanic,
    reward: {
      xp,
      gold,
      stones,
      tokens,
      itemCount,
      rarity,
      itemLevel: Math.min(160, spec.minLevel + 5),
    },
    waves,
  };
}
export const DUNGEON_IDS = Object.keys(DUNGEONS) as DungeonId[];
export function freshDungeonClears(): Record<DungeonId, number> {
  return Object.fromEntries(DUNGEON_IDS.map((id) => [id, 0])) as Record<
    DungeonId,
    number
  >;
}
export function normalizeDungeonClears(
  value: Partial<Record<DungeonId, number>> | undefined,
  tokens = 0,
): Record<DungeonId, number> {
  return Object.fromEntries(
    DUNGEON_IDS.map((id) => [
      id,
      Number.isFinite(value?.[id])
        ? Math.max(0, Math.min(1e9, Math.floor(value![id]!)))
        : id === "tomb" && tokens > 0
          ? 1
          : 0,
    ]),
  ) as Record<DungeonId, number>;
}
export function dungeonDropRarity(
  id: DungeonId,
  kind: "normal" | "elite" | "boss",
  level: number,
  random = Math.random,
): Rarity {
  const tier = DUNGEONS[id].tier,
    rolled = rollEquipmentRarity(level, kind, random);
  const floor: Rarity =
    kind === "boss"
      ? tier >= 9
        ? "Thần Thoại"
        : tier >= 6
          ? "Truyền Thuyết"
          : tier >= 4
            ? "Hoàng Kim"
            : "Cực phẩm"
      : kind === "elite"
        ? tier >= 9
          ? "Truyền Thuyết"
          : tier >= 6
            ? "Hoàng Kim"
            : tier >= 4
              ? "Cực phẩm"
              : "Hiếm"
        : tier >= 6
          ? "Hiếm"
          : tier >= 4
            ? "Tốt"
            : "Thường";
  return RARITIES.indexOf(rolled) > RARITIES.indexOf(floor) ? rolled : floor;
}

export function canEnterDungeon(
  id: DungeonId,
  level: number,
  clears: Partial<Record<DungeonId, number>>,
): boolean {
  const dungeon = DUNGEONS[id];
  return Boolean(
    dungeon &&
      level >= dungeon.minLevel &&
      (!dungeon.prerequisite || (clears[dungeon.prerequisite] ?? 0) > 0),
  );
}
