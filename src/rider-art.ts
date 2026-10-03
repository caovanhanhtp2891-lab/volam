import type { SectId } from "./sects";
import type { ActorMotion } from "./combat";
const TROUSERS: Record<SectId, string> = {
  "thieu-lam": "#d3bc88",
  "thien-vuong": "#6d4230",
  "duong-mon": "#263938",
  "ngu-doc": "#504063",
  "nga-mi": "#decbc4",
  "thuy-yen": "#b7cbd2",
  "cai-bang": "#675b3e",
  "thien-nhan": "#473331",
  "vo-dang": "#bdc6d2",
  "con-lon": "#877388",
};
export function drawRiderLeg(
  ctx: CanvasRenderingContext2D,
  sect: SectId,
  motion: ActorMotion,
  far = false,
): void {
  ctx.save();
  const drift = Math.sin(motion.stride) * motion.moving * 0.7;
  const knee = far ? 12 : -10,
    foot = far ? 12 : -7 + drift;
  ctx.strokeStyle = "#3c3a33";
  ctx.lineWidth = 0.7;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(far ? 0 : -5, -2);
  ctx.quadraticCurveTo(knee - 5, 4, knee - 3, 12);
  ctx.quadraticCurveTo(foot - 4, 18, foot - 2, 24);
  ctx.lineTo(foot + 3, 24);
  ctx.quadraticCurveTo(foot + 3, 16, knee + 4, 11);
  ctx.quadraticCurveTo(knee + 4, 7, far ? 6 : 3, 3);
  ctx.closePath();
  ctx.fillStyle = far ? "#42413a" : TROUSERS[sect];
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#736b5f";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(knee - 1, 8);
  ctx.quadraticCurveTo(knee + 2, 12, foot + 1, 21);
  ctx.stroke();
  ctx.fillStyle = "#302a25";
  ctx.strokeStyle = "#51493b";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(foot - 2.5, 19);
  ctx.quadraticCurveTo(foot, 18.5, foot + 3, 19);
  ctx.lineTo(foot + 3.5, 28);
  ctx.quadraticCurveTo(foot - 2, 29, foot - 6, 28);
  ctx.quadraticCurveTo(foot - 6, 26, foot - 2.5, 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (!far) {
    ctx.strokeStyle = "#8e7a56";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(foot - 5, 27);
    ctx.lineTo(foot + 4, 27);
    ctx.stroke();
  }
  ctx.restore();
}
