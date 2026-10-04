export const HEALTH_COLORS = { hostile: "#ef5360", ally: "#66db9c", neutral: "#dfbd78", self: "#66db9c" } as const;
export type HealthRelation = keyof typeof HEALTH_COLORS;
// Aggression always takes precedence over party membership.
export function playerHealthRelation(hostile = false, teammate = false, self = false): HealthRelation {
  return hostile ? "hostile" : self ? "self" : teammate ? "ally" : "neutral";
}
