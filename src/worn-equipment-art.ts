import type { EquipmentData } from "./equipment";
import { rarityTier } from "./equipment";
import { drawGlow } from "./battle-vfx";
import { drawEquipmentRadiance } from "./equipment-vfx";
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
): void {
  const scale = portrait ? 2.4 : 1,
    chest = portrait ? -113 : -12,
    head = portrait ? -162 : -29;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (look.armor) {
    const armor = look.armor,
      armored = ["plate", "mail", "lamellar"].includes(
        armor.variant ?? "plate",
      );
    ctx.save();
    ctx.translate(0, chest);
    ctx.scale(scale, scale);
    ctx.fillStyle = armor.color;
    ctx.strokeStyle = "#132433";
    ctx.lineWidth = 1;
    if (armored) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 5, -8);
        ctx.lineTo(side * 10, -7);
        ctx.lineTo(side * 12, -3);
        ctx.lineTo(side * 5, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#f2dc9e";
        ctx.beginPath();
        ctx.moveTo(side * 6, -6);
        ctx.lineTo(side * 10, -4);
        ctx.stroke();
        ctx.strokeStyle = "#132433";
      }
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#8ea9b8";
      ctx.beginPath();
      ctx.moveTo(-5, -3);
      ctx.lineTo(5, -3);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 9);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = armor.color;
      ctx.beginPath();
      if (armor.variant === "lamellar") {
        for (let y = 0; y < 7; y += 3) {
          ctx.moveTo(-4, y);
          ctx.lineTo(0, y + 2);
          ctx.lineTo(4, y);
        }
      } else {
        ctx.moveTo(-3, 0);
        ctx.lineTo(0, 5);
        ctx.lineTo(3, 0);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = armor.color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-7, 9);
      ctx.moveTo(5, -8);
      ctx.lineTo(2, 0);
      ctx.lineTo(7, 9);
      ctx.stroke();
      if (armor.variant === "brocade") {
        ctx.strokeStyle = "#f0d895";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-4, 3);
        ctx.quadraticCurveTo(-9, 0, -6, 7);
        ctx.moveTo(4, 3);
        ctx.quadraticCurveTo(9, 0, 6, 7);
        ctx.stroke();
      }
    }
    if (
      !look.simpleEffects &&
      (rarityTier(armor.rarity) >= 3 || (armor.enhance ?? 0) >= 7)
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
    ctx.translate(0, head);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#1b2934";
    ctx.fillStyle = helmet.color;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (["crown", "lotuscoronet"].includes(helmet.variant ?? "")) {
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
      ctx.moveTo(side * (portrait ? 8 : 3), portrait ? -3 : 8);
      ctx.lineTo(side * (portrait ? 20 : 8), portrait ? -3 : 8);
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
    if (rarityTier(pendant.rarity) >= 3 || (pendant.enhance ?? 0) >= 3)
      drawEquipmentRadiance(ctx, pendant, now, 8, look.simpleEffects);
    ctx.restore();
  }
  ctx.restore();
}
