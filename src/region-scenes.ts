export const TRAINING_ATLAS_URL = new URL(
  "./assets/training-regions.webp",
  import.meta.url,
).href;
export const REGION_SCENES = [
  { detail: "Cổ tự giữa rừng thông", weather: "leaves", color: "#b8d195" },
  { detail: "Bậc đá trong mây núi", weather: "mist", color: "#d6e3e9" },
  { detail: "Cổ mộ · Thanh hỏa", weather: "embers", color: "#5de7d3" },
  { detail: "Trúc lâm · Cầu qua suối", weather: "leaves", color: "#acd78e" },
  { detail: "Thanh sơn · Đạo quán", weather: "petals", color: "#f9cfdf" },
  { detail: "Rừng thu lá vàng", weather: "leaves", color: "#edc16b" },
  { detail: "Hồng phong · Vách núi", weather: "leaves", color: "#f1846c" },
  { detail: "Hoa tím ven sơn cốc", weather: "petals", color: "#cdb7ef" },
  { detail: "Đồi trà · Đường sơn đạo", weather: "leaves", color: "#a8cf83" },
  { detail: "Thiền viện · Ngân hạnh", weather: "leaves", color: "#f4da75" },
  { detail: "Ghềnh xanh đầu nguồn", weather: "mist", color: "#c4ebef" },
  { detail: "Dược viên · Hồ bích ngọc", weather: "petals", color: "#ffc6d8" },
  { detail: "Cát vàng · Di tích cổ", weather: "dust", color: "#f2d49d" },
  { detail: "Biên ải · Thành lũy", weather: "dust", color: "#d6bea0" },
  { detail: "Rừng thông trong tuyết", weather: "snow", color: "#e2f3ff" },
  { detail: "Băng tinh · Đỉnh tuyết", weather: "snow", color: "#d4f5ff" },
] as const;
export function regionFrame(region: number, width: number, height: number) {
  const index =
    Number.isInteger(region) && region >= 0 && region < 16 ? region : 0;
  return {
    x: ((index % 4) * width) / 4,
    y: (Math.floor(index / 4) * height) / 4,
    width: width / 4,
    height: height / 4,
  };
}
export function regionThumbnail(region: number): string {
  return `<i class="region-thumbnail" aria-hidden="true" style="background-image:url('${TRAINING_ATLAS_URL}');background-position:${((region % 4) * 100) / 3}% ${(Math.floor(region / 4) * 100) / 3}%"></i>`;
}
