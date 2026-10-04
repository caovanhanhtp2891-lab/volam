import type { GearVariant } from "./gear-catalog";
export const HORSE_WALK_SIZE = { width: 1024, height: 1536 } as const;
// Bounds follow the painted sprites themselves; the generated gutters vary.
// All four frames of a breed share their vertical crop and saddle coordinates.
const ROWS = [
  {
    top: 57,
    bottom: 250,
    spans: [
      [15, 255],
      [262, 507],
      [517, 763],
      [769, 1010],
    ],
  },
  {
    top: 285,
    bottom: 484,
    spans: [
      [17, 260],
      [260, 510],
      [520, 767],
      [772, 1014],
    ],
  },
  {
    top: 517,
    bottom: 727,
    spans: [
      [14, 265],
      [260, 517],
      [517, 770],
      [768, 1015],
    ],
  },
  {
    top: 753,
    bottom: 961,
    spans: [
      [15, 264],
      [262, 512],
      [518, 769],
      [769, 1012],
    ],
  },
  {
    top: 998,
    bottom: 1211,
    spans: [
      [15, 264],
      [261, 512],
      [517, 770],
      [768, 1016],
    ],
  },
  {
    top: 1250,
    bottom: 1462,
    spans: [
      [16, 265],
      [259, 513],
      [516, 772],
      [769, 1016],
    ],
  },
] as const;
export function horseBreed(variant: GearVariant): number {
  return (
    (
      {
        bay: 0,
        white: 1,
        warhorse: 2,
        ember: 3,
        dapple: 4,
        night: 5,
      } as Partial<Record<GearVariant, number>>
    )[variant] ?? 0
  );
}
export function horseWalkFrame(variant: GearVariant, frame: number) {
  const col = ((Math.floor(frame) % 4) + 4) % 4,
    row = ROWS[horseBreed(variant)];
  const [left, right] = row.spans[col];
  return {
    x: left,
    y: row.top,
    width: right - left,
    height: row.bottom - row.top,
    originX: col * 256 + 128,
  };
}
