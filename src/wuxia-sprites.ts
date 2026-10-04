import { invalidateSceneryArt } from "./scenery-sprites.ts";
import type { GroundMaterial } from "./wuxia-scenes.ts";

export const WUXIA_LANDMARKS_URL = new URL("./assets/wuxia-landmarks.webp", import.meta.url).href;
export const WUXIA_GROUND_URL = new URL("./assets/wuxia-ground.webp", import.meta.url).href;
const tiles = new Map<GroundMaterial, HTMLCanvasElement>();
function loadAtlas(url: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const image = new Image(); image.decoding = "async";
  image.onload = () => { tiles.clear(); invalidateSceneryArt(); };
  image.src = url;
  return image;
}
const landmarks = loadAtlas(WUXIA_LANDMARKS_URL), ground = loadAtlas(WUXIA_GROUND_URL);

// Textures are downsampled once to a small repeat tile. Map canvases are painted
// at native world resolution and cached; no texture work happens per combat frame.
export function groundPattern(c: CanvasRenderingContext2D, material: GroundMaterial): CanvasPattern | null {
  if (!ground?.complete || !ground.naturalWidth) return null;
  let tile = tiles.get(material);
  if (!tile) {
    tile = document.createElement("canvas"); tile.width = tile.height = 288;
    const tc = tile.getContext("2d")!, cell = ground.naturalWidth / 2;
    tc.imageSmoothingQuality = "high";
    tc.drawImage(ground, material % 2 * cell, Math.floor(material / 2) * cell, cell, cell, 0, 0, 288, 288);
    tiles.set(material, tile);
  }
  return c.createPattern(tile, "repeat");
}
export function drawWuxiaLandmark(c: CanvasRenderingContext2D, frame: number, x: number, footY: number, height: number): boolean {
  if (!landmarks?.complete || !landmarks.naturalWidth) return false;
  const cell = landmarks.naturalWidth / 4;
  c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(landmarks, frame % 4 * cell, Math.floor(frame / 4) * cell, cell, cell, x - height / 2, footY - height * .86, height, height);
  c.restore();
  return true;
}
