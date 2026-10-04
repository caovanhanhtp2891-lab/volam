import type { Cultivation } from './cultivation.ts';
import type { TitleDefinition } from './character-progression.ts';
import { MILITARY_RANKS, type MilitaryRankId } from './military.ts';

export interface PrestigeStyle { color: string; accent: string; fontSize: number; tier: number; glow: number; height: number }
const reducedMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;
export const prestigeTime = (now: number) => reducedMotion?.matches ? 0 : now;
export const prestigeSimple = (simple = false) => simple || !!reducedMotion?.matches;
export function realmStyle(cultivation: Cultivation): PrestigeStyle {
  const tier = 1 + Math.floor(cultivation.rank / 5), fontSize = 16 + Math.floor(cultivation.rank / 4);
  return { color: cultivation.realm.color, accent: cultivation.realm.accent, fontSize, tier, glow: 3 + cultivation.rank * .5, height: fontSize + 12 };
}
export function titleStyle(title: TitleDefinition): PrestigeStyle {
  const fontSize = 14 + title.rarity * 2;
  return { color: title.color, accent: title.rarity >= 4 ? '#fff0ba' : '#ecfff5', fontSize, tier: title.rarity, glow: title.rarity * 3, height: fontSize + 12 };
}
export function militaryStyle(id: MilitaryRankId): PrestigeStyle {
  const rank = MILITARY_RANKS.findIndex(value => value.id === id), definition = MILITARY_RANKS[rank];
  const fontSize = 18 + rank * 1.3;
  return { color: definition.color, accent: rank >= 4 ? '#fff0b4' : '#e2ffef', fontSize, tier: rank + 1, glow: 5 + rank * 2, height: fontSize + 12 };
}
export interface PrestigeLabel { text: string; style: PrestigeStyle; kind: 'military' | 'title' | 'realm' }
export interface LabelPlacement { label: PrestigeLabel; x: number; y: number; width: number }
export function prestigeFont(style: PrestigeStyle): string { return `800 ${style.fontSize}px 'DM Sans', sans-serif`; }
// Keep the whole ordered stack inside the camera. At the upper edge it moves
// beside the actor rather than pushing the bottom badge over the actor's head.
export function placePrestigeLabels(labels: readonly PrestigeLabel[], widths: readonly number[], x: number, bottom: number, bounds: { left: number; right: number; top: number; bottom: number }): LabelPlacement[] {
  const gap = 5, total = labels.reduce((sum, label) => sum + label.style.height, 0) + Math.max(0, labels.length - 1) * gap;
  const widest = Math.max(0, ...widths), idealTop = bottom - total;
  let center = x;
  if (idealTop < bounds.top) center += x - bounds.left < bounds.right - x ? widest / 2 + 42 : -widest / 2 - 42;
  center = Math.max(bounds.left + widest / 2, Math.min(bounds.right - widest / 2, center));
  let top = Math.max(bounds.top, Math.min(bounds.bottom - total, idealTop));
  return labels.map((label, i) => { const y = top + label.style.height / 2; top += label.style.height + gap; return {label,x:center,y,width:widths[i]}; });
}
export function prestigeWidth(ctx: CanvasRenderingContext2D, label: PrestigeLabel): number {
  ctx.font = prestigeFont(label.style);
  return ctx.measureText(label.text).width + 28 + (label.style.tier >= 4 ? 24 : 0);
}
export function fitPrestigeLabel(ctx: CanvasRenderingContext2D, label: PrestigeLabel, maxWidth: number): PrestigeLabel {
  const width = prestigeWidth(ctx, label), padding = 28 + (label.style.tier >= 4 ? 24 : 0);
  if (width <= maxWidth) return label;
  const fontSize = Math.max(14, label.style.fontSize * (maxWidth - padding) / (width - padding));
  return { ...label, style: { ...label.style, fontSize, height: fontSize + 12 } };
}
export function drawPrestigeLabel(ctx: CanvasRenderingContext2D, label: PrestigeLabel, x: number, y: number, width: number, now: number, simple = false): void {
  const style = label.style, high = style.tier >= 4, h = style.height, t = prestigeTime(now);
  ctx.save(); ctx.translate(x,y); ctx.font = prestigeFont(style); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#071319ed'; ctx.strokeStyle = style.color; ctx.lineJoin = 'round'; ctx.lineWidth = high ? 2.3 : 1.5;
  ctx.shadowColor = style.color; ctx.shadowBlur = prestigeSimple(simple) ? 0 : style.glow;
  ctx.beginPath(); ctx.roundRect(-width/2,-h/2,width,h,high?7:4); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  if (high) {
    ctx.strokeStyle = style.accent; ctx.globalAlpha = .8; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.roundRect(-width/2+3,-h/2+3,width-6,h-6,4); ctx.stroke(); ctx.globalAlpha = 1;
    for(const side of [-1,1]) {
      const edge = side * (width/2-8);ctx.fillStyle=style.accent;ctx.beginPath();ctx.moveTo(edge,-6);ctx.lineTo(edge+side*4,0);ctx.lineTo(edge,6);ctx.lineTo(edge-side*3,0);ctx.closePath();ctx.fill();
    }
  }
  const ink = ctx.createLinearGradient(0,-h/2,0,h/2);ink.addColorStop(0,'#ffffff');ink.addColorStop(.5,style.color);ink.addColorStop(1,style.accent);
  ctx.strokeStyle='#031016';ctx.lineWidth=3.2;ctx.strokeText(label.text,0,0);ctx.fillStyle=ink;ctx.fillText(label.text,0,0);
  if(high && !prestigeSimple(simple)) {
    const phase=(t/2600)%1, shineX=-width/2+phase*width;ctx.strokeStyle=style.accent;ctx.globalAlpha=.65;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(shineX-4,-h/2);ctx.lineTo(shineX+4,-h/2);ctx.moveTo(shineX,-h/2-3);ctx.lineTo(shineX,-h/2+3);ctx.stroke();
    for(let n=0;n<Math.min(4,style.tier-2);n++){const px=Math.cos(t/950+n*2.2)*(width/2-5);ctx.fillStyle=style.accent;ctx.globalAlpha=.45+.3*Math.sin(t/600+n);ctx.beginPath();ctx.arc(px,n%2?h/2:-h/2,1.2,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
