import type { ActorMotion } from "./combat";
import type { GearVariant } from "./gear-catalog";
import { HORSE_SIZE } from "./actor-rig";
import { horseGait } from "./actor-animation";
import { horseBreed, horseWalkFrame } from "./horse-animation";
import { drawEquipmentRadiance } from "./equipment-vfx";
import type { Rarity } from "./equipment";
export interface MountAppearance {
  variant: GearVariant;
  color: string;
  tier: number;
  enhancement: number;
  rarity?: Rarity;
  simpleEffects?: boolean;
}
export const HORSE_ATLAS_URL = new URL(
  "./assets/riding-horses.webp",
  import.meta.url,
).href;
const horses = new Image();
horses.decoding = "async";
horses.src = HORSE_ATLAS_URL;
const walkingHorses = new Image();
walkingHorses.decoding = "async";
walkingHorses.src = new URL("./assets/horse-walk.webp", import.meta.url).href;
export function drawHorse(
  ctx: CanvasRenderingContext2D,
  horse: MountAppearance,
  motion: ActorMotion,
  now: number,
): void {
  if (!horses.complete || !horses.naturalWidth) return;
  const index = horseBreed(horse.variant);
  const sx = ((index % 3) * horses.naturalWidth) / 3,
    sy = (Math.floor(index / 3) * horses.naturalHeight) / 2,
    sw = horses.naturalWidth / 3,
    sh = horses.naturalHeight / 2;
  const { width: w, height: h } = HORSE_SIZE;
  ctx.save();
  ctx.scale(motion.facingX < 0 ? -1 : 1, 1);
  if (motion.moving > 0.2 && !horse.simpleEffects) {
    ctx.save();
    ctx.fillStyle = "#b9a77b";
    for (let i = 0; i < 2; i++) {
      const p = (((motion.stride / (Math.PI * 2) + i / 2) % 1) + 1) % 1;
      ctx.globalAlpha = (1 - p) * 0.14;
      ctx.beginPath();
      ctx.ellipse(
        -30 - p * 16,
        12 - p * 3,
        2 + p * 5,
        1 + p * 1.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
  if (horse.tier >= 2 || horse.enhancement >= 7) {
    ctx.save();
    ctx.translate(0, 10);
    ctx.scale(1, 0.28);
    drawEquipmentRadiance(
      ctx,
      { color: horse.color, rarity: horse.rarity, enhance: horse.enhancement },
      now,
      33,
      horse.simpleEffects,
    );
    ctx.restore();
  }
  if (
    motion.moving < 0.025 ||
    !walkingHorses.complete ||
    !walkingHorses.naturalWidth
  )
    ctx.drawImage(horses, sx, sy, sw, sh, -w / 2, 12 - h, w, h);
  else {
    const gait = horseGait(motion.stride, motion.moving);
    const frame = horseWalkFrame(horse.variant, gait.frame);
    ctx.drawImage(
      walkingHorses,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      ((frame.x - frame.originX) * w) / 256,
      12 - h - gait.bob,
      (frame.width * w) / 256,
      h,
    );
  }
  ctx.restore();
}
