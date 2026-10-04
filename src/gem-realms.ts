import { RARITIES } from "./rarity.ts";
import {
  GEM_KINDS,
  GEM_LEVEL_CAP,
  GEM_COUNT_CAP,
  gemKey,
  type GemBag,
  type GemSpec,
} from "./gems.ts";
import { MONSTERS, faunaOf } from "./bestiary.ts";
import { ELEMENTS } from "./idle.ts";
import type { DungeonDefinition } from "./progression.ts";
export const GEM_REALM_IDS = [
  "gem-jade",
  "gem-stream",
  "gem-cave",
  "gem-flame",
  "gem-ancient",
  "gem-celestial",
  "gem-divine",
] as const;
export type GemRealmId = (typeof GEM_REALM_IDS)[number];
export type GemRealmDefinition = Omit<DungeonDefinition, "id"> & {
  id: GemRealmId;
  gemLevels: readonly [number, number];
  gemCount: number;
  qualityTier: number;
};
const NAMES = [
  "Ngọc Lâm",
  "Bích Thủy Khoáng",
  "Tử Tinh Động",
  "Hỏa Linh Mạch",
  "Hoàng Kim Di Tích",
  "Thiên Ngoại Tinh Hà",
  "Thần Ngọc Thiên Cung",
];
const LEVELS = [10, 25, 45, 65, 90, 120, 150];
const REGIONS = [0, 3, 2, 6, 12, 14, 15];
const GEM_LEVELS: readonly (readonly [number, number])[] = [
  [1, 2],
  [2, 3],
  [3, 5],
  [4, 6],
  [5, 7],
  [7, 9],
  [9, 10],
];
export const GEM_REALMS = Object.fromEntries(
  GEM_REALM_IDS.map((id, tier) => {
    const level = LEVELS[tier],
      fauna = faunaOf(REGIONS[tier]),
      waveCount = 2 + Math.floor(tier / 2);
    const waves = Array.from({ length: waveCount }, (_, wave) => {
      const last = wave === waveCount - 1;
      return Array.from({ length: 3 + tier + (last ? 1 : 0) }, (_, i) => {
        const boss = last && i === 0,
          species = boss
            ? fauna.boss
            : fauna.species[(i + wave) % fauna.species.length];
        return {
          id: `${id}-${wave}-${i}`,
          name: boss
            ? `Thủ Hộ ${NAMES[tier]}`
            : `${MONSTERS[species].name} · Khoáng linh`,
          kind: boss
            ? ("boss" as const)
            : i === 0
              ? ("elite" as const)
              : ("normal" as const),
          x: 650 + (i % 4) * 200,
          y: 510 + Math.floor(i / 4) * 145,
          level: Math.min(160, level + wave),
          color: ELEMENTS[MONSTERS[species].element].color,
          species,
        };
      });
    });
    return [
      id,
      {
        id,
        name: NAMES[tier],
        shortName: `NGỌC ${tier + 1}`,
        minLevel: level,
        region: REGIONS[tier],
        tier: 2 + tier,
        timeLimit: 300 + tier * 30,
        description: `Ngọc cấp ${GEM_LEVELS[tier].join("–")} · Phẩm chất cao nhất ${RARITIES[tier]}.`,
        mechanic:
          "Dọn khoáng linh và hạ thủ hộ. Chỉ nhận ngọc khi hoàn thành và nhận thưởng; có thể cày lại.",
        waves,
        gemLevels: GEM_LEVELS[tier],
        gemCount: 3 + tier * 2,
        qualityTier: tier,
        reward: {
          xp: 1000 + level * 100,
          gold: 1200 + level * 120,
          stones: 5 + tier * 3,
          tokens: 2 + tier,
          itemCount: 1 + Math.floor(tier / 3),
          itemLevel: Math.min(160, level + 3),
          rarity: RARITIES[tier],
        },
      } satisfies GemRealmDefinition,
    ];
  }),
) as unknown as Record<GemRealmId, GemRealmDefinition>;
export function isGemRealm(id: unknown): id is GemRealmId {
  return typeof id === "string" && Object.hasOwn(GEM_REALMS, id);
}
export function gemRealmReward(
  id: GemRealmId,
  random = Math.random,
): GemSpec[] {
  const d = GEM_REALMS[id],
    bounded = () => Math.max(0, Math.min(0.999999999, random()));
  return Array.from({ length: d.gemCount }, (_, i) => ({
    kind: GEM_KINDS[Math.floor(bounded() * GEM_KINDS.length)],
    level: Math.min(
      GEM_LEVEL_CAP,
      d.gemLevels[0] +
        Math.floor(bounded() * (d.gemLevels[1] - d.gemLevels[0] + 1)),
    ),
    // At least one gem of the map's best quality, and a mixed pool for the rest.
    quality:
      RARITIES[
        i === 0
          ? d.qualityTier
          : Math.max(
              0,
              d.qualityTier - (bounded() < 0.25 ? 2 : bounded() < 0.6 ? 1 : 0),
            )
      ],
  }));
}

// Reserve enough room for any legal roll before entering, so a cleared realm
// cannot leave its player stuck with an unclaimable reward at a stack limit.
export function canStoreGemReward(bag: GemBag, id: GemRealmId): boolean {
  const d = GEM_REALMS[id];
  for (const kind of GEM_KINDS)
    for (let level = d.gemLevels[0]; level <= d.gemLevels[1]; level++)
      for (const quality of RARITIES.slice(0, d.qualityTier + 1)) {
        if (
          (bag[gemKey({ kind, level, quality })] ?? 0) + d.gemCount >
          GEM_COUNT_CAP
        )
          return false;
      }
  return true;
}
