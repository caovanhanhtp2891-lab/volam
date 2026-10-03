import type { EffectMotif, SectId, SkillKey } from "./sects.ts";
import { SKILL_PALETTES, type SkillPalette } from "./skill-art.ts";
import { drawGlow } from "./battle-vfx.ts";
export { skillIconMarkup } from "./skill-art.ts";

export type SkillQuality = "full" | "simple";
export interface SectEffect {
  x: number; y: number; radius: number; color: string; kind: EffectMotif;
  angle?: number; skill?: SkillKey; sect?: SectId;
  phase?: "cast" | "impact"; quality?: SkillQuality;
}
const TAU = Math.PI * 2;
const ring = (c: CanvasRenderingContext2D, r: number) => { c.beginPath(); c.arc(0, 0, r, 0, TAU); };
const segment = (c: CanvasRenderingContext2D, a: number, b: number, x: number, y: number) => { c.moveTo(a, b); c.lineTo(x, y); };
// Saturated body with a narrow, hot core, sharing the same path.
function ink(c: CanvasRenderingContext2D, palette: SkillPalette, width = 5, accent = false): void {
  c.strokeStyle = accent ? palette.accent : palette.color; c.lineWidth = width; c.stroke();
  c.strokeStyle = palette.light; c.lineWidth = Math.max(.8, width * .23); c.stroke();
}
function sword(c: CanvasRenderingContext2D, length: number, palette: SkillPalette): void {
  c.beginPath(); c.moveTo(0, -length); c.lineTo(-3, -length * .76); c.lineTo(-2, 7);
  c.lineTo(2, 7); c.lineTo(3, -length * .76); c.closePath();
  c.fillStyle = palette.color; c.fill(); ink(c, palette, 2);
  c.beginPath(); segment(c, -7, 8, 7, 8); segment(c, 0, 8, 0, 17); ink(c, palette, 3);
}
function dragon(c: CanvasRenderingContext2D, r: number, p: number, palette: SkillPalette): void {
  c.beginPath(); c.moveTo(-r * .85, r * .25);
  c.bezierCurveTo(-r * .45, -r * (.75 + p * .2), r * .05, r * .65, r * .65, -r * .14);
  ink(c, palette, Math.min(16, r * .18));
  c.beginPath(); c.moveTo(r * .5, -r * .15); c.lineTo(r * .62, -r * .32);
  c.lineTo(r * .87, -r * .22); c.lineTo(r, -r * .06); c.lineTo(r * .8, r * .05);
  c.lineTo(r * .64, 0); c.closePath(); c.fillStyle = palette.color; c.fill(); ink(c, palette, 2);
  c.beginPath(); segment(c, r * .64, -r * .27, r * .58, -r * .45);
  segment(c, r * .77, -r * .24, r * .84, -r * .42);
  c.moveTo(r * .89, -r * .02); c.quadraticCurveTo(r * 1.02, r * .16, r * .72, r * .18); ink(c, palette, 2);
  c.fillStyle = palette.light; c.beginPath(); c.arc(r * .82, -r * .16, 2, 0, TAU); c.fill();
}
function lotus(c: CanvasRenderingContext2D, r: number, count: number, p: number, palette: SkillPalette): void {
  for (let i = 0; i < count; i++) {
    c.save(); c.rotate(i * TAU / count + p * .35);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * .36, -r * .36, -r * .2, -r * .8, 0, -r);
    c.bezierCurveTo(r * .2, -r * .8, r * .36, -r * .36, 0, 0);
    c.fillStyle = i % 2 ? palette.accent + "45" : palette.color + "55"; c.fill(); ink(c, palette, 2);
    c.restore();
  }
}

