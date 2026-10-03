import { drawGlow } from "./battle-vfx.ts";
import { iceFragments } from "./skill-flight.ts";
const TAU = Math.PI * 2;
function shard(
  c: CanvasRenderingContext2D,
  length: number,
  width: number,
): void {
  c.beginPath();
  c.moveTo(length, 0);
  c.lineTo(-length * 0.45, -width);
  c.lineTo(-length * 0.85, 0);
  c.lineTo(-length * 0.45, width);
  c.closePath();
  c.fillStyle = "#7cdbf6";
  c.fill();
  c.strokeStyle = "#e8fdff";
  c.lineWidth = 0.7;
  c.stroke();
  c.beginPath();
  c.moveTo(-length * 0.45, -width);
  c.lineTo(0, 0);
  c.lineTo(length, 0);
  c.lineTo(-length * 0.45, width);
  c.strokeStyle = "#c9f6ff";
  c.stroke();
}
export function drawIceMissile(
  c: CanvasRenderingContext2D,
  radius: number,
  now: number,
  simple = false,
): void {
  if (!simple) drawGlow(c, -3, 0, radius * 1.4, "#85d9f1", 0.27);
  for (const offset of simple ? [0] : [-1, 0, 1]) {
    c.save();
    c.translate(-Math.abs(offset) * radius * 0.6, offset * radius * 0.42);
    shard(c, radius * (offset ? 0.7 : 1.3), radius * 0.23);
    c.restore();
  }
  if (!simple) {
    c.strokeStyle = "#d5f5ff";
    c.lineWidth = 0.65;
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      c.moveTo(-radius * (1.3 + i * 0.6), Math.sin(now / 90 + i) * 3);
      c.lineTo(-radius * (2.0 + i * 0.6), Math.sin(now / 90 + i) * 3);
    }
    c.stroke();
  }
}
export function drawIceExplosion(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
  simple = false,
): void {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0 || p >= 1) return;
  c.save();
  c.translate(x, y);
  c.globalAlpha *= Math.min(1, p / 0.055);
  const spread = Math.min(75, Math.max(25, radius)) * (1 - (1 - p) ** 3);
  if (!simple && p < 0.45)
    drawGlow(c, 0, 0, 19 + spread * 0.25, "#c7f6ff", (1 - p / 0.45) * 0.65);
  if (p < 0.18) {
    c.globalAlpha *= 1 - p / 0.18;
    c.fillStyle = "#efffff";
    c.beginPath();
    c.ellipse(0, 0, 4 + 20 * p, 3 + 16 * p, 0, 0, TAU);
    c.fill();
    c.globalAlpha = Math.min(1, p / 0.055);
  }
  c.strokeStyle = "#a2e9f7";
  c.lineWidth = simple ? 1 : 1.5;
  c.globalAlpha *= (1 - p) ** 0.7;
  c.beginPath();
  c.ellipse(0, 20, spread, spread * 0.3, 0, 0, TAU);
  c.stroke();
  c.beginPath();
  for (let i = 0; i < (simple ? 3 : 6); i++) {
    const a = (i * TAU) / 6;
    c.moveTo(0, 20);
    c.lineTo(Math.cos(a) * spread * 0.45, 20 + Math.sin(a) * spread * 0.16);
    c.lineTo(
      Math.cos(a + 0.1) * spread * 0.72,
      20 + Math.sin(a + 0.1) * spread * 0.22,
    );
  }
  c.stroke();
  for (const bit of iceFragments(p, simple)) {
    c.save();
    c.translate(bit.x, bit.y);
    c.rotate(bit.angle);
    c.globalAlpha = bit.alpha;
    shard(c, bit.length, bit.length * 0.22);
    c.restore();
  }
  c.restore();
}
