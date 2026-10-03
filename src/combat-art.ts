import { actionProgress, type ActorMotion } from "./combat";
import { ELEMENTS, factionOf, type FactionId } from "./idle";
import { drawGlow } from "./battle-vfx";
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
  appearance: HeroAppearance = {
    weaponColor: "#daeaf5",
    armorColor: "",
    auraColor: "#daeaf5",
    tier: 0,
    enhancement: 0,
  },
): void {
  const faction = factionOf(factionId),
    color = appearance.armorColor || ELEMENTS[faction.element].color;
  const back = motion.facingY < -0.45,
    side = Math.abs(motion.facingX) > 0.72,
    direction = motion.facingX < 0 ? -1 : 1;
  const step = Math.sin(motion.stride) * motion.moving,
    p = actionProgress(motion, now);
  const attack = motion.action === "attack" ? Math.sin(p * Math.PI) : 0,
    cast = motion.action === "cast" ? Math.sin(p * Math.PI) : 0;
  const breath = Math.sin(now / 340) * 0.8,
    bob = Math.abs(step) * 4 + breath;
  const skin = "#f0c6a0",
    ink = "#162635",
    gold = "#ffe49c";
  ctx.save();
  ctx.scale(1.35, 1.35);
  if (appearance.tier >= 2) {
    ctx.save();
    ctx.strokeStyle = appearance.auraColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(0, 12, 27 + Math.sin(now / 220) * 2, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = now / 650 + (i * Math.PI * 2) / 5;
      drawGlow(
        ctx,
        Math.cos(a) * 25,
        8 + Math.sin(a) * 9,
        4,
        appearance.auraColor,
        0.7,
      );
    }
    ctx.restore();
  }
  ctx.scale(direction, 1);
  ctx.translate(attack * 7, -bob);
  ctx.rotate(attack * 0.13 - step * 0.035);
  if (now < motion.hurtUntil)
    ctx.globalAlpha *= 0.65 + Math.sin(now / 28) * 0.15;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  function joint(
    x: number,
    y: number,
    length: number,
    angle: number,
    cloth: string,
    width = 7,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineWidth = width + 3;
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, length);
    ctx.stroke();
    ctx.lineWidth = width;
    ctx.strokeStyle = cloth;
    ctx.stroke();
    ctx.restore();
    return { x: x - Math.sin(angle) * length, y: y + Math.cos(angle) * length };
  }
  function leg(x: number, phase: number) {
    const swing = phase * 0.65,
      knee = Math.max(0, phase) * 0.8;
    const at = joint(x, -9, 13, swing, "#455678", 7),
      foot = joint(at.x, at.y, 13, swing - knee, "#364765", 6);
    ctx.fillStyle = "#26364a";
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(foot.x + 2, foot.y, 6, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // A split cape and ribbons move independently of the head and body.
  ctx.fillStyle = color;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, -35);
  ctx.quadraticCurveTo(-26 - step * 5, -12, -17 - step * 7, 8);
  ctx.lineTo(-2, -3);
  ctx.lineTo(16 + step * 5, 8);
  ctx.quadraticCurveTo(18 - step * 3, -12, 10, -35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(11,20,39,.45)";
  ctx.fillRect(-9, -26, 18, 25);
  leg(-7, step);
  leg(7, -step);
  const far = joint(-13, -33, 13, -step * 0.4 + cast * 0.7, color, 8);
  joint(far.x, far.y, 12, -step * 0.2 + cast * 1.2, skin, 5);
  ctx.fillStyle = color;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -37);
  ctx.lineTo(12, -37);
  ctx.lineTo(15, -6);
  ctx.lineTo(4, -2);
  ctx.lineTo(0, -11);
  ctx.lineTo(-4, -2);
  ctx.lineTo(-15, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.beginPath();
  ctx.moveTo(-9, -33);
  ctx.lineTo(-4, -33);
  ctx.lineTo(1, -14);
  ctx.lineTo(-5, -8);
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(back ? 0 : -6, -35);
  ctx.lineTo(5, -17);
  ctx.lineTo(12, -7);
  ctx.stroke();
  ctx.fillStyle = "#392c43";
  ctx.fillRect(-12, -17, 24, 5);
  ctx.fillStyle = gold;
  ctx.fillRect(-3, -18, 6, 7);
  const upper =
    motion.action === "attack"
      ? -0.7 + p * 1.5
      : cast
        ? -1.1 * cast
        : step * 0.4;
  const elbow = joint(13, -33, 14, upper, color, 8);
  const fore =
    motion.action === "attack"
      ? upper - 0.9 + p * 1.3
      : cast
        ? -1.7 * cast
        : upper - 0.3;
  const hand = joint(elbow.x, elbow.y, 14, fore, skin, 5);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(fore - 0.55 - attack * 0.9);
  const spear = factionId === "tianwang" || factionId === "gaibang",
    ranged = factionId === "tangmen" || factionId === "wudu",
    staff = factionId === "tianren" || factionId === "kunlun";
  if (appearance.tier >= 1 || appearance.enhancement > 0)
    drawGlow(ctx, 0, -22, 17, appearance.weaponColor, 0.5);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, spear ? -46 : -28);
  ctx.stroke();
  ctx.strokeStyle = spear || staff ? "#d1a65c" : appearance.weaponColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (spear && factionId === "tianwang") {
    ctx.fillStyle = appearance.weaponColor;
    ctx.beginPath();
    ctx.moveTo(0, -57);
    ctx.lineTo(-5, -43);
    ctx.lineTo(5, -43);
    ctx.fill();
    ctx.fillStyle = "#ff564c";
    ctx.fillRect(2, -43, 11, 5);
  } else if (staff || ranged) {
    drawGlow(ctx, 0, -29, cast ? 19 : 11, appearance.weaponColor, 0.85);
    ctx.fillStyle = "#ffffdd";
    ctx.beginPath();
    ctx.arc(0, -29, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (!spear) {
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.stroke();
  }
  ctx.restore();
  // Round head, hair, profile nose, topknot and drifting headband.
  if (sex === "female") {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-6, -43);
    ctx.quadraticCurveTo(-24 - step * 4, -24, -12 - step * 3, -5);
    ctx.lineTo(4, -28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = back ? ink : skin;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(side ? 2 : 0, -46, side ? 9 : 12, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, -53, 12, 8, -0.1, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-2, -62, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gold;
  ctx.fillRect(-9, -54, 18, 3);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -53);
  ctx.quadraticCurveTo(-18, -48, -22 - Math.sin(now / 140) * 3, -46);
  ctx.stroke();
  if (!back) {
    ctx.fillStyle = ink;
    ctx.fillRect(side ? 6 : -5, -47, 3, 3);
    if (!side) ctx.fillRect(5, -47, 3, 3);
    ctx.fillStyle = "#a76f5c";
    ctx.fillRect(side ? 6 : -2, -40, 5, 1);
  }
  ctx.restore();
}
