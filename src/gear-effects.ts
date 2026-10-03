import { GEAR_SETS, setForElement } from "./gear-catalog";
import { drawGlow } from "./battle-vfx";
import type { Element } from "./idle";
export interface GearAura {
  element?: Element;
  pieces?: number;
  tier: number;
  enhancement: number;
}
function sigil(
  ctx: CanvasRenderingContext2D,
  element: Element,
  size: number,
): void {
  ctx.beginPath();
  if (element === "moc") {
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 1.5, 0, 0, size);
    ctx.quadraticCurveTo(-size * 1.5, 0, 0, -size);
  } else if (element === "hoa") {
    ctx.moveTo(0, -size * 1.5);
    ctx.quadraticCurveTo(size * 1.8, size, 0, size);
    ctx.quadraticCurveTo(-size * 1.5, 0, 0, -size * 1.5);
  } else if (element === "kim") {
    ctx.moveTo(0, -size * 1.6);
    ctx.lineTo(size * 0.5, size);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.5, size);
    ctx.closePath();
  } else if (element === "tho")
    for (let i = 0; i <= 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    }
  else
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    }
  if (element === "thuy") ctx.stroke();
  else {
    ctx.fill();
    ctx.stroke();
  }
}
export function drawGearAura(
  ctx: CanvasRenderingContext2D,
  aura: GearAura,
  now: number,
  simple = false,
): void {
  const pieces = aura.pieces ?? 0;
  if (!aura.element || pieces < 2) return;
  const set = GEAR_SETS[setForElement(aura.element)],
    full = pieces === 11;
  const radius = full ? 44 : pieces >= 6 ? 36 : 28,
    count = simple ? 2 : full ? 8 : pieces >= 6 ? 6 : 4;
  ctx.save();
  ctx.translate(0, 12);
  ctx.strokeStyle = set.color;
  ctx.fillStyle = set.color;
  ctx.lineWidth = full ? 1.8 : 1;
  if (!simple) drawGlow(ctx, 0, -8, radius, set.color, full ? 0.35 : 0.16);
  ctx.globalAlpha *= full ? 0.9 : 0.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (full) {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius - 7, (radius - 7) * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < count; i++) {
    const a = now / 1900 + (i * Math.PI * 2) / count;
    ctx.save();
    ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius * 0.28);
    ctx.rotate(-a);
    sigil(ctx, aura.element, full ? 5 : 3);
    ctx.restore();
  }
  if (full && !simple)
    for (let i = 0; i < 4; i++) {
      const t = (now / 1600 + i / 4) % 1;
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.fillRect(Math.cos(i * 2 + t) * 25, -t * 60, 2, 4);
    }
  ctx.restore();
}
