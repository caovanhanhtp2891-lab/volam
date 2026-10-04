export interface EnemyStatus {
  dead?: boolean;
  slowUntil: number;
  stunUntil: number;
  poisonUntil: number;
  chilledUntil?: number;
  frozenUntil?: number;
}
export function enemyStatusVisual(enemy: EnemyStatus, now: number) {
  const alive = !enemy.dead;
  const frozen =
    alive && enemy.stunUntil > now && (enemy.frozenUntil ?? 0) > now;
  return {
    frozen,
    iceAlpha: frozen ? Math.min(1, ((enemy.frozenUntil ?? 0) - now) / 180) : 0,
    chilled:
      alive &&
      !frozen &&
      enemy.slowUntil > now &&
      (enemy.chilledUntil ?? 0) > now,
    poisoned: alive && enemy.poisonUntil > now,
    stunned: alive && enemy.stunUntil > now && !frozen,
  };
}
