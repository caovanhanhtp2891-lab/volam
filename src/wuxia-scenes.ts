export type GroundMaterial = 0 | 1 | 2 | 3;
export interface WuxiaScene {
  ground: GroundMaterial;
  road: GroundMaterial;
  landmark: number;
  companion: number;
  bend: number;
  courtyard: boolean;
}

// Original scenery inspired by each existing JX1 place. Frames refer to the
// painted 4×4 landmark sheet; this table does not change map or monster IDs.
export const WUXIA_SCENES: readonly WuxiaScene[] = [
  { ground: 0, road: 1, landmark: 0, companion: 1, bend: -.10, courtyard: true }, // Hoa Sơn
  { ground: 0, road: 1, landmark: 1, companion: 4, bend: .12, courtyard: false }, // Kiếm Các Tây Bắc
  { ground: 1, road: 1, landmark: 2, companion: 12, bend: .02, courtyard: true }, // Tần Lăng
  { ground: 0, road: 2, landmark: 7, companion: 3, bend: -.08, courtyard: false }, // Kiếm Các Tây Nam
  { ground: 0, road: 1, landmark: 4, companion: 0, bend: .07, courtyard: true }, // Thanh Thành Sơn
  { ground: 2, road: 2, landmark: 5, companion: 6, bend: .10, courtyard: false }, // Phục Ngưu Tây
  { ground: 0, road: 2, landmark: 6, companion: 0, bend: -.12, courtyard: false }, // Phục Ngưu Đông
  { ground: 0, road: 2, landmark: 7, companion: 1, bend: .04, courtyard: false }, // Vũ Lăng Sơn
  { ground: 0, road: 2, landmark: 8, companion: 5, bend: -.05, courtyard: false }, // Thục Cương Sơn
  { ground: 0, road: 1, landmark: 9, companion: 6, bend: .09, courtyard: true }, // Hoành Sơn
  { ground: 2, road: 2, landmark: 10, companion: 3, bend: -.13, courtyard: false }, // Hoàng Hà
  { ground: 0, road: 1, landmark: 11, companion: 7, bend: .03, courtyard: true }, // Dược Vương Cốc
  { ground: 2, road: 2, landmark: 12, companion: 13, bend: .13, courtyard: false }, // Sa Mạc
  { ground: 2, road: 1, landmark: 13, companion: 4, bend: -.07, courtyard: true }, // Lâm Du Quan
  { ground: 3, road: 3, landmark: 14, companion: 15, bend: .06, courtyard: false }, // Chân Trường Bạch
  { ground: 3, road: 3, landmark: 15, companion: 14, bend: -.04, courtyard: false }, // Trường Bạch
];
export function wuxiaScene(region: number): WuxiaScene {
  return WUXIA_SCENES[Number.isInteger(region) && region >= 0 && region < WUXIA_SCENES.length ? region : 0];
}
export function roadControlPoints(region: number, vertical: boolean) {
  const b = wuxiaScene(region).bend;
  return vertical
    ? [{ x: .36 + b, y: -.04 }, { x: .43 - b, y: .3 }, { x: .57 + b, y: .72 }, { x: .43 - b, y: 1.04 }]
    : [{ x: -.04, y: .48 }, { x: .22, y: .40 - b }, { x: .66, y: .64 + b }, { x: 1.04, y: .45 - b * .3 }];
}
export function roadPoint(region: number, width: number, height: number, t: number, vertical: boolean) {
  const [a, b, c, d] = roadControlPoints(region, vertical), u = 1 - t;
  return {
    x: width * (a.x * u ** 3 + 3 * b.x * u * u * t + 3 * c.x * u * t * t + d.x * t ** 3),
    y: height * (a.y * u ** 3 + 3 * b.y * u * u * t + 3 * c.y * u * t * t + d.y * t ** 3),
  };
}
