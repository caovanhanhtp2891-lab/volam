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
  return Math.max(
    0,
    ["Thường", "Tốt", "Hiếm", "Cực phẩm"].indexOf(rarity ?? "Thường"),
  );
}
export function equipmentMarkup(
  slot: string,
  color: string,
  rarity?: string,
  extraClass = "",
): string {
  const key = Object.hasOwn(EQUIPMENT_SHAPES, slot) ? (slot as Slot) : "weapon";
  const safeColor = /^#[a-fA-F0-9]{6}$/.test(color) ? color : "#c9d5df";
  const tier = equipmentTier(rarity);
  return `<svg class="gear-art tier-${tier} ${extraClass}" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="--gear-color:${safeColor}"><circle class="gear-halo" cx="32" cy="32" r="26" fill="${safeColor}" opacity=".14"/><path d="${EQUIPMENT_SHAPES[key]}" fill="${safeColor}" fill-rule="evenodd" stroke="#121e2c" stroke-width="3" stroke-linejoin="round"/><path d="${EQUIPMENT_SHAPES[key]}" fill="none" stroke="#eff9ff" stroke-width="1" opacity=".65"/><path d="${GEMS[key]}" fill="${tier >= 2 ? "#ffd96e" : "#8bf0ff"}" stroke="#193644" stroke-width="1.5"/><path d="M10 12v8m-4-4h8M51 44v10m-5-5h10" fill="none" stroke="#fff7c4" stroke-width="2" class="gear-sparkle" opacity="${tier >= 2 ? 1 : 0.25}"/></svg>`;
}
const paths = new Map<string, Path2D>();
export function drawEquipmentIcon(
  ctx: CanvasRenderingContext2D,
  slot: string,
  color: string,
  size = 40,
): void {
  const key = Object.hasOwn(EQUIPMENT_SHAPES, slot) ? (slot as Slot) : "weapon";
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
  ctx.fill(path(EQUIPMENT_SHAPES[key]), "evenodd");
  ctx.stroke(path(EQUIPMENT_SHAPES[key]));
  ctx.strokeStyle = "#eaffff";
  ctx.lineWidth = 1;
  ctx.stroke(path(EQUIPMENT_SHAPES[key]));
  ctx.fillStyle = "#ffe484";
  ctx.fill(path(GEMS[key]));
  ctx.restore();
}
