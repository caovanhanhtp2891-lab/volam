// Original generated art. Rectangles use normalized coordinates so the atlas
// does not depend on the generator's output resolution.
export const ATLAS_URL = new URL("./assets/wuxia-atlas.webp", import.meta.url).href;
export const WORLD_ART_URL = new URL("./assets/thanh-khe.webp", import.meta.url).href;
const SCENERY_URL = new URL("./assets/scenery-atlas.webp", import.meta.url).href;

const SPRITES = {
  kim: [0, 0, .25, .274],
  hoa: [.25, 0, .25, .274],
  thuy: [.5, 0, .25, .274],
  bandit: [.75, 0, .25, .274],
  wolf: [0, .274, .25, .226],
  alpha: [.25, .274, .25, .226],
  beetle: [.5, .274, .25, .226],
  undead: [.75, .274, .25, .226],
  guide: [0, .5, .25, .25],
  smith: [.25, .5, .25, .25],
  portal: [.5, .5, .25, .25],
  guardian: [.75, .5, .25, .25],
  sword: [0, .75, .25, .25],
  fire: [.25, .75, .25, .25],
  ice: [.5, .75, .25, .25],
  loot: [.75, .75, .25, .25],
} as const;

export type SpriteId = keyof typeof SPRITES;

function loadImage(url: string): HTMLImageElement {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image;
}

const atlas = loadImage(ATLAS_URL);
const scenery = loadImage(SCENERY_URL);
export const worldArt = loadImage(WORLD_ART_URL);

export function spriteMarkup(id: SpriteId, extraClass = ""): string {
  const [x, y, w, h] = SPRITES[id];
  return `<span class="art-sprite ${extraClass}" aria-hidden="true" style="background-image:url('${ATLAS_URL}');background-size:${100 / w}% ${100 / h}%;background-position:${x / (1 - w) * 100}% ${y / (1 - h) * 100}%"></span>`;
}

export function drawSprite(
  context: CanvasRenderingContext2D,
  id: SpriteId,
  x: number,
  y: number,
  width: number,
  height: number,
  flip = false,
): boolean {
  return drawFromAtlas(context, atlas, SPRITES[id], x, y, width, height, flip);
}

export function drawScenerySprite(
  context: CanvasRenderingContext2D,
  id: "rock" | "bamboo" | "peach" | "gate",
  x: number, y: number, width: number, height: number,
): boolean {
  const rects = { rock: [0, 0, .5, .5], bamboo: [.5, 0, .5, .5], peach: [0, .5, .5, .5], gate: [.5, .5, .5, .5] } as const;
  return drawFromAtlas(context, scenery, rects[id], x, y, width, height);
}

function drawFromAtlas(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: readonly [number, number, number, number],
  x: number, y: number, width: number, height: number, flip = false,
): boolean {
  if (!image.complete || !image.naturalWidth) return false;
  const [sx, sy, sw, sh] = rect;
  context.save();
  context.translate(x, y);
  if (flip) context.scale(-1, 1);
  context.drawImage(image,
    sx * image.naturalWidth, sy * image.naturalHeight,
    sw * image.naturalWidth, sh * image.naturalHeight,
    -width / 2, -height, width, height,
  );
  context.restore();
  return true;
}
