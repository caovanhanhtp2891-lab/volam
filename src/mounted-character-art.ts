import { drawHorse, type MountAppearance } from "./mount-art";
import { drawAnimatedHero, type HeroAppearance } from "./combat-art";
import type { FactionId } from "./idle";
import type { ActorMotion } from "./combat";
import { actorRig, RIDER_SEAT } from "./actor-rig";
import { SECT_BY_FACTION } from "./sects";
import { drawRiderLeg } from "./rider-art";
export function drawMountedCharacter(
  c: CanvasRenderingContext2D,
  faction: FactionId,
  sex: "male" | "female",
  horse: MountAppearance,
  motion: ActorMotion,
  now: number,
  appearance: HeroAppearance,
): void {
  const direction = motion.facingX < 0 ? -1 : 1,
    bob = Math.abs(Math.sin(motion.stride * 1.05)) * motion.moving * 1.4;
  const seat = { x: RIDER_SEAT.x * direction, y: RIDER_SEAT.y - bob };
  c.save();
  c.translate(seat.x, seat.y);
  c.scale(direction, 1);
  drawRiderLeg(c, SECT_BY_FACTION[faction], motion, true);
  c.restore();
  drawHorse(c, horse, motion, now);
  c.save();
  c.translate(seat.x, seat.y);
  drawAnimatedHero(c, faction, sex, motion, now, {
    ...appearance,
    riding: true,
  });
  c.restore();
  const hand = actorRig(SECT_BY_FACTION[faction], sex, true).left;
  c.save();
  c.scale(direction, 1);
  c.strokeStyle = "#6c5030";
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(RIDER_SEAT.x + hand.x, seat.y + hand.y);
  c.quadraticCurveTo(29, -29 - bob, 41, -47 - bob);
  c.stroke();
  c.restore();
}
