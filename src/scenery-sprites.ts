export const SCENERY_ATLAS_URL = new URL(
  "./assets/scenery-props.webp",
  import.meta.url,
).href;
export let sceneryArtRevision = 0;
const atlas = typeof Image === "undefined" ? null : new Image();
if (atlas) {
  atlas.decoding = "async";
  atlas.onload = () => {
    sceneryArtRevision++;
  };
  atlas.src = SCENERY_ATLAS_URL;
}
// Each 362px cell is drawn smaller than its source, keeping leaves, roof tiles
// and crystal facets sharp. The scenery is original art, not a game screenshot.
export function drawScenerySprite(
  c: CanvasRenderingContext2D,
  frame: number,
  x: number,
  footY: number,
  height: number,
): boolean {
  if (!atlas?.complete || !atlas.naturalWidth) return false;
  const w = atlas.naturalWidth / 4,
    h = atlas.naturalHeight / 3;
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.drawImage(
    atlas,
    (frame % 4) * w,
    Math.floor(frame / 4) * h,
    w,
    h,
    x - height / 2,
    footY - height * 0.94,
    height,
    height,
  );
  c.restore();
  return true;
}
export function sceneryTreeFrame(region: number): number {
  return region >= 14
    ? 8
    : region === 3
      ? 1
      : [5, 6, 9].includes(region)
        ? 2
        : [4, 7, 11].includes(region)
          ? 3
          : [0, 1].includes(region)
            ? 0
            : 11;
}
