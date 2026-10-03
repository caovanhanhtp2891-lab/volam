import { paintedItemMarkup, paintedItemReady, drawPaintedItem } from "./item-art.ts";
import { rarityTier, type EquipmentData } from "./equipment.ts";
import {
  variantOf,
  GEAR_SETS,
  setForElement,
  type GearVariant,
} from "./gear-catalog.ts";
import {
  GEAR_DESIGNS,
  MATERIAL_PALETTES,
  type GearDesign,
} from "./equipment-design.ts";
import { SET_CREST_PATHS, drawSetCrest } from "./set-art.ts";
export const VARIANT_SHAPES = Object.fromEntries(
  Object.entries(GEAR_DESIGNS).map(([key, art]) => [key, art.shape]),
);
export const EQUIPMENT_SHAPES = {
  weapon: GEAR_DESIGNS.sword.shape,
  armor: GEAR_DESIGNS.plate.shape,
  helmet: GEAR_DESIGNS.helm.shape,
  boots: GEAR_DESIGNS.greaves.shape,
  belt: GEAR_DESIGNS.metalbelt.shape,
  necklace: GEAR_DESIGNS.chain.shape,
  ring: GEAR_DESIGNS.rubyring.shape,
  ring2: GEAR_DESIGNS.jadering.shape,
  bracelet: GEAR_DESIGNS.guards.shape,
  pendant: GEAR_DESIGNS.seal.shape,
  horse: GEAR_DESIGNS.bay.shape,
} as const;
export function equipmentTier(rarity?: string): number {
  return rarityTier(rarity);
}
const hex = (color: string) =>
  /^#[a-fA-F0-9]{6}$/.test(color) ? color : "#c9d5df";