// Bounded vectors and cached 96px light sprites. No dynamic gradients, blur,
// filters, random particle systems or screen-wide flashes.
export function drawSectEffect(c: CanvasRenderingContext2D, effect: SectEffect, progress: number, persistent = false): void {
  const p = Math.max(0, Math.min(1, progress));
  if (!persistent && (p <= 0 || p >= 1)) return;
  const palette = effect.sect ? SKILL_PALETTES[effect.sect] : { color: effect.color, light: "#fff9e6", accent: effect.color, dark: "#142c27" };
  const full = effect.quality !== "simple", ult = effect.skill === "ultimate", second = effect.skill === "skill2";
  const base = Math.max(8, effect.radius), expand = persistent ? 1 : .48 + .52 * (1 - (1 - p) ** 3);
  const r = base * expand, count = full ? (ult ? 8 : 6) : 4;
  c.save(); c.translate(effect.x, effect.y); c.lineCap = "round"; c.lineJoin = "round";
  c.globalAlpha *= persistent ? .32 : Math.min(1, p / .12, (1 - p) / .35) * .88;
  if (persistent) { ring(c, base); c.strokeStyle = palette.color; c.lineWidth = 1.2; c.stroke(); }
  if (full) drawGlow(c, 0, 0, Math.min(54, r * .45), palette.color, persistent ? .3 : .48);
  if (effect.phase === "cast") {
    ring(c, r * .65); ink(c, palette, 2);
    for (let i = 0; i < (full ? 4 : 2); i++) {
      c.save(); c.rotate(p * 2 + i * Math.PI / 2); c.beginPath(); segment(c, r * .8, 0, r * .45, 0); ink(c, palette, 3); c.restore();
    }
    c.restore(); return;
  }
  const motif = effect.kind;
  if (["staff", "spear", "arrows", "fan", "shadow"].includes(motif) || motif === "swords" && !ult) c.rotate(effect.angle ?? 0);
  if (motif === "staff" || motif === "blades") {
    const blades = motif === "staff" ? 1 : ult ? (full ? 6 : 4) : 2;
    for (let i = 0; i < blades; i++) {
      c.save(); c.rotate(i * TAU / blades + p * (ult ? 1.2 : .7));
      c.beginPath(); c.arc(0, 0, r * .82, -.95, .95);
      c.quadraticCurveTo(r * .27, r * .25, r * .6, -r * .55); c.closePath();
      c.fillStyle = palette.color + "45"; c.fill(); ink(c, palette, ult ? 5 : 4);
      if (full) { c.beginPath(); c.arc(0, 0, r, -.85, .6); ink(c, palette, 1.2, true); }
      c.restore();
    }
    if (motif === "staff") { c.beginPath(); segment(c, -r * .4, -r * .48, r * .4, r * .48); ink(c, palette, 5); }
  } else if (motif === "spear") {
    const spears = ult ? 6 : 1;
    if (ult) { ring(c, r * .9); ink(c, palette, 2, true); }
    if (second) {
      c.beginPath(); c.arc(-r * .2, 0, r * .48, -.8, .8); ink(c, palette, 3, true);
      if (full) { c.beginPath(); c.arc(-r * .36, 0, r * .48, -.8, .8); ink(c, palette, 1.5, true); }
      c.translate(p * r * .2, 0);
    }
    for (let i = 0; i < spears; i++) {
      c.save(); c.rotate(i * TAU / spears);
      c.beginPath(); segment(c, -r * .5, 0, r * .84, 0); ink(c, palette, 5);
      c.beginPath(); c.moveTo(r, 0); c.lineTo(r * .78, -6); c.lineTo(r * .82, 0); c.lineTo(r * .78, 6); c.closePath();
      c.fillStyle = palette.light; c.fill();
      if (full) { c.beginPath(); segment(c, -r * .45, -8, r * .6, -8); segment(c, -r * .45, 8, r * .6, 8); ink(c, palette, 1.5, true); }
      c.restore();
    }
  } else if (motif === "arrows") {
    const arrows = ult ? count : 3;
    for (let i = 0; i < arrows; i++) {
      c.save(); c.rotate((i - (arrows - 1) / 2) * (ult ? .19 : .1));
      const x = r * (.4 + .6 * p); c.beginPath(); segment(c, x - r * .6, 0, x, 0); ink(c, palette, 3);
      c.beginPath(); c.moveTo(x + 5, 0); c.lineTo(x - 5, -3); c.lineTo(x - 5, 3); c.closePath(); c.fillStyle = palette.light; c.fill(); c.restore();
    }
    if (ult) { c.beginPath(); c.arc(0, 0, r * .6, -.9, .9); ink(c, palette, 2, true); }
  } else if (motif === "trap") {
    c.rotate(p * .45); ring(c, r * .8); ink(c, palette, 2);
    for (let i = 0; i < 2; i++) { c.save(); c.rotate(i * Math.PI / 4); c.beginPath(); c.rect(-r * .5, -r * .5, r, r); ink(c, palette, 2, !!i); c.restore(); }
    for (let i = 0; i < count; i++) { c.save(); c.rotate(i * TAU / count); c.beginPath(); segment(c, r * .65, 0, r * .9, 0); ink(c, palette, 4); c.restore(); }
    ring(c, r * .2); c.fillStyle = palette.accent + "90"; c.fill(); ink(c, palette, 3, true);
  } else if (motif === "poison") {
    if (second || ult) {
      c.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; const x = Math.cos(a) * r * .85, y = Math.sin(a) * r * .85; if (!i) c.moveTo(x, y); else c.lineTo(x, y); } ink(c, palette, 2, true);
    }
    for (let i = 0; i < count; i++) { const a = i * TAU / count + p * .6; c.beginPath(); c.ellipse(Math.cos(a) * r * .55, Math.sin(a) * r * .55, r * .3, r * .18, a, 0, TAU); c.fillStyle = (i % 2 ? palette.accent : palette.color) + "38"; c.fill(); }
    c.save(); c.scale(r / 48, r / 48);
    if (ult) {
      c.beginPath(); c.ellipse(0, 2, 7, 13, 0, 0, TAU); c.fillStyle = palette.color; c.fill(); ink(c, palette, 2);
      c.beginPath(); c.moveTo(0, 13); c.bezierCurveTo(-32, 25, -24, -30, -5, -22); c.lineTo(-10, -17);
      for (const s of [-1, 1]) { segment(c, s * 7, -4, s * 20, -18); segment(c, s * 20, -18, s * 25, -9); for (let i = 0; i < 3; i++) segment(c, s * 6, i * 7, s * 19, i * 8 + 4); } ink(c, palette, 3, true);
    } else {
      c.beginPath(); c.moveTo(8, 20); c.bezierCurveTo(-23, 27, 20, -7, -4, -10); c.bezierCurveTo(-20, -34, 23, -34, 8, -11); ink(c, palette, 7);
      c.beginPath(); segment(c, -5, -23, -2, -20); segment(c, 7, -23, 4, -20); ink(c, palette, 1.5, true);
    }
    c.restore();
  } else if (motif === "lotus") {
    c.save(); c.scale(1, .75); lotus(c, r * .9, count, p, palette);
    if (ult && full) lotus(c, r * .58, 6, -p, palette);
    if (second) { ring(c, r); ink(c, palette, 2, true); } c.restore();
    c.beginPath(); segment(c, -7, 0, 7, 0); segment(c, 0, -7, 0, 7); ink(c, palette, 3, true);
  } else if (motif === "fan" || motif === "frost") {
    if (motif === "fan") {
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, -.72, .72); c.closePath(); c.fillStyle = palette.color + "28"; c.fill(); ink(c, palette, 2);
      for (let i = 0; i < count; i++) { const a = -.72 + i * 1.44 / (count - 1); c.beginPath(); segment(c, 0, 0, Math.cos(a) * r, Math.sin(a) * r); ink(c, palette, 1.2); }
    } else if (ult) {
      c.save(); c.scale(1, .6); ring(c, r * .85); ink(c, palette, 2, true); c.restore();
      const crystals = full ? 5 : 3;
      for (let i = 0; i < crystals; i++) {
        const a = i * TAU / crystals, x = Math.cos(a) * r * .57, y = Math.sin(a) * r * .28;
        c.save(); c.translate(x, y + (1 - p) * 18);
        c.beginPath(); c.moveTo(0, -r * .65); c.lineTo(-r * .13, -r * .27); c.lineTo(-r * .1, r * .15);
        c.lineTo(0, r * .24); c.lineTo(r * .1, r * .15); c.lineTo(r * .13, -r * .27); c.closePath();
        c.fillStyle = palette.color + "65"; c.fill(); ink(c, palette, 2);
        c.beginPath(); segment(c, 0, -r * .6, 0, r * .2); segment(c, -r * .12, -r * .27, 0, -r * .17); segment(c, 0, -r * .17, r * .12, -r * .27); ink(c, palette, 1.2); c.restore();
      }
    } else {
      ring(c, r * .85); ink(c, palette, 2, true);
      for (let i = 0; i < (full ? 6 : 4); i++) {
        c.save(); c.rotate(i * TAU / (full ? 6 : 4)); c.translate(r * .65, 0); c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, -r * .36); c.lineTo(-r * .12, 0); c.lineTo(0, r * .25); c.lineTo(r * .12, 0); c.closePath(); c.fillStyle = palette.color + "70"; c.fill(); ink(c, palette, 2); c.restore();
      }
      if (second) { c.beginPath(); c.moveTo(0, -r * .4); c.lineTo(r * .22, 0); c.lineTo(0, r * .4); c.lineTo(-r * .22, 0); c.closePath(); ink(c, palette, 4); }
    }
  } else if (motif === "bell") {
    ring(c, r * .9); ink(c, palette, 3); c.save(); c.scale(r / 48, r / 48);
    if (ult) {
      c.beginPath(); c.moveTo(-15, 25); c.lineTo(-23, -1); c.quadraticCurveTo(-22, -13, -15, 1); c.lineTo(-12, 7);
      c.lineTo(-12, -24); c.quadraticCurveTo(-8, -32, -5, -24); c.lineTo(-5, -4); c.lineTo(-5, -30); c.quadraticCurveTo(0, -38, 3, -30);
      c.lineTo(3, -4); c.lineTo(3, -25); c.quadraticCurveTo(9, -32, 11, -24); c.lineTo(11, -2); c.lineTo(11, -18); c.quadraticCurveTo(18, -23, 18, -16); c.lineTo(18, 15); c.quadraticCurveTo(15, 36, -15, 25);
    } else { c.beginPath(); c.moveTo(-26, 22); c.lineTo(-20, 8); c.bezierCurveTo(-25, -40, 25, -40, 20, 8); c.lineTo(26, 22); c.closePath(); }
    c.fillStyle = palette.color + "45"; c.fill(); ink(c, palette, 3);
    c.beginPath(); segment(c, -23, 26, 23, 26); ink(c, palette, 3); c.restore();
  } else if (motif === "taiji") {
    c.save(); c.scale(1, .7); c.rotate(p * Math.PI);
    const t = r * .75; ring(c, t); c.fillStyle = palette.dark + "bb"; c.fill(); ink(c, palette, 2);
    c.beginPath(); c.arc(0, 0, t, -Math.PI / 2, Math.PI / 2); c.arc(0, t / 2, t / 2, Math.PI / 2, -Math.PI / 2, true); c.arc(0, -t / 2, t / 2, Math.PI / 2, -Math.PI / 2); c.closePath(); c.fillStyle = palette.light + "bb"; c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.arc(0, s * t / 2, t * .11, 0, TAU); c.fillStyle = s > 0 ? palette.light : palette.dark; c.fill(); }
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); c.beginPath(); for (let j = 0; j < 3; j++) { const x = r * (.84 + j * .05); if ((i + j) % 2) { segment(c, x, -5, x, -1); segment(c, x, 1, x, 5); } else segment(c, x, -5, x, 5); } ink(c, palette, 1.2, true); c.restore(); } c.restore();
  } else if (motif === "swords") {
    if (!ult) {
      for (const y of [-6, 6]) { c.save(); c.translate(r * (.15 + p * .5), y); c.rotate(Math.PI / 2); sword(c, r * .45, palette); c.restore(); }
      c.beginPath(); segment(c, -r * .2, -6, r * .6, -6); segment(c, -r * .2, 6, r * .6, 6); ink(c, palette, 3);
    } else {
      c.save(); c.scale(1, .65); ring(c, r * .9); ink(c, palette, 2, true); c.restore();
      for (let i = 0; i < count; i++) { const a = i * TAU / count; c.save(); c.translate(Math.cos(a) * r * .68, Math.sin(a) * r * .4 - (1 - p) * 30); c.rotate(Math.PI); sword(c, Math.min(34, r * .28), palette); c.restore(); }
    }
  } else if (motif === "dragon") {
    c.rotate((effect.angle ?? 0) + (ult ? p * .8 : 0)); dragon(c, r, p, palette);
    if (ult) { c.save(); c.rotate(Math.PI); dragon(c, r * .85, p, palette); c.restore(); ring(c, r * .85); ink(c, palette, 2, true); }
  } else if (motif === "spiral") {
    for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0, 0, r * (.7 + i * .2), p * 3 + i * Math.PI, p * 3 + i * Math.PI + 2.3); ink(c, palette, 4, !!i); }
    c.beginPath(); c.ellipse(0, 4, r * .2, r * .24, 0, 0, TAU); c.ellipse(0, -r * .25, r * .14, r * .16, 0, 0, TAU); c.fillStyle = palette.color + "88"; c.fill(); ink(c, palette, 2);
  } else if (motif === "shadow") {
    for (let i = 0; i < (full ? 3 : 2); i++) {
      c.save(); c.translate(-r * .4 + i * r * .35 + p * 12, 0); c.globalAlpha *= .3 + i * .2;
      c.beginPath(); c.arc(0, -15, 5, 0, TAU); c.moveTo(-8, 7); c.lineTo(-5, -8); c.lineTo(5, -8); c.lineTo(10, 7); c.closePath(); c.fillStyle = palette.accent; c.fill(); ink(c, palette, 1.5); c.restore();
    }
    c.beginPath(); for (const y of [-12, 0, 12]) segment(c, -r * .75, y, r * .7, y); ink(c, palette, 2);
  } else if (motif === "lightning") {
    if (second || ult) { c.save(); c.scale(1, .6); ring(c, r * .85); ink(c, palette, 2, true); c.restore(); }
    if (ult) {
      c.save(); c.scale(1, .6); c.rotate(p * .5);
      c.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6; const x = Math.cos(a) * r * .82, y = Math.sin(a) * r * .82; if (!i) c.moveTo(x, y); else c.lineTo(x, y); } ink(c, palette, 2, true);
      c.restore();
    }
    const bolts = ult ? (full ? 3 : 2) : second ? 2 : 1;
    for (let i = 0; i < bolts; i++) {
      const x = (i - (bolts - 1) / 2) * r * .45;
      c.beginPath(); c.moveTo(x + 8, -r * (ult ? 1.15 : .85)); c.lineTo(x - 8, -r * .28);
      c.lineTo(x + 10, -r * .3); c.lineTo(x - 3, r * .2); ink(c, palette, ult ? 7 : 5);
      if (full) { c.beginPath(); segment(c, x - 7, -r * .3, x - 25, -r * .5); segment(c, x - 2, r * .1, x + 22, -r * .06); ink(c, palette, 2, true); }
    }
  }
  if (full && !persistent) {
    c.fillStyle = palette.light;
    for (let i = 0; i < (ult ? 8 : 4); i++) { const a = i * TAU / (ult ? 8 : 4) + .3, d = r * (.6 + p * .25); c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(a); c.fillRect(-3, -1, 6, 2); c.restore(); }
  }
  c.restore();
}

