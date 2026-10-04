import type { Cultivation } from "./cultivation.ts";
import type { TitleDefinition } from "./character-progression.ts";
import { MILITARY_RANKS, type MilitaryRankId } from "./military.ts";

export interface PrestigeStyle {
  color: string;
  accent: string;
  fontSize: number;
  tier: number;
  glow: number;
  height: number;
}
const reducedMotion =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : undefined;
export const prestigeTime = (now: number) => (reducedMotion?.matches ? 0 : now);
export const prestigeSimple = (simple = false) =>
  simple || !!reducedMotion?.matches;
export function realmStyle(cultivation: Cultivation): PrestigeStyle {
  const tier = 1 + Math.floor(cultivation.rank / 5),
    fontSize = (11 + cultivation.rank * 0.1) * 1.25;
  return {
    color: cultivation.realm.color,
    accent: cultivation.realm.accent,
    fontSize,
    tier,
    glow: 2 + cultivation.rank * 0.16,
    height: fontSize + 8,
  };
}
export function titleStyle(title: TitleDefinition): PrestigeStyle {
  const fontSize = (11 + title.rarity * 0.4) * 1.25;
  return {
    color: title.color,
    accent: title.rarity >= 4 ? "#fff0ba" : "#ecfff5",
    fontSize,
    tier: title.rarity,
    glow: 2 + title.rarity * 0.65,
    height: fontSize + 8,
  };
}
export function militaryStyle(id: MilitaryRankId): PrestigeStyle {
  const rank = MILITARY_RANKS.findIndex((value) => value.id === id),
    definition = MILITARY_RANKS[rank];
  const fontSize = (11.5 + rank * 0.4) * 1.25;
  return {
    color: definition.color,
    accent: rank >= 4 ? "#fff0b4" : "#e2ffef",
    fontSize,
    tier: rank + 1,
    glow: 2.5 + rank * 0.65,
    height: fontSize + 8,
  };
}
export interface PrestigeLabel {
  text: string;
  style: PrestigeStyle;
  kind: "military" | "title" | "realm";
}
export interface LabelPlacement {
  label: PrestigeLabel;
  x: number;
  y: number;
  width: number;
}
export function prestigeFont(style: PrestigeStyle): string {
  return `800 ${style.fontSize}px 'DM Sans', sans-serif`;
}
// One actor anchor for the whole stack. Screen/HUD clamps would detach labels
// from a moving hero as the camera approaches an edge.
export function placePrestigeLabels(
  labels: readonly PrestigeLabel[],
  widths: readonly number[],
  x: number,
  bottom: number,
): LabelPlacement[] {
  const gap = 4,
    total =
      labels.reduce((sum, label) => sum + label.style.height, 0) +
      Math.max(0, labels.length - 1) * gap;
  let top = bottom - total;
  return labels.map((label, i) => {
    const y = top + label.style.height / 2;
    top += label.style.height + gap;
    return { label, x, y, width: widths[i] };
  });
}
export function prestigeWidth(
  ctx: CanvasRenderingContext2D,
  label: PrestigeLabel,
): number {
  ctx.font = prestigeFont(label.style);
  return (
    ctx.measureText(label.text).width + 12 + (label.style.tier >= 4 ? 10 : 0)
  );
}
export function fitPrestigeLabel(
  ctx: CanvasRenderingContext2D,
  label: PrestigeLabel,
  maxWidth: number,
): PrestigeLabel {
  const width = prestigeWidth(ctx, label),
    padding = 12 + (label.style.tier >= 4 ? 10 : 0);
  if (width <= maxWidth) return label;
  const fontSize = Math.max(
    12.5,
    (label.style.fontSize * (maxWidth - padding)) / (width - padding),
  );
  return {
    ...label,
    style: { ...label.style, fontSize, height: fontSize + 8 },
  };
}
export function drawPrestigeLabel(
  ctx: CanvasRenderingContext2D,
  label: PrestigeLabel,
  x: number,
  y: number,
  width: number,
  now: number,
  simple = false,
): void {
  const style = label.style,
    high = style.tier >= 4,
    h = style.height,
    t = prestigeTime(now),
    compact = prestigeSimple(simple);
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.translate(x, y);
  ctx.font = prestigeFont(style);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#071018";
  ctx.lineWidth = 2.5;
  ctx.strokeText(label.text, 0, 0);
  const shine = compact ? 0.5 : 0.5 + Math.sin(t / 1800) * 0.3;
  const ink = ctx.createLinearGradient(-width / 2, -h / 2, width / 2, h / 2);
  ink.addColorStop(0, style.color);
  ink.addColorStop(shine - 0.12, style.color);
  ink.addColorStop(shine, style.accent);
  ink.addColorStop(shine + 0.12, style.color);
  ink.addColorStop(1, style.accent);
  ctx.shadowColor = style.color;
  ctx.shadowBlur = 0;
  ctx.fillStyle = ink;
  ctx.fillText(label.text, 0, 0);
  ctx.shadowBlur = 0;
  if (high && !compact) {
    for (const side of [-1, 1]) {
      const edge = side * (width / 2 - 3),
        sparkle = 2 + 0.5 * Math.sin(t / 700 + side);
      ctx.strokeStyle = style.accent;
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t / 1100 + side);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(edge - sparkle, 0);
      ctx.lineTo(edge + sparkle, 0);
      ctx.moveTo(edge, -sparkle);
      ctx.lineTo(edge, sparkle);
      ctx.stroke();
    }
  }
  ctx.restore();
}
