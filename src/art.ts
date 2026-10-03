// One 5x4 atlas: ten sects, then ten shared monsters/NPCs/loot sprites.
export const ATLAS_URL = new URL("./assets/simple-atlas.webp", import.meta.url).href;

const IDS = ["thieu-lam", "thien-vuong", "duong-mon", "ngu-doc", "nga-mi", "thuy-yen", "cai-bang", "thien-nhan", "vo-dang", "con-lon", "bandit", "wolf", "alpha", "beetle", "undead", "guide", "smith", "portal", "guardian", "loot"] as const;
export type SpriteId = typeof IDS[number];
const SPRITES = Object.fromEntries(IDS.map((id, index) => [id, [index % 5 / 5, Math.floor(index / 5) / 4, .2, .25] as const])) as Record<SpriteId, readonly [number, number, number, number]>;


function loadImage(url: string): HTMLImageElement {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image;
}

const atlas = loadImage(ATLAS_URL);

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
