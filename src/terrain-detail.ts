import { REGION_SCENES } from "./region-scenes";

// Small native-resolution strokes add readable ground detail over the painting.
// Decorations stay on the ground plane and do not imply new collision walls.
export function drawTerrainDetail(c: CanvasRenderingContext2D, region: number, width: number, height: number): void {
  let seed = 9701 + region * 149;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const snow = region >= 14, sand = region === 12, stone = [2, 4, 9, 13].includes(region);
  const color = REGION_SCENES[region]?.color ?? "#b8d195";
  c.save();
  for (let i = 0; i < Math.ceil(width * height / 3200); i++) {
    const x = random() * width, y = random() * height;
    c.fillStyle = snow ? "#edf8ff62" : sand ? "#ffe7bb40" : "#e1d9b92b";
    c.fillRect(x, y, 1.2 + random() * 2, 1);
    c.strokeStyle = snow ? "#456b8850" : "#202c2a40";
    c.lineWidth = .8;
    c.beginPath(); c.moveTo(x - 2, y + 2); c.lineTo(x + 4, y + 2); c.stroke();
  }
  if (stone) {
    const x = width * .5, y = height * .54;
    c.fillStyle = "#1a242629"; c.strokeStyle = "#d9d6bc65"; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(x, y, 110, 64, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x, y, 97, 56, 0, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      c.beginPath(); c.moveTo(x + Math.cos(a) * 80, y + Math.sin(a) * 45);
      c.lineTo(x + Math.cos(a) * 96, y + Math.sin(a) * 56); c.stroke();
    }
  }
  for (let i = 0; i < Math.ceil(width * height / 42000); i++) {
    const x = random() * width, y = random() * height;
    if (Math.hypot(x - width * .5, y - height * .54) < 170) continue;
    c.strokeStyle = snow ? "#b9dfed8c" : sand ? "#ecd0a555" : "#6482597a";
    c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x - 9, y + 2); c.lineTo(x - 5, y - 8);
    c.moveTo(x, y + 3); c.lineTo(x + 2, y - 13); c.moveTo(x + 7, y + 1); c.lineTo(x + 11, y - 6); c.stroke();
    if (!sand && !snow && i % 3 === 0) {
      c.fillStyle = color + "8c";
      for (let j = 0; j < 4; j++) {
        c.beginPath(); c.ellipse(x + (j - 2) * 4, y - 7 - j % 2 * 4, 2, 1.5, j, 0, Math.PI * 2); c.fill();
      }
    }
    if (snow && i % 3 === 0) {
      c.strokeStyle = "#b8eafe70"; c.beginPath(); c.moveTo(x - 14, y + 8); c.lineTo(x - 3, y + 3); c.lineTo(x + 8, y + 6); c.stroke();
    }
  }
  c.restore();
}
