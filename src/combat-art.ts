import { actionProgress, type ActorMotion } from "./combat";
import type { FactionId } from "./idle";
import { SECTS, SECT_BY_FACTION, HERO_SIZE } from "./sects";
import { drawWalkingSprite, drawRidingTorso } from "./art";
import { actorRig } from "./actor-rig";
import { drawHeldWeapon } from "./held-weapon-art";
import type { GearAura } from "./gear-effects";
import { type GearVariant } from "./gear-catalog";
import type { EquipmentVisual } from "./equipment-vfx";
import {
  drawWearableDetails,
  type WearableAppearance,
} from "./worn-equipment-art";
import { drawRiderLeg } from "./rider-art";
export { drawEquipmentIcon } from "./equipment-art";
export interface HeroAppearance extends GearAura, WearableAppearance {
  weaponVariant?: GearVariant;
  weapon?: EquipmentVisual;
  riding?: boolean;
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
  const school = SECTS[SECT_BY_FACTION[factionId]],
    rig = actorRig(school.id, sex, appearance.riding);
  const step =
    appearance.riding || motion.action === "dash"
      ? 0
      : Math.sin(motion.stride) * motion.moving;
  const swing =
    motion.action === "attack" || motion.action === "cast"
      ? Math.sin(actionProgress(motion, now) * Math.PI)
      : 0;
  const direction = motion.facingX < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(swing * direction * 1.3, -Math.abs(step) * 0.8);
  ctx.rotate(step * 0.014);
  if (now < motion.hurtUntil) ctx.globalAlpha *= 0.65;
  if (appearance.riding) {
    ctx.save();
    ctx.scale(direction, 1);
    drawRidingTorso(ctx, school.id, sex, rig.pelvis);
    drawRiderLeg(ctx, school.id, motion);
    ctx.restore();
  } else
    drawWalkingSprite(
      ctx,
      school.id,
      0,
      12,
      HERO_SIZE.width,
      HERO_SIZE.height,
      step,
      direction < 0,
      sex,
    );
  // The clean atlas contains empty hands. Only the equipped/default weapon is drawn.
  const defaultWeapon: Record<string, GearVariant> = {
    "thieu-lam": "staff",
    "thien-vuong": "spear",
    "duong-mon": "crossbow",
    "ngu-doc": "staff",
    "nga-mi": "sword",
    "thuy-yen": "fan",
    "cai-bang": "dragonstaff",
    "thien-nhan": "daggers",
    "vo-dang": "sword",
    "con-lon": "thundersword",
  };
  const variant = appearance.weaponVariant ?? defaultWeapon[school.id];
  ctx.save();
  ctx.scale(direction, 1);
  ctx.translate(rig.right.x, rig.right.y);
  ctx.rotate(-0.16 + swing * (motion.action === "cast" ? 0.35 : 1.0));
  drawHeldWeapon(
    ctx,
    variant,
    appearance.weapon ?? {
      color: appearance.weaponColor,
      enhance: appearance.enhancement,
    },
    now,
    appearance.simpleEffects,
  );
  ctx.restore();
  ctx.save();
  if (appearance.riding) {
    ctx.scale(direction, 1);
    ctx.translate(0, HERO_SIZE.height * (1 - rig.pelvis) - 12);
  }
  ctx.translate(0, 12);
  ctx.scale(HERO_SIZE.width / 46, HERO_SIZE.height / 50);
  ctx.translate(0, -12);
  // Upper fittings and enchantment still follow the seated torso; standing
  // boot details cannot be reused for bent knees and saddle-side feet.
  drawWearableDetails(
    ctx,
    appearance.riding ? { ...appearance, boots: undefined } : appearance,
    now,
    false,
    step,
  );
  ctx.restore();
  ctx.restore();
}
