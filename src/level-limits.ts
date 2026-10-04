export const MAX_LEVEL = 200;
export const MAX_GEAR_GRADE = MAX_LEVEL / 10;
export const MAX_EXPERIENCE_BUFF = 1000;
export function validExperienceBuff(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= MAX_EXPERIENCE_BUFF
  );
}
export const normalizeExperienceBuff = (value: unknown): number =>
  validExperienceBuff(value) ? value : 1;
