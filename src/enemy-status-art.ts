import { drawElementalMotion } from "./elemental-motion.ts";
import { enemyStatusVisual, type EnemyStatus } from "./enemy-status.ts";
export function drawEnemyStatus(
  c: CanvasRenderingContext2D,
  enemy: EnemyStatus & { radius: number },
  now: number,
  simple = false,
) {
  const status = enemyStatusVisual(enemy, now);
  if (!status.frozen && !status.chilled && !status.poisoned && !status.stunned && !status.burning && !status.corroded)
    return;
  const r = Math.min(32, Math.max(14, enemy.radius));
  c.save();
  if (status.burning) drawElementalMotion(c, "fire", r * 1.15, now, "#ff792d", "#fff0a0", simple, true);
  if (status.corroded) {
    drawElementalMotion(c, "acid", r, now, "#81db45", "#e5ff8d", simple, true);
    c.strokeStyle = "#b1e873"; c.lineWidth = 1.6;
    for (let i = 0; i < (simple ? 2 : 4); i++) {
      const x = (i - 1.5) * r * .38, drip = (now / 70 + i * 9) % (r * .7);
      c.beginPath(); c.moveTo(x, -r * .7 + drip); c.lineTo(x + 2, -r * .45 + drip); c.stroke();
    }
  }
  if (status.frozen) {
    c.globalAlpha *= status.iceAlpha;
    c.fillStyle = "#81d7f54a";
    c.strokeStyle = "#c3f3ff";
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-r * 0.9, 9);
    c.lineTo(-r, -r * 1.3);
    c.lineTo(-r * 0.4, -r * 2.4);
    c.lineTo(r * 0.5, -r * 2.25);
    c.lineTo(r, -r * 1.1);
    c.lineTo(r * 0.85, 9);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-r * 0.4, -r * 2.4);
    c.lineTo(-r * 0.2, -r * 0.3);
    c.lineTo(r * 0.85, 9);
    c.moveTo(r * 0.5, -r * 2.25);
    c.lineTo(-r * 0.2, -r * 0.3);
    c.lineTo(-r * 0.9, 9);
    c.strokeStyle = "#e3faff90";
    c.lineWidth = 0.7;
    c.stroke();
    c.strokeStyle = "#86dcef";
    c.beginPath();
    c.ellipse(0, 12, r * 1.2, r * 0.35, 0, 0, Math.PI * 2);
    c.stroke();
    if (!simple) {
      c.fillStyle = "#e4fbff";
      for (let i = 0; i < 3; i++) {
        const a = now / 400 + (i * Math.PI * 2) / 3;
        c.beginPath();
        c.arc(
          Math.cos(a) * r * 0.8,
          -r + Math.sin(a) * r * 0.7,
          1,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
    }
  } else if (status.chilled) {
    c.strokeStyle = "#94e5f4";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, 12, r * 1.05, r * 0.32, 0, 0, Math.PI * 2);
    c.stroke();
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * r * 0.6, 10);
      c.lineTo(side * r * 0.8, -2);
      c.lineTo(side * r, 10);
      c.fillStyle = "#b8efff70";
      c.fill();
    }
  }
  c.globalAlpha = 1;
  if (status.poisoned) {
    c.fillStyle = "#a4e76c";
    c.strokeStyle = "#406232";
    c.lineWidth = 0.7;
    for (let i = 0; i < (simple ? 1 : 3); i++) {
      const p = (now / 1000 + i / 3) % 1;
      c.globalAlpha = (1 - p) * 0.8;
      c.beginPath();
      c.arc((i - 1) * r * 0.55, 12 - p * r * 1.5, 2 + p, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
  }
  if (status.stunned) {
    c.globalAlpha = 0.9;
    c.fillStyle = "#ffe59c";
    c.strokeStyle = "#917431";
    c.lineWidth = 0.7;
    for (let i = 0; i < (simple ? 1 : 3); i++) {
      const a = now / 250 + (i * Math.PI * 2) / 3,
        x = Math.cos(a) * r * 0.65,
        y = -r * 2.3 + Math.sin(a) * 3;
      c.beginPath();
      c.moveTo(x, y - 3);
      c.lineTo(x + 1, y - 1);
      c.lineTo(x + 3, y);
      c.lineTo(x + 1, y + 1);
      c.lineTo(x, y + 3);
      c.lineTo(x - 1, y + 1);
      c.lineTo(x - 3, y);
      c.lineTo(x - 1, y - 1);
      c.closePath();
      c.fill();
      c.stroke();
    }
  }
  c.restore();
}
