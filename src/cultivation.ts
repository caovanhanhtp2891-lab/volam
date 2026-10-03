export const REALMS = [
  { name: "Luyện Thể", minPower: 0, color: "#9bdd98", accent: "#e0ffd7" },
  { name: "Luyện Khí", minPower: 250, color: "#62dedb", accent: "#d8fffa" },
  { name: "Trúc Cơ", minPower: 650, color: "#61eba8", accent: "#e5ffc4" },
  { name: "Kim Đan", minPower: 1200, color: "#ffcf58", accent: "#fff4bd" },
  { name: "Nguyên Anh", minPower: 2000, color: "#ffab78", accent: "#fff0d1" },
  { name: "Hóa Thần", minPower: 3000, color: "#67cfff", accent: "#d7f4ff" },
  { name: "Luyện Hư", minPower: 4200, color: "#b9a1ff", accent: "#ece4ff" },
  { name: "Hợp Thể", minPower: 5600, color: "#52eed1", accent: "#d7fff4" },
  { name: "Đại Thừa", minPower: 7200, color: "#f197e8", accent: "#ffe3f8" },
  { name: "Độ Kiếp", minPower: 9000, color: "#a78aff", accent: "#e0f7ff" },
  { name: "Chân Tiên", minPower: 11000, color: "#8fdcff", accent: "#f0fdff" },
  { name: "Thiên Tiên", minPower: 13000, color: "#82f3e7", accent: "#fff4ca" },
  { name: "Huyền Tiên", minPower: 15000, color: "#ae96ff", accent: "#f4e2ff" },
  { name: "Kim Tiên", minPower: 17000, color: "#ffd66c", accent: "#fff8df" },
  {
    name: "Thái Ất Kim Tiên",
    minPower: 19000,
    color: "#ffc381",
    accent: "#fff0a3",
  },
  {
    name: "Đại La Kim Tiên",
    minPower: 21500,
    color: "#ffdf8f",
    accent: "#ffb9df",
  },
  { name: "Tiên Vương", minPower: 24000, color: "#ca9aff", accent: "#ffdf92" },
  { name: "Tiên Đế", minPower: 27000, color: "#ffd277", accent: "#ffa9cb" },
  { name: "Đạo Tổ", minPower: 30000, color: "#fff2bb", accent: "#85eaff" },
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
  Number.isFinite(value) ? Math.max(0, value) : 0;
export function combatPower(
  attack: number,
  defense: number,
  maxHp: number,
): number {
  return Math.floor(
    positive(attack) * 3 + positive(defense) * 2 + positive(maxHp) * 0.15,
  );
}

// Derived from current strength: existing saves need no new persisted fields.
export function cultivationForPower(value: number): Cultivation {
  const power = Math.floor(positive(value));
  let rank = 0;
  for (let i = 1; i < REALMS.length; i++) {
    if (power < REALMS[i].minPower) break;
    rank = i;
  }
  const realm = REALMS[rank],
    next = REALMS[rank + 1];
  const span = next
    ? next.minPower - realm.minPower
    : 2000; // The final five phases fit within the current level-160 gear budget.
  const phaseCount = rank < 2 ? 9 : REALM_PHASES.length;
  const phasePower = (index: number) =>
    realm.minPower + Math.ceil((span * index) / phaseCount);
  let phaseIndex = 0;
  for (let i = 1; i < phaseCount; i++) {
    if (power < phasePower(i)) break;
    phaseIndex = i;
  }
  const phase = rank < 2 ? `Tầng ${phaseIndex + 1}` : REALM_PHASES[phaseIndex];
  const nextPower =
    phaseIndex < phaseCount - 1
      ? phasePower(phaseIndex + 1)
      : (next?.minPower ?? null);
  const nextLabel =
    phaseIndex < phaseCount - 1
      ? `${realm.name} · ${rank < 2 ? `Tầng ${phaseIndex + 2}` : REALM_PHASES[phaseIndex + 1]}`
      : next
        ? `${next.name} · ${rank + 1 < 2 ? "Tầng 1" : REALM_PHASES[0]}`
        : null;
  return {
    realm,
    rank,
    power,
    phase,
    phaseIndex,
    label: `${realm.name} · ${phase}`,
    progress:
      nextPower === null
        ? 1
        : (power - phasePower(phaseIndex)) /
          (nextPower - phasePower(phaseIndex)),
    nextPower,
    nextLabel,
  };
}
