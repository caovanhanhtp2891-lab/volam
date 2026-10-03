// Local prototype rules. These are not authoritative online transactions.
export const BAG_CAPACITY = 60;
export const MAX_POTIONS = 99;
export const POTION_COOLDOWN = 8;
export type PotionKind = "hp" | "mp";
export type DungeonId = "tomb" | "bamboo";

export const POTIONS = {
  hp: { name: "Kim Sang Dược", price: 20, fraction: .4, label: "HP", color: "#df8077" },
  mp: { name: "Hồi Khí Đan", price: 15, fraction: .4, label: "MP", color: "#7bbcdf" },
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

export function normalizeSupplies(source: { potions?: Partial<Record<PotionKind, number>>; potionCooldown?: number }) {
  const count = (kind: PotionKind, initial: number) => {
    const value = source.potions?.[kind];
    return value === undefined ? initial : Number.isFinite(value) ? Math.max(0, Math.min(MAX_POTIONS, Math.floor(value))) : 0;
  };
  return {
    potions: { hp: count("hp", 3), mp: count("mp", 2) },
    potionCooldown: Number.isFinite(source.potionCooldown) ? Math.max(0, Math.min(POTION_COOLDOWN, source.potionCooldown!)) : 0,
  };
}

export function buyPotion(player: Supplies, kind: PotionKind, quantity: number): "bought" | "invalid" | "full" | "poor" {
  if (!Object.hasOwn(POTIONS, kind) || !Number.isInteger(quantity) || quantity < 1 || quantity > 5) return "invalid";
  const cost = POTIONS[kind].price * quantity;
  if (player.potions[kind] + quantity > MAX_POTIONS) return "full";
  if (player.gold < cost) return "poor";
  player.gold -= cost;
  player.potions[kind] += quantity;
  return "bought";
}

export function usePotion(player: Supplies, kind: PotionKind): "used" | "invalid" | "cooldown" | "empty" | "full" {
  if (!Object.hasOwn(POTIONS, kind)) return "invalid";
  if (player.potionCooldown > 0) return "cooldown";
  if (player.potions[kind] < 1) return "empty";
  const current = kind === "hp" ? player.hp : player.mp;
  const maximum = kind === "hp" ? player.maxHp : player.maxMp;
  if (current >= maximum) return "full";
  const restored = Math.min(maximum, current + Math.ceil(maximum * POTIONS[kind].fraction));
  if (kind === "hp") player.hp = restored;
  else player.mp = restored;
  player.potions[kind] -= 1;
  player.potionCooldown = POTION_COOLDOWN;
  return "used";
}

export function itemSalePrice(item: { power: number; level: number; enhance: number }): number {
  return Math.max(5, Math.floor(item.power * 2 + item.level * 3 + item.enhance * 15));
}

export function storeRewardItems<T>(owner: { inventory: T[]; pendingItems: T[] }, items: readonly T[]): void {
  for (const item of items) {
    if (owner.inventory.length < BAG_CAPACITY) owner.inventory.push(item);
    else owner.pendingItems.push(item);
  }
}

export function recoverPendingItems<T>(owner: { inventory: T[]; pendingItems: T[] }): number {
  const count = Math.min(Math.max(0, BAG_CAPACITY - owner.inventory.length), owner.pendingItems.length);
  owner.inventory.push(...owner.pendingItems.splice(0, count));
  return count;
}

interface EnemySpawn {
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
  prerequisite?: DungeonId;
  timeLimit: number;
  description: string;
  mechanic: string;
  reward: { xp: number; gold: number; stones: number; tokens: number; itemLevel: number };
  waves: readonly (readonly EnemySpawn[])[];
}

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = {
  tomb: {
    id: "tomb", name: "Cổ Mộ Bí Ẩn", shortName: "CỔ MỘ", minLevel: 3, timeLimit: 180,
    description: "Dọn U Binh và Mộ Tướng để mở cửa gặp Cổ Mộ Thủ Vệ.",
    mechanic: "Né bẫy đất màu đỏ. Khi còn nửa HP, Thủ Vệ đánh thêm vùng quanh mình.",
    reward: { xp: 320, gold: 420, stones: 3, tokens: 1, itemLevel: 8 },
    waves: [
      [
        { id: "tomb-guard-1", name: "Cổ Mộ U Binh", kind: "normal", x: 560, y: 690, level: 4, color: "#697fa9" },
        { id: "tomb-guard-2", name: "Cổ Mộ U Binh", kind: "normal", x: 760, y: 600, level: 4, color: "#697fa9" },
        { id: "tomb-guard-3", name: "Độc Thi Trùng", kind: "normal", x: 930, y: 780, level: 5, color: "#6f9b70" },
        { id: "tomb-elite", name: "Mộ Tướng Trấn Quan", kind: "elite", x: 1120, y: 610, level: 6, color: "#c78853" },
      ],
      [{ id: "tomb-boss", name: "Cổ Mộ Thủ Vệ", kind: "boss", x: 1430, y: 730, level: 8, color: "#5f7fd2" }],
    ],
  },
  bamboo: {
    id: "bamboo", name: "Trúc Lâm Thí Luyện", shortName: "TRÚC LÂM", minLevel: 5, prerequisite: "tomb", timeLimit: 240,
    description: "Vượt 3 đợt: đàn Trúc Lang, hộ vệ tinh anh và Lang Vương Thí Luyện.",
    mechanic: "Đợt sau chỉ xuất hiện khi dọn hết đợt trước. Lang Vương nổi giận dưới 50% HP.",
    reward: { xp: 500, gold: 650, stones: 5, tokens: 2, itemLevel: 10 },
    waves: [
      [
        { id: "trial-wolf-1", name: "Trúc Lang Thí Luyện", kind: "normal", x: 580, y: 630, level: 5, color: "#7d98a6" },
        { id: "trial-wolf-2", name: "Trúc Lang Thí Luyện", kind: "normal", x: 700, y: 740, level: 5, color: "#7d98a6" },
        { id: "trial-wolf-3", name: "Trúc Lang Thí Luyện", kind: "normal", x: 860, y: 650, level: 5, color: "#7d98a6" },
      ],
      [
        { id: "trial-elite-1", name: "Trúc Lâm Hộ Vệ", kind: "elite", x: 1020, y: 620, level: 6, color: "#d59d4c" },
        { id: "trial-elite-2", name: "Trúc Lâm Hộ Vệ", kind: "elite", x: 1130, y: 790, level: 6, color: "#d59d4c" },
      ],
      [{ id: "trial-boss", name: "Lang Vương Thí Luyện", kind: "boss", x: 1430, y: 730, level: 10, color: "#8d5bd1" }],
    ],
  },
};

export function canEnterDungeon(id: DungeonId, level: number, clears: Partial<Record<DungeonId, number>>): boolean {
  const dungeon = DUNGEONS[id];
  return Boolean(dungeon && level >= dungeon.minLevel && (!dungeon.prerequisite || (clears[dungeon.prerequisite] ?? 0) > 0));
}
