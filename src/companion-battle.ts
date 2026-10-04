import { freshMotion, updateMotion, type ActorMotion } from "./combat.ts";
import type { CompanionId } from "./companions.ts";
import { scaledOutgoingDamage } from "./combat-scale.ts";
import { elementalMultiplier, type Element } from "./idle.ts";

export function companionStrike(
  raw: number,
  ownerAttack: number,
  defense: number,
  level: number,
  element: Element,
  targetElement?: Element,
) {
  return {
    damage: scaledOutgoingDamage(
      raw * (targetElement ? elementalMultiplier(element, targetElement) : 1),
      defense,
      level,
      false,
      {},
    ),
    // Existing status ticks store a multiplier of the owner's attack, never
    // a combat HP amount. Preserve the companion's own power at that boundary.
    statusMultiplier: raw / Math.max(1, ownerAttack),
  };
}
export interface CompanionActor {
  id: CompanionId;
  x: number;
  y: number;
  context: string;
  motion: ActorMotion;
  attackReadyAt: number;
  healReadyAt: number;
  hit?: {
    targetId: string;
    from: { x: number; y: number };
    startedAt: number;
    duration: number;
    damage: number;
    level: number;
  };
}
export function createCompanionActor(
  id: CompanionId,
  point: { x: number; y: number },
  context: string,
  now: number,
): CompanionActor {
  return {
    id,
    x: point.x - 70,
    y: point.y + 20,
    context,
    motion: freshMotion(),
    attackReadyAt: now + 500,
    healReadyAt: now + 1500,
  };
}
export function moveCompanion(
  actor: CompanionActor,
  goal: { x: number; y: number },
  dt: number,
  now: number,
  blocked: (x: number, y: number) => boolean,
  bounds: { width: number; height: number },
  speed: number,
): void {
  const before = { x: actor.x, y: actor.y },
    d = Math.hypot(goal.x - actor.x, goal.y - actor.y);
  if (d > 8) {
    const travel = Math.min(d - 8, speed * Math.min(0.1, Math.max(0, dt))),
      x = Math.max(
        30,
        Math.min(
          bounds.width - 30,
          actor.x + ((goal.x - actor.x) / d) * travel,
        ),
      ),
      y = Math.max(
        30,
        Math.min(
          bounds.height - 30,
          actor.y + ((goal.y - actor.y) / d) * travel,
        ),
      );
    if (!blocked(x, actor.y)) actor.x = x;
    if (!blocked(actor.x, y)) actor.y = y;
  }
  updateMotion(actor.motion, before, actor, dt, now);
}
