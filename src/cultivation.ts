export const REALMS = [
  { name: "Phàm Nhân", minPower: 0, color: "#c6b897", accent: "#e3d8bc" },
  { name: "Luyện Thể", minPower: 100_000, color: "#9bdd98", accent: "#e0ffd7" },
  { name: "Luyện Khí", minPower: 1_000_000, color: "#62dedb", accent: "#d8fffa" },
  { name: "Trúc Cơ", minPower: 3_000_000, color: "#61eba8", accent: "#e5ffc4" },
  { name: "Kim Đan", minPower: 8_000_000, color: "#ffcf58", accent: "#fff4bd" },
  { name: "Nguyên Anh", minPower: 20_000_000, color: "#ffab78", accent: "#fff0d1" },
  { name: "Hóa Thần", minPower: 50_000_000, color: "#67cfff", accent: "#d7f4ff" },
  { name: "Luyện Hư", minPower: 100_000_000, color: "#b9a1ff", accent: "#ece4ff" },
  { name: "Hợp Thể", minPower: 200_000_000, color: "#52eed1", accent: "#d7fff4" },
  { name: "Đại Thừa", minPower: 400_000_000, color: "#f197e8", accent: "#ffe3f8" },
  { name: "Độ Kiếp", minPower: 700_000_000, color: "#a78aff", accent: "#e0f7ff" },
  { name: "Chân Tiên", minPower: 1_000_000_000, color: "#8fdcff", accent: "#f0fdff" },
  { name: "Thiên Tiên", minPower: 1_500_000_000, color: "#82f3e7", accent: "#fff4ca" },
  { name: "Huyền Tiên", minPower: 2_200_000_000, color: "#ae96ff", accent: "#f4e2ff" },
  { name: "Kim Tiên", minPower: 3_000_000_000, color: "#ffd66c", accent: "#fff8df" },
  {
    name: "Thái Ất Kim Tiên",
    minPower: 4_200_000_000,
    color: "#ffc381",
    accent: "#fff0a3",
  },
  {
    name: "Đại La Kim Tiên",
    minPower: 5_600_000_000,
    color: "#ffdf8f",
    accent: "#ffb9df",
  },
  { name: "Tiên Vương", minPower: 7_200_000_000, color: "#ca9aff", accent: "#ffdf92" },
  { name: "Tiên Đế", minPower: 8_800_000_000, color: "#ffd277", accent: "#ffa9cb" },
  { name: "Đạo Tổ", minPower: 10_000_000_000, color: "#fff2bb", accent: "#85eaff" },
  { name: "Hỗn Nguyên", minPower: 100_000_000_000, color: "#9ff4e6", accent: "#f9d6ff" },
  { name: "Hồng Mông", minPower: 1_000_000_000_000, color: "#e7abff", accent: "#fff2bc" },
  { name: "Vô Cực", minPower: 10_000_000_000_000, color: "#ffffff", accent: "#9fdcff" },
] as const;

export const REALM_PHASES = [
  "Sơ kỳ",
  "Trung kỳ",
  "Hậu kỳ",
  "Đỉnh phong",
  "Đại viên mãn",
] as const;
export type RealmDefinition = (typeof REALMS)[number];
export interface Cultivation {
  realm: RealmDefinition;
  rank: number;
  power: number;
  phase: string;
  phaseIndex: number;
  label: string;
  progress: number;
  nextPower: number | null;
  nextLabel: string | null;
}

const positive = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER / 100, value)) : 0;
export function strengthScore(attack: number, defense: number, maxHp: number, extra = 0): number {
  return positive(attack) * 3 + positive(defense) * 2 + positive(maxHp) * .15 + positive(extra);
}
export function powerFromScore(score: number): number {
  const safe = positive(score);
  if (safe >= Math.cbrt(Number.MAX_SAFE_INTEGER * 1000)) return Number.MAX_SAFE_INTEGER;
  return Math.floor(safe ** 3 / 1000);
}
export function combatPower(
  attack: number,
  defense: number,
  maxHp: number,
  extra = 0,
): number {
  return powerFromScore(strengthScore(attack, defense, maxHp, extra));
}

// Derived from current strength: existing saves need no new persisted fields.
export function cultivationForPower(value: number): Cultivation {
  const power = Number.isFinite(value) ? Math.floor(Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, value))) : 0;
  let rank = 0;
  for (let i = 1; i < REALMS.length; i++) {
    if (power < REALMS[i].minPower) break;
    rank = i;
  }
  const realm = REALMS[rank],
    next = REALMS[rank + 1];
  const span = next
    ? next.minPower - realm.minPower
    : realm.minPower;
  const layered = rank === 1 || rank === 2;
  const phaseCount = rank === 0 ? 1 : layered ? 9 : REALM_PHASES.length;
  const phasePower = (index: number) =>
    realm.minPower + Math.ceil((span * index) / phaseCount);
  let phaseIndex = 0;
  for (let i = 1; i < phaseCount; i++) {
    if (power < phasePower(i)) break;
    phaseIndex = i;
  }
  const phase = rank === 0 ? "Chưa nhập đạo" : layered ? `Tầng ${phaseIndex + 1}` : REALM_PHASES[phaseIndex];
  const nextPower =
    phaseIndex < phaseCount - 1
      ? phasePower(phaseIndex + 1)
      : (next?.minPower ?? null);
  const nextLabel =
    phaseIndex < phaseCount - 1
      ? `${realm.name} · ${layered ? `Tầng ${phaseIndex + 2}` : REALM_PHASES[phaseIndex + 1]}`
      : next
        ? `${next.name} · ${rank + 1 <= 2 ? "Tầng 1" : REALM_PHASES[0]}`
        : null;
  return {
    realm,
    rank,
    power,
    phase,
    phaseIndex,
    label: rank === 0 ? realm.name : `${realm.name} · ${phase}`,
    progress:
      nextPower === null
        ? 1
        : (power - phasePower(phaseIndex)) /
          (nextPower - phasePower(phaseIndex)),
    nextPower,
    nextLabel,
  };
}
