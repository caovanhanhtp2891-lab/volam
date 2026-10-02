interface MapObstacle { x: number; y: number; w: number; h: number; type: string; }

// Static scenery is painted once at half resolution, then reused by the world
// and minimap. This avoids image downloads and repeated geometry every frame.
export function createMapArt(
  mode: "world" | "dungeon",
  width: number,
  height: number,
  obstacles: readonly MapObstacle[] = [],
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width / 2);
  canvas.height = Math.ceil(height / 2);
  const context = canvas.getContext("2d")!;
  context.scale(canvas.width / width, canvas.height / height);
  context.fillStyle = mode === "world" ? "#5d8058" : "#222b37";
  context.fillRect(0, 0, width, height);

  if (mode === "dungeon") {
    context.fillStyle = "#3e4857";
    context.fillRect(160, 500, 1450, 470);
    context.strokeStyle = "#697082";
    context.lineWidth = 8;
    context.strokeRect(160, 500, 1450, 470);
    context.strokeStyle = "#35404f";
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
  context.ellipse(1665, 935, 155, 105, -.2, 0, Math.PI * 2);
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
      context.moveTo(x, y + h * .4);
      context.lineTo(x + w * .22, y);
      context.lineTo(x + w * .78, y + h * .05);
      context.lineTo(x + w, y + h * .66);
      context.lineTo(x + w * .8, y + h);
      context.lineTo(x + w * .12, y + h * .92);
      context.closePath();
      context.fill();
      context.strokeStyle = "#a5b09a";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x + w * .25, y + h * .15);
      context.lineTo(x + w * .5, y + h * .45);
      context.lineTo(x + w * .78, y + h * .2);
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
        context.ellipse(sx - 4, y + 17, 17, 7, -.4, 0, Math.PI * 2);
        context.ellipse(sx + 11, y + 36, 17, 7, .4, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  return canvas;
}
