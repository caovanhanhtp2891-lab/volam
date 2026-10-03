import type { SectId } from "./sects";
import type { CharacterSex } from "./character-art";
export const RIDER_SEAT = { x: -3, y: -44 } as const;
export const HORSE_SIZE = { width: 112, height: 88 } as const;
const HANDS: Record<SectId, readonly [number, number, number, number]> = {
  "thieu-lam": [0.35, 0.55, 0.84, 0.54],
  "thien-vuong": [0.31, 0.57, 0.78, 0.57],
  "duong-mon": [0.34, 0.57, 0.83, 0.52],
  "ngu-doc": [0.35, 0.59, 0.85, 0.53],
  "nga-mi": [0.29, 0.58, 0.82, 0.57],
  "thuy-yen": [0.34, 0.53, 0.8, 0.54],
  "cai-bang": [0.32, 0.55, 0.84, 0.54],
  "thien-nhan": [0.28, 0.53, 0.82, 0.54],
  "vo-dang": [0.36, 0.56, 0.85, 0.56],
  "con-lon": [0.36, 0.62, 0.88, 0.57],
};
export function actorRig(sect: SectId, sex: CharacterSex, riding = false) {
  const [rx, ry, lx, ly] = HANDS[sect];
  const pelvis = sex === "female" ? 0.64 : 0.65;
  const point = (x: number, y: number) => ({
    x: (x - (riding ? 0.54 : 0.5)) * 56,
    y: riding ? (y - pelvis) * 76 : (y - 1) * 76 + 12,
  });
  return {
    right: point(rx, ry),
    left: point(lx, ly),
    pelvis,
    head: point(0.55, 0.15),
  };
}
export function horseStride(stride: number, moving: number, leg: number) {
  const phase = stride * 1.05 + ([0, Math.PI, 0.45, Math.PI + 0.45][leg] ?? 0);
  return {
    x: Math.sin(phase) * 3.5 * moving,
    lift: Math.max(0, Math.cos(phase)) * 3.5 * moving,
    angle: Math.sin(phase) * 0.13 * moving,
  };
}
export function actorCastOffset(
  sect: SectId,
  sex: CharacterSex,
  facingX: number,
  riding = false,
) {
  const hand = actorRig(sect, sex, riding).right,
    direction = facingX < 0 ? -1 : 1;
  return {
    x: (hand.x + (riding ? RIDER_SEAT.x : 0)) * direction,
    y: hand.y + (riding ? RIDER_SEAT.y : 0),
  };
}
