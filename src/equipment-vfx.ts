import type { EquipmentData } from "./equipment";
import { rarityTier, RARITY_COLORS } from "./equipment.ts";
import type { Element } from "./idle";
import { GEAR_SETS, type SetId } from "./gear-catalog.ts";
import { drawSetCrest } from "./set-art.ts";
import { drawGlow } from "./battle-vfx.ts";
export interface EquipmentVisual {
  color: string;
  rarity?: EquipmentData["rarity"];
  enhance?: number;
  element?: Element;
  setId?: SetId;
}
export function equipmentVisualState(
  item: Partial<EquipmentData>,
  simple = false,
) {
  const tier = rarityTier(item.rarity),
    enhance = Math.max(0, Math.min(10, item.enhance ?? 0));
  const band = Math.max(
    [0, 0, 1, 1, 2, 3, 4][tier],
    enhance >= 10 ? 3 : enhance >= 7 ? 2 : enhance >= 3 ? 1 : 0,
  );
  return {
    tier,
    enhance,
    halo: tier >= 2 || enhance >= 7,
    band,
    motes: simple
      ? 0
      : Math.max(
          [0, 0, 2, 3, 4, 6, 8][tier],
          enhance >= 10 ? 6 : enhance >= 7 ? 4 : 0,
        ),
    beam: [0, 36, 70, 98, 125, 155, 190][tier],
  };
}
export function drawElementMote(
  ctx: CanvasRenderingContext2D,
  element: Element | undefined,
  size: number,
): void {
  ctx.beginPath();
  if (element === "hoa") {
    ctx.moveTo(0, -size * 1.5);
    ctx.quadraticCurveTo(size * 1.4, 0, 0, size);
    ctx.quadraticCurveTo(-size, 0, 0, -size * 1.5);
  } else if (element === "moc") {
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 1.6, 0, 0, size);
    ctx.quadraticCurveTo(-size, 0, 0, -size);
  } else if (element === "thuy") {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    }
    ctx.stroke();
    return;
  } else if (element === "tho") {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(0, -size * 1.4);
    ctx.lineTo(size * 0.55, 0);
    ctx.lineTo(0, size * 1.4);
    ctx.lineTo(-size * 0.55, 0);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}
export function drawEquipmentRadiance(
  ctx: CanvasRenderingContext2D,
  item: EquipmentVisual,
  now: number,
  radius = 18,
  simple = false,
): void {
  const state = equipmentVisualState(item, simple);
  if (!state.halo) return;
  const color = item.rarity ? RARITY_COLORS[item.rarity] : item.color;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.8;
  if (!simple)
    drawGlow(
      ctx,
      0,
      0,
      radius * (1.15 + 0.1 * state.band),
      color,
      0.15 + state.band * 0.08,
    );
  if (state.band) {
    ctx.globalAlpha *= 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, now / 1400, now / 1400 + Math.PI * 1.4);
    ctx.stroke();
    if (state.band >= 2) {
      ctx.beginPath();
      ctx.arc(0, 0, radius + 3, -now / 1800, -now / 1800 + Math.PI);
      ctx.stroke();
    }
    if (state.tier >= 5) {
      ctx.save();
      ctx.rotate(now / 1700);
      ctx.lineWidth = state.tier === 6 ? 1.3 : 0.7;
      for (let i = 0; i < (state.tier === 6 ? 8 : 6); i++) {
        const a = (i * Math.PI * 2) / (state.tier === 6 ? 8 : 6);
        ctx.save();
        ctx.translate(Math.cos(a) * (radius + 5), Math.sin(a) * (radius + 5));
        ctx.rotate(a);
        drawElementMote(ctx, item.element, state.tier === 6 ? 3 : 2);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  if (item.setId && state.band >= 2 && !simple) {
    ctx.save();
    ctx.rotate(-now / 1800);
    drawSetCrest(ctx, GEAR_SETS[item.setId].crest, radius * 0.42, color);
    ctx.restore();
  }
  for (let i = 0; i < state.motes; i++) {
    const angle =
      now / (state.band >= 3 ? 750 : 1400) + (i * Math.PI * 2) / state.motes;
    ctx.save();
    ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.75);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.65 + Math.sin(now / 280 + i) * 0.2;
    drawElementMote(ctx, item.element, state.band >= 3 ? 2.6 : 1.7);
    ctx.restore();
  }
  ctx.restore();
}
export function drawEquipmentDropAura(
  ctx: CanvasRenderingContext2D,
  item: EquipmentVisual,
  now: number,
  landed: boolean,
  simple = false,
): void {
  const state = equipmentVisualState(item, simple),
    color = item.rarity ? RARITY_COLORS[item.rarity] : item.color;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  if (state.halo && !simple)
    drawGlow(ctx, 0, 0, 23 + state.tier * 4, color, 0.2 + state.tier * 0.05);
  ctx.globalAlpha *= 0.45;
  ctx.lineWidth = state.tier >= 3 ? 1.5 : 1;
  if (state.halo) {
    ctx.beginPath();
    ctx.ellipse(0, 6, 16 + state.tier * 2, 5 + state.tier, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (landed && state.tier >= 2) {
    if (state.halo) {
      ctx.beginPath();
      ctx.ellipse(0, 6, 12 + state.tier * 2, 3 + state.tier, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!simple) {
      ctx.globalAlpha = 0.12 + Math.sin(now / 320) * 0.025;
      ctx.beginPath();
      ctx.moveTo(-10 - state.tier, 0);
      ctx.lineTo(-3, -state.beam);
      ctx.lineTo(3, -state.beam);
      ctx.lineTo(10 + state.tier, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.fillRect(-1, -state.beam, 2, state.beam);
      for (let i = 0; i < state.motes; i++) {
        const t = (now / 1700 + i / (state.tier + 1)) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.8;
        ctx.translate(Math.sin(now / 700 + i * 2) * 10, -t * state.beam * 0.65);
        drawElementMote(ctx, item.element, state.tier === 4 ? 2.3 : 1.5);
        ctx.restore();
      }
    }
    if (state.enhance >= 10 || state.tier >= 5) {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = state.tier === 6 ? "#ffd4dc" : "#ffe7a6";
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + now / 2400;
        ctx.moveTo(Math.cos(a) * 20, 6 + Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * 25, 6 + Math.sin(a) * 10);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}
