import { GEAR_SETS, setForElement, type SetId } from "./gear-catalog";
import { drawSetCrest } from "./set-art.ts";
import { drawGlow } from "./battle-vfx";
import type { Element } from "./idle";
import { drawEquipmentRadiance, type EquipmentVisual } from "./equipment-vfx";
export interface GearAura {
  element?: Element;
  setId?: SetId;
  pieces?: number;
  tier: number;
  enhancement: number;
  auraEnhancement?: number;
  quality?: EquipmentVisual;
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
  if (aura.quality) {
    ctx.save();
    ctx.translate(0, 12);
    ctx.scale(1, 0.32);
    drawEquipmentRadiance(ctx, aura.quality, now, 24 + aura.tier * 2, simple);
    ctx.restore();
  }
  const pieces = aura.pieces ?? 0;
  if (
    !aura.element ||
    pieces < 2 ||
    (aura.auraEnhancement ?? aura.enhancement) < 7
  )
    return;
  const set = GEAR_SETS[aura.setId ?? setForElement(aura.element)],
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
    if (aura.setId) drawSetCrest(ctx, set.crest, full ? 6 : 4, set.color);
    else sigil(ctx, aura.element, full ? 5 : 3);
    ctx.restore();
  }
  if (pieces >= 6) {
    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.scale(1, 0.32);
    drawSetCrest(ctx, set.crest, radius * 0.55, set.color);
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
