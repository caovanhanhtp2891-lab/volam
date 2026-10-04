import type { GearVariant } from "./gear-catalog";
import type { EquipmentVisual } from "./equipment-vfx";
import { drawEquipmentRadiance } from "./equipment-vfx";
import type { weaponPose } from "./actor-animation";
export function drawHeldWeapon(
  c: CanvasRenderingContext2D,
  variant: GearVariant,
  weapon: EquipmentVisual,
  now: number,
  simple = false,
  activity?: ReturnType<typeof weaponPose>,
): void {
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  if ((activity?.trail ?? 0) > 0.01) {
    c.save();
    c.globalAlpha *= (activity?.trail ?? 0) * 0.35;
    c.strokeStyle = "#d8eff3";
    c.lineWidth = simple ? 1 : 2;
    c.beginPath();
    c.arc(
      0,
      0,
      variant === "daggers" ? 21 : 35,
      -Math.PI / 2 - 0.65,
      -Math.PI / 2 + 0.15,
    );
    c.stroke();
    if (!simple) {
      c.globalAlpha *= 0.5;
      c.lineWidth = 0.7;
      c.beginPath();
      c.arc(0, 0, 29, -Math.PI / 2 - 0.8, -Math.PI / 2);
      c.stroke();
    }
    c.restore();
  }
  const pole = ["spear", "halberd", "staff", "dragonstaff"].includes(variant);
  const sword = [
    "sword",
    "frostsword",
    "thundersword",
    "blade",
    "firesaber",
    "daggers",
  ].includes(variant);
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    color: string,
  ) => {
    c.strokeStyle = "#172129";
    c.lineWidth = width + 1.3;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  };
  if (pole) {
    line(0, 19, 0, -42, 2.1, "#95703e");
    for (const y of [-32, -27, 12, 16]) line(-1.3, y, 1.3, y, 0.65, "#d7bc73");
    c.fillStyle = "#bdccd1";
    c.strokeStyle = "#33454c";
    c.lineWidth = 0.75;
    if (variant === "spear" || variant === "halberd") {
      c.beginPath();
      c.moveTo(0, -56);
      c.lineTo(-3.3, -44);
      c.lineTo(0, -39);
      c.lineTo(3.3, -44);
      c.closePath();
      c.fill();
      c.stroke();
      line(0, -53, 0, -42, 0.6, "#f2f6ea");
      if (variant === "halberd") {
        c.beginPath();
        c.moveTo(2, -44);
        c.quadraticCurveTo(13, -43, 8, -31);
        c.lineTo(3, -37);
        c.closePath();
        c.fill();
        c.stroke();
      }
    } else {
      c.strokeStyle = "#c7a65b";
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(0, -46, 5, 0, Math.PI * 2);
      c.stroke();
      line(0, -43, 0, -40, 1.5, "#d6b66a");
    }
  } else if (sword || variant === "axe" || variant === "hammer") {
    line(0, 6, 0, -4, 2, "#574238");
    line(-4, -4, 4, -4, 1.2, "#c9af6b");
    c.fillStyle = "#b7c8d0";
    c.strokeStyle = "#3e5360";
    c.lineWidth = 0.7;
    c.beginPath();
    const broad = ["blade", "firesaber"].includes(variant);
    if (variant === "axe") {
      line(0, -4, 0, -31, 2, "#866141");
      c.moveTo(1, -33);
      c.quadraticCurveTo(16, -37, 11, -21);
      c.lineTo(0, -25);
    } else if (variant === "hammer") {
      line(0, -4, 0, -24, 2, "#735b41");
      c.rect(-6, -33, 12, 11);
    } else {
      const length = variant === "daggers" ? 23 : 37;
      c.moveTo(-1.6, -5);
      c.lineTo(-1.6, -length + 6);
      c.lineTo(0, -length);
      c.lineTo(broad ? 5 : 1.6, -length + 5);
      c.lineTo(broad ? 4 : 1.6, -5);
    }
    c.closePath();
    c.fill();
    c.stroke();
    line(0, -8, 0, variant === "daggers" ? -20 : -30, 0.7, "#edf3ef");
  } else if (variant === "fan" || variant === "lotusfan") {
    c.fillStyle = "#c9d9d6";
    c.strokeStyle = "#58787b";
    c.lineWidth = 0.65;
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, 16, -2.5, -0.6);
    c.closePath();
    c.fill();
    c.stroke();
    for (let a = -2.5; a < -0.55; a += 0.31)
      line(0, 0, Math.cos(a) * 15, Math.sin(a) * 15, 0.5, "#a89061");
  } else if (
    variant === "bow" ||
    variant === "crossbow" ||
    variant === "poisondarts"
  ) {
    c.strokeStyle = "#a78653";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(1, -20);
    c.quadraticCurveTo(15, 0, 1, 20);
    c.stroke();
    const pull = (activity?.pull ?? 0) * 6;
    c.strokeStyle = "#cec8ad";
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(1, -20);
    c.lineTo(1 - pull, 0);
    c.lineTo(1, 20);
    c.stroke();
    line(-8, 0, 17, 0, 0.8, "#c9d1cb");
    if (variant !== "bow") line(-3, -10, -3, 9, 2, "#705537");
  } else if (variant === "chakram") {
    c.strokeStyle = "#c7b06e";
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, -10, 10, 0, Math.PI * 2);
    c.stroke();
  } else if (variant === "flute") {
    line(0, 6, 0, -25, 2, "#6d9c83");
    for (const y of [-18, -12, -6]) line(-0.5, y, 0.5, y, 0.8, "#223b2c");
  } else {
    line(0, 5, 0, -11, 2, "#766039");
    c.strokeStyle = "#a6bcc6";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -11);
    c.bezierCurveTo(18, -20, -14, -42, 5, -48);
    c.stroke();
  }
  {
    c.save();
    c.translate(0, pole ? -43 : -20);
    drawEquipmentRadiance(c, weapon, now, 8, simple);
    c.restore();
  }
  // Fingers wrap over the grip so the object sits inside the palm.
  c.strokeStyle = "#d4ae8b";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-1.6, -1.4);
  c.lineTo(1.5, -0.6);
  c.moveTo(-1.6, 0.6);
  c.lineTo(1.5, 1.3);
  c.stroke();
  c.restore();
}
