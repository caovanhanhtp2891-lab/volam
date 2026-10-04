import { COMPANIONS, companionFrame, type CompanionId } from "./companions.ts";
import { actionProgress, type ActorMotion } from "./combat.ts";
export const COMPANION_ATLAS_URL = new URL(
  "./assets/companions.webp",
  import.meta.url,
).href;
const atlas = new Image();
atlas.decoding = "async";
atlas.src = COMPANION_ATLAS_URL;
export function companionMarkup(id: CompanionId, extra = ""): string {
  const i = COMPANIONS[id].frame;
  return `<i class="companion-art ${extra}" data-companion-art="${id}" aria-hidden="true" style="background-image:url('${COMPANION_ATLAS_URL}');background-size:500% 200%;background-position:${((i % 5) / 4) * 100}% ${Math.floor(i / 5) * 100}%"></i>`;
}
export function drawCompanion(
  c: CanvasRenderingContext2D,
  id: CompanionId,
  motion: ActorMotion,
  now: number,
  boss = false,
): void {
  const frame = companionFrame(id, atlas.naturalWidth, atlas.naturalHeight),
    size = boss ? 116 : 94;
  c.save();
  if (motion.facingX > 0) c.scale(-1, 1);
  const attack =
      motion.action !== "idle"
        ? Math.sin(actionProgress(motion, now) * Math.PI)
        : 0,
    step = Math.sin(motion.stride) * motion.moving;
  c.translate(-attack * 5, -Math.abs(step) * 2);
  c.rotate(step * 0.015 - attack * 0.03);
  if (atlas.complete && atlas.naturalWidth)
    c.drawImage(
      atlas,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -size / 2,
      -size + 9,
      size,
      size,
    );
  else {
    c.fillStyle = COMPANIONS[id].color;
    c.beginPath();
    c.ellipse(0, -32, 13, 30, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
