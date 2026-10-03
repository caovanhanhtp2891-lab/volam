export interface Point {
  x: number;
  y: number;
}
export type MotionAction = "idle" | "attack" | "cast" | "dash";
export interface ActorMotion {
  stride: number;
  moving: number;
  facingX: number;
  facingY: number;
  action: MotionAction;
  actionAt: number;
  actionDuration: number;
  hurtUntil: number;
}
export function freshMotion(): ActorMotion {
  return {
    stride: 0,
    moving: 0,
    facingX: 1,
    facingY: 0,
    action: "idle",
    actionAt: 0,
    actionDuration: 0,
    hurtUntil: 0,
  };
}
export function updateMotion(
  motion: ActorMotion,
  before: Point,
  after: Point,
  dt: number,
  now: number,
): void {
  const dx = after.x - before.x,
    dy = after.y - before.y;
  const travelled = Math.hypot(dx, dy);
  const moving = travelled > 0.05;
  motion.moving += ((moving ? 1 : 0) - motion.moving) * Math.min(1, dt * 18);
  if (moving) {
    motion.stride = (motion.stride + travelled / 13) % (Math.PI * 2);
    motion.facingX = dx / travelled;
    motion.facingY = dy / travelled;
  }
  if (now >= motion.actionAt + motion.actionDuration) motion.action = "idle";
}
export function actionProgress(motion: ActorMotion, now: number): number {
  return motion.actionDuration > 0
    ? Math.max(0, Math.min(1, (now - motion.actionAt) / motion.actionDuration))
    : 1;
}
export function easedPoint(from: Point, to: Point, progress: number): Point {
  const t = Math.max(0, Math.min(1, progress));
  const eased = 1 - (1 - t) ** 3;
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
  };
}
// Travel time stays readable at close range and bounded for distant targets.
export function flightDuration(from: Point, to: Point, speed = 720): number {
  return Math.max(
    150,
    Math.min(
      650,
      (Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, speed)) * 1000,
    ),
  );
}
export function landingHeight(progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return (
    Math.sin(t * Math.PI) * 42 +
    Math.sin((Math.max(0, t - 0.72) / 0.28) * Math.PI) * 5
  );
}
export function withinReach(
  from: Point,
  to: Point,
  reach: number,
  radius = 0,
): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) <= reach + radius;
}
