import { actionProgress, type ActorMotion } from "./combat";
import { ELEMENTS, factionOf, type FactionId } from "./idle";

// Articulated limbs keep each step, turn and strike visible without loading an
// animation atlas. All coordinates are in world space around the actor's feet.
export function drawAnimatedHero(
  ctx: CanvasRenderingContext2D,
  factionId: FactionId,
  sex: "male" | "female",
  motion: ActorMotion,
  now: number,
): void {
  const faction = factionOf(factionId);
  const color = ELEMENTS[faction.element].color;
  const back = motion.facingY < -0.45;
  const side = Math.abs(motion.facingX) > 0.72;
  const direction = motion.facingX < 0 ? -1 : 1;
  const step = Math.sin(motion.stride) * motion.moving;
  const action = actionProgress(motion, now);
  const striking = motion.action === "attack" ? Math.sin(action * Math.PI) : 0;
  const casting = motion.action === "cast" ? Math.sin(action * Math.PI) : 0;
  const bob = motion.moving * Math.abs(Math.sin(motion.stride)) * 2.5;
  const skin = "#e6ba8e",
    ink = "#18211d",
    trim = "#eed5a0";
  ctx.save();
  ctx.scale(direction, 1);
  ctx.translate(striking * 4, -bob);
  if (now < motion.hurtUntil)
    ctx.globalAlpha *= 0.65 + Math.sin(now / 28) * 0.15;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  function limb(
    x: number,
    y: number,
    length: number,
    angle: number,
    cloth: string,
    hand = false,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, length);
    ctx.stroke();
    ctx.strokeStyle = cloth;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = hand ? skin : "#443d2d";
    ctx.beginPath();
    ctx.ellipse(0, length, hand ? 3.8 : 4.8, hand ? 4 : 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Hair and coat tails swing behind the body.
  if (sex === "female") {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-6, -42);
    ctx.quadraticCurveTo(-19 - step * 3, -12, -8 - step * 4, 4);
    ctx.lineTo(3, -21);
    ctx.closePath();
    ctx.fill();
  }
  limb(-6, -9, 21, step * 0.45, "#475548");
  limb(6, -9, 21, -step * 0.45, "#59654f");
  limb(-12, -32, 18, -step * 0.3 + casting * 0.8, color, true);
  ctx.fillStyle = color;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -37);
  ctx.lineTo(9, -37);
  ctx.lineTo(14 + step * 2, -4);
  ctx.lineTo(1, 0);
  ctx.lineTo(-14 - step * 2, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(18,32,24,.28)";
  ctx.fillRect(-10, -14, 20, 7);
  ctx.strokeStyle = trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(back ? 0 : -5, -34);
  ctx.lineTo(4, -15);
  ctx.lineTo(9, -7);
  ctx.stroke();
  ctx.fillStyle = "#4a3d26";
  ctx.fillRect(-10, -16, 20, 4);
  ctx.fillStyle = trim;
  ctx.fillRect(-2, -16, 4, 4);
  // Right hand carries a weapon appropriate to the selected faction.
  const armAngle =
    motion.action === "attack"
      ? -0.9 + action * 2.5
      : casting > 0
        ? -1.3 * casting
        : step * 0.3;
  limb(11, -32, 18, armAngle, color, true);
  ctx.save();
  ctx.translate(11, -32);
  ctx.rotate(armAngle);
  ctx.translate(0, 17);
  ctx.rotate(-0.45 - striking * 0.8);
  const spear = factionId === "tianwang" || factionId === "gaibang";
  const ranged = factionId === "tangmen" || factionId === "wudu";
  const staff = factionId === "tianren" || factionId === "kunlun";
  ctx.strokeStyle = "#29372e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(0, spear ? -42 : -24);
  ctx.stroke();
  ctx.strokeStyle = spear || staff ? "#a88b55" : "#e8edd3";
  ctx.lineWidth = 2.8;
  ctx.stroke();
  if (spear && factionId === "tianwang") {
    ctx.fillStyle = "#e8edd3";
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(-4, -40);
    ctx.lineTo(4, -40);
    ctx.fill();
    ctx.fillStyle = "#b04d37";
    ctx.fillRect(2, -39, 9, 4);
  } else if (staff || ranged) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -26, ranged ? 5 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff2c8";
    ctx.beginPath();
    ctx.arc(-1, -28, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (!spear) {
    ctx.strokeStyle = trim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(6, -3);
    ctx.stroke();
  }
  ctx.restore();
  // Face orientation distinguishes front, side and back views.
  ctx.fillStyle = back ? ink : skin;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(side ? 2 : 0, -44, side ? 8 : 10, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, -50, 10, 6, -0.1, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-2, -58, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = trim;
  ctx.fillRect(-7, -51, 14, 2);
  if (!back) {
    ctx.fillStyle = ink;
    ctx.fillRect(side ? 5 : -4, -44, 2, 2);
    if (!side) ctx.fillRect(4, -44, 2, 2);
    ctx.fillStyle = "#9b6b4d";
    ctx.fillRect(side ? 5 : -2, -38, 4, 1);
  }
  ctx.restore();
}

export function drawEquipmentIcon(
  ctx: CanvasRenderingContext2D,
  slot: string,
  color: string,
  size = 26,
): void {
  ctx.save();
  ctx.scale(size / 26, size / 26);
  ctx.strokeStyle = "#202c22";
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  ctx.lineJoin = "round";
  if (slot === "weapon") {
    ctx.rotate(0.6);
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(4, -7);
    ctx.lineTo(3, 8);
    ctx.lineTo(-3, 8);
    ctx.lineTo(-4, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff0b8";
    ctx.fillRect(-7, 6, 14, 3);
    ctx.fillStyle = "#7c5530";
    ctx.fillRect(-2, 9, 4, 6);
  } else if (slot === "armor") {
    ctx.beginPath();
    ctx.moveTo(-5, -11);
    ctx.lineTo(-13, -6);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-8, 12);
    ctx.lineTo(8, 12);
    ctx.lineTo(6, -2);
    ctx.lineTo(9, 0);
    ctx.lineTo(13, -6);
    ctx.lineTo(5, -11);
    ctx.lineTo(0, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f7e0ad";
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(4, 6);
    ctx.stroke();
  } else if (slot === "boots" || slot === "horse") {
    for (const x of [-6, 5]) {
      ctx.fillRect(x - 4, -10, 7, 15);
      ctx.fillRect(x - 4, 3, 11, 6);
      ctx.strokeRect(x - 4, -10, 7, 15);
    }
  } else if (slot === "helmet") {
    ctx.beginPath();
    ctx.arc(0, 2, 11, Math.PI, 0);
    ctx.lineTo(11, 8);
    ctx.lineTo(5, 8);
    ctx.lineTo(5, 1);
    ctx.lineTo(-5, 1);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, slot === "belt" ? 5 : 10, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#f4dc96";
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
