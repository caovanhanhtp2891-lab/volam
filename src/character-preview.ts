import type { HeroAppearance } from "./combat-art";
import { drawGlow } from "./battle-vfx";
import { drawCultivationAura } from "./cultivation-art";
import type { Cultivation } from "./cultivation";
import { ELEMENTS, factionOf, type FactionId } from "./idle";

let pedestal: HTMLCanvasElement | undefined;
function drawPortraitBody(
  ctx: CanvasRenderingContext2D,
  factionId: FactionId,
  sex: "male" | "female",
  appearance: HeroAppearance,
  now: number,
): void {
  const color =
    appearance.armorColor || ELEMENTS[factionOf(factionId).element].color;
  const ink = "#17232d",
    skin = "#f0c8a0",
    gold = "#e7cb83";
  const sway = Math.sin(now / 650) * 1.4;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // A full-body portrait uses longer robe and limbs than the small arena sprite.
  ctx.fillStyle = color;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-19, -126);
  ctx.quadraticCurveTo(-34, -85, -27 + sway, -45);
  ctx.lineTo(0, -64);
  ctx.lineTo(28 + sway, -45);
  ctx.quadraticCurveTo(33, -85, 19, -126);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(side * 11, -73);
    ctx.lineTo(side * 13, -39);
    ctx.lineTo(side * 12, -5);
    ctx.stroke();
    ctx.strokeStyle = "#345465";
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.fillStyle = "#172b34";
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(side * 14, -1, 11, 4, -side * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.translate(0, -Math.sin(now / 550) * 0.7);
  for (const side of [-1, 1]) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(side * 19, -128);
    ctx.lineTo(side * 28, -104);
    ctx.lineTo(side * 24, -80);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 11;
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(side * 26, -96);
    ctx.lineTo(side * 24, -79);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(side * 24, -77, 4, 6, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#d8d3b6";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -131);
  ctx.lineTo(16, -131);
  ctx.lineTo(16, -70);
  ctx.lineTo(-16, -70);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-20, -134);
  ctx.lineTo(-6, -135);
  ctx.lineTo(-3, -103);
  ctx.lineTo(-8, -74);
  ctx.lineTo(-26, -55);
  ctx.lineTo(-24, -109);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, -134);
  ctx.lineTo(6, -135);
  ctx.lineTo(2, -103);
  ctx.lineTo(9, -74);
  ctx.lineTo(26, -55);
  ctx.lineTo(24, -109);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -133);
  ctx.lineTo(-2, -104);
  ctx.lineTo(-18, -66);
  ctx.moveTo(8, -133);
  ctx.lineTo(2, -104);
  ctx.lineTo(18, -66);
  ctx.stroke();
  ctx.fillStyle = "#423b30";
  ctx.fillRect(-19, -88, 38, 8);
  ctx.fillStyle = gold;
  ctx.fillRect(-5, -89, 10, 10);
  if (sex === "female") {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-8, -153);
    ctx.quadraticCurveTo(-30 + sway, -131, -16 + sway, -111);
    ctx.lineTo(2, -136);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.fillRect(-5, -141, 10, 12);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -151, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, -161, 12, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-1, -173, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -160);
  ctx.lineTo(10, -160);
  ctx.moveTo(-8, -158);
  ctx.quadraticCurveTo(-20, -150, -22 + sway, -146);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.fillRect(-6, -151, 2, 2);
  ctx.fillRect(4, -151, 2, 2);
  ctx.fillStyle = "#a46e57";
  ctx.fillRect(-3, -143, 6, 1);
  ctx.save();
  ctx.translate(25, -77);
  ctx.rotate(0.38);
  const staff = ["tianren", "kunlun", "gaibang"].includes(factionId),
    spear = factionId === "tianwang";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 35);
  ctx.lineTo(0, -(staff || spear ? 86 : 60));
  ctx.stroke();
  ctx.strokeStyle = staff ? gold : appearance.weaponColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  if (staff) {
    drawGlow(ctx, 0, -84, 9, appearance.weaponColor, 0.8);
    ctx.fillStyle = "#ffedaf";
    ctx.beginPath();
    ctx.arc(0, -84, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = appearance.weaponColor;
    ctx.beginPath();
    ctx.moveTo(0, spear ? -101 : -72);
    ctx.lineTo(-5, spear ? -81 : -55);
    ctx.lineTo(5, spear ? -81 : -55);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(8, -3);
    ctx.stroke();
  }
  if (appearance.tier >= 2 || appearance.enhancement > 0)
    drawGlow(ctx, 0, -38, 14, appearance.weaponColor, 0.35);
  ctx.restore();
  ctx.restore();
}
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
  },
  now: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / 360, canvas.height / 400);
  ctx.drawImage(portraitPedestal(), 0, 0);
  ctx.translate(180, 280);
  ctx.save();
  ctx.scale(2.2, 2.2);
  drawCultivationAura(ctx, character.cultivation, now);
  ctx.restore();
  ctx.translate(0, 44);
  ctx.scale(1.5, 1.5);
  drawPortraitBody(
    ctx,
    character.factionId,
    character.sex,
    character.appearance,
    now,
  );
  ctx.restore();
}