function tint(color: string, amount: number): string {
  const n = parseInt(color.slice(1), 16);
  return `#${[16, 8, 0]
    .map((shift) => {
      const channel = (n >> shift) & 255;
      return Math.round(
        amount > 0
          ? channel + (255 - channel) * amount
          : channel * (1 + amount),
      )
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}
function palette(art: GearDesign): readonly string[] {
  return ["silk", "leather"].includes(art.material)
    ? [tint(art.enamel, 0.48), art.enamel, tint(art.enamel, -0.55)]
    : MATERIAL_PALETTES[art.material];
}
const gradeOf = (level = 1) => Math.max(1, Math.min(16, Math.ceil(level / 10)));
const enhanceOf = (value = 0) => Math.max(0, Math.min(10, value));
export function equipmentEffectLabel(rarity?: string, enhancement = 0): string {
  const tier = equipmentTier(rarity),
    enhance = enhanceOf(enhancement);
  const quality = [
    "Viền bạc mộc",
    "Viền lục ngọc",
    "Viền lam bạc",
    "Ấn văn tím",
    "Chạm vàng kim",
  ][tier];
  return `${quality}${enhance >= 10 ? " · +10 tinh tú xoay" : enhance >= 7 ? " · +7 linh khí xoay" : enhance >= 3 ? " · +3 khắc sáng" : ""}`;
}
let svgSerial = 0;
export function equipmentMarkup(
  slot: string,
  color: string,
  rarity?: string,
  extraClass = "",
  item?: Partial<EquipmentData>,
): string {
  const variant = variantOf({ slot, variant: item?.variant }),
    art = GEAR_DESIGNS[variant];
  const safeColor = hex(color),
    tier = equipmentTier(rarity),
    grade = gradeOf(item?.level),
    enhance = enhanceOf(item?.enhance);
  const element = item?.setId && GEAR_SETS[item.setId] ? GEAR_SETS[item.setId] : item?.element
    ? GEAR_SETS[setForElement(item.element)]
    : undefined;
  const glow = element?.color ?? safeColor,
    jewel = element?.color ?? (tier >= 2 ? safeColor : "#72d5db");
  const elementGlyph = item?.element ? GEAR_SETS[setForElement(item.element)].glyph : "";
  const id = `gear-${(++svgSerial).toString(36)}`,
    [light, mid, dark] = palette(art);
  const trim = grade >= 13 ? "#fff3cc" : grade >= 9 ? "#f4d482" : "#a3bcc7";
  const corner = "M5 18V5h13M46 5h13v13M59 46v13H46M18 59H5V46";
  const ring =
    tier >= 3
      ? `<g class="gear-quality-detail" fill="${safeColor}" opacity=".7"><path d="M32 3l3 4-3 4-3-4z M32 53l3 4-3 4-3-4z M3 32l4-3 4 3-4 3z M53 32l4-3 4 3-4 3z"/></g>`
      : "";
  const crest =
    tier === 4
      ? `<path class="gear-quality-crest" d="M10 17L5 9l12 3L25 4l7 5 7-5 8 8 12-3-5 8M7 46l4 10 13 3M57 46l-4 10-13 3" fill="none" stroke="#ffdb75" stroke-width="2"/>`
      : "";
  const ornament =
    grade >= 5
      ? `<path d="${corner}" fill="none" stroke="${trim}" stroke-width="${grade >= 9 ? 1.8 : 1}"/>${grade >= 13 ? '<path d="M6 6l7 7M58 6l-7 7M6 58l7-7M58 58l-7-7" stroke="#ffe3a0"/>' : ""}`
      : "";
  const effects =
    enhance >= 3
      ? `<path class="gear-enchant" d="M12 6h40q6 0 6 6v40q0 6-6 6H12q-6 0-6-6V12q0-6 6-6z" fill="none" stroke="${glow}" stroke-width="1.8" stroke-dasharray="9 17" opacity=".8"/>${enhance >= 7 ? `<g class="gear-orbit" fill="${glow}" stroke="#fff6da" stroke-width=".6"><path d="M9 14l3 5-3 5-3-5z M55 40l3 5-3 5-3-5z"/>${enhance === 10 ? '<path d="M28 6l4-4 4 4-4 4z M28 58l4-4 4 4-4 4z"/>' : ""}</g>` : ""}`
      : "";
  const setBadge = item?.setId && GEAR_SETS[item.setId] ? `<g class="gear-set-crest" data-set-crest="${item.setId}" transform="translate(53 53)"><circle r="8" fill="#101c24" stroke="${glow}"/><path d="${SET_CREST_PATHS[GEAR_SETS[item.setId].crest]}" transform="scale(.44)" fill="none" stroke="${glow}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></g>` : "";
  return `<svg class="gear-art tier-${tier} grade-${Math.ceil(grade / 4)} enhanced-${enhance >= 7 ? 2 : enhance >= 3 ? 1 : 0} ${enhance === 10 ? "enhanced-max" : ""} ${extraClass}" data-variant="${variant}" data-material="${art.material}" data-enhancement="${enhance}" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="--gear-color:${safeColor};--gear-element:${glow}"><defs><linearGradient id="${id}-body" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${light}"/><stop offset=".3" stop-color="${mid}"/><stop offset=".48" stop-color="${light}"/><stop offset=".62" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="${id}-gold" x2=".6" y2="1"><stop stop-color="#fff2ba"/><stop offset=".45" stop-color="#d5aa5e"/><stop offset="1" stop-color="#724425"/></linearGradient><linearGradient id="${id}-enamel" x2=".3" y2="1"><stop stop-color="${tint(art.enamel, 0.35)}"/><stop offset="1" stop-color="${tint(art.enamel, -0.35)}"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="${glow}" stop-opacity=".45"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient><linearGradient id="${id}-gem" x2=".8" y2="1"><stop stop-color="#f2ffff"/><stop offset=".3" stop-color="${jewel}"/><stop offset="1" stop-color="${tint(jewel, -0.58)}"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="9" fill="#09111b"/>${enhance >= 7 ? `<circle class="gear-halo" cx="32" cy="32" r="29" fill="url(#${id}-glow)"/><g class="gear-awakening" fill="none" stroke="${glow}" stroke-width=".8" opacity=".7"><circle cx="32" cy="32" r="28"/>${enhance >= 10 ? `<circle cx="32" cy="32" r="24" stroke-dasharray="3 5"/><path d="M32 3l3 4-3 4-3-4zM32 53l3 4-3 4-3-4zM3 32l4-3 4 3-4 3zM53 32l4-3 4 3-4 3z"/>` : ""}</g>` : ""}<rect class="gear-quality-frame" x="3" y="3" width="58" height="58" rx="8" fill="none" stroke="${safeColor}" stroke-width="${tier >= 2 ? 1.5 : 0.8}" opacity="${tier ? 0.9 : 0.45}"/>${ring}${ornament}${crest}<g class="gear-illustration"><g class="gear-body" data-painted-gear="${variant}">${paintedItemMarkup(variant)}</g><path class="gear-engraving" d="${art.engraving}" fill="none" opacity="0"/>${effects}</g>${tier >= 2 ? '<path class="gear-sparkle" d="M12 9v8m-4-4h8M53 46v10m-5-5h10" fill="none" stroke="#fff7d0" stroke-width="1.4"/>' : ""}${element ? `<g class="gear-element"><circle cx="10" cy="53" r="8" fill="#101c24" stroke="${element.color}"/><text x="10" y="56.5" fill="${element.color}" font-size="10" text-anchor="middle">${elementGlyph}</text></g>` : ""}${setBadge}</svg>`;
}
const paths = new Map<string, Path2D>();
const icons = new Map<string, HTMLCanvasElement>();
function path(data: string): Path2D {
  if (!paths.has(data)) paths.set(data, new Path2D(data));
  return paths.get(data)!;
}
function gradient(
  ctx: CanvasRenderingContext2D,
  colors: readonly string[],
): CanvasGradient {
  const paint = ctx.createLinearGradient(8, 4, 55, 60);
  colors.forEach((color, i) =>
    paint.addColorStop(i / (colors.length - 1), color),
  );
  return paint;
}
function iconCanvas(
  slot: string,
  color: string,
  item?: Partial<EquipmentData>,
): HTMLCanvasElement {
  const variant = variantOf({ slot, variant: item?.variant }),
    art = GEAR_DESIGNS[variant],
    tier = equipmentTier(item?.rarity);
  const element = item?.setId && GEAR_SETS[item.setId] ? GEAR_SETS[item.setId] : item?.element
    ? GEAR_SETS[setForElement(item.element)]
    : undefined;
  const painted = paintedItemReady(variant);
  const cacheKey = `${variant}/${color}/${tier}/${item?.setId ?? element?.element ?? ""}/${painted}`;
  const found = icons.get(cacheKey);
  if (found) {
    icons.delete(cacheKey);
    icons.set(cacheKey, found);
    return found;
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  if (painted && drawPaintedItem(ctx, variant, 2, 2, 60)) {
    if (icons.size >= 160) icons.delete(icons.keys().next().value!);
    icons.set(cacheKey, canvas);
    return canvas;
  }
  const main = path(art.shape),
    [light, mid, dark] = palette(art);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.save();
  ctx.translate(1, 2);
  ctx.fillStyle = "#0008";
  ctx.fill(main, "evenodd");
  ctx.restore();
  ctx.fillStyle = gradient(ctx, [light, mid, light, dark]);
  ctx.strokeStyle = "#152331";
  ctx.lineWidth = 2;
  ctx.fill(main, "evenodd");
  ctx.stroke(main);
  ctx.fillStyle = gradient(
    ctx,
    ["silk", "leather"].includes(art.material)
      ? MATERIAL_PALETTES.gold
      : [tint(art.enamel, 0.35), art.enamel, tint(art.enamel, -0.4)],
  );
  ctx.strokeStyle = "#273342";
  ctx.lineWidth = 0.8;
  ctx.fill(path(art.accent), "evenodd");
  ctx.stroke(path(art.accent));
  ctx.strokeStyle = ["silk", "leather"].includes(art.material)
    ? "#f0d79e"
    : light;
  ctx.lineWidth = 1.1;
  ctx.stroke(path(art.engraving));
  ctx.strokeStyle = light;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 0.6;
  ctx.stroke(main);
  ctx.globalAlpha = 1;
  const jewel = element?.color ?? (tier >= 2 ? color : "#72d5db");
  ctx.fillStyle = gradient(ctx, ["#efffff", jewel, tint(jewel, -0.58)]);
  ctx.strokeStyle = "#e8d394";
  ctx.lineWidth = 0.9;
  ctx.fill(path(art.gem));
  ctx.stroke(path(art.gem));
  if (item?.setId && GEAR_SETS[item.setId]) {
    ctx.save(); ctx.translate(32, 32);
    drawSetCrest(ctx, GEAR_SETS[item.setId].crest, 6, element!.color);
    ctx.restore();
  }
  if (element) {
    ctx.fillStyle = element.color;
    ctx.strokeStyle = "#14212b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(10, 53, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (icons.size >= 160) icons.delete(icons.keys().next().value!);
  icons.set(cacheKey, canvas);
  return canvas;
}
export function drawEquipmentIcon(
  ctx: CanvasRenderingContext2D,
  slot: string,
  color: string,
  size = 40,
  item?: Partial<EquipmentData>,
): void {
  ctx.drawImage(
    iconCanvas(slot, hex(color), item),
    -size / 2,
    -size / 2,
    size,
    size,
  );
}
export function weaponCenter(
  variant: GearVariant,
  size: number,
): readonly [number, number] {
  const grips: Partial<Record<GearVariant, readonly [number, number]>> = {
    sword: [18, 46],
    blade: [16, 46],
    spear: [15, 48],
    staff: [17, 48],
    crossbow: [31, 45],
    fan: [32, 50],
    axe: [17, 48],
    halberd: [14, 49],
    daggers: [14, 38],
    bow: [28, 28],
    chakram: [32, 52],
    flute: [22, 43],
    whip: [18, 46],
    hammer: [17, 49],
    dragonstaff: [16, 49], firesaber: [15, 49], poisondarts: [16, 46],
    frostsword: [32, 53], thundersword: [32, 53], lotusfan: [32, 53],
  };
  const grip = grips[variant] ?? [32, 32];
  return [((32 - grip[0]) * size) / 64, ((32 - grip[1]) * size) / 64];
}
