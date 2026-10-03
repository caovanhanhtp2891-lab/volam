import type { Element } from "./idle";
export const VFX_COLORS: Record<Element, string> = {
  kim: "#ffe56b",
  moc: "#70ff98",
  thuy: "#6edbff",
  hoa: "#ff863c",
  tho: "#c0a0ff",
};
const glows = new Map<string, HTMLCanvasElement>();
export function skillMarkup(theme: Element, key: string): string {
  const color = VFX_COLORS[theme];
  const glyph =
    theme === "hoa"
      ? "M24 7c-2 12-14 13-12 24 1 13 23 14 25 0 1-8-5-12-5-12l-2 9c-6-6-2-14-6-21z"
      : theme === "tho"
        ? "M29 5L12 27h11l-4 16 19-23H27z"
        : theme === "moc"
          ? "M9 37C5 13 22 7 40 8c-3 22-11 33-25 28l18-20z"
          : theme === "thuy"
            ? "M24 5l8 16 14 3-14 5-8 16-7-16-14-5 14-3z"
            : "M24 5l7 14-7 24-7-24z";
  return `<svg class="skill-glyph" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="${color}" opacity=".15"/><path d="${glyph}" fill="${color}" stroke="#fff7d6" stroke-width="1.4"/>${key === "ultimate" ? '<circle cx="24" cy="24" r="21" fill="none" stroke="#ffe694" stroke-width="2" stroke-dasharray="5 3"/>' : key === "skill2" ? '<path d="M7 39l9-3M34 12l9-3" stroke="#fff7d6" stroke-width="2"/>' : ""}</svg>`;
}
export function drawVfxProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  theme: Element,
  now: number,
): void {
  const color = VFX_COLORS[theme];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  for (let i = 5; i >= 1; i--)
    drawGlow(
      ctx,
      -i * 12,
      Math.sin(now / 60 + i) * 2,
      16 - i * 1.8,
      color,
      (6 - i) / 8,
    );
  drawGlow(ctx, 0, 0, 27, color, 0.8);
  ctx.fillStyle = color;
  ctx.strokeStyle = "#fff7df";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (theme === "hoa") {
    ctx.moveTo(21, 0);
    ctx.quadraticCurveTo(-6, -15, -25, -8);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-25, 8);
    ctx.quadraticCurveTo(-6, 15, 21, 0);
  } else if (theme === "tho") {
    ctx.moveTo(22, 0);
    ctx.lineTo(-2, -10);
    ctx.lineTo(0, -2);
    ctx.lineTo(-24, -5);
    ctx.lineTo(-8, 10);
    ctx.lineTo(-7, 2);
    ctx.closePath();
  } else {
    ctx.moveTo(23, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffdd";
  ctx.beginPath();
  ctx.ellipse(2, 0, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
): void {
  let sprite = glows.get(color);
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = sprite.height = 96;
    const c = sprite.getContext("2d")!,
      gradient = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(0.45, color + "a0");
    gradient.addColorStop(1, color + "00");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 96, 96);
    glows.set(color, sprite);
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2);
  ctx.restore();
}
export interface VisualEffect {
  x: number;
  y: number;
  radius: number;
  color: string;
  startedAt: number;
  duration: number;
  kind: string;
  theme?: Element;
  angle?: number;
}
export function drawBattleEffect(
  ctx: CanvasRenderingContext2D,
  fx: VisualEffect,
  now: number,
): void {
  const p = Math.max(0, Math.min(1, (now - fx.startedAt) / fx.duration));
  const alpha = Math.sin(Math.PI * p) ** 0.6,
    theme = fx.theme ?? "kim",
    color = VFX_COLORS[theme];
  const r = fx.radius * (0.35 + 0.75 * p);
  ctx.save();
  ctx.translate(fx.x, fx.y);
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  if (fx.kind === "slash") {
    ctx.rotate(fx.angle ?? 0);
    const end = -1.15 + p * 2.6;
    for (let i = 3; i >= 0; i--) {
      ctx.strokeStyle = i === 0 ? "#ffffeb" : color;
      ctx.globalAlpha = alpha * (i === 0 ? 1 : 0.2 + i * 0.12);
      ctx.lineWidth = i === 0 ? 3 : 5 + i * 5;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * (0.9 + i * 0.035), end - 1.15, end);
      ctx.stroke();
    }
    drawGlow(
      ctx,
      Math.cos(end) * fx.radius,
      Math.sin(end) * fx.radius,
      20,
      color,
    );
  } else if (fx.kind === "trail") {
    ctx.rotate(fx.angle ?? 0);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(fx.radius * p, 0);
    ctx.stroke();
    for (let i = 0; i < 4; i++)
      drawGlow(ctx, fx.radius * p * (i / 4), 0, 20, color, 0.2 + i * 0.1);
  } else if (fx.kind === "heal" || fx.kind === "shield") {
    drawGlow(ctx, 0, -15, r * 0.6, color, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(
      0,
      fx.kind === "heal" ? 15 : -20,
      r * 0.7,
      fx.kind === "heal" ? r * 0.3 : r,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + p,
        x = Math.cos(a) * r * 0.6,
        y = Math.sin(a) * r * 0.35 - p * 55;
      ctx.fillRect(x - 3, y - 10, 6, 20);
      ctx.fillRect(x - 10, y - 3, 20, 6);
    }
  } else {
    const impact = fx.kind === "impact";
    drawGlow(ctx, 0, 0, impact ? r * 0.9 : r * 0.7, color, impact ? 0.9 : 0.35);
    ctx.strokeStyle = "#fff6cc";
    ctx.lineWidth = impact ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * (impact ? 0.6 : 0.85), 0, Math.PI * 2);
    ctx.stroke();
    const count = impact ? 7 : 12;
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count + p * 0.65,
        x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      if (theme === "hoa") {
        drawGlow(ctx, 0, 0, impact ? 10 : 22, color, 0.65);
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.quadraticCurveTo(-12, -16, -8, 0);
        ctx.quadraticCurveTo(-12, 16, 20, 0);
        ctx.fill();
        ctx.fillStyle = "#fff093";
        ctx.beginPath();
        ctx.ellipse(2, 0, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (theme === "tho") {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-12, -9);
        ctx.lineTo(-5, 8);
        ctx.lineTo(8, -6);
        ctx.lineTo(23, 1);
        ctx.stroke();
        ctx.strokeStyle = "#fff4ff";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (theme === "moc") {
        drawGlow(ctx, 0, 0, 16, color, 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 17, 6, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e5ffd9";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, -5);
        ctx.lineTo(12, 5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 22);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#efffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        if (theme === "thuy") {
          ctx.beginPath();
          ctx.moveTo(-13, 0);
          ctx.lineTo(13, 0);
          ctx.moveTo(-8, -8);
          ctx.lineTo(8, 8);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
