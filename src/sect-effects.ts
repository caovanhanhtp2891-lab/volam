import type { EffectMotif, SkillDefinition, SkillKey } from "./sects";

const ICON_PATHS: Record<EffectMotif, string> = {
  staff: '<path d="M9 25 24 8M6 21l6 5M20 6l6 5"/>',
  bell: '<path d="M10 23h12l-2-5v-5a4 4 0 0 0-8 0v5zm4-16h4M14 26h4"/>',
  spear: '<path d="m8 26 14-15M20 6l6-1-1 6-5 1zM11 19l4 4"/>',
  arrows: '<path d="m5 25 18-18m-2 0h6v6M5 18 16 7M12 27l13-13"/>',
  trap: '<path d="M8 8h16v16H8zM16 4v24M4 16h24m-14-2 4 4m0-4-4 4"/>',
  poison: '<path d="M16 5c-2 6-8 9-8 15a8 8 0 0 0 16 0c0-6-6-9-8-15zM12 21h.1M20 21h.1M13 25h6"/>',
  lotus: '<path d="M16 25C4 23 5 12 8 10l8 9 8-9c3 2 4 13-8 15zm0-6c-7-5-5-11 0-15 5 4 7 10 0 15"/>',
  fan: '<path d="M16 27 4 12a17 17 0 0 1 24 0zm0 0L10 8m6 19V6m0 21 6-19"/>',
  frost: '<path d="M16 4v24M6 10l20 12M6 22l20-12m-13-3 3 3 3-3m-6 18 3-3 3 3"/>',
  dragon: '<path d="M5 25c17 1-2-14 14-14l5-7 3 9-7 4c-3 3 10 9-2 10M22 11h.1"/>',
  spiral: '<path d="M11 5h10l-2 6c8 7 7 16-3 16s-11-9-3-16zM9 19h14"/>',
  blades: '<path d="M6 26 23 5c5 9-2 15-11 18zM26 26 9 5c-5 9 2 15 11 18z"/>',
  shadow: '<path d="M5 9h10M3 16h9M6 23h8m9-18-6 11h7l-7 12"/>',
  taiji: '<circle cx="16" cy="16" r="11"/><path d="M16 5c10 0 10 11 0 11s-10 11 0 11"/><circle cx="16" cy="10" r="1"/><circle cx="16" cy="22" r="1"/>',
  swords: '<path d="M16 4v24M12 21h8M8 6v17m-3-3h6M24 6v17m-3-3h6"/>',
  lightning: '<path d="m19 3-13 16h9l-2 10 13-17h-9z"/>',
};

export function skillIconMarkup(skill: SkillDefinition, key: SkillKey, color: string): string {
  const marker = key === "ultimate" ? '<path d="m4 5 2 1m22-1-2 1M16 30v-2"/>' : key === "skill2" ? '<circle cx="28" cy="27" r="1"/><circle cx="4" cy="27" r="1"/>' : '';
  return `<svg viewBox="0 0 32 32" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-motif="${skill.motif}" data-icon-skill="${key}">${ICON_PATHS[skill.motif]}${marker}</svg>`;
}

export interface SectEffect {
  x: number;
  y: number;
  radius: number;
  color: string;
  kind: EffectMotif;
  angle?: number;
  skill?: SkillKey;
}

