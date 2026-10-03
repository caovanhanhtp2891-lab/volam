import type { SectId } from "./sects";
export type CharacterSex = "male" | "female";
export const CHARACTER_ATLAS_URL = new URL("./assets/sect-characters.webp", import.meta.url).href;
export const CHARACTER_ATLAS_SIZE = { width: 1223, height: 1286 } as const;
export const CHARACTER_SECTS: readonly SectId[] = ["thieu-lam", "thien-vuong", "duong-mon", "ngu-doc", "nga-mi", "thuy-yen", "cai-bang", "thien-nhan", "vo-dang", "con-lon"];
export function defaultCharacterSex(id: SectId): CharacterSex { return id === "nga-mi" || id === "thuy-yen" ? "female" : "male"; }
export function characterFrame(id: SectId, sex: CharacterSex = defaultCharacterSex(id)): readonly [number, number, number, number] {
  const index = CHARACTER_SECTS.indexOf(id) + (sex === "female" ? 10 : 0);
  return [index % 5 / 5, Math.floor(index / 5) / 4, .2, .25];
}
// The second row in each gender group starts below a short empty gutter.
// Mask that gutter so tall weapons/boots from the preceding row cannot bleed in.
export function characterTopInset(id: SectId, sex?: CharacterSex): number {
  const row = characterFrame(id, sex)[1];
  return row === .25 || row === .75 ? .045 : 0;
}
export function characterPortraitCrop(id: SectId, sex: CharacterSex): readonly [number, number, number, number] {
  const [x, y, w, h] = characterFrame(id, sex);
  const focusX = id === "cai-bang" ? .60 : id === "duong-mon" || id === "con-lon" ? .52 : .56;
  return [(x + w * (focusX - .21)) * CHARACTER_ATLAS_SIZE.width, (y + h * .045) * CHARACTER_ATLAS_SIZE.height,
    w * .42 * CHARACTER_ATLAS_SIZE.width, h * .32 * CHARACTER_ATLAS_SIZE.height];
}
export const characterArtKey = (id: SectId, sex: CharacterSex) => `${id}-${sex}`;
