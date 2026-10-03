import { actionProgress, type ActorMotion } from "./combat";
import type { FactionId } from "./idle";
import { SECTS, SECT_BY_FACTION, HERO_SIZE } from "./sects";
import { drawSprite } from "./art";
import { drawGlow } from "./battle-vfx";
import { drawEquipmentIcon, weaponCenter } from "./equipment-art";
import type { GearAura } from "./gear-effects";
import type { GearVariant } from "./gear-catalog";
import { drawEquipmentRadiance, type EquipmentVisual } from "./equipment-vfx";
import {
  drawWearableDetails,
  type WearableAppearance,
} from "./worn-equipment-art";
export { drawEquipmentIcon } from "./equipment-art";
export interface HeroAppearance extends GearAura, WearableAppearance {
  weaponVariant?: GearVariant;
  weapon?: EquipmentVisual;
  simpleEffects?: boolean;
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
  appearance: HeroAppearance = {
    weaponColor: "#daeaf5",
    armorColor: "",
    auraColor: "#daeaf5",
    tier: 0,
    enhancement: 0,
  },
): void {
  const school = SECTS[SECT_BY_FACTION[factionId]];
  const step = Math.sin(motion.stride) * motion.moving;
  const progress = actionProgress(motion, now);
  const swing =
    motion.action === "attack" || motion.action === "cast"
      ? Math.sin(progress * Math.PI)
      : 0;
  ctx.save();
  ctx.translate(swing * motion.facingX * 3, -Math.abs(step) * 1.5);
  ctx.rotate(step * 0.035 + swing * 0.07 * (motion.facingX < 0 ? -1 : 1));
  if (now < motion.hurtUntil) ctx.globalAlpha *= 0.65;
  if (appearance.tier >= 2) {
    ctx.save();
    ctx.globalAlpha *= 0.45;
    ctx.strokeStyle = appearance.auraColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 10, 17, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (
    !drawSprite(
      ctx,
      school.id,
      0,
      12,
      HERO_SIZE.width,
      HERO_SIZE.height,
      motion.facingX < 0,
    )
  ) {
    ctx.fillStyle = school.color;
    ctx.fillRect(-8, -15, 16, 23);
    ctx.fillStyle = "#edc39a";
    ctx.beginPath();
    ctx.arc(0, -21, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = school.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(18, -24);
    ctx.stroke();
  }
  drawWearableDetails(ctx, appearance, now);
  if (appearance.weaponVariant) {
    ctx.save();
    ctx.translate(17 * (motion.facingX < 0 ? -1 : 1), -12);
    ctx.rotate((-0.35 + swing * 1.15) * (motion.facingX < 0 ? -1 : 1));
    if (motion.facingX < 0) ctx.scale(-1, 1);
    const center = weaponCenter(appearance.weaponVariant, 31);
    ctx.translate(...center);
    const weapon = appearance.weapon ?? {
      color: appearance.weaponColor,
      enhance: appearance.enhancement,
    };
    drawEquipmentRadiance(ctx, weapon, now, 16, appearance.simpleEffects);
    drawEquipmentIcon(ctx, "weapon", appearance.weaponColor, 31, {
      ...weapon,
      variant: appearance.weaponVariant,
    });
    if (
      swing > 0.1 &&
      !appearance.simpleEffects &&
      appearance.enhancement >= 3
    ) {
      ctx.strokeStyle = appearance.weaponColor;
      ctx.lineWidth = appearance.enhancement >= 7 ? 2 : 1;
      ctx.globalAlpha *= swing * 0.7;
      ctx.beginPath();
      ctx.arc(-8, 7, 25, -1.6, -0.1);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (
    !appearance.weaponVariant &&
    appearance.enhancement >= 3 &&
    !appearance.simpleEffects
  ) {
    drawGlow(
      ctx,
      16,
      -12,
      14 + Math.sin(now / 230) * 2,
      appearance.weaponColor,
      0.35,
    );
    ctx.strokeStyle =
      appearance.enhancement >= 7 ? "#fff1b5" : appearance.weaponColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.lineTo(18 + Math.sin(now / 180) * 2, -14);
    ctx.lineTo(15, -21);
    ctx.stroke();
  }
  if (appearance.tier >= 1 || appearance.enhancement > 0) {
    ctx.strokeStyle = appearance.weaponColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.arc(13, -12, 8 + swing * 3, -0.8, 0.8);
    ctx.stroke();
  }
  if (sex === "female" && !["emei", "cuiyan"].includes(factionId)) {
    ctx.strokeStyle = school.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -27);
    ctx.lineTo(-10 - step * 2, -23);
    ctx.stroke();
  }
  ctx.restore();
}
