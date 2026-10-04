import { TRAINING_ATLAS_URL, REGION_SCENES, regionFrame } from "./region-scenes";
import { drawTerrainDetail } from "./terrain-detail";
const trainingAtlas = new Image();
trainingAtlas.decoding = "async";
export let trainingArtRevision = 0;
trainingAtlas.onload = () => { trainingArtRevision++; };
trainingAtlas.src = TRAINING_ATLAS_URL;

interface MapObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
}

// Repeating mirrored terrain keeps painted details at a readable scale in large
// worlds. Opposite edges meet at the same atlas pixels, avoiding hard seams.
export function createTerrainArt(
  region: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = createTrainingArt(region, width, height);
  if (!trainingAtlas.complete || !trainingAtlas.naturalWidth) return canvas;
  const c = canvas.getContext("2d")!,
    frame = regionFrame(
      region,
      trainingAtlas.naturalWidth,
      trainingAtlas.naturalHeight,
    );
  const tileWidth = 900,
    tileHeight = 600;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  for (let row = 0; row < Math.ceil(height / tileHeight); row++) {
    for (let col = 0; col < Math.ceil(width / tileWidth); col++) {
      c.save();
      c.translate(
        (col + (col % 2)) * tileWidth,
        (row + (row % 2)) * tileHeight,
      );
      c.scale(col % 2 ? -1 : 1, row % 2 ? -1 : 1);
      c.drawImage(
        trainingAtlas,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        tileWidth,
        tileHeight,
      );
      drawTerrainDetail(c, region, tileWidth, tileHeight);
      c.restore();
    }
  }
  c.fillStyle = "#08132316";
  c.fillRect(0, 0, width, height);
  c.restore();
  return canvas;
}

// Original scenery for the idle arenas. Paint once per region, with a clear
// center for combat and paths that remain readable on small portrait screens.
export function createTrainingArt(region: number, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const ctx = canvas.getContext("2d")!;
  if (trainingAtlas.complete && trainingAtlas.naturalWidth) {
    const frame = regionFrame(region, trainingAtlas.naturalWidth, trainingAtlas.naturalHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(trainingAtlas, frame.x, frame.y, frame.width, frame.height, 0, 0, width, height);
    // A subtle vignette keeps the center readable without hiding painted terrain.
    const shade = ctx.createRadialGradient(width / 2, height / 2, height * .2, width / 2, height / 2, width * .64);
    shade.addColorStop(0, "#08132300"); shade.addColorStop(1, "#08132325");
    ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
    drawTerrainDetail(ctx, region, width, height);
    return canvas;
  }
  const palettes = [
    ["#4c5739", "#8d8060", "#304833", "#647343"],
    ["#3d503f", "#85755b", "#213c33", "#5f7350"],
    ["#444446", "#716a5d", "#30373b", "#626a59"],
    ["#655d40", "#a89868", "#425338", "#858451"],
    ["#50665b", "#9b9f88", "#354c44", "#819680"],
  ];
  const [ground, path, dark, light] =
    region >= 14
      ? ["#899b91", "#b0b3a1", "#4c6555", "#d6ded0"]
      : region === 12
        ? ["#9b8355", "#c2aa78", "#686745", "#b4a162"]
        : palettes[region % palettes.length];
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, width, height);
  let seed = region + 1234;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.strokeStyle = path;
  ctx.lineWidth = 110;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(130, 250);
  ctx.bezierCurveTo(750, 480, 930, 550, 1810, 1030);
  ctx.stroke();
  ctx.lineWidth = 95;
  ctx.beginPath();
  ctx.moveTo(1470, 100);
  ctx.bezierCurveTo(1020, 480, 940, 700, 620, 1140);
  ctx.stroke();
  for (let i = 0; i < 32000; i++) {
    const x = random() * width,
      y = random() * height;
    ctx.fillStyle = random() > 0.5 ? "#e8dcb625" : "#0b160c2b";
    ctx.fillRect(x, y, 2 + random() * 4, 1 + random() * 3);
  }
  for (let i = 0; i < 220; i++) {
    const x = random() * width,
      y = random() * height;
    if (Math.hypot(x - 950, y - 650) < 95) continue;
    ctx.fillStyle = i % 3 === 0 ? light : dark;
    for (let leaf = 0; leaf < 14; leaf++) {
      const angle = random() * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(angle) * 14, y + Math.sin(angle) * 8, 8, 3, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = random() * width,
      y = random() * height;
    if (Math.hypot(x - 950, y - 650) < 260) continue;
    ctx.strokeStyle = light;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x - 5, y - 7);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y - 10);
    ctx.stroke();
    if (i % 9 === 0) {
      ctx.fillStyle = "#b49ba9";
      ctx.fillRect(x, y - 10, 3, 3);
    }
  }
  for (const [x, y, scale] of [
    [600, 330, 1.1],
    [1250, 890, 1.3],
    [480, 850, 0.9],
    [1320, 380, 1],
    [200, 180, 1.4],
    [1650, 650, 1.5],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#0004";
    ctx.beginPath();
    ctx.ellipse(16, 20, 63, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5b4c36";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.lineTo(-4, -65);
    ctx.lineTo(-40, -125);
    ctx.moveTo(-4, -55);
    ctx.lineTo(40, -110);
    ctx.stroke();
    for (let j = 0; j < 18; j++) {
      ctx.fillStyle = j % 3 === 0 ? light : dark;
      ctx.beginPath();
      ctx.ellipse(
        (random() - 0.5) * 110,
        -85 - random() * 65,
        26 + random() * 18,
        18 + random() * 10,
        random(),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
  for (const [x, y] of [
    [760, 310],
    [1260, 530],
    [690, 950],
    [1420, 720],
  ]) {
    ctx.fillStyle = "#0003";
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 7, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#757765";
    ctx.beginPath();
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x - 18, y - 27);
    ctx.lineTo(x + 16, y - 32);
    ctx.lineTo(x + 31, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#a3a38d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 24);
    ctx.lineTo(x + 12, y - 30);
    ctx.stroke();
  }
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

  for (let y = 30; y < height; y += 130) {
    for (let x = 20; x < width; x += 150) {
      context.fillStyle = "#64875d";
      context.beginPath();
      context.ellipse(x + 35, y + 20, 40, 19, 0, 0, Math.PI * 2);
      context.fill();
    }
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

  // Two modest huts mark the NPC area without filling the field with detail.
  for (const y of [195, 385]) {
    context.fillStyle = "#987955";
    context.fillRect(80, y + 15, 100, 50);
    context.fillStyle = "#624b45";
    context.beginPath();
    context.moveTo(70, y + 20);
    context.lineTo(130, y - 10);
    context.lineTo(190, y + 20);
    context.closePath();
    context.fill();
    context.fillStyle = "#423b36";
    context.fillRect(123, y + 35, 18, 30);
  }

  for (const { x, y, w, h, type } of obstacles) {
    if (type === "rock") {
      context.fillStyle = "#7d8b7d";
      context.beginPath();
      context.moveTo(x, y + h * 0.4);
      context.lineTo(x + w * 0.22, y);
      context.lineTo(x + w * 0.78, y + h * 0.05);
      context.lineTo(x + w, y + h * 0.66);
      context.lineTo(x + w * 0.8, y + h);
      context.lineTo(x + w * 0.12, y + h * 0.92);
      context.closePath();
      context.fill();
      context.strokeStyle = "#a5b09a";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x + w * 0.25, y + h * 0.15);
      context.lineTo(x + w * 0.5, y + h * 0.45);
      context.lineTo(x + w * 0.78, y + h * 0.2);
      context.stroke();
    } else {
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
