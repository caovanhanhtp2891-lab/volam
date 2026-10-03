import type { ActorMotion } from "./combat";
import type { GearVariant } from "./gear-catalog";
import { drawGlow } from "./battle-vfx";
export interface MountAppearance {
  variant: GearVariant;
  color: string;
  tier: number;
  enhancement: number;
}
export function drawHorse(
  ctx: CanvasRenderingContext2D,
  horse: MountAppearance,
  motion: ActorMotion,
  now: number,
): void {
  const coat =
    horse.variant === "white"
      ? "#e8e2cb"
      : horse.variant === "ember"
        ? "#a54531"
        : horse.variant === "warhorse"
          ? "#596d7c"
          : horse.variant === "night"
            ? "#33394d"
            : horse.variant === "dapple"
              ? "#a3a69b"
              : "#a67544";
  const mane = horse.variant === "white" ? "#9babb8" : "#342b2a",
    gait = Math.sin(motion.stride * 0.9) * motion.moving;
  ctx.save();
  ctx.scale(motion.facingX < 0 ? -1 : 1, 1);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Hooves keep the actor's ground position; only the body bobs while galloping.
  for (const [x, front] of [
    [-20, 0],
    [19, 0],
    [-13, 1],
    [13, 1],
  ]) {
    const stride = gait * (front ? 1 : -1) * (x > 0 ? -1 : 1);
    ctx.strokeStyle = "#182329";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, -6);
    ctx.lineTo(x + stride * 5, 8);
    ctx.lineTo(x - stride * 7, 21 - Math.abs(stride) * 3);
    ctx.stroke();
    ctx.strokeStyle = front ? coat : "#61492f";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#202a2d";
    ctx.fillRect(x - stride * 7 - 4, 19 - Math.abs(stride) * 3, 9, 4);
  }
  ctx.translate(0, -Math.abs(gait) * 1.5);
  ctx.strokeStyle = mane;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-27, -15);
  ctx.quadraticCurveTo(-40, -11, -38 - gait * 3, 12);
  ctx.stroke();
  ctx.fillStyle = coat;
  ctx.strokeStyle = "#26312f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-1, -12, 29, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (horse.variant === "dapple") {
    ctx.fillStyle = "#dbe0d2";
    for (const [x, y] of [
      [-18, -15],
      [-9, -6],
      [8, -14],
      [14, -7],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(15, -15);
  ctx.quadraticCurveTo(17, -43, 31, -44);
  ctx.lineTo(34, -53);
  ctx.lineTo(38, -41);
  ctx.lineTo(45, -35);
  ctx.lineTo(49, -22);
  ctx.quadraticCurveTo(41, -14, 34, -23);
  ctx.lineTo(26, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = mane;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(31, -43);
  ctx.quadraticCurveTo(18, -33, 19, -20);
  ctx.stroke();
  ctx.fillStyle = "#0f1b22";
  ctx.beginPath();
  ctx.arc(38, -34, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#372727";
  ctx.fillRect(43, -23, 4, 2);
  ctx.fillStyle = horse.color;
  ctx.strokeStyle = "#edd59c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-15, -23);
  ctx.lineTo(10, -23);
  ctx.lineTo(15, -2);
  ctx.lineTo(0, 6);
  ctx.lineTo(-17, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3b2920";
  ctx.fillRect(-12, -27, 25, 7);
  ctx.strokeStyle = "#e5c67c";
  ctx.strokeRect(-12, -27, 25, 7);
  ctx.strokeStyle = "#d9b575";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(43, -29);
  ctx.lineTo(3, -30);
  ctx.lineTo(0, -11);
  ctx.stroke();
  if (horse.tier >= 2) {
    ctx.fillStyle = "#b8cbd7";
    ctx.strokeStyle = "#f4e7c0";
    ctx.beginPath();
    ctx.moveTo(30, -44);
    ctx.lineTo(40, -39);
    ctx.lineTo(46, -30);
    ctx.lineTo(34, -29);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = horse.color;
    ctx.beginPath();
    ctx.moveTo(36, -39);
    ctx.lineTo(40, -34);
    ctx.lineTo(36, -29);
    ctx.lineTo(33, -34);
    ctx.closePath();
    ctx.fill();
  }
  if (horse.tier >= 3 || horse.enhancement >= 5) {
    drawGlow(ctx, 0, -7, 25, horse.color, 0.2);
    for (let i = 0; i < 3; i++) {
      const t = (now / 1000 + i / 3) % 1;
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.fillStyle = horse.color;
      ctx.beginPath();
      ctx.arc(-28 - t * 10, -12 - t * 15, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
