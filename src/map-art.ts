import { drawScenerySprite } from "./scenery-sprites";
import { drawLandscape, drawSceneryTemple, drawSceneryRock } from "./landscape-art";
import { REGION_SCENES } from "./region-scenes";
export { sceneryArtRevision as trainingArtRevision } from "./scenery-sprites";

interface MapObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
}

// Paint the complete ground at world resolution. Large worlds share the same
// biome, with distinct native landmarks instead of repeated enlarged pictures.
export function createTerrainArt(region: number, width: number, height: number): HTMLCanvasElement {
  return createTrainingArt(region, width, height);
}
export function createTrainingArt(region: number, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas"); canvas.width = Math.ceil(width); canvas.height = Math.ceil(height);
  drawLandscape(canvas.getContext("2d")!, region, width, height);
  canvas.dataset.nativeLandscape = String(region);
  return canvas;
}

export function drawRegionWeather(ctx: CanvasRenderingContext2D, region: number, now: number, x: number, y: number, width: number, height: number, simple = false): void {
  const scene = REGION_SCENES[region] ?? REGION_SCENES[0];
  ctx.save(); ctx.fillStyle = scene.color; ctx.strokeStyle = scene.color;
  const count = simple ? 4 : scene.weather === "snow" ? 20 : 12;
  for (let i = 0; i < count; i++) {
    const phase = now / (scene.weather === "embers" ? 6000 : 13000) + i * .618;
    const px = x + (((i * .381 + now / 85000) % 1 + 1) % 1) * width;
    const py = y + ((phase % 1 + 1) % 1) * height;
    ctx.globalAlpha = scene.weather === "mist" ? .035 : .25 + Math.sin(phase * 6) * .12;
    ctx.beginPath();
    if (scene.weather === "mist") ctx.ellipse(px, py, 90, 16, -.2, 0, Math.PI * 2);
    else if (scene.weather === "snow" || scene.weather === "dust" || scene.weather === "embers") ctx.arc(px, scene.weather === "embers" ? y + height - (py - y) : py, scene.weather === "snow" ? 1.2 + i % 3 * .4 : 1, 0, Math.PI * 2);
    else ctx.ellipse(px + Math.sin(phase * 8) * 10, py, scene.weather === "petals" ? 2.4 : 3.5, 1.2, phase * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Static scenery is painted once at native resolution, then reused by the world
// and minimap. This avoids image downloads and repeated geometry every frame.
export function createMapArt(
  mode: "world" | "dungeon" | "bamboo",
  width: number,
  height: number,
  obstacles: readonly MapObstacle[] = [],
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const context = canvas.getContext("2d")!;
  context.scale(canvas.width / width, canvas.height / height);
  context.fillStyle = mode === "world" ? "#5d8058" : mode === "bamboo" ? "#35543e" : "#222b37";
  context.fillRect(0, 0, width, height);
  drawLandscape(context, mode === "world" ? 3 : mode === "bamboo" ? 3 : 2, width, height, false);

  if (mode !== "world") {
    context.fillStyle = mode === "bamboo" ? "#8f9261" : "#3e4857";
    context.fillRect(160, 500, 1450, 470);
    context.strokeStyle = mode === "bamboo" ? "#b0b579" : "#697082";
    context.lineWidth = 8;
    context.strokeRect(160, 500, 1450, 470);
    context.strokeStyle = mode === "bamboo" ? "#7e8256" : "#35404f";
    context.lineWidth = 2;
    context.beginPath();
    for (let x = 160; x <= 1610; x += 96) {
      context.moveTo(x, 500);
      context.lineTo(x, 970);
    }
    for (let y = 500; y <= 970; y += 96) {
      context.moveTo(160, y);
      context.lineTo(1610, y);
    }
    context.stroke();
    if (mode === "bamboo") {
      context.fillStyle = "#6f945c";
      for (let x = 160; x < 1650; x += 90) {
        context.fillRect(x, 365, 7, 110);
        context.fillRect(x + 30, 1010, 7, 100);
        context.beginPath();
        context.ellipse(x + 5, 380, 32, 10, -0.4, 0, Math.PI * 2);
        context.ellipse(x + 30, 1020, 32, 10, 0.4, 0, Math.PI * 2);
        context.fill();
      }
    }
    return canvas;
  }

  context.strokeStyle = "#baa879";
  context.lineWidth = 60;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(170, 320);
  context.lineTo(384, 380);
  context.lineTo(384, 890);
  context.moveTo(220, 505);
  context.lineTo(1650, 505);
  context.lineTo(1710, 300);
  context.stroke();

  context.fillStyle = "#658d9c";
  context.beginPath();
  context.ellipse(1665, 935, 155, 105, -0.2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#97b4b6";
  context.lineWidth = 3;
  for (let index = 0; index < 3; index++) {
    context.beginPath();
    context.moveTo(1595 + index * 15, 910 + index * 24);
    context.lineTo(1695 + index * 15, 910 + index * 24);
    context.stroke();
  }

  for (const y of [195, 385]) drawSceneryTemple(context, 130, y + 65, .6, 3);

  for (const { x, y, w, h, type } of obstacles) {
    if (type === "rock") {
      drawSceneryRock(context, x + w / 2, y + h / 2, Math.max(w, h) / 60);
    } else {
      let painted = false;
      for (let sx = x + 25; sx < x + w; sx += 60) painted = drawScenerySprite(context, 1, sx, y + h, Math.max(100, h + 65)) || painted;
      if (painted) continue;
      context.fillStyle = "#355c43";
      context.fillRect(x, y, w, h);
      for (let sx = x + 14; sx < x + w; sx += 34) {
        context.strokeStyle = "#abc075";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(sx, y + h - 8);
        context.lineTo(sx + 3, y + 10);
        context.stroke();
        context.fillStyle = "#699653";
        context.beginPath();
        context.ellipse(sx - 4, y + 17, 17, 7, -0.4, 0, Math.PI * 2);
        context.ellipse(sx + 11, y + 36, 17, 7, 0.4, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  return canvas;
}
