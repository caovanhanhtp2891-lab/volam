export const RARITIES = [
  "Thường",
  "Tốt",
  "Hiếm",
  "Cực phẩm",
  "Hoàng Kim",
  "Truyền Thuyết",
  "Thần Thoại",
] as const;
export type Rarity = (typeof RARITIES)[number];
export const RARITY_COLORS: Record<Rarity, string> = {
  Thường: "#e3e8ec",
  Tốt: "#73d19b",
  Hiếm: "#64b5f6",
  "Cực phẩm": "#cf91ff",
  "Hoàng Kim": "#ffd35a",
  "Truyền Thuyết": "#ff963f",
  "Thần Thoại": "#ff405d",
};
export const RARITY_NAMES = [
  "Trắng",
  "Lục",
  "Lam",
  "Tím",
  "Vàng",
  "Cam",
  "Đỏ",
] as const;
