import type { SetCrest } from "./gear-catalog";

// Small engraved crests shared by inventory badges, worn gear and set circles.
export const SET_CREST_PATHS: Record<SetCrest, string> = {
  tower: "M0-14V-11M-4-8L0-12 4-8ZM-9-2L0-7 9-2ZM-13 5L0-1 13 5ZM-9 5v7H9V5M-3 12V6H3V12M-12 12H12",
  blade: "M0-12-3-7-2 6H2L3-7ZM-7 7H7M0 7v5",
  bamboo: "M-3 12V-12M-7-6H1M-7 1H1M-7 8H1M1-3q10-10 10-1Q5-2 1-3M-7 5q-8-10-4-11",
  moon: "M6-11a12 12 0 1 0 0 22Q-8 0 6-11ZM8-6l2 3 3 1-3 1-2 3-1-3-3-1 3-1Z",
  flame: "M0-13Q1-4 7-8Q15 7 0 12Q-14 6-6-5Q-5 3 0-13ZM0-3Q-6 5 0 9Q6 5 0-3",
  mountain: "M-13 10-4-8 1 0 6-12 13 10ZM-7 3-4-1-1 3M2-2l4-5 4 6",
  bell: "M-11 7-8 3V-4Q-8-12 0-12Q8-12 8-4V3L11 7ZM-10 3H10M-4 11H4M-5-6H5",
  spear: "M0-14-5-5 0-7 5-5ZM0-7V14M-6 2H6M-8-4V6M8-4V6",
  dart: "M0-13 3-3 13 0 3 3 0 13-3 3-13 0-3-3ZM-2-2H2V2H-2Z",
  serpent: "M8 9Q-12 14-5 1Q7-7-2-7Q-10-2-10-9Q0-17 10-8Q11-3 3-2M4-10l2 1M2-2V3L-1 5M2 3l3 2",
  lotus: "M0 8Q-13-1 0-12Q13-1 0 8ZM0 8Q-16 8-12-7Q0-4 0 8ZM0 8Q16 8 12-7Q0-4 0 8ZM-13 11H13",
  crystal: "M0-14-7-5-5 8 0 13 5 8 7-5ZM0-14V13M-7-5 0 0 7-5M-5 8 0 4 5 8",
  dragon: "M-12 8Q0 12-2 1Q-12-9 1-7Q5-5 8-8L13-3 8 2 4 0M5-7 5-13 9-10M10-4l2-1M0 4l5 3 3-2M8 0q7 5 3 8",
  taiji: "M0-12a12 12 0 1 0 0 24 12 12 0 1 0 0-24ZM0-12C-8-12-8 0 0 0S8 12 0 12M0-8a2 2 0 1 0 0 4 2 2 0 1 0 0-4M0 4a2 2 0 1 0 0 4 2 2 0 1 0 0-4",
  thunder: "M3-14-8 2H-1L-4 14 10-4H3L7-14ZM-12-8l3 2M9 7l3 2",
};
const crestPaths = new Map<SetCrest, Path2D>();
export function drawSetCrest(ctx: CanvasRenderingContext2D, crest: SetCrest, size: number, color: string): void {
  let path = crestPaths.get(crest);
  if (!path) { path = new Path2D(SET_CREST_PATHS[crest]); crestPaths.set(crest, path); }
  ctx.save(); ctx.scale(size / 14, size / 14); ctx.strokeStyle = color;
  ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(path); ctx.restore();
}
