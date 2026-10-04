import type { ActorMotion } from "./combat";
import { weaponBaseVariant, type GearVariant } from "./gear-catalog.ts";
const TAU = Math.PI * 2;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function horseGait(stride: number, moving: number) {
  const phase = (((stride % TAU) + TAU) % TAU) / TAU;
  return {
    frame: Math.floor(phase * 4),
    bob: (1 - Math.cos(phase * TAU * 2)) * 0.65 * moving,
    lean: Math.sin(phase * TAU) * 0.018 * moving,
  };
}
export function weaponFamily(variant: GearVariant) {
  variant = weaponBaseVariant(variant);
  if (["spear", "halberd"].includes(variant)) return "thrust";
  if (["bow", "crossbow", "poisondarts"].includes(variant)) return "ranged";
  if (["fan", "lotusfan", "flute", "chakram"].includes(variant)) return "cast";
  return "swing";
}
export function weaponPose(
  variant: GearVariant,
  motion: ActorMotion,
  now: number,
) {
  const progress =
    motion.actionDuration > 0
      ? clamp((now - motion.actionAt) / motion.actionDuration)
      : 1;
  const active =
    (motion.action === "attack" || motion.action === "cast") && progress < 1;
  const family = weaponFamily(variant);
  const windup = ease(progress / 0.24);
  const strike = ease((progress - 0.24) / 0.22);
  const recovery = ease((progress - 0.48) / 0.52);
  const movement = motion.moving * Math.sin(motion.stride) * 0.025;
  let angle = -0.16 + movement;
  if (active) {
    if (family === "thrust")
      angle += (-0.35 * windup + 1.85 * strike) * (1 - recovery);
    else if (family === "ranged") angle += 0.12 * Math.sin(progress * Math.PI);
    else if (family === "cast" || motion.action === "cast")
      angle += 0.38 * Math.sin(progress * Math.PI);
    else angle += (-0.55 * windup + 1.6 * strike) * (1 - recovery);
  }
  return {
    angle,
    progress,
    family,
    pull: active && family === "ranged" ? Math.sin(progress * Math.PI) : 0,
    trail:
      active && family === "swing" && motion.action === "attack"
        ? Math.sin(clamp((progress - 0.24) / 0.35) * Math.PI)
        : 0,
    lean: active ? strike * (1 - recovery) * 0.045 : 0,
  };
}
export function bodyBreath(now: number, moving: number, riding: boolean) {
  return riding ? 0 : Math.sin(now / 540) * 0.35 * (1 - clamp(moving));
}
