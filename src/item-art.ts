// Original painted, transparent atlases. Frames are shared by SVG inventory
// art and cached Canvas world art; enhancement light is rendered separately.
const ATLAS = {
  relics: { url: new URL("./assets/gear-relics.webp", import.meta.url).href, width: 1536, height: 1024, columns: 6, rows: 4 },
  weapons: { url: new URL("./assets/gear-weapons.webp", import.meta.url).href, width: 1402, height: 1122, columns: 5, rows: 4 },
  clothing: { url: new URL("./assets/gear-clothing.webp", import.meta.url).href, width: 1145, height: 1374, columns: 5, rows: 6 },
  jewelry: { url: new URL("./assets/gear-jewelry.webp", import.meta.url).href, width: 1292, height: 1218, columns: 6, rows: 6 },
};
const ORDERS = {
  relics: "meteorhammer scimitar iceglaive sunblade serpentstaff jadebow tigerarmor celestialrobe infernomail tigerhelm crystalcrown demonmask stormboots frostgreaves serpentbelt aurorabelt sunamulet serpentchain thunderring bloodring frostbracer dragonbeads phoenixseal starcompass".split(" "),
  weapons: "sword blade spear staff crossbow fan axe halberd daggers bow chakram flute whip hammer dragonstaff firesaber poisondarts frostsword thundersword lotusfan".split(" "),
  clothing: "plate robe mail lamellar cloak brocade dragonrobe phoenixmail shadowrobe helm crown hood dragonhelm veiledhat lotuscoronet mask thundercrest phoenixcrown greaves slippers cloudboots sandboots lotusboots shadowboots metalbelt jadebelt silkbelt dragonbelt starbelt emberbelt".split(" "),
  jewelry: "chain amulet moonchain fangchain lotuschain venomchain rubyring jadering dragonring signetring twinring frostring phoenixring guards beads silvercuff chainbracelet thunderbracer lotusbeads seal talisman gourd mirror scroll bell dragonseal taijicharm venomvial bay white warhorse ember dapple night hp mp".split(" "),
};
export const PAINTED_ITEM_FRAMES = Object.fromEntries(Object.entries(ORDERS).flatMap(([key, names]) => {
  const atlas = ATLAS[key as keyof typeof ATLAS], w = atlas.width / atlas.columns, h = atlas.height / atlas.rows;
  return names.map((name, index) => [name, { ...atlas, x: index % atlas.columns * w, y: Math.floor(index / atlas.columns) * h, w, h }]);
}));
const images = new Map<string, HTMLImageElement>();
function imageFor(url: string): HTMLImageElement {
  let image = images.get(url);
  if (!image) { image = new Image(); image.decoding = "async"; image.src = url; images.set(url, image); }
  return image;
}
export function paintedItemReady(name: string): boolean {
  const frame = PAINTED_ITEM_FRAMES[name];
  if (!frame) return false;
  const image = imageFor(frame.url);
  return image.complete && image.naturalWidth > 0;
}
export function drawPaintedItem(c: CanvasRenderingContext2D, name: string, x: number, y: number, width: number, height = width): boolean {
  const frame = PAINTED_ITEM_FRAMES[name];
  if (!frame || !paintedItemReady(name)) return false;
  // Keep the source cell's aspect ratio (jewelry cells are slightly wider).
  const scale = Math.min(width / frame.w, height / frame.h), w = frame.w * scale, h = frame.h * scale;
  c.drawImage(imageFor(frame.url), frame.x, frame.y, frame.w, frame.h, x + (width - w) / 2, y + (height - h) / 2, w, h);
  return true;
}
export function paintedItemMarkup(name: string, x = 5, y = 5, size = 54): string {
  const frame = PAINTED_ITEM_FRAMES[name];
  if (!frame) return "";
  return `<svg data-painted-item="${name}" x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" overflow="hidden" preserveAspectRatio="xMidYMid meet"><image href="${frame.url}" width="${frame.width}" height="${frame.height}"/></svg>`;
}
export type ResourceArt = "hp" | "mp" | "silver" | "stone" | "token" | "chest";
export function resourceMarkup(kind: ResourceArt): string {
  const body = kind === "hp" || kind === "mp" ? paintedItemMarkup(kind, 0, 0, 64)
    : kind === "stone" ? '<path d="M32 5l22 15-8 30-27 7L8 27z" fill="#599ab6" stroke="#d7efff" stroke-width="2"/><path d="M32 5l-6 23L8 27m18 1l20 22m-20-22l28-8m-28 8l-7 29" fill="none" stroke="#b1eaff" stroke-width="2"/><path d="M32 5l-6 23 28-8z" fill="#c7f1ff"/><path d="M26 28l20 22 8-30z" fill="#28547a"/>'
    : kind === "token" ? '<path d="M14 12l18-7 18 7v42l-18 6-18-6z" fill="#533126" stroke="#e1b470" stroke-width="2"/><path d="M18 16l14-5 14 5v33l-14 5-14-5z" fill="#bc8c44" stroke="#f4d799"/><path d="M23 25h18m-9-8v28m-11-8l11-12 11 12m-22 8h22" fill="none" stroke="#4b2c1d" stroke-width="3"/><circle cx="32" cy="10" r="2" fill="#fff0b9"/>'
    : kind === "chest" ? '<path d="M8 26Q8 9 32 9t24 17v27H8z" fill="#7b4228" stroke="#d4a455" stroke-width="2"/><path d="M8 28h48M18 14v39m28-39v39" stroke="#ecc87a" stroke-width="5"/><path d="M25 25h14v15H25z" fill="#e1b765" stroke="#ffe8a8"/><circle cx="32" cy="32" r="3" fill="#40281e"/>'
    : '<g fill="#b9c9d1" stroke="#536674" stroke-width="2"><ellipse cx="21" cy="43" rx="16" ry="8"/><ellipse cx="43" cy="35" rx="16" ry="8"/><ellipse cx="26" cy="26" rx="17" ry="9"/></g><g fill="none" stroke="#effbff" stroke-width="2"><ellipse cx="26" cy="25" rx="13" ry="6"/><path d="M19 23h14v5H19zM30 37l12-4M9 44l12 3"/></g>';
  return `<svg class="resource-art resource-${kind}" data-item-art="${kind}" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
}
const resourceImages = new Map<ResourceArt, HTMLImageElement>();
export function drawResource(c: CanvasRenderingContext2D, kind: ResourceArt, x: number, y: number, size: number): boolean {
  if (kind === "hp" || kind === "mp") return drawPaintedItem(c, kind, x - size / 2, y - size / 2, size);
  let image = resourceImages.get(kind);
  if (!image) {
    image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(resourceMarkup(kind).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}`;
    resourceImages.set(kind, image);
  }
  if (!image.complete || !image.naturalWidth) return false;
  c.drawImage(image, x - size / 2, y - size / 2, size, size);
  return true;
}
