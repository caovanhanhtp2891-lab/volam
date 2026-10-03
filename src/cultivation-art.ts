import { drawGlow } from "./battle-vfx";
import type { Cultivation } from "./cultivation";

const TAU = Math.PI * 2;
// The aura stays on the ground while the animated body moves above it.
export function drawCultivationAura(
  ctx: CanvasRenderingContext2D,
  cultivation: Cultivation,
  now: number,
): void {
  const {
    rank: realmRank,
    phaseIndex,
    realm: { color, accent },
  } = cultivation;
  if (realmRank === 0) {
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = .3; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 19, 27, 9, 0, 0, TAU); ctx.stroke(); ctx.restore();
    return;
  }
  const rank = realmRank - 1;
  const radius = 34 + rank * 1.8 + phaseIndex * 0.4;
  const rotation = now / (11000 - rank * 200);
  const rings = 1 + Math.floor(rank / 4);
  ctx.save();
  ctx.translate(0, 19);
  ctx.scale(1, 0.36);
  ctx.lineCap = "round";
  drawGlow(ctx, 0, 0, radius * 1.35, color, 0.16 + rank * 0.012);
  for (let i = 0; i < rings; i++) {
    const r = radius * (1 - i * 0.13);
    ctx.globalAlpha = 0.65 - i * 0.06;
    ctx.strokeStyle = i % 2 ? accent : color;
    ctx.lineWidth = i === 0 ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    if (rank >= 2) {
      ctx.save();
      ctx.rotate(rotation * (i % 2 ? -1 : 1));
      ctx.setLineDash([rank >= 10 ? 7 : 4, 9]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 0.85;
  if (rank >= 3) {
    // Trigram seals grow into a rotating lotus formation at higher realms.
    const petals = rank >= 14 ? 12 : rank >= 5 ? 8 : 6;
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate(rotation + (i * TAU) / petals);
      ctx.strokeStyle = i % 2 ? accent : color;
      ctx.lineWidth = rank >= 10 ? 1.7 : 1.2;
      if (rank >= 5) {
        ctx.beginPath();
        ctx.moveTo(radius * 0.3, 0);
        ctx.quadraticCurveTo(radius * 0.7, -radius * 0.23, radius * 1.16, 0);
        ctx.quadraticCurveTo(radius * 0.7, radius * 0.23, radius * 0.3, 0);
        ctx.stroke();
      }
      for (let j = 0; j < 3; j++) {
        const x = radius * 0.75 + j * 4;
        ctx.beginPath();
        ctx.moveTo(x, -5);
        ctx.lineTo(x, j === i % 3 ? -1 : 5);
        if (j === i % 3) {
          ctx.moveTo(x, 1);
          ctx.lineTo(x, 5);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (rank >= 10) {
    ctx.save();
    ctx.rotate(-rotation * 0.7);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = (i * TAU * 2) / 5;
      const x = Math.cos(a) * radius * 0.65,
        y = Math.sin(a) * radius * 0.65;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  const motes = 3 + Math.floor(rank / 2);
  for (let i = 0; i < motes; i++) {
    const a = rotation * (i % 2 ? -2 : 2) + (i * TAU) / motes;
    const x = Math.cos(a) * radius,
      y = Math.sin(a) * radius;
    drawGlow(ctx, x, y, rank >= 10 ? 6 : 4, i % 2 ? accent : color, 0.8);
    if (rank >= 14) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x, y + 7);
      ctx.stroke();
    }
  }
  if (rank === 9 || rank >= 17) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 6; i++) {
      const a = -rotation + (i * TAU) / 6;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(radius * 0.45, 0);
      ctx.lineTo(radius * 0.62, -5);
      ctx.lineTo(radius * 0.66, 5);
      ctx.lineTo(radius * 0.85, -3);
      ctx.lineTo(radius, 0);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  if (rank >= 5) {
    ctx.save();
    for (let i = 0; i < Math.min(10, rank - 2); i++) {
      const t = (now / (2300 - rank * 35) + i * 0.17) % 1;
      const x = Math.cos(i * 2.4 + rotation) * radius * 0.8;
      drawGlow(
        ctx,
        x,
        12 - t * (25 + rank),
        3 + rank / 10,
        i % 2 ? accent : color,
        Math.sin(t * Math.PI) * 0.6,
      );
    }
    ctx.restore();
  }
}
