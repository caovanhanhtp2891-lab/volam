import {
  drawScenerySprite,
  sceneryTreeFrame,
  sceneryArtRevision,
} from "./scenery-sprites.ts";
import { drawWuxiaLandmark, groundPattern } from "./wuxia-sprites.ts";
import { wuxiaScene, roadControlPoints, roadPoint } from "./wuxia-scenes.ts";
// Native-resolution terrain. Ground grain, paths and landmarks are cached once,
// so combat frames never upscale a small painted atlas or run a blur filter.
export const LANDSCAPES = [
  ["#455d3b", "#bfad7c", "#204b36", "#88ad5e", "#ae8c57"],
  ["#4f6353", "#b4bdb0", "#244f49", "#8da997", "#768c85"],
  ["#303e43", "#7d8e87", "#234943", "#71978b", "#526b66"],
  ["#3e6548", "#c0b986", "#205336", "#98b958", "#72945a"],
  ["#596857", "#c8c1a3", "#365249", "#a6b89b", "#8eaa96"],
  ["#655d3c", "#d3b27e", "#72512f", "#d4b351", "#a07842"],
  ["#6c5745", "#c5a589", "#713b30", "#d57d52", "#a45b45"],
  ["#555951", "#c3b291", "#414c45", "#aeb785", "#a77eac"],
  ["#486646", "#b3bc81", "#255239", "#9cac53", "#82a661"],
  ["#62634a", "#d4c293", "#676134", "#d8c75e", "#a5975f"],
  ["#476567", "#bfc8ad", "#27544f", "#80b8a2", "#8aac9c"],
  ["#57734c", "#c0c396", "#315c43", "#9fc877", "#bf9baa"],
  ["#b8a176", "#e4cb9c", "#756e47", "#b6a45d", "#bd8954"],
  ["#6b6860", "#beb396", "#424f42", "#929879", "#847769"],
  ["#b9cdc9", "#e4ece1", "#365e57", "#8eb8a9", "#7f9a99"],
  ["#a9c6ce", "#e2f1f2", "#366274", "#b8d9df", "#7da6b8"],
] as const;
export function sceneryRandom(region: number) {
  let seed = (region + 19) * 17041;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const TAU = Math.PI * 2;
function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fill();
}
export function drawSceneryRock(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  snow = false,
) {
  if (drawScenerySprite(c, 6, x, y + 5, 78 * scale)) return;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  ellipse(c, 8, 7, 34, 13, "#172c2a55");
  c.beginPath();
  c.moveTo(-29, 0);
  c.lineTo(-18, -26);
  c.lineTo(9, -35);
  c.lineTo(31, -15);
  c.lineTo(25, 7);
  c.lineTo(-11, 9);
  c.closePath();
  c.fillStyle = snow ? "#689093" : "#6f7970";
  c.fill();
  c.strokeStyle = "#354c46";
  c.lineWidth = 1.5;
  c.stroke();
  c.beginPath();
  c.moveTo(-18, -26);
  c.lineTo(9, -35);
  c.lineTo(20, -20);
  c.lineTo(-4, -16);
  c.lineTo(-29, 0);
  c.closePath();
  c.fillStyle = snow ? "#e3f0ee" : "#a1aa8a";
  c.fill();
  c.beginPath();
  c.moveTo(-4, -16);
  c.lineTo(10, -3);
  c.lineTo(25, 7);
  c.moveTo(9, -35);
  c.lineTo(10, -3);
  c.strokeStyle = "#d6dac085";
  c.lineWidth = 1.2;
  c.stroke();
  if (!snow) {
    ellipse(c, -15, 1, 10, 4, "#557a48");
    ellipse(c, -22, -5, 5, 3, "#89a063");
  }
  c.restore();
}
function tree(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  region: number,
  random: () => number,
) {
  if (drawScenerySprite(c, sceneryTreeFrame(region), x, y + 5, 146 * scale))
    return;
  const [, , dark, light] = LANDSCAPES[region],
    pine = [0, 1, 14, 15].includes(region),
    snow = region >= 14;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  ellipse(c, 19, 6, 46, 15, "#153d2b50");
  c.strokeStyle = "#564534";
  c.lineWidth = 11;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(0, 8);
  c.lineTo(-3, -88);
  c.stroke();
  c.strokeStyle = "#b89763";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-3, 5);
  c.lineTo(-5, -82);
  c.stroke();
  if (pine) {
    for (let layer = 0; layer < 4; layer++) {
      const y = -38 - layer * 22,
        r = 46 - layer * 9;
      c.beginPath();
      c.moveTo(0, y - 49);
      c.bezierCurveTo(-r * 0.3, y - 22, -r * 0.7, y - 7, -r, y);
      c.quadraticCurveTo(-r * 0.25, y + 9, 0, y + 8);
      c.quadraticCurveTo(r * 0.25, y + 9, r, y);
      c.bezierCurveTo(r * 0.7, y - 7, r * 0.3, y - 22, 0, y - 49);
      c.closePath();
      c.fillStyle = layer % 2 ? dark : light;
      c.fill();
      c.strokeStyle = dark;
      c.lineWidth = 1;
      c.stroke();
      for (let needle = 0; needle < 14; needle++) {
        const px = (random() - 0.5) * r * 1.5,
          py = y - random() * 20;
        c.strokeStyle = snow ? "#e6f1e8b0" : "#c0d38960";
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + 8, py - 3);
        c.stroke();
      }
      if (snow) {
        c.beginPath();
        c.moveTo(0, y - 43);
        c.lineTo(-r * 0.63, y - 8);
        c.quadraticCurveTo(0, y - 2, r * 0.66, y - 8);
        c.closePath();
        c.fillStyle = "#ebf4ed";
        c.fill();
      }
    }
  } else if (region === 3) {
    for (let stalk = -2; stalk <= 2; stalk++) {
      const sx = stalk * 10;
      c.strokeStyle = stalk % 2 ? "#548749" : "#97bd63";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(sx, 6);
      c.lineTo(sx + stalk * 2, -104 - Math.abs(stalk) * 10);
      c.stroke();
      for (let y = -14; y > -100; y -= 20) {
        c.strokeStyle = "#d4d88a";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx - 3, y);
        c.lineTo(sx + 3, y);
        c.stroke();
        for (const side of [-1, 1]) {
          c.beginPath();
          c.moveTo(sx, y);
          c.quadraticCurveTo(sx + side * 14, y - 19, sx + side * 31, y - 10);
          c.quadraticCurveTo(sx + side * 16, y - 6, sx, y);
          c.fillStyle = side > 0 ? light : dark;
          c.fill();
        }
      }
    }
  } else {
    c.strokeStyle = "#66523b";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-2, -45);
    c.lineTo(-26, -84);
    c.moveTo(-3, -63);
    c.lineTo(27, -96);
    c.stroke();
    for (let cluster = 0; cluster < 20; cluster++) {
      const a = cluster * 2.39996,
        r = Math.sqrt(random()) * 39,
        px = Math.cos(a) * r,
        py = -85 + Math.sin(a) * r * 0.62;
      ellipse(c, px + 3, py + 4, 22, 15, dark);
      ellipse(c, px - 2, py - 3, 20, 13, light);
      for (let leaf = 0; leaf < 7; leaf++)
        ellipse(
          c,
          px + (random() - 0.5) * 34,
          py + (random() - 0.5) * 19,
          2 + random() * 3,
          1.2,
          leaf % 2 ? dark + "b0" : "#f1dc9b75",
        );
    }
    if ([4, 7, 11].includes(region))
      for (let i = 0; i < 24; i++)
        ellipse(
          c,
          (random() - 0.5) * 80,
          -70 - random() * 40,
          2,
          2,
          region === 7 ? "#e4b6ed" : "#f7cee1",
        );
  }
  c.restore();
}
export function drawSceneryTemple(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  region = 0,
) {
  if (drawWuxiaLandmark(c, wuxiaScene(region).landmark, x, y + 12, 350 * scale)) return;
  if (
    drawScenerySprite(
      c,
      region >= 14 ? 9 : region === 12 ? 10 : [2, 13].includes(region) ? 5 : 4,
      x,
      y + 15,
      280 * scale,
    )
  )
    return;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const snow = region >= 14,
    roof = snow
      ? "#e5eeeb"
      : [5, 6, 9].includes(region)
        ? "#8c5143"
        : "#477777";
  ellipse(c, 16, 14, 151, 28, "#18332e55");
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i % 2 ? "#87978d" : "#c3c9ad";
    c.fillRect(-118 + i * 8, -6 - i * 7, 236 - i * 16, 16);
    c.strokeStyle = "#465e56";
    c.lineWidth = 1;
    c.strokeRect(-118 + i * 8, -6 - i * 7, 236 - i * 16, 16);
  }
  c.fillStyle = "#a78b68";
  c.fillRect(-92, -116, 184, 108);
  c.fillStyle = "#d4be91";
  c.fillRect(-86, -108, 172, 75);
  for (const side of [-1, 1]) {
    c.fillStyle = "#774d3e";
    c.fillRect(side * 85 - 5, -112, 10, 104);
    c.fillStyle = "#b4965e";
    c.fillRect(side * 85 - 6, -117, 12, 8);
    c.fillStyle = "#253e36";
    c.fillRect(side * 55 - 19, -94, 38, 44);
    c.strokeStyle = "#d7c295";
    c.lineWidth = 2;
    for (let n = -1; n <= 1; n++) {
      c.beginPath();
      c.moveTo(side * 55 + n * 10, -92);
      c.lineTo(side * 55 + n * 10, -52);
      c.moveTo(side * 55 - 18, -73 + n * 11);
      c.lineTo(side * 55 + 18, -73 + n * 11);
      c.stroke();
    }
  }
  c.fillStyle = "#293d31";
  c.fillRect(-23, -80, 46, 65);
  c.fillStyle = "#8c593c";
  c.fillRect(-21, -79, 19, 60);
  c.fillRect(3, -79, 19, 60);
  c.strokeStyle = "#ceae75";
  c.strokeRect(-23, -80, 46, 65);
  c.beginPath();
  c.moveTo(-134, -108);
  c.quadraticCurveTo(-112, -102, -103, -129);
  c.quadraticCurveTo(-55, -134, 0, -177);
  c.quadraticCurveTo(55, -134, 103, -129);
  c.quadraticCurveTo(112, -102, 134, -108);
  c.lineTo(110, -97);
  c.lineTo(-110, -97);
  c.closePath();
  c.fillStyle = roof;
  c.fill();
  c.strokeStyle = "#e1c992";
  c.lineWidth = 3;
  c.stroke();
  c.strokeStyle = snow ? "#a3bdb7" : "#97bbb09c";
  c.lineWidth = 1.2;
  for (let i = -7; i <= 7; i++) {
    c.beginPath();
    c.moveTo(i * 12, -157 + Math.abs(i) * 4);
    c.lineTo(i * 16, -108);
    c.stroke();
  }
  c.fillStyle = "#273e34";
  c.fillRect(-38, -111, 76, 22);
  c.strokeStyle = "#d4b675";
  c.strokeRect(-38, -111, 76, 22);
  c.fillStyle = "#f5dc9b";
  c.font = "bold 12px serif";
  c.textAlign = "center";
  c.fillText(
    region === 2 ? "CỔ MỘ" : region === 13 ? "BIÊN ẢI" : "SƠN TRANG",
    0,
    -95,
  );
  for (const side of [-1, 1]) {
    c.strokeStyle = "#947953";
    c.beginPath();
    c.moveTo(side * 99, -106);
    c.lineTo(side * 99, -80);
    c.stroke();
    ellipse(c, side * 99, -75, 9, 12, "#c06b42");
    c.strokeStyle = "#ffe0a2";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(side * 99 - 8, -76);
    c.lineTo(side * 99 + 8, -76);
    c.stroke();
  }
  c.restore();
}
function crystal(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  if (drawScenerySprite(c, 7, x, y + 5, 90 * scale)) return;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  ellipse(c, 3, 3, 23, 9, "#173c454d");
  for (let i = -1; i <= 1; i++) {
    const px = i * 13,
      h = i === 0 ? 63 : 37;
    c.beginPath();
    c.moveTo(px - 9, -4);
    c.lineTo(px - 11, -h + 15);
    c.lineTo(px, -h);
    c.lineTo(px + 10, -h + 15);
    c.lineTo(px + 7, 0);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.strokeStyle = "#eaffff";
    c.lineWidth = 1.2;
    c.stroke();
    c.beginPath();
    c.moveTo(px, -h);
    c.lineTo(px - 2, -9);
    c.lineTo(px + 7, 0);
    c.closePath();
    c.fillStyle = "#fff7";
    c.fill();
  }
  c.restore();
}
export function drawLandscape(
  c: CanvasRenderingContext2D,
  region: number,
  width: number,
  height: number,
  paths = true,
) {
  region = Number.isInteger(region) && region >= 0 && region < 16 ? region : 0;
  const [ground, road, , light] = LANDSCAPES[region],
    random = sceneryRandom(region),
    scale = Math.max(0.25, Math.min(1.4, width / 1900)),
    snow = region >= 14,
    desert = region === 12,
    scene = wuxiaScene(region),
    texture = groundPattern(c, scene.ground),
    roadTexture = groundPattern(c, scene.road);
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.filter = "none";
  c.fillStyle = ground;
  c.fillRect(0, 0, width, height);
  if (texture) {
    c.fillStyle = texture; c.fillRect(0, 0, width, height);
    c.globalAlpha = snow ? .16 : scene.ground === 1 ? .28 : .34;
    c.fillStyle = ground; c.fillRect(0, 0, width, height); c.globalAlpha = 1;
  }
  const shade = c.createLinearGradient(0, 0, width, height);
  shade.addColorStop(0, "#dfdf9c14");
  shade.addColorStop(0.5, "#0000");
  shade.addColorStop(1, "#16373c28");
  c.fillStyle = shade;
  c.fillRect(0, 0, width, height);
  // Tiny native strokes add crisp grain instead of enlargement noise.
  for (let i = 0; i < Math.ceil((width * height) / (texture ? 650 : 110)); i++) {
    const x = random() * width,
      y = random() * height;
    c.fillStyle =
      i % 3
        ? snow
          ? "#f5fcf37a"
          : desert
            ? "#ffe6b55c"
            : "#9aab7052"
        : "#18362b30";
    c.fillRect(x, y, 1 + random() * 3, 0.7 + random());
  }
  if ([3, 10, 11, 15].includes(region)) {
    // The creek stays along the map border, leaving the combat area readable.
    c.lineCap = "round";
    for (const [w, color] of [
      [112, "#223b39"],
      [101, road],
      [87, snow ? "#77b2c3" : "#387c86"],
      [55, snow ? "#bbdce2" : "#519aa1"],
    ] as const) {
      c.strokeStyle = color;
      c.lineWidth = w * scale;
      c.beginPath();
      c.moveTo(width * 0.84, -50);
      c.bezierCurveTo(
        width * 0.94,
        height * 0.36,
        width * 0.75,
        height * 0.67,
        width * 0.86,
        height + 50,
      );
      c.stroke();
    }
    for (let i = 0; i < 60; i++) {
      const y = (i / 60) * height,
        x = width * (0.85 + Math.sin(i / 10) * 0.025);
      c.strokeStyle = "#d5eddb7a";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - 14 * scale, y);
      c.quadraticCurveTo(x, y - 3, x + 23 * scale, y);
      c.stroke();
    }
  }
  if (paths) {
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const [w, color] of [
      [99, "#2c403750"],
      [92, road],
      [82, roadTexture ?? (snow ? "#c3d3cd" : desert ? "#d4b383" : "#a9a078")],
    ] as const) {
      c.lineWidth = w * scale;
      c.strokeStyle = color;
      c.beginPath();
      for (const vertical of [false, true]) {
        const [a, b, d, e] = roadControlPoints(region, vertical);
        c.moveTo(a.x * width, a.y * height);
        c.bezierCurveTo(b.x * width, b.y * height, d.x * width, d.y * height, e.x * width, e.y * height);
      }
      c.stroke();
    }
  }
  if (paths) {
    const point = (t: number, vertical: boolean) => roadPoint(region, width, height, t, vertical);
    for (let i = 0; i < Math.ceil((width * height) / 550); i++) {
      const t = random(),
        vertical = i % 2 === 0,
        at = point(t, vertical),
        next = point(Math.min(1, t + 0.002), vertical),
        dx = next.x - at.x,
        dy = next.y - at.y,
        distance = Math.hypot(dx, dy) || 1,
        offset = (random() - 0.5) * 70 * scale;
      const x = at.x - (dy / distance) * offset,
        y = at.y + (dx / distance) * offset;
      c.fillStyle = snow
        ? i % 2
          ? "#f4fcf197"
          : "#a1b8b766"
        : i % 2
          ? scene.road === 1 ? "#d1d3c273" : "#e8d7ac9c"
          : "#6b674d55";
      c.fillRect(x, y, (1 + random() * 4) * scale, (1 + random() * 2) * scale);
      if (i % 12 === 0) {
        c.strokeStyle = snow ? "#aac5c0" : "#d3c8a7";
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(x - 4 * scale, y);
        c.lineTo(x + 2 * scale, y - 2 * scale);
        c.lineTo(x + 7 * scale, y + 1 * scale);
        c.stroke();
      }
    }
  }
  // Fragmented stone paving and cracks distinguish dungeon/fortress biomes.
  if ([2, 4, 9, 13, 15].includes(region))
    for (let i = 0; i < 190; i++) {
      const x = random() * width,
        y = random() * height,
        w = 17 + random() * 29;
      c.fillStyle = snow ? "#dfede755" : "#b2ba9d25";
      c.strokeStyle = snow ? "#6f969649" : "#263e343e";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - w, y);
      c.lineTo(x - w * 0.6, y - 10);
      c.lineTo(x + w * 0.7, y - 9);
      c.lineTo(x + w, y + 1);
      c.lineTo(x + w * 0.4, y + 10);
      c.lineTo(x - w * 0.8, y + 8);
      c.closePath();
      c.fill();
      c.stroke();
    }
  // Low ground vegetation does not suggest collision walls in walkable areas.
  for (let i = 0; i < Math.ceil((width * height) / 3100); i++) {
    const x = random() * width,
      y = random() * height;
    c.strokeStyle = snow ? "#648b8050" : desert ? "#84694077" : light + "b0";
    c.lineWidth = 0.9 * scale;
    c.beginPath();
    for (let j = 0; j < 3; j++) {
      c.moveTo(x + j * 3 * scale, y);
      c.lineTo(x + (j * 4 - 3) * scale, y - (4 + random() * 9) * scale);
    }
    c.stroke();
    if ([4, 7, 11].includes(region) && i % 5 === 0)
      ellipse(
        c,
        x,
        y - 6 * scale,
        2 * scale,
        1.5 * scale,
        region === 7 ? "#d9a9ed" : "#f8c1c7",
      );
  }
  const props: { x: number; y: number; scale: number; kind: number }[] = [];
  for (let i = 0; i < Math.ceil((width * height) / 16500); i++) {
    const x = random() * width,
      y = random() * height;
    // Keep a wide center clear for both melee and distant projectiles.
    if (
      Math.hypot((x - width * 0.5) / width, (y - height * 0.54) / height) < 0.2
    )
      continue;
    props.push({ x, y, scale: scale * (0.6 + random() * 0.5), kind: i % 6 });
  }
  props.sort((a, b) => a.y - b.y);
  for (const prop of props) {
    if (prop.kind === 0 || desert || region === 2)
      drawSceneryRock(c, prop.x, prop.y, prop.scale, snow);
    else if (region === 15 && prop.kind % 2)
      drawSceneryRock(c, prop.x, prop.y, prop.scale, true);
    else tree(c, prop.x, prop.y, prop.scale, region, random);
  }
  // The landmark is north of the fighting area so its roof never hides targets.
  if (scene.courtyard) {
    const x = width * .50, y = height * .46, rx = 190 * scale, ry = 90 * scale;
    c.beginPath(); c.moveTo(x - rx, y); c.lineTo(x, y - ry); c.lineTo(x + rx, y); c.lineTo(x, y + ry); c.closePath();
    c.fillStyle = roadTexture ?? "#7f8b7d"; c.fill();
    c.strokeStyle = snow ? "#c9e1dd" : "#626b58"; c.lineWidth = 6 * scale; c.stroke();
    c.strokeStyle = "#d7d3b67a"; c.lineWidth = 1; c.stroke();
  }
  drawSceneryTemple(c, width * .50, height * .30, scale, region);
  drawWuxiaLandmark(c, scene.companion, width * .70, height * .79, 245 * scale);
  if ([0, 1, 4, 7].includes(region)) drawWuxiaLandmark(c, 1, width * .21, height * .66, 290 * scale);
  if ([3, 10].includes(region)) drawWuxiaLandmark(c, 3, width * .84, height * .46, 220 * scale);
  if (region === 12 || region === 13) {
    for (let i = 0; i < 5; i++) {
      const x = width * 0.64 + i * 31 * scale,
        y = height * 0.2;
      c.fillStyle = "#56675b";
      c.fillRect(x, y - 77 * scale, 27 * scale, 76 * scale);
      c.fillStyle = "#a3a88a";
      c.fillRect(x, y - 83 * scale, 30 * scale, 10 * scale);
      c.fillStyle = ground;
      c.fillRect(x + 9 * scale, y - 49 * scale, 9 * scale, 19 * scale);
    }
  }
  // A stone platform is ground decoration, never a hidden obstacle.
  const ax = width * 0.61,
    ay = height * 0.76;
  ellipse(c, ax + 6, ay + 6, 94 * scale, 50 * scale, "#193b3450");
  c.beginPath(); c.ellipse(ax, ay, 87 * scale, 44 * scale, 0, 0, TAU);
  c.fillStyle = roadTexture ?? (snow ? "#d2e3dc" : "#879a7a"); c.fill();
  c.strokeStyle = snow ? "#f0ffff" : "#d0cdae";
  c.lineWidth = 2 * scale;
  c.beginPath();
  c.ellipse(ax, ay, 78 * scale, 37 * scale, 0, 0, TAU);
  c.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    c.beginPath();
    c.moveTo(ax + Math.cos(a) * 79 * scale, ay + Math.sin(a) * 38 * scale);
    c.lineTo(ax + Math.cos(a) * 65 * scale, ay + Math.sin(a) * 29 * scale);
    c.stroke();
  }
  c.restore();
}
const thumbnails = new Map<string, string>();
export function landscapeThumbnail(region: number): string {
  const key = `${region}:${sceneryArtRevision}`;
  if (!thumbnails.has(key)) {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 300;
    drawLandscape(canvas.getContext("2d")!, region, 480, 300);
    thumbnails.set(key, canvas.toDataURL("image/webp", 0.9));
    // Atlas load invalidations must not retain thumbnails from older revisions.
    for (const old of thumbnails.keys()) if (!old.endsWith(`:${sceneryArtRevision}`)) thumbnails.delete(old);
  }
  return `<i class="region-thumbnail" data-native-landscape="${region}" aria-hidden="true" style="background-image:url('${thumbnails.get(key)}');background-size:cover;background-position:center"></i>`;
}

