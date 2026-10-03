import type { TitleDefinition } from "./character-progression";

// Small vector motifs, drawn around the feet. No bitmap or particle allocation.
export function drawTitleEffect(ctx: CanvasRenderingContext2D, title: TitleDefinition, now: number): void {
  ctx.save(); ctx.translate(0, 8); ctx.scale(1, .6);
  ctx.strokeStyle = title.color; ctx.fillStyle = title.color; ctx.lineWidth = 1.5;
  ctx.globalAlpha = .8; ctx.rotate(now / 4500);
  const point = (angle: number, radius: number) => [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
  const polygon = (sides: number, radius: number, offset = 0) => {
    ctx.beginPath(); for (let i = 0; i < sides; i++) { const [x, y] = point(offset + i * Math.PI * 2 / sides, radius); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); ctx.stroke();
  };
  switch (title.motif) {
    case "leaf":
      for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.ellipse(24, 0, 8, 3, -.5, 0, Math.PI * 2); ctx.stroke(); } break;
    case "arrows":
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(18, -5); ctx.lineTo(32, 0); ctx.lineTo(18, 5); ctx.stroke(); } break;
    case "diamonds":
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.save(); ctx.translate(28, 0); polygon(4, 5); ctx.restore(); } break;
    case "crown":
      ctx.beginPath(); ctx.moveTo(-25, 12); ctx.lineTo(-29, -12); ctx.lineTo(-12, 0); ctx.lineTo(0, -23); ctx.lineTo(12, 0); ctx.lineTo(29, -12); ctx.lineTo(25, 12); ctx.closePath(); ctx.stroke(); break;
    case "runes": polygon(4, 31); polygon(4, 25, Math.PI / 4); break;
    case "coins":
      for (let i = 0; i < 5; i++) { const [x,y] = point(i * Math.PI * 2 / 5, 27); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke(); ctx.strokeRect(x - 1, y - 1, 2, 2); } break;
    case "sparks":
      for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(32 + Math.sin(now / 250 + i) * 3, 0); ctx.stroke(); } break;
    case "swords":
      for (let i = 0; i < 2; i++) { ctx.rotate(Math.PI); ctx.beginPath(); ctx.moveTo(22, -19); ctx.lineTo(25, -28); ctx.lineTo(28, -19); ctx.lineTo(28, 13); ctx.lineTo(22, 13); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(17, 13); ctx.lineTo(33, 13); ctx.moveTo(25, 13); ctx.lineTo(25, 23); ctx.stroke(); } break;
    case "stars":
      for (let i = 0; i < 5; i++) { const [x,y] = point(i * Math.PI * 2 / 5, 28); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke(); } break;
    case "sun":
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(27, 0); ctx.lineTo(34, 0); ctx.stroke(); } break;
    case "lotus":
      for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.ellipse(17, 0, 15, 6, 0, 0, Math.PI * 2); ctx.stroke(); } break;
    case "orbit":
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 19, .6, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 34, 19, -.6, 0, Math.PI * 2); ctx.stroke(); polygon(6, 13); break;
  }
  ctx.restore();
}
