import type { ActorMotion } from "./combat";
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
import { weaponPose, bodyBreath, actorBodyPose } from "./actor-animation";
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
  const defaultWeapon: Partial<Record<string, GearVariant>> = {
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
  const variant =
    appearance.weaponVariant ?? defaultWeapon[school.id] ?? "sword";
  const pose = weaponPose(variant, motion, now);
  const body = actorBodyPose(motion, pose.family, now, !!appearance.riding);
  const direction = motion.facingX < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(
    pose.lean * direction * 28,
    -Math.abs(step) * 0.8 + bodyBreath(now, motion.moving, !!appearance.riding),
  );
  ctx.rotate(step * 0.014 + pose.lean * direction);
  if (now < motion.hurtUntil) ctx.globalAlpha *= 0.65;
  if (appearance.riding) {
    ctx.save();
    ctx.scale(direction, 1);
    ctx.rotate(body.torsoAngle);
    drawRidingTorso(ctx, school.id, sex, rig.pelvis);
    ctx.restore();
    ctx.save();
    ctx.scale(direction, 1);
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
      body,
    );
  // The clean atlas contains empty hands. Only the equipped/default weapon is drawn.
  ctx.save();
  if (!appearance.riding) ctx.translate(0, 12 - HERO_SIZE.height * 0.22);
  ctx.scale(direction, 1);
  ctx.rotate(body.torsoAngle);
  if (!appearance.riding)
    ctx.translate(body.torsoShift, HERO_SIZE.height * 0.22 - 12 + body.crouch);
  ctx.translate(rig.right.x, rig.right.y);
  ctx.rotate(pose.angle);
  drawHeldWeapon(
    ctx,
    variant,
    appearance.weapon ?? {
      color: appearance.weaponColor,
      enhance: appearance.enhancement,
    },
    now,
    appearance.simpleEffects,
    pose,
  );
  ctx.restore();
  ctx.save();
  if (appearance.riding) {
    ctx.scale(direction, 1);
    ctx.rotate(body.torsoAngle);
    ctx.translate(0, HERO_SIZE.height * (1 - rig.pelvis));
  } else {
    ctx.translate(0, 12 - HERO_SIZE.height * 0.22);
    ctx.scale(direction, 1);
    ctx.rotate(body.torsoAngle);
    ctx.translate(body.torsoShift, HERO_SIZE.height * 0.22 + body.crouch);
  }
  ctx.scale(HERO_SIZE.width / 46, HERO_SIZE.height / 50);
  ctx.translate(0, -12);
  drawWearableDetails(
    ctx,
    { ...appearance, boots: undefined },
    now,
    false,
    step,
  );
  ctx.restore();
  if (!appearance.riding && appearance.boots) {
    ctx.save();
    ctx.translate(0, 12);
    ctx.scale((direction * HERO_SIZE.width) / 46, HERO_SIZE.height / 50);
    ctx.translate(0, -12);
    drawWearableDetails(
      ctx,
      { boots: appearance.boots, simpleEffects: appearance.simpleEffects },
      now,
      false,
      step,
    );
    ctx.restore();
  }
  ctx.restore();
}