// Gem realms have recognizable mineral veins even when sharing a forest biome.
export function drawGemMine(
  c: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
) {
  c.save();
  c.strokeStyle = "#172d355c";
  c.lineWidth = 16;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(width * 0.2, height * 0.28);
  c.lineTo(width * 0.38, height * 0.33);
  c.lineTo(width * 0.35, height * 0.65);
  c.lineTo(width * 0.73, height * 0.73);
  c.stroke();
  c.strokeStyle = color + "85";
  c.lineWidth = 2;
  c.stroke();
  for (const [x, y, scale] of [
    [0.22, 0.36, 1.5],
    [0.35, 0.26, 1.2],
    [0.68, 0.31, 1.8],
    [0.76, 0.59, 1.4],
    [0.26, 0.78, 1.6],
    [0.6, 0.82, 1.8],
  ] as const)
    crystal(c, x * width, y * height, scale, color);
  drawScenerySprite(c, 5, width * 0.16, height * 0.61, 210);
  c.fillStyle = "#18332b";
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.fillRect(width * 0.48 - 88, height * 0.27, 176, 38);
  c.strokeRect(width * 0.48 - 88, height * 0.27, 176, 38);
  c.font = "bold 17px serif";
  c.textAlign = "center";
  c.fillStyle = "#e9f7dc";
  c.fillText("LINH NGỌC KHOÁNG MẠCH", width * 0.48, height * 0.27 + 25);
  c.restore();
}
