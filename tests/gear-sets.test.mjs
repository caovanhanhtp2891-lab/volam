import test from "node:test";
import assert from "node:assert/strict";
import {
  GEAR_SETS,
  GEAR_VARIANTS,
  SET_IDS,
  EQUIPMENT_SLOTS,
  setStatuses,
  setBonuses,
  variantsForSlot,
  validGearIdentity,
  rollGearIdentity,
} from "../src/gear-catalog.ts";
import {
  emptyStats,
  loadoutStats,
  totalGearStats,
  equipBestGear,
  equipSetPieces,
  discardCandidates,
} from "../src/equipment.ts";
import { equipmentMarkup, VARIANT_SHAPES } from "../src/equipment-art.ts";
import {
  ridingSpeed,
  mountSpeedBonus,
  normalizeMounted,
} from "../src/mount.ts";
const piece = (slot, setId = "kim-phong", changes = {}) => ({
  id: `${setId}-${slot}`,
  slot,
  level: 10,
  rarity: "Tốt",
  power: 1,
  enhance: 0,
  setId,
  element: GEAR_SETS[setId].element,
  ...changes,
});
const set = (count = 11, id = "kim-phong") =>
  EQUIPMENT_SLOTS.slice(0, count).map((slot) => piece(slot, id));
test("set thresholds activate only with equipped distinct slots and full hidden stats require both rings and horse", () => {
  for (const count of [1, 2, 3, 4, 5, 6, 10, 11]) {
    const status = setStatuses(set(count))[0];
    assert.equal(status.pieces, count);
    assert.equal(status.full, count === 11);
    assert.equal(status.bonuses.attack, count === 11 ? 36 : count >= 2 ? 6 : 0);
    assert.equal(status.bonuses.hp, count >= 4 ? 90 : 0);
    assert.equal(status.bonuses.crit, count === 11 ? 8 : count >= 6 ? 3 : 0);
  }
  assert.equal(setStatuses([...set(10), piece("weapon")])[0].full, false);
  assert.equal(
    setStatuses(set().filter((item) => item.slot !== "ring2"))[0].full,
    false,
  );
  assert.equal(
    setStatuses(set().filter((item) => item.slot !== "horse"))[0].full,
    false,
  );
});
test("fifteen full sets have different actual bonuses, matching element strengthens only set stats", () => {
  const full = SET_IDS.map((id) => setBonuses(set(11, id)));
  assert.equal(new Set(full.map(JSON.stringify)).size, 15);
  for (const id of SET_IDS) {
    const items = set(11, id),
      base = setBonuses(items),
      aligned = setBonuses(items, GEAR_SETS[id].element);
    for (const key of Object.keys(base))
      assert.equal(aligned[key], Math.ceil(base[key] * 1.2));
    const combined = loadoutStats(items, GEAR_SETS[id].element),
      primary = totalGearStats(items);
    for (const key of Object.keys(base))
      assert.equal(combined[key], primary[key] + aligned[key]);
  }
});
test("weakest set grade limits bonuses; mixed sets stack their own stages and recalculation never mutates saves", () => {
  const items = set().map((item) => ({ ...item, level: 160 }));
  items[5].level = 10;
  const snapshot = JSON.stringify(items);
  assert.equal(setStatuses(items)[0].grade, 1);
  assert.deepEqual(setBonuses(items), setBonuses(set()));
  assert.equal(JSON.stringify(items), snapshot);
  const mixed = [
    piece("weapon"),
    piece("armor"),
    piece("helmet", "xich-diem"),
    piece("boots", "xich-diem"),
  ];
  assert.deepEqual(setBonuses(mixed), {
    ...emptyStats(),
    attack: 12,
    defense: 8,
    hp: 0,
    mp: 0,
    crit: 0,
    speed: 0,
  });
  assert.equal(
    setStatuses(mixed).every((s) => !s.full),
    true,
  );
  assert.equal(setStatuses(set(10))[0].bonuses.crit, 3);
});
test("old gear receives no invented elements or set bonuses and identity validation rejects mismatched set/slot data", () => {
  const old = {
    id: "old",
    slot: "weapon",
    rarity: "Tốt",
    power: 20,
    level: 1,
    enhance: 0,
  };
  assert.deepEqual(loadoutStats([old]), totalGearStats([old]));
  assert.equal(validGearIdentity(old), true);
  for (const bad of [
    { variant: "unknown" },
    { variant: "plate" },
    { element: "wind" },
    { setId: "xich-diem", element: "kim" },
    { setId: "__proto__", element: "kim" },
  ])
    assert.equal(validGearIdentity({ ...old, ...bad }), false);
  assert.equal(
    validGearIdentity({
      ...old,
      variant: "sword",
      element: "kim",
      setId: "kim-phong",
    }),
    true,
  );
});
test("all 84 equipment variants have compatible distinct artwork, grades and enchantment markers", () => {
  assert.equal(Object.keys(GEAR_VARIANTS).length, 84);
  for (const [variant, info] of Object.entries(GEAR_VARIANTS)) {
    const gear = { ...piece(info.slot), variant, level: 160, enhance: 10 };
    assert.ok(VARIANT_SHAPES[variant]);
    assert.equal(validGearIdentity(gear), true);
    assert.match(
      equipmentMarkup(info.slot, "#ffd35a", "Hoàng Kim", "", gear),
      /grade-4 enhanced-2/,
    );
    assert.match(
      equipmentMarkup(info.slot, "#ffd35a", "Hoàng Kim", "", gear),
      /gear-element/,
    );
  }
  assert.equal(
    new Set(variantsForSlot("weapon").map((v) => VARIANT_SHAPES[v])).size,
    20,
  );
  assert.equal(
    validGearIdentity({ ...piece("ring2"), variant: "jadering" }),
    true,
  );
});
test("new drops use valid identities and Golden gear always belongs to a full obtainable element set", () => {
  for (const slot of EQUIPMENT_SLOTS)
    for (const rarity of ["Thường", "Tốt", "Hoàng Kim"])
      for (const roll of [0, 0.3, 0.8, 0.999]) {
        const identity = rollGearIdentity(slot, rarity, "hoa", () => roll);
        assert.equal(validGearIdentity({ slot, ...identity }), true);
        if (rarity === "Hoàng Kim") assert.ok(identity.setId);
      }
});
test("auto equip keeps a full set when a higher individual score would destroy its hidden attributes", () => {
  const items = set(),
    owner = {
      equipment: Object.fromEntries(items.map((item) => [item.slot, item])),
      inventory: [
        {
          ...piece("weapon"),
          id: "plain-upgrade",
          setId: undefined,
          power: 20,
        },
      ],
    };
  assert.equal(equipBestGear(owner, "kim"), 0);
  assert.equal(setStatuses(Object.values(owner.equipment))[0].full, true);
});
test("wearing a set preserves all items in a full bag and ignores absent or weaker duplicate pieces", () => {
  const old = { ...piece("weapon"), setId: undefined, id: "old" },
    replacement = piece("weapon"),
    duplicate = { ...replacement, id: "weaker", power: 0 };
  const owner = {
    equipment: { weapon: old },
    inventory: [
      replacement,
      duplicate,
      ...Array.from({ length: 58 }, (_, i) => ({
        ...piece("armor"),
        id: `spare-${i}`,
        setId: undefined,
      })),
    ],
  };
  const ids = [old, ...owner.inventory].map((i) => i.id).sort();
  assert.equal(equipSetPieces(owner, "kim-phong"), 1);
  assert.equal(owner.inventory.length, 60);
  assert.equal(owner.equipment.weapon.id, replacement.id);
  assert.equal(equipSetPieces(owner, "kim-phong"), 0);
  assert.deepEqual(
    [...Object.values(owner.equipment), ...owner.inventory]
      .map((i) => i.id)
      .sort(),
    ids,
  );
});
test("filtered disposal protects set pieces while manual sales remain possible", () => {
  const owner = {
    equipment: {},
    inventory: [
      piece("weapon"),
      { ...piece("armor"), setId: undefined, id: "plain" },
    ],
  };
  assert.deepEqual(
    discardCandidates(owner, {
      maxLevel: 160,
      maxRarity: 4,
      weakerOnly: false,
    }).map((i) => i.id),
    ["plain"],
  );
});
test("mounting speeds up only movement, toggling never compounds and old saves start unmounted", () => {
  const horse = piece("horse", "kim-phong", { level: 1 });
  assert.equal(mountSpeedBonus(horse), 36);
  assert.equal(ridingSpeed(150, horse, true), 204);
  assert.equal(ridingSpeed(150, horse, false), 150);
  assert.equal(ridingSpeed(150, undefined, true), 150);
  for (let i = 0; i < 20; i++) assert.equal(ridingSpeed(150, horse, true), 204);
  assert.equal(normalizeMounted(undefined, horse), false);
  assert.equal(normalizeMounted(true, undefined), false);
  assert.equal(normalizeMounted("true", horse), false);
  assert.equal(normalizeMounted(true, horse), true);
  assert.ok(
    mountSpeedBonus({ ...horse, rarity: "Hoàng Kim", level: 160 }) >
      mountSpeedBonus(horse),
  );
});
