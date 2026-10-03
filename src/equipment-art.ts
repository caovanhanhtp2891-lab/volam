import { rarityTier, type EquipmentData } from "./equipment.ts";
import { variantOf, GEAR_SETS, setForElement } from "./gear-catalog.ts";
export const EQUIPMENT_SHAPES = {
  weapon: "M17 50l5-10L43 9l6-4-1 8-24 30-5 9z M17 37l13 9-3 4-14-9z",
  armor: "M22 9l10 6 10-6 14 11-8 12-7-4 5 28H18l5-28-7 4L8 20z",
  helmet:
    "M12 32C12 8 52 8 52 32l-4 19-9 4V34H25v21l-9-4z M27 14l5-9 5 9v17H27z",
  boots: "M13 10h14v28l7 6v9H10V42l3-4z M36 10h14v28l7 6v9H34V42l2-4z",
  belt: "M7 25l13-5h24l13 5v16l-13 4H20L7 41z M24 23h16v20H24z",
  necklace:
    "M13 12c-2 18 4 25 19 27 15-2 21-9 19-27l-6 1c1 13-3 18-13 19-10-1-14-6-13-19z M32 33l10 10-10 14-10-14z",
  ring: "M13 36a19 19 0 1 0 38 0 19 19 0 1 0-38 0m8 0a11 11 0 1 1 22 0 11 11 0 1 1-22 0 M20 15l5-7h14l5 7-12 14z",
  ring2:
    "M15 38a17 17 0 1 0 34 0 17 17 0 1 0-34 0m7 0a10 10 0 1 1 20 0 10 10 0 1 1-20 0 M22 20l10-12 10 12-10 10z",
  bracelet: "M14 15l7-6h22l7 6-3 36-7 5H24l-7-5z M22 21h20l-2 25H24z",
  pendant: "M28 8h8v8l14 12-6 24-12 8-12-8-6-24 14-12z",
  horse:
    "M8 31l7-9h24l-2-12 7-6 5 12 9 10-3 9-9-3-4 9 3 15h-9l-3-14H21l-5 14H7l8-20z",
} as const;
export const VARIANT_SHAPES: Record<string, string> = {
  sword: EQUIPMENT_SHAPES.weapon,
  blade: "M13 49l9-12L35 9l20-4-8 21-22 17-8 10z M14 35l17 11-3 4-18-10z",
  spear: "M9 56l5 1L47 18l-5-5z M37 17L53 3l8 2-1 9-14 10z",
  staff:
    "M13 57l6 1L44 22l-5-5z M38 24L28 14l4-10 13-2 11 9-2 12-10 6z M34 13l9-5 7 6-7 9z",
  crossbow:
    "M26 13l11 2 1 34-12 9-6-6 9-10z M9 19l11-9 13 5 12-3 13 15-5 5-13-11-13 1-10-6-5 10z",
  fan: "M30 55l5-1 2-16L59 24 48 8 31 4 14 11 4 28l25 10z M31 37l1-29 M31 37L16 14 M33 36l14-24",
  plate: EQUIPMENT_SHAPES.armor,
  robe: "M22 6l10 8 10-8 15 15-10 10-5-6 10 34H12l10-34-5 6L7 21z M25 16l7 10 7-10 M20 40h24",
  mail: "M22 8l10 6 10-6 12 12-9 10-4-5 4 31H19l4-31-4 5L10 20z M24 23h16v25H24z",
  helm: EQUIPMENT_SHAPES.helmet,
  crown: "M8 19l13 9 11-21 11 21 13-9-5 27H13z M15 47h34v7H15z",
  hood: "M10 48V26C10 2 54 2 54 26v22l-12 9-1-29-9-9-9 9-1 29z",
  greaves: EQUIPMENT_SHAPES.boots,
  slippers: "M13 18h13v20l9 8-4 9H7V42l6-7z M38 18h13v20l9 8-4 9H32V42l6-7z",
  metalbelt: EQUIPMENT_SHAPES.belt,
  jadebelt: "M6 24l14-6h24l14 6v17l-14 6H20L6 41z M23 24l9-8 9 8v18l-9 9-9-9z",
  chain: EQUIPMENT_SHAPES.necklace,
  amulet:
    "M12 9c0 26 5 34 20 34s20-8 20-34l-5-1c0 21-4 28-15 28S17 29 17 8z M23 35h18l6 15-15 11-15-11z",
  rubyring: EQUIPMENT_SHAPES.ring,
  jadering:
    "M10 36a22 22 0 1 0 44 0 22 22 0 1 0-44 0m10 0a12 12 0 1 1 24 0 12 12 0 1 1-24 0 M23 12l9-6 9 6-9 12z",
  guards: EQUIPMENT_SHAPES.bracelet,
  beads:
    "M14 17a7 7 0 1 0 14 0 7 7 0 1 0-14 0 M34 17a7 7 0 1 0 14 0 7 7 0 1 0-14 0 M8 32a7 7 0 1 0 14 0 7 7 0 1 0-14 0 M42 32a7 7 0 1 0 14 0 7 7 0 1 0-14 0 M14 47a7 7 0 1 0 14 0 7 7 0 1 0-14 0 M34 47a7 7 0 1 0 14 0 7 7 0 1 0-14 0 M28 54h8v7h-8z",
  seal: EQUIPMENT_SHAPES.pendant,
  talisman:
    "M19 6h26v44l-13 12-13-12z M26 13h12v8H26z M26 26l12 10-12 9 M32 47v9",
  bay: EQUIPMENT_SHAPES.horse,
  white: EQUIPMENT_SHAPES.horse,
  warhorse:
    EQUIPMENT_SHAPES.horse + " M18 21l9-8 14 7-3 17H21z M37 10l7-8 9 19-10 2z",
  ember:
    EQUIPMENT_SHAPES.horse + " M3 28l4-13 5 4 6-12 4 14z M48 10l4-7 5 13-3 8z",
};
type Slot = keyof typeof EQUIPMENT_SHAPES;
const GEMS: Record<Slot, string> = {
  weapon: "M22 37l4-4 5 4-4 4z",
  armor: "M32 23l7 7-7 9-7-9z",
  helmet: "M32 20l5 6-5 6-5-6z",
  boots: "M17 20h6v8h-6z M40 20h6v8h-6z",
  belt: "M32 26l6 7-6 7-6-7z",
  necklace: "M32 39l6 6-6 8-6-8z",
  ring: "M25 15l7-4 7 4-7 9z",
  ring2: "M26 20l6-8 6 8-6 5z",
  bracelet: "M32 26l7 9-7 9-7-9z",
  pendant: "M32 22l9 12-9 16-9-16z",
  horse: "M25 24h10v12H25z",
};
export function equipmentTier(rarity?: string): number {
  return rarityTier(rarity);
}
export function equipmentMarkup(
  slot: string,
  color: string,
  rarity?: string,
  extraClass = "",
  item?: Partial<EquipmentData>,
): string {
  const key = Object.hasOwn(EQUIPMENT_SHAPES, slot) ? (slot as Slot) : "weapon";
  const safeColor = /^#[a-fA-F0-9]{6}$/.test(color) ? color : "#c9d5df";
  const tier = equipmentTier(rarity),
    variant = variantOf({ slot, variant: item?.variant });
  const shape = VARIANT_SHAPES[variant] ?? EQUIPMENT_SHAPES[key];
  const grade = Math.max(1, Math.min(16, Math.ceil((item?.level ?? 1) / 10)));
  const enhance = Math.max(0, Math.min(10, item?.enhance ?? 0));
  const element = item?.element
    ? GEAR_SETS[setForElement(item.element)]
    : undefined;
  const trim = grade >= 13 ? "#fff3cc" : grade >= 9 ? "#f4d482" : "#a3bcc7";
  const decoration =
    grade >= 5
      ? `<path d="M5 20L5 5h15M44 5h15v15M5 44v15h15M44 59h15V44" fill="none" stroke="${trim}" stroke-width="${grade >= 9 ? 2 : 1}"/>${grade >= 13 ? '<path d="M7 5l5 7-7-5M52 5l-5 7 7-5M7 59l5-7-7 5M52 59l-5-7 7 5" stroke="#ffdd89" fill="none"/>' : ""}`
      : "";
  const badge = element
    ? `<g class="gear-element" transform="translate(-42 42)"><circle cx="53" cy="11" r="9" fill="#101c24" stroke="${element.color}"/><text x="53" y="14.5" fill="${element.color}" font-size="10" text-anchor="middle">${element.glyph}</text></g>`
    : "";
  return `<svg class="gear-art tier-${tier} grade-${Math.ceil(grade / 4)} enhanced-${enhance >= 7 ? 2 : enhance >= 3 ? 1 : 0} ${extraClass}" data-variant="${variant}" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="--gear-color:${safeColor}">${tier === 4 ? '<path d="M32 2l8 6 15 1 6 13-3 20-12 14-14 6-14-6L6 42 3 22 9 9l15-1z" fill="none" stroke="#ffd35a" stroke-width="2"/><path d="M32 3l2 4-2 4-2-4z" fill="#fff4bc"/>' : ""}${decoration}<circle class="gear-halo" cx="32" cy="32" r="26" fill="${safeColor}" opacity=".14"/><path d="${shape}" fill="${safeColor}" fill-rule="evenodd" stroke="#121e2c" stroke-width="3" stroke-linejoin="round"/><path d="${shape}" fill="none" stroke="#eff9ff" stroke-width="1" opacity=".65"/><path d="${GEMS[key]}" fill="${tier >= 2 ? "#ffd96e" : "#8bf0ff"}" stroke="#193644" stroke-width="1.5"/><path d="M10 12v8m-4-4h8M51 44v10m-5-5h10" fill="none" stroke="#fff7c4" stroke-width="2" class="gear-sparkle" opacity="${tier >= 2 ? 1 : 0.25}"/>${enhance >= 3 ? `<path class="gear-enchant" d="M12 51L52 11M16 53L54 15" fill="none" stroke="${enhance >= 7 ? "#fff4a0" : safeColor}" stroke-width="1.5"/>` : ""}${badge}</svg>`;
}
const paths = new Map<string, Path2D>();
export function drawEquipmentIcon(
  ctx: CanvasRenderingContext2D,
  slot: string,
  color: string,
  size = 40,
  item?: Partial<EquipmentData>,
): void {
  const key = Object.hasOwn(EQUIPMENT_SHAPES, slot) ? (slot as Slot) : "weapon";
  const shape =
    VARIANT_SHAPES[variantOf({ slot, variant: item?.variant })] ??
    EQUIPMENT_SHAPES[key];
  const path = (data: string) => {
    if (!paths.has(data)) paths.set(data, new Path2D(data));
    return paths.get(data)!;
  };
  ctx.save();
  ctx.scale(size / 64, size / 64);
  ctx.translate(-32, -32);
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#182b3d";
  ctx.fillStyle = color;
  ctx.fill(path(shape), "evenodd");
  ctx.stroke(path(shape));
  ctx.strokeStyle = "#eaffff";
  ctx.lineWidth = 1;
  ctx.stroke(path(shape));
  ctx.fillStyle = "#ffe484";
  ctx.fill(path(GEMS[key]));
  if (item?.element) {
    const set = GEAR_SETS[setForElement(item.element)];
    ctx.fillStyle = set.color;
    ctx.strokeStyle = "#122126";
    ctx.beginPath();
    ctx.arc(53, 11, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
