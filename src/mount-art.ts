import type { ActorMotion } from "./combat";
import type { GearVariant } from "./gear-catalog";
import { HORSE_SIZE, horseStride } from "./actor-rig";
import { drawEquipmentRadiance } from "./equipment-vfx";
export interface MountAppearance {
  variant: GearVariant;
  color: string;
  tier: number;
  enhancement: number;
  simpleEffects?: boolean;
}
export const HORSE_ATLAS_URL = new URL(
  "./assets/riding-horses.webp",
  import.meta.url,
).href;
const horses = new Image();
horses.decoding = "async";
horses.src = HORSE_ATLAS_URL;
export function drawHorse(
  ctx: CanvasRenderingContext2D,
  horse: MountAppearance,
  motion: ActorMotion,
  now: number,
): void {
  if (!horses.complete || !horses.naturalWidth) return;
  const index =
    horse.variant === "white"
      ? 1
      : horse.variant === "warhorse"
        ? 2
        : horse.variant === "ember"
          ? 3
          : horse.variant === "dapple"
            ? 4
            : horse.variant === "night"
              ? 5
              : 0;
  const sx = ((index % 3) * horses.naturalWidth) / 3,
    sy = (Math.floor(index / 3) * horses.naturalHeight) / 2,
    sw = horses.naturalWidth / 3,
    sh = horses.naturalHeight / 2;
  const { width: w, height: h } = HORSE_SIZE;
  ctx.save();
  ctx.scale(motion.facingX < 0 ? -1 : 1, 1);
  if (horse.enhancement >= 7) {
    ctx.save();
    ctx.translate(0, 10);
    ctx.scale(1, 0.28);
    drawEquipmentRadiance(
      ctx,
      { color: horse.color, enhance: horse.enhancement },
      now,
      33,
      horse.simpleEffects,
    );
    ctx.restore();
  }
  if (motion.moving < 0.025)
    ctx.drawImage(horses, sx, sy, sw, sh, -w / 2, 12 - h, w, h);
  else {
    for (const leg of [0, 2, 1, 3]) {
      const step = horseStride(motion.stride, motion.moving, leg),
        lx = -w / 2 + (leg * w) / 4;
      ctx.save();
      ctx.translate(lx + w / 8 + step.x, 12 - h * 0.36 - step.lift);
      ctx.rotate(step.angle);
      ctx.drawImage(
        horses,
        sx + (leg * sw) / 4,
        sy + sh * 0.64,
        sw / 4,
        sh * 0.36,
        -w / 8,
        0,
        w / 4,
        h * 0.36,
      );
      ctx.restore();
    }
    const bob = Math.abs(Math.sin(motion.stride * 1.05)) * motion.moving * 1.4;
    ctx.drawImage(
      horses,
      sx,
      sy,
      sw,
      sh * 0.67,
      -w / 2,
      12 - h - bob,
      w,
      h * 0.67,
    );
  }
  ctx.restore();
}
