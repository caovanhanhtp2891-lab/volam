import type { MartialArt, SectId, SkillKey, EffectMotif } from "./sects.ts";
import { SKILL_PALETTES, type SkillPalette } from "./skill-art.ts";
const TAU = Math.PI * 2;
export function martialPalette(art: MartialArt, sect: SectId): SkillPalette {
  const base = SKILL_PALETTES[sect];
  if (art === "dog-staff") return { ...base, color: "#ccdb70", accent: "#65b685", light: "#fffbd2" };
  if (art === "wind-saber") return { ...base, color: "#8ee2c7", accent: "#f2d17c", light: "#effff7" };
  if (art === "ice-swords") return { ...base, color: "#b4e5ff", accent: "#ffaace", light: "#f4ffff" };
  if (art === "ice-twins") return { ...base, accent: "#d5a8ff" };
  return base;
}
function stroke(c: CanvasRenderingContext2D, p: SkillPalette, width: number) {
  c.strokeStyle = p.dark; c.lineWidth = width + 2; c.stroke();
  c.strokeStyle = p.color; c.lineWidth = width; c.stroke();
  c.strokeStyle = p.light; c.lineWidth = Math.max(.8, width * .23); c.stroke();
}
function crescent(c: CanvasRenderingContext2D, r: number, p: SkillPalette) {
  c.beginPath(); c.moveTo(-r * .6, r * .7);
  c.bezierCurveTo(-r * .8, -r * .55, r * .55, -r * .9, r, -.2 * r);
  c.bezierCurveTo(.25 * r, -.45 * r, -.35 * r, .2 * r, -r * .6, r * .7);
  c.fillStyle = p.color + "70"; c.fill(); stroke(c, p, 3);
}
function sword(c: CanvasRenderingContext2D, r: number, p: SkillPalette) {
  c.beginPath(); c.moveTo(r, 0); c.lineTo(.58 * r, -4); c.lineTo(-r * .55, -3); c.lineTo(-r * .55, 3); c.lineTo(.58 * r, 4); c.closePath();
  c.fillStyle = p.color; c.fill(); stroke(c, p, 1.4);
  c.beginPath(); c.moveTo(-r * .58, -8); c.lineTo(-r * .58, 8); c.moveTo(-r * .58, 0); c.lineTo(-r, 0); stroke(c, p, 2);
}
function pole(c: CanvasRenderingContext2D, r: number, p: SkillPalette, spear = false, fire = false) {
  c.beginPath(); c.moveTo(-r, 0); c.lineTo(r * .75, 0); stroke(c, p, 3);
  if (spear) {
    c.beginPath(); c.moveTo(r, 0); c.lineTo(r * .62, -6); c.lineTo(r * .75, 0); c.lineTo(r * .62, 6); c.closePath();
    c.fillStyle = p.light; c.fill();
    if (fire) { c.beginPath(); c.arc(r * .62, 0, r * .24, -.9, .9); stroke(c, p, 4); }
  } else for (const x of [-r * .7, r * .65]) { c.beginPath(); c.moveTo(x, -5); c.lineTo(x, 5); stroke(c, p, 2); }
}
function flame(c: CanvasRenderingContext2D, r: number, p: SkillPalette, time: number) {
  const sway = Math.sin(time * 8) * r * .15;
  c.beginPath(); c.moveTo(-r * .5, r * .2); c.bezierCurveTo(-r, -r * .3, -.1 * r, -r * .55, sway, -r);
  c.bezierCurveTo(.25 * r, -.1 * r, .65 * r, -.6 * r, r * .6, r * .1); c.quadraticCurveTo(0, r * .6, -r * .5, r * .2);
  c.fillStyle = p.color + "cc"; c.fill(); stroke(c, p, 1.2);
  c.beginPath(); c.moveTo(-r * .2, r * .2); c.quadraticCurveTo(-r * .3, -r * .1, sway, -r * .5); c.quadraticCurveTo(r * .4, r * .2, -r * .2, r * .2);
  c.fillStyle = p.light; c.fill();
}
function dragon(c: CanvasRenderingContext2D, r: number, p: SkillPalette, time: number, simple: boolean) {
  const wave = Math.sin(time * 9) * r * .12;
  c.beginPath(); c.moveTo(-r * 1.3, r * .25);
  c.bezierCurveTo(-r * .8, -r * .5 + wave, 0, r * .8, r * .65, -.12 * r);
  stroke(c, p, Math.min(17, r * .25));
  if (!simple) for (let i = 1; i < 8; i++) {
    const t = i / 8, x = -r * 1.2 + t * r * 1.75, y = Math.sin(t * TAU) * r * .2;
    c.beginPath(); c.moveTo(x - 3, y - 4); c.quadraticCurveTo(x + 5, y, x - 3, y + 4); c.strokeStyle = p.accent; c.lineWidth = 1; c.stroke();
  }
  c.beginPath(); c.moveTo(r * .5, -r * .18); c.lineTo(r * .7, -r * .4); c.lineTo(r * .95, -r * .2);
  c.lineTo(r * 1.15, 0); c.lineTo(r * .9, r * .12); c.lineTo(r * .6, r * .06); c.closePath(); c.fillStyle = p.accent; c.fill(); stroke(c, p, 2);
  c.beginPath(); c.moveTo(r * .64, -r * .28); c.lineTo(r * .58, -r * .57); c.moveTo(r * .84, -r * .25); c.lineTo(r * .95, -r * .48);
  c.moveTo(r * 1.05, 0); c.quadraticCurveTo(r * 1.38, r * .22, r * .9, r * .3);
  c.moveTo(r, -.15 * r); c.quadraticCurveTo(r * 1.4, -r * .5, r * 1.07, -r * .6); stroke(c, p, 1.3);
  c.fillStyle = p.dark; c.beginPath(); c.arc(r * .83, -r * .18, Math.max(2, r * .055), 0, TAU); c.fill();
  c.fillStyle = p.light; c.beginPath(); c.arc(r * .84, -r * .2, 1.1, 0, TAU); c.fill();
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(-r * .1, .05 * r); c.lineTo(r * .08, side * r * .3); c.lineTo(r * .3, side * r * .35); c.moveTo(r * .08, side * r * .3); c.lineTo(r * .18, side * r * .48); stroke(c, p, 2); }
}
function lotus(c: CanvasRenderingContext2D, r: number, p: SkillPalette, time: number, count: number) {
  for (let i = 0; i < count; i++) { c.save(); c.rotate(i * TAU / count + time * .4); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * .5, -r * .4, -r * .25, -r * .85, 0, -r); c.bezierCurveTo(r * .25, -r * .85, r * .5, -r * .4, 0, 0); c.fillStyle = p.color + "70"; c.fill(); stroke(c, p, 1.6); c.restore(); }
}
function taiji(c: CanvasRenderingContext2D, r: number, p: SkillPalette, time: number) {
  c.save(); c.rotate(time * 2); c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); c.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); c.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2); c.closePath(); c.fillStyle = p.color + "bd"; c.fill();
  c.beginPath(); c.arc(0, 0, r, 0, TAU); stroke(c, p, 1.5);
  for (const side of [-1, 1]) { c.beginPath(); c.arc(0, side * r / 2, r * .14, 0, TAU); c.fillStyle = side === 1 ? p.dark : p.light; c.fill(); } c.restore();
}
function thunder(c: CanvasRenderingContext2D, r: number, p: SkillPalette, time: number, vertical = false) {
  c.save(); if (vertical) c.rotate(Math.PI / 2);
  c.beginPath(); c.moveTo(-r * 1.1, 0); c.lineTo(-r * .6, -r * .25); c.lineTo(-r * .4, r * .16); c.lineTo(r * .1, -r * .16); c.lineTo(r * .3, r * .12); c.lineTo(r, 0); stroke(c, p, 3 + Math.sin(time * 20)); c.restore();
}
export interface MartialEffect {
  x: number; y: number; radius: number; sect: SectId; art: MartialArt; kind?: EffectMotif; skill?: SkillKey;
  phase?: "cast" | "release" | "impact"; angle?: number; quality?: "full" | "simple";
}
// The same weapon geometry is used for release, flight and contact. All counts
// and extents are bounded; simple mode changes only rendering, never combat.
function body(c: CanvasRenderingContext2D, art: MartialArt, key: SkillKey | undefined, r: number, palette: SkillPalette, time: number, simple: boolean, flight = false, kind?: EffectMotif) {
  const ult = key === "ultimate", second = key === "skill2", count = simple ? 2 : ult ? 5 : 3;
  if (art === "saber" && kind === "bell") {
    for (let i = 0; i < count; i++) { c.beginPath(); c.ellipse(0, 0, r * (.4 + i * .18), r * (.3 + i * .15), 0, 0, TAU); stroke(c, palette, 2); }
    c.beginPath(); c.moveTo(-r * .25, -r * .15); c.lineTo(-r * .1, -r * .3); c.lineTo(r * .1, -r * .3); c.lineTo(r * .25, -r * .15); c.lineTo(r * .2, r * .15); c.lineTo(0, r * .3); c.lineTo(-r * .2, r * .15); c.closePath(); stroke(c, palette, 2);
  } else if (art === "dragon-palm") {
    for (let i = 0; i < (flight ? 1 : ult ? 3 : second ? 2 : 1); i++) { c.save(); c.rotate((i - (ult ? 1 : 0)) * .5); dragon(c, r * (flight ? 1 : .7), palette, time + i, simple); c.restore(); }
  } else if (art === "staff" || art === "dog-staff" || art === "spear" || art === "fire-spear") {
    const spear = art === "spear" || art === "fire-spear";
    const thrusts = flight ? 1 : ult ? (art === "fire-spear" ? 3 : count) : second ? 3 : 1;
    for (let i = 0; i < thrusts; i++) {
      c.save();
      if (spear) {
        c.rotate((i - (thrusts - 1) / 2) * .13);
        c.translate(Math.sin(time * 12 + i) * r * .12, (i - (thrusts - 1) / 2) * 5);
      } else c.rotate(ult ? i * TAU / count + time : (i - 1) * .22 + time * .8);
      pole(c, r, palette, spear, art === "fire-spear");
      if (art === "fire-spear") {
        c.translate(r * .7, 0); c.rotate(Math.PI / 2);
        flame(c, r * .28, palette, time + i);
      } else if (!spear) {
        c.beginPath(); c.arc(0, 0, r * .8, -.8, .9); stroke(c, palette, 2);
      }
      c.restore();
    }
  } else if (art === "hammer") {
    c.save(); c.rotate(-.7 + time * .4); c.beginPath(); c.moveTo(-r * .7, r * .55); c.lineTo(r * .15, -r * .25); stroke(c, palette, 5);
    c.beginPath(); c.rect(-r * .12, -r * .55, r * .55, r * .38); c.fillStyle = palette.accent; c.fill(); stroke(c, palette, 2); c.restore();
    c.beginPath(); c.ellipse(0, r * .45, r, r * .3, 0, 0, TAU); stroke(c, palette, 2);
  } else if (["saber", "poison-saber", "ice-saber", "ice-twins", "wind-saber"].includes(art)) {
    for (let i = 0; i < (flight ? 1 : art === "ice-twins" ? 2 : ult ? 3 : 1); i++) { c.save(); c.rotate(art === "ice-twins" ? i * Math.PI + time : (i - 1) * .55); crescent(c, r, palette); c.restore(); }
    if (art === "wind-saber") for (let i = 0; i < count; i++) { c.beginPath(); c.ellipse(-r * .25, i * 6, r * .9, r * .2, -.2, .1, Math.PI * 1.7); stroke(c, palette, 1); }
  } else if (art === "dart" || art === "bolts") {
    for (let i = 0; i < (flight ? art === "dart" ? 1 : 3 : count); i++) { c.save(); c.rotate((i - 1) * .18 + (art === "dart" ? time * 3 : 0)); if (art === "dart") crescent(c, r * .7, palette); else { c.beginPath(); c.moveTo(-r, 0); c.lineTo(r * .7, 0); stroke(c, palette, 1.8); c.beginPath(); c.moveTo(r, 0); c.lineTo(r * .5, -3); c.lineTo(r * .5, 3); c.closePath(); c.fillStyle = palette.light; c.fill(); } c.restore(); }
  } else if (art === "ice-swords" || art === "sword-array") {
    for (let i = 0; i < (flight ? 1 : ult ? 3 : second ? 2 : 1); i++) { c.save(); c.rotate((i - 1) * .35); sword(c, r, palette); c.restore(); }
  } else if (art === "fire-rain") {
    if (flight) { c.rotate(Math.PI / 2); flame(c, r, palette, time); }
    else for (let i = 0; i < count; i++) { c.save(); c.translate((i - (count - 1) / 2) * r * .35, -r * (.8 - time * .4) - (i % 2) * r * .25); c.rotate(-.4); c.beginPath(); c.moveTo(0, -r * .8); c.lineTo(0, 0); stroke(c, palette, 4); flame(c, r * .42, palette, time + i); c.restore(); }
  } else if (art === "thunder" || art === "qi" && key === "skill1") {
    for (let i = 0; i < (flight ? 1 : count); i++) { c.save(); c.translate((i - (count - 1) / 2) * r * .3, 0); thunder(c, r, palette, time + i, !flight); c.restore(); }
  } else if (art === "qi") taiji(c, r * .7, palette, time);
  else if (art === "lotus-palm") {
    if (kind === "frost") { crescent(c, r, palette); lotus(c, r * .35, palette, time, simple ? 3 : 6); }
    else { c.save(); c.scale(1, .7); lotus(c, r, palette, time, simple ? 4 : 8); c.restore(); }
  } else {
    for (let i = 0; i < count; i++) { c.beginPath(); const a = i * TAU / count + time; c.ellipse(Math.cos(a) * r * .4, Math.sin(a) * r * .4, r * .45, r * .25, a, 0, TAU); c.fillStyle = (i % 2 ? palette.accent : palette.color) + "45"; c.fill(); }
    c.beginPath(); c.moveTo(-r * .55, r * .2); c.bezierCurveTo(-r, -r, r, r, r * .55, -r * .2); stroke(c, palette, 7);
  }
}
export function drawMartialEffect(c: CanvasRenderingContext2D, e: MartialEffect, progress: number, persistent = false): void {
  const p = Math.max(0, Math.min(1, progress)); if (!persistent && (p <= 0 || p >= 1)) return;
  const palette = martialPalette(e.art, e.sect), simple = e.quality === "simple", impact = e.phase === "impact";
  const r = Math.max(8, Math.min(impact ? 62 : 240, e.radius)) * (persistent ? 1 : impact ? .35 + .65 * Math.sqrt(p) : .55 + .45 * p);
  c.save(); c.translate(e.x, e.y); c.rotate(e.angle ?? 0); c.lineCap = "round"; c.lineJoin = "round";
  c.globalAlpha *= persistent ? .7 : Math.min(1, p / .08, (1 - p) / .22);
  if (e.phase === "cast") {
    c.beginPath(); c.ellipse(0, 8, r * .8, r * .32, 0, 0, TAU); stroke(c, palette, 1.5);
    body(c, e.art, e.skill, r * .45, palette, p, simple, false, e.kind);
  } else {
    body(c, e.art, e.skill, r * (impact ? .65 : .85), palette, p, simple, false, e.kind);
    if (impact || persistent || e.art === "hammer") {
      c.beginPath(); c.ellipse(0, 7, r * (.45 + p * .7), r * (.2 + p * .28), 0, 0, TAU); stroke(c, palette, impact ? 3 * (1 - p) + 1 : 1.2);
    }
    if (impact) for (let i = 0; i < (simple ? 3 : 9); i++) { const a = i * 2.399963, d = r * (.3 + p * .8); c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * .6); c.rotate(a + p); c.beginPath(); if (e.art.includes("ice")) { c.moveTo(-5, 0); c.lineTo(0, -2); c.lineTo(7, 0); c.lineTo(0, 2); c.closePath(); } else c.arc(0, 0, 1.5 + (1 - p) * 1.5, 0, TAU); c.fillStyle = i % 2 ? palette.accent : palette.light; c.fill(); c.restore(); }
  }
  c.restore();
}
export function drawMartialProjectile(c: CanvasRenderingContext2D, x: number, y: number, angle: number, sect: SectId, art: MartialArt, key: SkillKey | undefined, now: number, simple: boolean, kind?: EffectMotif) {
  const palette = martialPalette(art, sect), r = key === "ultimate" ? 24 : 17;
  c.save(); c.translate(x, y); c.rotate(angle); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(-r * 2.3, 0); c.lineTo(0, 0); stroke(c, palette, 2);
  body(c, art, key, r, palette, now / 900, simple, true, kind); c.restore();
}
