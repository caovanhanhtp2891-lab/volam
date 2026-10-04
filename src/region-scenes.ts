import { landscapeThumbnail } from "./landscape-art.ts";
export const TRAINING_ATLAS_URL = new URL(
  "./assets/training-regions.webp",
  import.meta.url,
).href;
export const REGION_SCENES = [
  { detail: "Sơn đình · Vách đá Hoa Sơn", weather: "leaves", color: "#b8d195" },
  { detail: "Kiếm Các · Sơn đạo hiểm trở", weather: "mist", color: "#d6e3e9" },
  { detail: "Tần Lăng · Mộ môn cổ", weather: "embers", color: "#5de7d3" },
  { detail: "Trúc lâm · Cầu qua suối", weather: "leaves", color: "#acd78e" },
  { detail: "Thanh Thành · Đạo quán", weather: "petals", color: "#f9cfdf" },
  { detail: "Trà quán · Rừng thu lá vàng", weather: "leaves", color: "#edc16b" },
  { detail: "Hồng phong · Vách núi", weather: "leaves", color: "#f1846c" },
  { detail: "Hoa tím ven sơn cốc", weather: "petals", color: "#cdb7ef" },
  { detail: "Đồi trà · Đường sơn đạo", weather: "leaves", color: "#a8cf83" },
  { detail: "Thiền viện · Ngân hạnh", weather: "leaves", color: "#f4da75" },
  { detail: "Hoàng Hà · Bến thuyền đầu nguồn", weather: "mist", color: "#c4ebef" },
  { detail: "Dược viên · Hồ bích ngọc", weather: "petals", color: "#ffc6d8" },
  { detail: "Cát vàng · Di tích cổ", weather: "dust", color: "#f2d49d" },
  { detail: "Biên ải · Thành lũy", weather: "dust", color: "#d6bea0" },
  { detail: "Rừng thông trong tuyết", weather: "snow", color: "#e2f3ff" },
  { detail: "Trường Bạch · Băng nham đỉnh tuyết", weather: "snow", color: "#d4f5ff" },
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
export function regionThumbnail(region: number): string { return landscapeThumbnail(region); }
