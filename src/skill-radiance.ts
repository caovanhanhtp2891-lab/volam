import type { SectId } from "./sects.ts";
import type { SkillPalette } from "./skill-art.ts";
const TAU = Math.PI * 2;
export function impactFragments(
  progress: number,
  radius: number,
  simple = false,
) {
  const p = Math.max(0, Math.min(1, progress)),
    r = Math.max(8, Math.min(180, radius));
  return Array.from({ length: simple ? 4 : 12 }, (_, i) => {
    const angle = i * 2.399963 + 0.2,
      travel = r * (0.18 + p * (0.7 + (i % 3) * 0.2));
    return {
      x: Math.cos(angle) * travel,
      y: Math.sin(angle) * travel * 0.68 - r * 0.32 * Math.sin(p * Math.PI),
      angle: angle + p * 2,
      size: Math.max(1, r * (0.045 + (i % 2) * 0.02)) * (1 - p * 0.6),
      alpha: (1 - p) ** 0.8,
    };
  });
}
// An outlined wave and distinct fragments make impact readable on bright snow
// as well as dark terrain. No full-screen flash, blur or indefinite particles.
export function drawImpactBloom(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  p: number,
  palette: SkillPalette,
  sect?: SectId,
  simple = false,
) {
  if (p <= 0 || p >= 1) return;
  const r = Math.max(12, Math.min(130, radius));
  c.save();
  c.translate(x, y);
  c.lineCap = "round";
  c.globalAlpha *= (1 - p) ** 0.7;
  c.beginPath();
  c.ellipse(0, 7, r * (0.28 + p), r * (0.17 + p * 0.5), 0, 0, TAU);
  c.strokeStyle = palette.dark;
  c.lineWidth = 5 * (1 - p) + 1;
  c.stroke();
  c.strokeStyle = palette.color;
  c.lineWidth = 3 * (1 - p) + 1;
  c.stroke();
  c.strokeStyle = palette.light;
  c.lineWidth = 1;
  c.stroke();
  if (p < 0.24) {
    c.save();
    c.globalAlpha *= (1 - p / 0.24) * 0.9;
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * TAU) / 16,
        d = r * (i % 2 ? 0.16 : 0.52);
      c.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    }
    c.closePath();
    c.fillStyle = palette.light;
    c.fill();
    c.strokeStyle = palette.color;
    c.lineWidth = 2;
    c.stroke();
    c.restore();
  }
  for (const fragment of impactFragments(p, r, simple)) {
    c.save();
    c.translate(fragment.x, fragment.y);
    c.rotate(fragment.angle);
    c.globalAlpha *= fragment.alpha;
    const size = fragment.size;
    c.beginPath();
    if (sect === "ngu-doc" || sect === "duong-mon") {
      c.arc(0, 0, size * 1.1, 0, TAU);
      c.fillStyle = palette.color;
      c.fill();
      c.strokeStyle = palette.light;
      c.lineWidth = 1;
      c.stroke();
      c.beginPath();
      c.arc(-size * 0.3, -size * 0.3, size * 0.25, 0, TAU);
      c.fillStyle = palette.light;
      c.fill();
    } else {
      c.moveTo(-size * 2, 0);
      c.lineTo(0, -size * 0.6);
      c.lineTo(size * 2, 0);
      c.lineTo(0, size * 0.6);
      c.closePath();
      c.fillStyle = palette.color;
      c.fill();
      c.strokeStyle = palette.light;
      c.lineWidth = 0.8;
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}
export function drawPoisonCloud(
  c: CanvasRenderingContext2D,
  radius: number,
  now: number,
  simple = false,
) {
  const r = Math.max(12, Math.min(40, radius));
  c.save();
  c.lineCap = "round";
  c.beginPath();
  c.ellipse(0, 10, r * 1.2, r * 0.4, 0, 0, TAU);
  c.fillStyle = "#193d2470";
  c.fill();
  c.strokeStyle = "#b6f568";
  c.lineWidth = 1.6;
  c.stroke();
  for (let i = 0; i < (simple ? 3 : 8); i++) {
    const age = (now / 1400 + i * 0.618) % 1,
      x = Math.sin(i * 2.4 + age * 3) * r * 0.7,
      y = 6 - age * r * 2.15;
    c.globalAlpha = Math.sin(age * Math.PI) * 0.85;
    c.beginPath();
    c.arc(x, y, 3 + (1 - age) * 4, 0, TAU);
    c.fillStyle = "#78c64f65";
    c.fill();
    c.strokeStyle = "#b6ef70";
    c.lineWidth = 1.1;
    c.stroke();
    c.beginPath();
    c.arc(x - 1.3, y - 1.7, 1.2, 0, TAU);
    c.fillStyle = "#e7ffab";
    c.fill();
  }
  c.restore();
}
