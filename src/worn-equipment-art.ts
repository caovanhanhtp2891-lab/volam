import type { EquipmentData } from "./equipment";
import { drawGlow } from "./battle-vfx";
import { equipmentVisualState, drawEquipmentRadiance } from "./equipment-vfx";
import { GEAR_SETS } from "./gear-catalog";
import { drawSetCrest } from "./set-art.ts";
export type WornVisual = Partial<EquipmentData> & { color: string };
export interface WearableAppearance {
  armor?: WornVisual;
  helmet?: WornVisual;
  boots?: WornVisual;
  pendant?: WornVisual;
  simpleEffects?: boolean;
}
export function drawWearableDetails(
  ctx: CanvasRenderingContext2D,
  look: WearableAppearance,
  now: number,
  portrait = false,
  footstep = 0,
): void {
  const scale = portrait ? 2.4 : 1,
    chest = portrait ? -113 : -12,
    head = portrait ? -162 : -29;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (look.armor) {
    const armor = look.armor,
      armored = ["plate", "mail", "lamellar", "phoenixmail"].includes(
        armor.variant ?? "plate",
      );
    ctx.save();
    ctx.translate(0, chest);
    ctx.scale(scale, scale);
    ctx.fillStyle = armor.color;
    ctx.strokeStyle = "#132433";
    ctx.lineWidth = 1;
    // Small fittings follow the painted costume instead of covering it with plates.
    ctx.strokeStyle = armor.color;
    ctx.lineWidth = .65;
    ctx.globalAlpha *= .8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 3, -4);
      ctx.quadraticCurveTo(side * 5, -1, side * 3, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(side * 5, -4, armored ? 1.5 : .8, 1, side * .5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#dac58c";
    ctx.lineWidth = .45;
    ctx.beginPath(); ctx.moveTo(-3, 4); ctx.quadraticCurveTo(0, 5, 3, 4); ctx.stroke();
    if (armor.setId) {
      ctx.save(); ctx.translate(0, 1);
      drawSetCrest(ctx, GEAR_SETS[armor.setId].crest, 2, GEAR_SETS[armor.setId].color);
      ctx.restore();
    }
    if (
      !look.simpleEffects &&
      equipmentVisualState(armor).halo
    ) {
      for (const side of [-1, 1]) {
        const t = (now / 1600 + (side + 1) / 4) % 1;
        drawGlow(
          ctx,
          side * (11 + t * 2),
          -2 - t * 9,
          4,
          armor.color,
          (1 - t) * 0.55,
        );
      }
    }
    ctx.restore();
  }
  if (look.helmet) {
    const helmet = look.helmet;
    ctx.save();
    ctx.translate(0, head - 2);
    ctx.scale(scale * .45, scale * .45);
    ctx.strokeStyle = "#1b2934";
    ctx.fillStyle = helmet.color;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (["crown", "lotuscoronet", "phoenixcrown", "thundercrest"].includes(helmet.variant ?? "")) {
      ctx.moveTo(-4, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-2, -2);
      ctx.lineTo(0, -6);
      ctx.lineTo(2, -2);
      ctx.lineTo(5, -4);
      ctx.lineTo(4, 0);
    } else if (helmet.variant === "dragonhelm") {
      ctx.moveTo(-5, 1);
      ctx.lineTo(-7, -6);
      ctx.lineTo(-2, -3);
      ctx.lineTo(0, -5);
      ctx.lineTo(2, -3);
      ctx.lineTo(7, -6);
      ctx.lineTo(5, 1);
    } else if (helmet.variant === "veiledhat") {
      ctx.moveTo(-8, 0);
      ctx.lineTo(0, -5);
      ctx.lineTo(8, 0);
    } else {
      ctx.moveTo(-4, 0);
      ctx.lineTo(-3, -3);
      ctx.lineTo(0, -5);
      ctx.lineTo(3, -3);
      ctx.lineTo(4, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff2ba";
    ctx.fillRect(-0.7, -2.6, 1.4, 2);
    ctx.restore();
  }
  if (look.boots) {
    ctx.strokeStyle = look.boots.color;
    ctx.lineWidth = portrait ? 2 : 1;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const stride = portrait ? 0 : footstep * side;
      const y = portrait ? -3 : 8 - Math.max(0, stride) * 2.4;
      ctx.moveTo(side * (portrait ? 8 : 3) + stride * 2.8, y);
      ctx.lineTo(side * (portrait ? 20 : 8) + stride * 2.8, y);
    }
    ctx.stroke();
  }
  if (look.pendant) {
    const pendant = look.pendant;
    ctx.save();
    ctx.translate(0, chest + scale * 4);
    ctx.scale(scale, scale);
    ctx.fillStyle = pendant.color;
    ctx.strokeStyle = "#fff2ba";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -1.5);
    ctx.lineTo(2, 1);
    ctx.lineTo(0, 4);
    ctx.lineTo(-2, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (equipmentVisualState(pendant).halo)
      drawEquipmentRadiance(ctx, pendant, now, 8, look.simpleEffects);
    ctx.restore();
  }
  ctx.restore();
}
