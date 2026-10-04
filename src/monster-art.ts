import { MONSTERS, monsterFrame, type SpeciesId } from "./bestiary";
import { actionProgress, type ActorMotion } from "./combat";
export const MONSTER_ATLAS_URL = new URL(
  "./assets/monsters.webp",
  import.meta.url,
).href;
const atlas = new Image();
atlas.decoding = "async";
atlas.src = MONSTER_ATLAS_URL;
export function monsterSize(id: SpeciesId, elite = false) {
  const boss = MONSTERS[id].boss;
  return {
    width: boss ? 128 : elite ? 88 : 72,
    height: boss ? 144 : elite ? 102 : 84,
  };
}
export function monsterMarkup(id: SpeciesId): string {
  const i = MONSTERS[id].frame;
  return `<i class="monster-art" data-species="${id}" aria-hidden="true" style="background-image:url('${MONSTER_ATLAS_URL}');background-size:800% 400%;background-position:${((i % 8) / 7) * 100}% ${(Math.floor(i / 8) / 3) * 100}%"></i>`;
}
export function drawMonster(
  c: CanvasRenderingContext2D,
  id: SpeciesId,
  motion: ActorMotion,
  now: number,
  elite = false,
): boolean {
  if (!atlas.complete || !atlas.naturalWidth) return false;
  const frame = monsterFrame(id, atlas.naturalWidth, atlas.naturalHeight),
    size = monsterSize(id, elite),
    def = MONSTERS[id];
  const step = Math.sin(motion.stride) * motion.moving,
    attack =
      motion.action !== "idle"
        ? Math.sin(actionProgress(motion, now) * Math.PI)
        : 0;
  c.save();
  if (motion.facingX > 0) c.scale(-1, 1);
  c.translate(
    -attack * 5,
    -Math.abs(step) * 2 -
      (def.behavior === "ranged" && id !== "archer"
        ? Math.sin(now / 400) * 2
        : 0),
  );
  c.rotate(step * 0.018 - attack * 0.055);
  if (now < motion.hurtUntil) c.globalAlpha *= 0.72;
  c.drawImage(
    atlas,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    -size.width / 2,
    -size.height + 12,
    size.width,
    size.height,
  );
  c.restore();
  return true;
}
