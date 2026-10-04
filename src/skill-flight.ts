import type { SectId, SkillDefinition } from "./sects";
import type { Point } from "./combat";
export function skillUsesFlight(skill: SkillDefinition): boolean {
  if (skill.projectile !== undefined) return skill.projectile && skill.damage > 0 && !skill.dash;
  return (
    skill.damage > 0 &&
    !skill.dash &&
    ((skill.anchor === "target" && skill.range > 160) ||
      (skill.shape === "cone" && skill.motif === "fan") ||
      (skill.shape === "line" && skill.motif === "swords"))
  );
}
export function flightArc(sect: SectId): number {
  return sect === "con-lon"
    ? 0
    : sect === "thuy-yen"
      ? 4
      : sect === "vo-dang"
        ? 3
        : sect === "duong-mon"
          ? 7
          : 18;
}
export function skillFlightPoint(
  from: Point,
  to: Point,
  progress: number,
  sect: SectId,
): Point {
  const t = Math.max(0, Math.min(1, progress));
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * flightArc(sect),
  };
}
export function iceFragments(progress: number, simple = false) {
  const p = Math.max(0, Math.min(1, progress)),
    count = simple ? 3 : 12;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * Math.PI * 2) / count + 0.25,
      velocity = 26 + (i % 4) * 11;
    return {
      x: Math.cos(angle) * velocity * p,
      y: Math.sin(angle) * velocity * p * 0.66 - 18 * p + 32 * p * p,
      angle: angle + p * (i % 2 ? 2 : -2),
      length: (9 + (i % 3) * 3) * (1 - p * 0.72),
      alpha: (1 - p) ** 0.7,
    };
  });
}
export function flightSpeed(sect: SectId): number {
  return sect === "thuy-yen"
    ? 460
    : sect === "duong-mon"
      ? 820
      : sect === "con-lon"
        ? 1100
        : sect === "cai-bang"
          ? 520
          : 720;
}
