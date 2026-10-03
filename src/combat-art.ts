import { actionProgress, type ActorMotion } from "./combat";
import type { FactionId } from "./idle";
import { SECTS, SECT_BY_FACTION, HERO_SIZE } from "./sects";
import { drawSprite } from "./art";
export { drawEquipmentIcon } from "./equipment-art";
export interface HeroAppearance {
  weaponColor: string;
  armorColor: string;
  auraColor: string;
  tier: number;
  enhancement: number;
}
export function drawAnimatedHero(
  ctx: CanvasRenderingContext2D,
  factionId: FactionId,
  sex: "male" | "female",
  motion: ActorMotion,
  now: number,
  appearance: HeroAppearance = { weaponColor: "#daeaf5", armorColor: "", auraColor: "#daeaf5", tier: 0, enhancement: 0 },
): void {
  const school = SECTS[SECT_BY_FACTION[factionId]];
  const step = Math.sin(motion.stride) * motion.moving;
  const progress = actionProgress(motion, now);
  const swing = motion.action === "attack" || motion.action === "cast" ? Math.sin(progress * Math.PI) : 0;
  ctx.save();
  ctx.translate(swing * motion.facingX * 3, -Math.abs(step) * 1.5);
  ctx.rotate(step * .035 + swing * .07 * (motion.facingX < 0 ? -1 : 1));
  if (now < motion.hurtUntil) ctx.globalAlpha *= .65;
  if (appearance.tier >= 2) {
    ctx.save(); ctx.globalAlpha *= .45; ctx.strokeStyle = appearance.auraColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 10, 17, 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  if (!drawSprite(ctx, school.id, 0, 12, HERO_SIZE.width, HERO_SIZE.height, motion.facingX < 0)) {
    ctx.fillStyle = school.color; ctx.fillRect(-8, -15, 16, 23);
    ctx.fillStyle = "#edc39a"; ctx.beginPath(); ctx.arc(0, -21, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = school.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(18, -24); ctx.stroke();
  }
  // Equipment stays visible without recoloring the school's distinctive robe.
  if (appearance.tier >= 1 || appearance.enhancement > 0) {
    ctx.strokeStyle = appearance.weaponColor; ctx.lineWidth = 2; ctx.globalAlpha *= .7;
    ctx.beginPath(); ctx.arc(13, -12, 8 + swing * 3, -.8, .8); ctx.stroke();
  }
  if (sex === "female" && !["emei", "cuiyan"].includes(factionId)) {
    ctx.strokeStyle = school.accent; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(-4, -27); ctx.lineTo(-10 - step * 2, -23); ctx.stroke();
  }
  ctx.restore();
}
