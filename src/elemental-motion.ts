import type { EffectMotif, SectId } from "./sects.ts";

export type MotionKind = "fire" | "acid" | "ice" | "lightning" | "lotus" | "metal" | "orbit" | "shadow";
export function elementalMotionKind(sect: SectId, motif?: EffectMotif): MotionKind {
  if (motif === "shadow") return "shadow";
  if (sect === "cai-bang" || sect === "thien-nhan") return "fire";
  if (sect === "ngu-doc" || sect === "duong-mon") return "acid";
  if (sect === "thuy-yen") return "ice";
  if (sect === "con-lon") return "lightning";
  if (sect === "nga-mi") return "lotus";
  if (sect === "vo-dang") return "orbit";
  return "metal";
}
const TAU = Math.PI * 2;
const fraction = (value: number) => value - Math.floor(value);
// Bounded, deterministic trajectories. Reduced quality retains four animated
// particles with the same skill area; it never changes hit detection or damage.
export function elementalParticles(kind: MotionKind, radius: number, now: number, simple = false) {
  const r = Math.max(6, Math.min(180, radius)), count = simple ? 4 : 14;
  return Array.from({ length: count }, (_, index) => {
    const seed = fraction(index * .61803398875 + .13);
    const age = fraction(now / (kind === "fire" ? 730 : 1150) + seed);
    const angle = index * 2.399963 + now / 1600;
    const lifting = ["fire", "acid", "lotus"].includes(kind);
    return {
      x: lifting ? (seed - .5) * r * 1.6 + Math.sin(age * 6 + index) * r * .1 : Math.cos(angle) * r * (.28 + age * .66),
      y: lifting ? r * .15 - age * r * (kind === "fire" ? 1.55 : .9) : Math.sin(angle) * r * (.28 + age * .66) * .65,
      alpha: Math.sin(age * Math.PI),
      size: Math.max(1, r * (.02 + seed * .025)),
      age, angle,
    };
  });
}
// Draw at the caller's local origin. No allocations survive a frame, gradients,
// blur filters or unbounded particles. Each element has its own moving geometry.
export function drawElementalMotion(c: CanvasRenderingContext2D, kind: MotionKind, radius: number, now: number, color: string, light: string, simple = false, ground = false): void {
  const r = Math.max(6, Math.min(180, radius));
  c.save(); c.lineCap = "round";
  if (ground && (kind === "fire" || kind === "acid")) {
    c.fillStyle = kind === "fire" ? "#25160f66" : "#39611d55";
    c.beginPath(); c.ellipse(0, r * .1, r * .8, r * .28, 0, 0, TAU); c.fill();
    c.strokeStyle = color; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(0, r * .1, r * (.7 + Math.sin(now / 180) * .03), r * .23, 0, 0, TAU); c.stroke();
  }
  if (kind === "fire") {
    const flames = simple ? 3 : 7;
    for (let i = 0; i < flames; i++) {
      const x = (i / (flames - 1) - .5) * r * 1.35;
      const height = r * (.42 + .25 * (1 + Math.sin(now / 90 + i * 2.1)));
      const sway = Math.sin(now / 120 + i * 1.7) * r * .12, width = r * .1;
      c.beginPath(); c.moveTo(x - width, r * .12);
      c.bezierCurveTo(x - width * 2, -height * .25, x + sway - width, -height * .55, x + sway, -height);
      c.bezierCurveTo(x + sway + width * .2, -height * .5, x + width * 2, -height * .15, x + width, r * .12);
      c.closePath(); c.fillStyle = color + "b5"; c.fill();
      c.beginPath(); c.moveTo(x - width * .45, r * .12); c.quadraticCurveTo(x - width, -height * .3, x + sway * .4, -height * .55);
      c.quadraticCurveTo(x + width, -height * .2, x + width * .45, r * .12); c.fillStyle = light + "b0"; c.fill();
    }
  }
  if (kind === "lightning") {
    const beat = Math.floor(now / 65);
    c.strokeStyle = color; c.lineWidth = simple ? 1.4 : 2.8;
    for (let ray = 0; ray < (simple ? 2 : 5); ray++) {
      const angle = ray * TAU / 5 + Math.sin(now / 260) * .35;
      c.beginPath(); c.moveTo(0, 0);
      for (let j = 1; j <= 5; j++) {
        const drift = Math.sin(beat * 2.7 + ray * 4 + j * 1.9) * r * .16;
        c.lineTo(Math.cos(angle) * r * j / 5 - Math.sin(angle) * drift, Math.sin(angle) * r * j / 5 + Math.cos(angle) * drift);
      }
      c.stroke(); c.strokeStyle = light; c.lineWidth = .8; c.stroke(); c.strokeStyle = color; c.lineWidth = 2.8;
    }
  }
  for (const particle of elementalParticles(kind, r, now, simple)) {
    c.save(); c.globalAlpha *= particle.alpha * .85; c.translate(particle.x, particle.y);
    c.fillStyle = particle.age > .6 ? light : color; c.strokeStyle = color; c.lineWidth = 1.2;
    const size = particle.size;
    c.beginPath();
    if (kind === "acid") {
      c.arc(0, 0, size * (1 + particle.age), 0, TAU); c.stroke();
      c.beginPath(); c.arc(-size * .3, -size * .3, size * .35, 0, TAU); c.fill();
      if (ground && !simple) { c.beginPath(); c.moveTo(size, size); c.lineTo(size + Math.sin(now / 110) * 2, size * 3); c.stroke(); }
    } else if (kind === "lotus") {
      c.rotate(particle.angle); c.moveTo(0, -size * 2);
      c.quadraticCurveTo(size * 2, 0, 0, size * 2); c.quadraticCurveTo(-size * 2, 0, 0, -size * 2); c.fill();
    } else if (kind === "ice" || kind === "orbit") {
      c.rotate(particle.angle); c.moveTo(-size * 2, 0); c.lineTo(size * 2, 0);
      c.moveTo(0, -size * 2); c.lineTo(0, size * 2); c.strokeStyle = light; c.stroke();
    } else if (kind === "metal" || kind === "shadow") {
      c.rotate(particle.angle); c.moveTo(-size * 4, 0); c.lineTo(size * 2, 0); c.stroke();
    } else { c.arc(0, 0, size, 0, TAU); c.fill(); }
    c.restore();
  }
  c.restore();
}