export function drawSectProjectile(c: CanvasRenderingContext2D, x: number, y: number, angle: number, sect: SectId, key: SkillKey | undefined, now: number, quality: SkillQuality = "full"): void {
  const palette = SKILL_PALETTES[sect], full = quality === "full", r = key === "ultimate" ? 18 : 12;
  c.save(); c.translate(x, y); c.rotate(angle); c.lineCap = "round"; c.lineJoin = "round";
  if (full) drawGlow(c, -2, 0, r * 1.5, palette.color, .45);
  c.beginPath(); segment(c, -r * 2.7, 0, 0, 0); ink(c, palette, key ? 3 : 2);
  if (full) { c.beginPath(); segment(c, -r * 2, -4, -r * .7, -3); segment(c, -r * 2.3, 4, -r * .8, 3); ink(c, palette, 1.2, true); }
  if (sect === "cai-bang") dragon(c, r, (now % 500) / 500, palette);
  else if (sect === "ngu-doc") {
    c.beginPath(); c.moveTo(-r, 0); c.bezierCurveTo(-r * .5, -8, 0, 8, r, 0); ink(c, palette, 5);
    c.beginPath(); c.moveTo(r + 5, 0); c.lineTo(r - 3, -4); c.lineTo(r - 3, 4); c.closePath(); c.fillStyle = palette.accent; c.fill();
  } else if (sect === "nga-mi") { c.rotate(now / 1000); lotus(c, r, full ? 5 : 3, 0, palette); }
  else if (sect === "con-lon") {
    c.beginPath(); c.moveTo(-r, -3); c.lineTo(0, 4); c.lineTo(-2, -4); c.lineTo(r + 5, 0); ink(c, palette, 5);
  } else if (sect === "duong-mon") {
    for (let i = -1; i <= 1; i++) { c.save(); c.translate(-Math.abs(i) * 5, i * 5); c.beginPath(); segment(c, -9, 0, 9, 0); ink(c, palette, 2); c.beginPath(); c.moveTo(14, 0); c.lineTo(6, -2); c.lineTo(6, 2); c.closePath(); c.fillStyle = palette.light; c.fill(); c.restore(); }
  } else if (sect === "thien-nhan") {
    c.rotate(now / 150); for (let i = 0; i < 2; i++) { c.rotate(Math.PI); c.beginPath(); c.arc(0, 0, r, -.9, 1); ink(c, palette, 4); }
  } else if (sect === "vo-dang" || sect === "thien-vuong" || sect === "thieu-lam") { c.rotate(Math.PI / 2); sword(c, r + 4, palette); }
  else { c.beginPath(); c.moveTo(r + 5, 0); c.lineTo(0, -6); c.lineTo(-r, 0); c.lineTo(0, 6); c.closePath(); c.fillStyle = palette.color + "bb"; c.fill(); ink(c, palette, 2); }
  c.restore();
}
