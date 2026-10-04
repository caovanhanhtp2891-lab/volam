export function createSiegeArt(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1900;
  canvas.height = 1200;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#293b30";
  c.fillRect(0, 0, 1900, 1200);
  for (let y = 180; y < 1010; y += 38)
    for (let x = 310; x < 1590; x += 70) {
      c.fillStyle = (x + y) % 3 === 0 ? "#4c5149" : "#414b42";
      c.fillRect(x, y, 68, 36);
      c.fillStyle = "#83917e22";
      c.fillRect(x + 4, y + 3, 60, 2);
    }
  c.fillStyle = "#84816c";
  c.fillRect(840, 300, 220, 650);
  for (let y = 305; y < 940; y += 45) {
    c.strokeStyle = "#4b5149";
    c.strokeRect(840, y, 220, 44);
  }
  const wall = (x: number, y: number, w: number, h: number) => {
    c.fillStyle = "#161e22";
    c.fillRect(x + 10, y + 22, w, h);
    c.fillStyle = "#747769";
    c.fillRect(x, y, w, h);
    c.fillStyle = "#363f3c";
    c.fillRect(x, y + h - 10, w, 10);
    c.strokeStyle = "#a6a68a";
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
    for (let i = 0; i < w; i += 40) {
      c.fillStyle = "#9a9b82";
      c.fillRect(x + i, y - 12, 22, 16);
    }
  };
  wall(300, 185, 1300, 60);
  wall(300, 185, 55, 750);
  wall(1545, 185, 55, 750);
  wall(300, 520, 565, 50);
  wall(1035, 520, 565, 50);
  for (const x of [340, 1480])
    for (const y of [230, 580]) {
      c.fillStyle = "#242c2b";
      c.fillRect(x - 70, y - 70, 150, 150);
      c.fillStyle = "#797e6b";
      c.fillRect(x - 72, y - 100, 144, 126);
      c.fillStyle = "#493b35";
      c.fillRect(x - 80, y - 90, 160, 22);
      c.fillStyle = "#884b3c";
      c.beginPath();
      c.moveTo(x - 95, y - 95);
      c.lineTo(x, y - 155);
      c.lineTo(x + 95, y - 95);
      c.closePath();
      c.fill();
      c.strokeStyle = "#c1955f";
      c.lineWidth = 4;
      c.stroke();
    }
  c.fillStyle = "#523e32";
  c.fillRect(820, 210, 260, 86);
  c.fillStyle = "#914c3b";
  c.beginPath();
  c.moveTo(790, 215);
  c.lineTo(950, 145);
  c.lineTo(1110, 215);
  c.closePath();
  c.fill();
  c.strokeStyle = "#d2b775";
  c.lineWidth = 5;
  c.stroke();
  c.fillStyle = "#dfc18a";
  c.font = "bold 24px serif";
  c.textAlign = "center";
  c.fillText("TRẤN THÀNH", 950, 266);
  for (const x of [450, 1450])
    for (const y of [400, 760]) {
      c.fillStyle = "#cf9870";
      c.fillRect(x, y - 65, 5, 75);
      c.fillStyle = x < 950 ? "#5fb69f" : "#cb6d64";
      c.beginPath();
      c.moveTo(x + 5, y - 65);
      c.lineTo(x + 62, y - 56);
      c.lineTo(x + 5, y - 30);
      c.fill();
    }
  return canvas;
}
export function drawSiegeStructure(
  c: CanvasRenderingContext2D,
  kind: "gate" | "banner",
  health: number,
  now: number,
): void {
  if (kind === "gate") {
    c.fillStyle = "#202c28";
    c.fillRect(-82, -82, 164, 95);
    c.fillStyle = "#71482d";
    c.fillRect(-73, -74, 146, 85);
    for (let x = -70; x < 70; x += 18) {
      c.fillStyle = "#bd915a";
      c.fillRect(x, -73, 3, 83);
    }
    c.fillStyle = "#392f27";
    c.fillRect(-72, -56, 144, 8);
    c.fillRect(-72, -12, 144, 8);
    c.strokeStyle = "#dfba6c";
    c.lineWidth = 3;
    c.strokeRect(-75, -77, 150, 89);
    if (health < 0.7) {
      c.strokeStyle = "#241b16";
      c.beginPath();
      c.moveTo(-12, -73);
      c.lineTo(7, -45);
      c.lineTo(-8, -28);
      c.lineTo(15, 9);
      c.stroke();
    }
  } else {
    c.fillStyle = "#bfbfa2";
    c.fillRect(-3, -110, 6, 120);
    c.fillStyle = "#c94d48";
    c.beginPath();
    c.moveTo(3, -107);
    c.bezierCurveTo(25, -120 + Math.sin(now / 180) * 8, 45, -90, 74, -103);
    c.lineTo(65, -55);
    c.bezierCurveTo(40, -40, 18, -68, 3, -56);
    c.closePath();
    c.fill();
    c.fillStyle = "#f0d395";
    c.font = "bold 23px serif";
    c.fillText("戰", 34, -75);
    c.fillStyle = "#919385";
    c.fillRect(-24, 3, 48, 14);
  }
}
