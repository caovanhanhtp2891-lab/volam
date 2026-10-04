import { drawSceneryTemple } from "./landscape-art";
import { createTerrainArt } from "./map-art";
import {
  EXPLORATION_WIDTH,
  EXPLORATION_HEIGHT,
  explorationZones,
} from "./exploration";
export function createExplorationArt(region: number): HTMLCanvasElement {
  const canvas = createTerrainArt(
      region,
      EXPLORATION_WIDTH,
      EXPLORATION_HEIGHT,
    ),
    c = canvas.getContext("2d")!;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  const zones = explorationZones(region);
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const [width, color] of [
    [76, "#252820a0"],
    [62, "#dac998a0"],
    [48, "#a89870c0"],
  ] as const) {
    c.lineWidth = width;
    c.strokeStyle = color;
    c.beginPath();
    zones.forEach((z, i) => (i ? c.lineTo(z.x, z.y) : c.moveTo(z.x, z.y)));
    c.closePath();
    c.stroke();
  }
  // Stone markers give the road a sharp edge, without covering combat zones.
  zones.forEach((z, i) => {
    const next = zones[(i + 1) % zones.length];
    const dx = next.x - z.x, dy = next.y - z.y, d = Math.hypot(dx, dy);
    for (let t = 400; t < d - 400; t += 110) {
      const x = z.x + dx * t / d, y = z.y + dy * t / d;
      c.fillStyle = "#eee0b0a0";
      c.fillRect(x - dy / d * 31 - 3, y + dx / d * 31 - 2, 6, 4);
      c.fillRect(x + dy / d * 31 - 3, y - dx / d * 31 - 2, 6, 4);
    }
  });
  zones.forEach((z, i) => {
    const g = c.createRadialGradient(z.x, z.y, 80, z.x, z.y, 390);
    g.addColorStop(0, i === 3 ? "#9a64433d" : "#cdb78424");
    g.addColorStop(1, "#0000");
    c.fillStyle = g;
    c.beginPath();
    c.arc(z.x, z.y, 390, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = i === 3 ? "#aa766099" : "#c5bc9299";
    c.lineWidth = 5;
    c.setLineDash([16, 20]);
    c.beginPath();
    c.ellipse(z.x, z.y, 350, 285, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    const x = z.x - 360,
      y = z.y - 310;
    drawSceneryTemple(c, x, y + 85, .9, region);
    c.fillStyle = "#15201bbd";
    c.fillRect(z.x - 190, z.y + 300, 380, 58);
    c.strokeStyle = "#af9b69";
    c.strokeRect(z.x - 190, z.y + 300, 380, 58);
    c.fillStyle = "#ebd79f";
    c.font = "bold 22px serif";
    c.textAlign = "center";
    c.fillText(z.name, z.x, z.y + 325);
    c.font = "15px sans-serif";
    c.fillStyle = "#c6d4b1";
    c.fillText(
      `Quái cấp ${z.minLevel}–${z.maxLevel}${i === 3 ? " · BOSS" : ""}`,
      z.x,
      z.y + 347,
    );
  });
  c.restore();
  return canvas;
}
