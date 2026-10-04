import type { TitleDefinition } from "./character-progression";
import { prestigeTime, prestigeSimple } from "./prestige-art";
import { drawMilitaryDragons } from "./military-vfx";

// Small vector motifs, drawn around the feet. No bitmap or particle allocation.
export function drawTitleEffect(ctx: CanvasRenderingContext2D, title: TitleDefinition, now: number, simple = false): void {
  now = prestigeTime(now); simple = prestigeSimple(simple);
  ctx.save(); ctx.translate(0, 8); ctx.scale(1 + title.rarity * .06, .6 + title.rarity * .025);
  ctx.shadowColor = title.color; ctx.shadowBlur = simple ? 0 : 2 + title.rarity * 1.5;
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
    case "dragon":
      ctx.save(); ctx.scale(.75, 1.1); drawMilitaryDragons(ctx, "thai-thu", now, false, simple, title.color); drawMilitaryDragons(ctx, "thai-thu", now, true, simple, title.color); ctx.restore(); break;
    case "phoenix":
      for (const side of [-1, 1]) for (let i=0;i<5;i++) { ctx.beginPath(); ctx.moveTo(0, 9); ctx.quadraticCurveTo(side*(16+i*3), -31+i*2, side*(35+i*3), -14+i*7); ctx.quadraticCurveTo(side*14, 8+i*3, 0, 9); ctx.stroke(); }
      ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-23);ctx.lineTo(7,-16);ctx.moveTo(0,8);ctx.quadraticCurveTo(-15,33,0,39);ctx.quadraticCurveTo(15,33,0,8);ctx.stroke();break;
    case "constellation":
      polygon(6,34);for(let i=0;i<6;i++){const [x,y]=point(i*Math.PI/3,34);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();}polygon(3,15);break;
    case "blade-wheel":
      for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(19,-3);ctx.lineTo(41,0);ctx.lineTo(19,3);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(16,-6);ctx.lineTo(16,6);ctx.moveTo(10,0);ctx.lineTo(19,0);ctx.stroke();ctx.restore();}polygon(6,14);break;
    case "clouds":
      for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(18,3);ctx.bezierCurveTo(14,-9,25,-16,29,-7);ctx.bezierCurveTo(43,-13,47,9,30,10);ctx.lineTo(18,10);ctx.stroke();ctx.restore();}break;
    case "halo":
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,17+i*9,0,Math.PI*2);ctx.stroke();}polygon(8,29);break;
    case "orbit":
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 19, .6, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 34, 19, -.6, 0, Math.PI * 2); ctx.stroke(); polygon(6, 13); break;
  }
  ctx.shadowBlur = 0;
  if (title.rarity >= 2) {ctx.strokeStyle = title.color;ctx.globalAlpha=.55;ctx.lineWidth=1+title.rarity*.3;ctx.beginPath();ctx.arc(0,0,36+title.rarity,0,Math.PI*2);ctx.stroke();}
  if (title.rarity >= 4 && !simple) {
    ctx.strokeStyle='#fff0be';ctx.fillStyle='#fff0be';ctx.lineWidth=1.2;ctx.globalAlpha=.8;
    const count=title.rarity===5?10:6;for(let i=0;i<count;i++){const [x,y]=point(-now/2800+i*Math.PI*2/count,42+Math.sin(now/600+i)*2);ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
    if(title.rarity===5){polygon(8,46);ctx.setLineDash([3,6]);ctx.beginPath();ctx.arc(0,0,49,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
}