// Bounded flat geometry, no particles, gradients, shadows or additive blending.
export function drawSectEffect(ctx: CanvasRenderingContext2D, effect: SectEffect, progress: number, persistent = false): void {
  const p = Math.max(0, Math.min(1, progress));
  const r = Math.max(8, effect.radius * (.65 + p * .35));
  const count = effect.skill === "ultimate" ? 8 : 4;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalAlpha = persistent ? .3 : Math.sin(Math.PI * p) * .85;
  ctx.strokeStyle = effect.color;
  ctx.fillStyle = effect.color;
  ctx.lineWidth = effect.skill === "ultimate" ? 3 : 2;
  ctx.lineCap = "round";
  const circle = (radius: number) => { ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke(); };
  const line = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const motif = effect.kind;
  if (motif === "staff" || motif === "spear" || motif === "arrows" || motif === "blades" || motif === "shadow") {
    ctx.rotate(effect.angle ?? 0);
    if (effect.skill === "ultimate") circle(r * .9);
    if (motif === "staff" || motif === "blades") {
      for (let i = 0; i < (motif === "blades" ? 2 : 1); i++) {
        ctx.beginPath(); ctx.arc(0, 0, r * (.7 + i * .18), -.9 + p * .5 + i * Math.PI, .9 + p * .5 + i * Math.PI); ctx.stroke();
      }
      if (motif === "staff") line(-r * .4, -r * .5, r * .6, r * .5);
    } else if (motif === "spear") {
      for (let i = 0; i < (effect.skill === "ultimate" ? 6 : 1); i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 3); line(-r * .7, 0, r, 0); line(r, 0, r * .75, -8); line(r, 0, r * .75, 8); ctx.restore();
      }
    } else if (motif === "arrows") {
      for (let i = 0; i < count; i++) {
        ctx.save(); ctx.rotate((i - (count - 1) / 2) * .17); const x = r * p; line(x - r * .65, 0, x, 0); line(x, 0, x - 7, -4); line(x, 0, x - 7, 4); ctx.restore();
      }
    } else {
      for (let i = 0; i < 3; i++) { line(-r * .7, (i - 1) * 10, r * (.3 + p * .5), (i - 1) * 10); }
      ctx.beginPath(); ctx.arc(r * .4, 0, r * .4, -.9, .9); ctx.stroke();
    }
  } else if (motif === "lotus" || motif === "poison" || motif === "fan") {
    if (motif === "fan") {
      ctx.rotate(effect.angle ?? 0); ctx.beginPath(); ctx.arc(0, 0, r, -.8, .8); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = -.8 + i * .4; line(0, 0, Math.cos(a) * r, Math.sin(a) * r); }
    } else {
      circle(r * .7);
      for (let i = 0; i < count; i++) {
        const a = i * Math.PI * 2 / count + p * .5;
        ctx.save(); ctx.rotate(a); ctx.beginPath();
        if (motif === "lotus") ctx.ellipse(r * .45, 0, r * .38, r * .14, 0, 0, Math.PI * 2);
        else { ctx.moveTo(r * .85, 0); ctx.quadraticCurveTo(r * .2, -r * .35, r * .2, 0); ctx.quadraticCurveTo(r * .2, r * .35, r * .85, 0); }
        ctx.stroke(); ctx.restore();
      }
      if (motif === "lotus") { line(-7, 0, 7, 0); line(0, -7, 0, 7); }
    }
  } else if (motif === "frost" || motif === "lightning" || motif === "swords") {
    if (motif === "swords" && effect.skill === "skill1") {
      ctx.rotate(effect.angle ?? 0);
      for (const offset of [-6, 6]) { line(-r * .2, offset, r, offset); line(r, offset, r * .85, offset - 6); }
      ctx.restore();
      return;
    }
    if (effect.skill !== "skill1") circle(r * .85);
    for (let i = 0; i < (motif === "frost" ? 6 : count); i++) {
      ctx.save(); ctx.rotate(i * Math.PI * 2 / (motif === "frost" ? 6 : count));
      if (motif === "frost") { line(0, 0, r, 0); line(r * .65, 0, r * .45, -10); line(r * .65, 0, r * .45, 10); }
      else if (motif === "lightning") { ctx.beginPath(); ctx.moveTo(r * .2, -r * .7); ctx.lineTo(-r * .05, -r * .15); ctx.lineTo(r * .24, -r * .15); ctx.lineTo(-r * .1, r * .65); ctx.stroke(); }
      else { const x = r * .65; line(x, -r * .45, x, r * .45); line(x - 7, r * .2, x + 7, r * .2); line(x, -r * .45, x - 3, -r * .3); }
      ctx.restore();
    }
  } else if (motif === "trap") {
    ctx.rotate(p * .35); ctx.strokeRect(-r * .65, -r * .65, r * 1.3, r * 1.3); circle(r * .8);
    line(-r * .4, 0, r * .4, 0); line(0, -r * .4, 0, r * .4);
  } else if (motif === "bell") {
    circle(r); ctx.beginPath(); ctx.moveTo(-r * .5, r * .4); ctx.quadraticCurveTo(-r * .4, -r * .7, 0, -r * .7); ctx.quadraticCurveTo(r * .4, -r * .7, r * .5, r * .4); ctx.closePath(); ctx.stroke(); line(-r * .5, r * .55, r * .5, r * .55);
  } else if (motif === "taiji") {
    ctx.rotate(p * Math.PI); circle(r); ctx.beginPath(); ctx.arc(0, -r / 2, r / 2, -Math.PI / 2, Math.PI / 2); ctx.arc(0, r / 2, r / 2, -Math.PI / 2, -Math.PI * 1.5, true); ctx.stroke();
    for (const y of [-r / 2, r / 2]) { ctx.beginPath(); ctx.arc(0, y, 4, 0, Math.PI * 2); ctx.fill(); }
  } else if (motif === "dragon") {
    ctx.rotate(effect.angle ?? 0); ctx.beginPath(); ctx.moveTo(-r, r * .2); ctx.bezierCurveTo(-r * .6, -r, r * .3, r, r * .8, -r * .2); ctx.stroke();
    const x = r * .8, y = -r * .2; line(x, y, x + 10, y - 9); line(x, y, x + 12, y + 5); line(x - 8, y - 5, x - 5, y - 16);
    if (effect.skill === "ultimate") { circle(r * .7); circle(r); }
  } else {
    ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i * .4 + p * Math.PI; const d = r * i / 24; const x = Math.cos(a) * d, y = Math.sin(a) * d; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
  }
  ctx.restore();
}
