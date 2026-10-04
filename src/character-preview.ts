import { drawAnimatedHero, type HeroAppearance } from "./combat-art";
import { freshMotion } from "./combat";
import { type MountAppearance } from "./mount-art";
import { drawGearAura } from "./gear-effects";
import { drawCultivationAura } from "./cultivation-art";
import type { Cultivation } from "./cultivation";
import type { FactionId } from "./idle";
import { SECT_BY_FACTION } from "./sects";
import { characterArtKey } from "./character-art";
import { drawMountedCharacter } from "./mounted-character-art";
import { drawMilitaryDragons } from "./military-vfx";
import type { MilitaryRankId } from "./military";
import { drawTitleEffect } from "./title-art";
import type { TitleDefinition } from "./character-progression";

let pedestal: HTMLCanvasElement | undefined;
function portraitPedestal(): HTMLCanvasElement {
  if (pedestal) return pedestal;
  pedestal = document.createElement("canvas");
  pedestal.width = 360;
  pedestal.height = 400;
  const ctx = pedestal.getContext("2d")!;
  const gold = ctx.createLinearGradient(0, 300, 0, 365);
  gold.addColorStop(0, "#fff1ad");
  gold.addColorStop(0.3, "#bf8d34");
  gold.addColorStop(0.65, "#5d3c17");
  gold.addColorStop(1, "#d9ae53");
  ctx.fillStyle = "#0009";
  ctx.beginPath();
  ctx.ellipse(180, 352, 147, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 2; i >= 0; i--) {
    ctx.fillStyle = gold;
    ctx.strokeStyle = "#eac274";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(180, 332 + i * 8, 140 - i * 2, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#6b5427";
  ctx.beginPath();
  ctx.ellipse(180, 328, 133, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e5c87e";
  ctx.lineWidth = 2;
  for (const r of [118, 104, 68]) {
    ctx.beginPath();
    ctx.ellipse(180, 328, r, r * 0.21, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(180 + Math.cos(a) * 105, 328 + Math.sin(a) * 22);
    ctx.lineTo(180 + Math.cos(a) * 118, 328 + Math.sin(a) * 25);
    ctx.stroke();
  }
  return pedestal;
}

export function drawCharacterPreview(
  canvas: HTMLCanvasElement,
  character: {
    factionId: FactionId;
    sex: "male" | "female";
    appearance: HeroAppearance;
    cultivation: Cultivation;
    horse?: MountAppearance;
    simpleEffects?: boolean;
    militaryRank?: MilitaryRankId;
    title?: TitleDefinition;
  },
  now: number,
): void {
  canvas.dataset.characterArt = characterArtKey(
    SECT_BY_FACTION[character.factionId],
    character.sex,
  );
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / 360, canvas.height / 400);
  ctx.drawImage(portraitPedestal(), 0, 0);
  ctx.translate(180, 280);
  ctx.save();
  ctx.scale(2.2, 2.2);
  drawCultivationAura(ctx, character.cultivation, now, character.simpleEffects);
  if (character.title) drawTitleEffect(ctx, character.title, now, character.simpleEffects);
  if (character.militaryRank) drawMilitaryDragons(ctx, character.militaryRank, now, false, character.simpleEffects);
  drawGearAura(ctx, character.appearance, now, character.simpleEffects);
  ctx.restore();
  ctx.save();
  if (character.horse) {
    ctx.translate(0, 18);
    ctx.scale(2.7, 2.7);
    const motion = freshMotion();
    motion.stride = now / 250;
    drawMountedCharacter(
      ctx,
      character.factionId,
      character.sex,
      character.horse,
      motion,
      now,
      character.appearance,
    );
  } else {
    ctx.scale(4, 4);
    drawAnimatedHero(
      ctx,
      character.factionId,
      character.sex,
      freshMotion(),
      now,
      character.appearance,
    );
  }
  ctx.restore();
  if (character.militaryRank) {
    ctx.save();
    ctx.scale(2.2, 2.2);
    drawMilitaryDragons(ctx, character.militaryRank, now, true, character.simpleEffects);
    ctx.restore();
  }
  ctx.restore();
}
