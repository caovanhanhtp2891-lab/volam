import { CHARACTER_ATLAS_URL, CHARACTER_ATLAS_SIZE, CHARACTER_SECTS, characterFrame, characterPortraitCrop, characterArtKey, characterTopInset, defaultCharacterSex, type CharacterSex } from "./character-art";
import type { SectId } from "./sects";
// Keep the original shared monsters/NPCs/loot atlas and a separate 20-look wuxia atlas.
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
const characterAtlas = loadImage(CHARACTER_ATLAS_URL);
const isCharacter = (id: SpriteId): id is SectId => CHARACTER_SECTS.includes(id as SectId);
function sourceFor(id: SpriteId, sex?: CharacterSex) {
  return isCharacter(id) ? { image: characterAtlas, rect: characterFrame(id, sex) } : { image: atlas, rect: SPRITES[id] };
}

export function spriteMarkup(id: SpriteId, extraClass = "", sex?: CharacterSex): string {
  const { rect: [x, y, w, h] } = sourceFor(id, sex);
  return `<span class="art-sprite ${extraClass}" ${isCharacter(id) ? `data-character-art="${characterArtKey(id, sex ?? defaultCharacterSex(id))}"` : ""} aria-hidden="true" style="background-image:url('${isCharacter(id) ? CHARACTER_ATLAS_URL : ATLAS_URL}');background-size:${100 / w}% ${100 / h}%;background-position:${x / (1 - w) * 100}% ${y / (1 - h) * 100}%;${isCharacter(id) ? `clip-path:inset(${characterTopInset(id, sex) * 100}% 0 0)` : ""}"></span>`;
}
export function characterPortraitMarkup(id: SectId, sex: CharacterSex): string {
  const crop = characterPortraitCrop(id, sex);
  return `<svg class="character-portrait-art" data-character-art="${characterArtKey(id, sex)}" viewBox="${crop.join(" ")}" aria-hidden="true"><image href="${CHARACTER_ATLAS_URL}" width="${CHARACTER_ATLAS_SIZE.width}" height="${CHARACTER_ATLAS_SIZE.height}"/></svg>`;
}

export function drawSprite(
  context: CanvasRenderingContext2D,
  id: SpriteId,
  x: number,
  y: number,
  width: number,
  height: number,
  flip = false,
  sex?: CharacterSex,
): boolean {
  const source = sourceFor(id, sex);
  return drawFromAtlas(context, source.image, source.rect, x, y, width, height, flip);
}

// Reuse the atlas while letting the two lower-body halves take opposite steps.
// Overlap at the hem keeps the robe connected to the upper body as feet lift.
export function drawWalkingSprite(
  context: CanvasRenderingContext2D, id: SpriteId,
  x: number, y: number, width: number, height: number,
  step: number, flip = false, sex?: CharacterSex,
  body?: { torsoAngle: number; torsoShift: number; crouch: number; kneeLift: number },
): boolean {
  if (Math.abs(step) < .025 && (!body || Math.abs(body.torsoAngle) + Math.abs(body.torsoShift) + body.crouch < .025)) return drawSprite(context, id, x, y, width, height, flip, sex);
  const { image: source, rect: [sx, sy, sw, sh] } = sourceFor(id, sex);
  if (!source.complete || !source.naturalWidth) return false;
  const split = .78, overlap = .045;
  context.save();
  context.translate(x, y);
  if (flip) context.scale(-1, 1);
  for (const side of (step > 0 ? [-1, 1] : [1, -1])) {
    const stride = step * side;
    context.save();
    context.translate(side * width * .12 + stride * 3.1, -height * (1 - split));
    context.rotate(stride * .11);
    context.drawImage(source,
      (sx + (side > 0 ? sw / 2 : 0)) * source.naturalWidth,
      (sy + sh * (split - overlap)) * source.naturalHeight,
      sw * source.naturalWidth / 2, sh * source.naturalHeight * (1 - split + overlap),
      side < 0 ? -width / 2 + width * .12 : -width * .12,
      -height * overlap - Math.max(0, stride) * (body?.kneeLift ?? 3.6),
      width / 2, height * (1 - split + overlap),
    );
    context.restore();
  }
  context.save();
  context.translate(0, -height * (1 - split));
  context.rotate(body?.torsoAngle ?? 0);
  context.translate(body?.torsoShift ?? 0, height * (1 - split) + (body?.crouch ?? 0));
  context.beginPath(); context.rect(-width / 2, -height, width, height * (split + .01)); context.clip();
  drawFromAtlas(context, source, sourceFor(id, sex).rect, 0, 0, width, height);
  context.restore();
  context.restore();
  return true;
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
  if (image === characterAtlas && (sy === .25 || sy === .75)) {
    context.beginPath(); context.rect(-width / 2, -height * .955, width, height * .955); context.clip();
  }
  context.drawImage(image,
    sx * image.naturalWidth, sy * image.naturalHeight,
    sw * image.naturalWidth, sh * image.naturalHeight,
    -width / 2, -height, width, height,
  );
  context.restore();
  return true;
}

// Seated pose stops at the pelvis; the standing boots are never drawn on a mount.
export function drawRidingTorso(
  context: CanvasRenderingContext2D,
  id: SectId,
  sex: CharacterSex,
  pelvis: number,
  width = 56,
  height = 76,
): boolean {
  if (!characterAtlas.complete || !characterAtlas.naturalWidth) return false;
  const [x, y, w, h] = characterFrame(id, sex);
  context.drawImage(
    characterAtlas,
    x * characterAtlas.naturalWidth,
    y * characterAtlas.naturalHeight,
    w * characterAtlas.naturalWidth,
    h * pelvis * characterAtlas.naturalHeight,
    -width * 0.54,
    -height * pelvis,
    width,
    height * pelvis,
  );
  return true;
}
