import type { MartialArt, SectId, SkillKey, EffectMotif } from "./sects.ts";
import { SKILL_PALETTES, type SkillPalette } from "./skill-art.ts";
import { martialVisual, type MartialVisual } from "./martial-visuals.ts";
import { drawGlow } from "./battle-vfx.ts";
const TAU = Math.PI * 2;
export function martialPalette(art: MartialArt, sect: SectId): SkillPalette {
  const base = SKILL_PALETTES[sect];
  if (art === "dog-staff") return { ...base, color: "#ffbf59", accent: "#eb7438", light: "#fff3b0" };
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
// Release and flight share weapon geometry; contact uses its own elemental
// burst. All counts/extents are bounded; simple mode never changes combat.
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
// Contact is an explosion of the skill's element, not another full weapon at
// the enemy. It runs only when gameplay confirms a hit.
function contact(c: CanvasRenderingContext2D, v: MartialVisual, r: number, p: SkillPalette, time: number, simple: boolean) {
  const count = simple ? 3 : 8, expand = .4 + time * .8;
  if (v.contact === "slash") {
    c.save(); c.rotate(-.7 + time * .3); crescent(c, r * (1 - time * .3), p); c.restore();
  } else if (v.contact === "radiance") {
    lotus(c, r * .62, p, time, simple ? 3 : 6);
  } else if (v.contact === "venom") {
    c.beginPath();
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count;
      const x = Math.cos(a) * r * .45, y = Math.sin(a) * r * .25;
      c.moveTo(x + r * .28, y); c.arc(x, y, r * .28, 0, TAU);
    }
    c.fillStyle = p.color + "55"; c.fill(); stroke(c, p, 1.2);
  } else if (v.contact === "flame") {
    for (let i = 0; i < (simple ? 2 : 4); i++) {
      c.save(); c.translate((i - 1.5) * r * .27, r * .15); flame(c, r * (.5 + i % 2 * .2), p, time + i); c.restore();
    }
  } else if (v.contact === "lightning") {
    for (let i = 0; i < (simple ? 2 : 4); i++) { c.save(); c.rotate(i * Math.PI / 2 + .4); thunder(c, r * .7, p, time); c.restore(); }
  }
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963, d = r * expand;
    c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * .62 - time * 6); c.rotate(a + time);
    c.beginPath();
    if (v.contact === "shards") {
      c.moveTo(-r * .23, 0); c.lineTo(0, -r * .07); c.lineTo(r * .32, 0); c.lineTo(0, r * .07); c.closePath();
    } else if (v.contact === "venom") c.arc(0, 0, 2 + (1 - time) * 2, 0, TAU);
    else { c.moveTo(-r * .12, 0); c.lineTo(r * .2, 0); }
    c.fillStyle = i % 2 ? p.accent : p.light;
    if (v.contact === "shards" || v.contact === "venom") c.fill();
    else { c.strokeStyle = c.fillStyle; c.lineWidth = 2; c.stroke(); }
    c.restore();
  }
  c.beginPath(); c.ellipse(0, 7, r * expand, r * expand * .4, 0, 0, TAU); stroke(c, p, 1.5);
}
function presentation(c: CanvasRenderingContext2D, e: MartialEffect, v: MartialVisual, r: number, p: SkillPalette, time: number, simple: boolean) {
  const count = Math.min(simple ? 3 : 8, v.streams);
  if (v.pattern === "rain") {
    for (let i = 0; i < count; i++) {
      const x = (i / Math.max(1, count - 1) - .5) * r * 1.4;
      const y = Math.sin(i * 2.4) * r * .23;
      const fall = Math.min(1, time * 1.65 - i % 3 * .07);
      const height = Math.max(0, 1 - fall) * r * 1.4;
      c.save(); c.translate(x, y - height); c.rotate(Math.PI * .32);
      c.beginPath(); c.moveTo(-r * .6, 0); c.lineTo(0, 0); stroke(c, p, 2.5);
      if (e.art === "fire-rain") { c.rotate(-Math.PI / 2); flame(c, r * .21, p, time + i); }
      else if (e.art === "bolts") pole(c, r * .19, p, true);
      else crescent(c, r * .2, p);
      c.restore();
      if (fall > .7) {
        c.beginPath(); c.ellipse(x, y + 4, r * .18 * fall, r * .07 * fall, 0, 0, TAU); stroke(c, p, 1.2);
      }
    }
  } else if (v.pattern === "storm") {
    if (e.art === "qi") { c.save(); c.scale(1, .48); taiji(c, r * .75, p, time); c.restore(); }
    for (let i = 0; i < count; i++) {
      c.save(); c.translate((i - (count - 1) / 2) * r * .35, Math.sin(i * 2.4) * r * .18);
      thunder(c, r * (.55 + Math.sin(time * 13 + i) * .08), p, time + i, true);
      c.beginPath(); c.ellipse(0, r * .6, r * .24, r * .09, 0, 0, TAU); stroke(c, p, 1.6);
      if (e.art === "sword-array") { c.rotate(Math.PI / 2); sword(c, r * .38, p); }
      c.restore();
    }
  } else if (v.pattern === "guard") {
    c.save(); c.scale(1, .6); body(c, e.art, e.skill, r * .75, p, time, simple, false, e.kind); c.restore();
    c.beginPath(); c.ellipse(0, -r * .2, r * .72, r, 0, Math.PI, TAU); stroke(c, p, 2.5);
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count + time;
      c.beginPath(); c.ellipse(Math.cos(a) * r * .8, 8 + Math.sin(a) * r * .3, 4, 2, a, 0, TAU);
      c.fillStyle = p.light; c.fill();
    }
  } else if (v.pattern === "sweep" || v.pattern === "spiral") {
    for (let i = 0; i < count; i++) {
      c.save(); c.rotate(i * TAU / count + time * 2.4);
      if (v.pattern === "spiral") c.translate(r * .45, 0);
      if (e.art === "dart" || e.art.includes("saber") || e.art === "ice-twins") crescent(c, r * .6, p);
      else pole(c, r * .85, p, e.art === "fire-spear", e.art === "fire-spear");
      c.restore();
    }
    c.beginPath(); c.ellipse(0, 8, r * .9, r * .42, 0, .2 + time, Math.PI * 1.8 + time); stroke(c, p, 2);
  } else if (v.pattern === "burst") {
    body(c, e.art, e.skill, r * .68, p, time, simple, false, e.kind);
    for (let i = 0; i < (simple ? 1 : 3); i++) {
      const wave = (time + i * .22) % 1;
      c.save(); c.globalAlpha *= (1 - wave) * .7;
      c.beginPath(); c.ellipse(0, 8, r * (.25 + wave), r * (.1 + wave * .43), 0, 0, TAU); stroke(c, p, 2); c.restore();
    }
    if (v.contact === "flame" || v.contact === "venom") for (let i = 0; i < count; i++) {
      c.save(); const a = i * TAU / count; c.translate(Math.cos(a) * r * .65, Math.sin(a) * r * .35);
      if (v.contact === "flame") flame(c, r * .3, p, time + i);
      else { c.beginPath(); c.arc(0, Math.sin(time * 8 + i) * 5, r * .08, 0, TAU); stroke(c, p, 1.2); }
      c.restore();
    }
  } else if (v.pattern === "fan") {
    for (let i = 0; i < count; i++) {
      c.save(); c.rotate((i - (count - 1) / 2) * Math.min(.35, 1.3 / Math.max(1, count - 1)));
      if (e.art === "dragon-palm") dragon(c, r * .63, p, time + i * .1, simple);
      else if (e.art === "spear" || e.art === "dog-staff") pole(c, r * .83, p, e.art === "spear");
      else if (e.art.includes("sword")) sword(c, r * .75, p);
      else crescent(c, r * .7, p);
      c.restore();
    }
  } else body(c, e.art, e.skill, r * .85, p, time, simple, false, e.kind);
}
export function drawMartialEffect(c: CanvasRenderingContext2D, e: MartialEffect, progress: number, persistent = false): void {
  const time = Math.max(0, Math.min(1, progress)); if (!persistent && (time <= 0 || time >= 1)) return;
  const p = martialPalette(e.art, e.sect), v = martialVisual(e.art, e.skill), simple = e.quality === "simple", impact = e.phase === "impact";
  const r = Math.max(8, Math.min(impact ? 62 : 240, e.radius)) * (persistent ? 1 : impact ? .35 + .65 * Math.sqrt(time) : .55 + .45 * time);
  c.save(); c.translate(e.x, e.y);
  // Point rain/lightning and radial fields use world up; only directed attacks
  // rotate toward the victim, so falling skills never turn sideways.
  if (v.delivery === "melee" || v.delivery === "travel" || impact) c.rotate(e.angle ?? 0);
  c.lineCap = "round"; c.lineJoin = "round";
  c.globalAlpha *= persistent ? .65 : Math.min(1, time / .08, (1 - time) / .22);
  if (!simple && typeof document !== "undefined") drawGlow(c, 0, 5, Math.min(80, r * .8), p.color, impact ? .3 : .15);
  if (impact) contact(c, v, r, p, time, simple);
  else if (e.phase === "cast") {
    c.beginPath(); c.ellipse(0, 8, r * .8, r * .32, 0, 0, TAU); stroke(c, p, 1.5);
    body(c, e.art, e.skill, r * .45, p, time, simple, false, e.kind);
  } else presentation(c, e, v, r, p, time, simple);
  c.restore();
}
export function drawMartialProjectile(c: CanvasRenderingContext2D, x: number, y: number, angle: number, sect: SectId, art: MartialArt, key: SkillKey | undefined, now: number, simple: boolean, kind?: EffectMotif) {
  const p = martialPalette(art, sect), v = martialVisual(art, key);
  const count = key ? Math.min(simple ? 2 : 8, v.streams) : 1;
  const r = key === "ultimate" ? 24 : 19;
  c.save(); c.translate(x, y); c.rotate(angle); c.lineCap = "round"; c.lineJoin = "round";
  for (let i = 0; i < count; i++) {
    c.save(); const spread = i - (count - 1) / 2;
    const wave = v.pattern === "spiral" ? Math.sin(now / 130 + i * TAU / count) * 9 : spread * 7;
    c.translate(-Math.abs(spread) * 5, wave); c.rotate(v.pattern === "fan" ? spread * .05 : 0);
    c.beginPath(); c.moveTo(-r * 2.3, 0); c.lineTo(0, 0); stroke(c, p, 2);
    if (art === "dragon-palm") dragon(c, r * 1.15, p, now / 900 + i * .1, simple);
    else if (art === "fire-rain") { c.rotate(Math.PI / 2); flame(c, r, p, now / 900); }
    else if (art === "dog-staff" || art === "fire-spear") pole(c, r, p, art === "fire-spear", art === "fire-spear");
    else if (art === "bolts") pole(c, r * .8, p, true);
    else if (art === "dart" || art.includes("saber") || art === "ice-twins") crescent(c, r, p);
    else if (art.includes("sword")) sword(c, r, p);
    else body(c, art, key, r, p, now / 900, simple, true, kind);
    if (!simple && v.contact === "lightning" && art !== "thunder" && art !== "qi") thunder(c, r * .65, p, now / 900);
    c.restore();
  }
  c.restore();
}
