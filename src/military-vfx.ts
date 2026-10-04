import { MILITARY_RANKS, type MilitaryRankId } from './military.ts';
import { prestigeSimple, prestigeTime } from './prestige-art.ts';
export function militaryDragonSpec(id: MilitaryRankId, simple = false) {
  const rank = MILITARY_RANKS.findIndex(value => value.id === id);
  return { rank, count: !simple && rank >= 4 ? 2 : 1, radius: 42 + rank * 4.5, height: 22 + rank * 3, size: .64 + rank * .1, segments: simple ? 12 : 28, glow: 4 + rank * 1.5, color: MILITARY_RANKS[rank].color as string };
}
export function drawMilitaryDragons(ctx: CanvasRenderingContext2D, id: MilitaryRankId, now: number, front: boolean, simple = false, color?: string): void {
  simple = prestigeSimple(simple);now = prestigeTime(now);
  const spec=militaryDragonSpec(id,simple), tau=Math.PI*2;
  if (color) spec.color = color;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(let dragon=0;dragon<spec.count;dragon++) {
    const head=now/(3000-spec.rank*120)+dragon*tau/spec.count;
    const point=(a:number)=>({x:Math.cos(a)*spec.radius,y:-20+Math.sin(a)*spec.height});
    const path=()=>{ctx.beginPath();let connected=false;for(let i=0;i<=spec.segments;i++){const a=head-2+i*2/spec.segments,p=point(a);if((Math.sin(a)>=0)===front){if(connected)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);connected=true}else connected=false}};
    ctx.strokeStyle=spec.color;ctx.lineWidth=11*spec.size;ctx.globalAlpha=.45+spec.rank*.045;ctx.shadowColor=spec.color;ctx.shadowBlur=simple?0:spec.glow;path();ctx.stroke();ctx.shadowBlur=0;
    ctx.globalAlpha=1;ctx.strokeStyle='#172126';ctx.lineWidth=8*spec.size;path();ctx.stroke();ctx.strokeStyle=spec.color;ctx.lineWidth=5.8*spec.size;path();ctx.stroke();
    ctx.strokeStyle='#ffefb9';ctx.lineWidth=1.3*spec.size;ctx.globalAlpha=.9;path();ctx.stroke();ctx.globalAlpha=1;
    // Scales, dorsal fins and grasping claws track the moving body, not the ground.
    if(!simple) for(let i=2;i<9;i++) {
      const a=head-i*.21;if((Math.sin(a)>=0)!==front)continue;const p=point(a);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(spec.height*Math.cos(a),-spec.radius*Math.sin(a)));ctx.scale(spec.size,spec.size);
      ctx.strokeStyle=spec.color;ctx.fillStyle='#fff0b6';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-3,-3);ctx.lineTo(0,-8-spec.rank*.4);ctx.lineTo(3,-3);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.arc(0,0,3,-Math.PI/2,Math.PI/2);ctx.stroke();
      if(i===3||i===7){ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(-4,10);ctx.lineTo(3,14);ctx.moveTo(-3,10);ctx.lineTo(-7,13);ctx.moveTo(0,12);ctx.lineTo(-1,16);ctx.stroke();}ctx.restore();
    }
    if((Math.sin(head)>=0)===front) {
      const p=point(head);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(spec.height*Math.cos(head),-spec.radius*Math.sin(head)));ctx.scale(spec.size,spec.size);
      ctx.strokeStyle='#151c22';ctx.fillStyle=spec.color;ctx.lineWidth=1.8;ctx.shadowColor=spec.color;ctx.shadowBlur=simple?0:spec.glow;
      ctx.beginPath();ctx.moveTo(-10,-5);ctx.quadraticCurveTo(-2,-12,7,-6);ctx.lineTo(15,-3);ctx.lineTo(19,1);ctx.lineTo(14,6);ctx.lineTo(5,6);ctx.lineTo(-2,10);ctx.lineTo(-10,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle='#fff4c5';ctx.beginPath();ctx.moveTo(-6,-5);ctx.lineTo(-13,-17);ctx.lineTo(-1,-9);ctx.moveTo(1,-6);ctx.lineTo(-2,-19);ctx.lineTo(8,-8);ctx.fill();
      ctx.strokeStyle='#fff1bd';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(12,4);ctx.quadraticCurveTo(23,15,27,7);ctx.moveTo(12,-2);ctx.quadraticCurveTo(27,-12,29,-5);ctx.moveTo(3,7);ctx.lineTo(-3,15);ctx.stroke();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(7,-3,3,2,-.3,0,tau);ctx.fill();ctx.fillStyle='#482118';ctx.beginPath();ctx.arc(8,-3,1.2,0,tau);ctx.fill();
      ctx.strokeStyle='#633326';ctx.beginPath();ctx.moveTo(10,3);ctx.lineTo(16,3);ctx.stroke();ctx.restore();
    }
  }ctx.restore();
}
