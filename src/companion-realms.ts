import { COMPANIONS, COMPANION_IDS, type CompanionId } from "./companions.ts";
import { ELEMENTS } from "./idle.ts";
import { MONSTERS, faunaOf } from "./bestiary.ts";
import type { DungeonDefinition } from "./progression.ts";
export type BondDungeonId = `bond-${CompanionId}`;
type Spawn = DungeonDefinition["waves"][number][number] & {
  companionId?: CompanionId;
};
export type BondDungeonDefinition = Omit<DungeonDefinition, "id" | "waves"> & {
  id: BondDungeonId;
  companionId: CompanionId;
  waves: Spawn[][];
};
export const BOND_DUNGEONS = Object.fromEntries(
  COMPANION_IDS.map((id, tier) => {
    const def = COMPANIONS[id],
      fauna = faunaOf(def.region),
      dungeonId = `bond-${id}` as BondDungeonId,
      waveCount = tier < 3 ? 2 : tier < 6 ? 3 : 4;
    const waves: Spawn[][] = Array.from({ length: waveCount }, (_, wave) => {
      const last = wave === waveCount - 1,
        units: Spawn[] = [];
      if (last)
        units.push({
          id: `${dungeonId}-heroine`,
          name: def.name,
          kind: "boss",
          x: 1220,
          y: 660,
          level: Math.min(160, def.level + 2),
          color: def.color,
          companionId: id,
        });
      const count = last
        ? Math.min(3, 1 + Math.floor(tier / 4))
        : Math.min(7, 2 + Math.floor(tier / 2));
      for (let i = 0; i < count; i++) {
        const species = fauna.species[(wave + i) % 6];
        units.push({
          id: `${dungeonId}-${wave}-${i}`,
          name: `${MONSTERS[species].name} · Hộ vệ`,
          kind: i === 0 && wave > 0 && !last ? "elite" : "normal",
          x: 620 + (i % 3) * 210,
          y: 560 + Math.floor(i / 3) * 150,
          level: Math.min(160, def.level + wave),
          species,
          color: ELEMENTS[MONSTERS[species].element].color,
        });
      }
      return units;
    });
    return [
      dungeonId,
      {
        id: dungeonId,
        companionId: id,
        name: def.realmName,
        shortName: `KỲ DUYÊN ${tier + 1}`,
        minLevel: def.level,
        region: def.region,
        tier: 2 + tier,
        timeLimit: 240 + tier * 25,
        description: `Tầng ${tier + 1} · Thắng ${def.name} để thử thu phục làm Tri kỷ.`,
        mechanic: `Né ${def.skill}; dọn hộ vệ để tập trung đấu với ${def.name}.`,
        waves,
        reward: {
          xp: 800 + def.level * 120,
          gold: 1000 + def.level * 150,
          stones: 3 + tier * 2,
          tokens: 1 + tier,
          itemLevel: Math.min(160, def.level + 2),
          itemCount: 1 + Math.floor(tier / 4),
          rarity:
            tier >= 7
              ? "Thần Thoại"
              : tier >= 5
                ? "Truyền Thuyết"
                : tier >= 3
                  ? "Hoàng Kim"
                  : "Hiếm",
        },
      } satisfies BondDungeonDefinition,
    ];
  }),
) as Record<BondDungeonId, BondDungeonDefinition>;
export function isBondDungeon(id: unknown): id is BondDungeonId {
  return typeof id === "string" && Object.hasOwn(BOND_DUNGEONS, id);
}
