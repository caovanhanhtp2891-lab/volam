import test from "node:test";
import assert from "node:assert/strict";
import { BAG_CAPACITY, MAX_POTIONS, POTION_COOLDOWN, POTIONS, DUNGEONS, buyPotion, usePotion, normalizeSupplies, itemSalePrice, storeRewardItems, recoverPendingItems, canEnterDungeon } from "../src/progression.ts";

const player = (changes = {}) => ({ gold: 100, hp: 20, maxHp: 100, mp: 10, maxMp: 80, ...normalizeSupplies({}), ...changes });

test("old saves receive starter supplies without overwriting existing counts", () => {
  assert.deepEqual(normalizeSupplies({}), { potions: { hp: 3, mp: 2 }, potionCooldown: 0 });
  assert.deepEqual(normalizeSupplies({ potions: { hp: 0, mp: 7 }, potionCooldown: 4 }), { potions: { hp: 0, mp: 7 }, potionCooldown: 4 });
});

test("supply migration clamps invalid, fractional and oversized data", () => {
  assert.deepEqual(normalizeSupplies({ potions: { hp: -8, mp: Infinity }, potionCooldown: NaN }), { potions: { hp: 0, mp: 0 }, potionCooldown: 0 });
  assert.deepEqual(normalizeSupplies({ potions: { hp: 999, mp: 4.8 }, potionCooldown: 99 }), { potions: { hp: MAX_POTIONS, mp: 4 }, potionCooldown: POTION_COOLDOWN });
});

for (const kind of ["hp", "mp"]) {
  test(`${kind}: buy a single potion, charge exactly its listed price`, () => {
    const p = player();
    const initial = p.potions[kind];
    assert.equal(buyPotion(p, kind, 1), "bought");
    assert.equal(p.gold, 100 - POTIONS[kind].price);
    assert.equal(p.potions[kind], initial + 1);
  });

  test(`${kind}: a bundle at exact balance never makes the wallet negative`, () => {
    const p = player({ gold: POTIONS[kind].price * 5 });
    assert.equal(buyPotion(p, kind, 5), "bought");
    assert.equal(p.gold, 0);
    const snapshot = structuredClone(p);
    assert.equal(buyPotion(p, kind, 1), "poor");
    assert.deepEqual(p, snapshot);
  });

  test(`${kind}: insufficient funds or a full stack does not change state`, () => {
    const poor = player({ gold: 0 });
    const original = structuredClone(poor);
    assert.equal(buyPotion(poor, kind, 1), "poor");
    assert.deepEqual(poor, original);
    const full = player({ potions: { hp: MAX_POTIONS, mp: MAX_POTIONS } });
    const before = structuredClone(full);
    assert.equal(buyPotion(full, kind, 1), "full");
    assert.deepEqual(full, before);
  });

  test(`${kind}: a purchase fits exactly at the stack cap, but not above it`, () => {
    const p = player({ potions: { hp: 94, mp: 94 }, gold: 200 });
    assert.equal(buyPotion(p, kind, 5), "bought");
    assert.equal(p.potions[kind], MAX_POTIONS);
  });

  test(`${kind}: restores 40 percent of maximum and starts the shared cooldown`, () => {
    const p = player();
    const initial = p.potions[kind];
    assert.equal(usePotion(p, kind), "used");
    assert.equal(p[kind], kind === "hp" ? 60 : 42);
    assert.equal(p.potions[kind], initial - 1);
    assert.equal(p.potionCooldown, POTION_COOLDOWN);
    const after = structuredClone(p);
    assert.equal(usePotion(p, kind === "hp" ? "mp" : "hp"), "cooldown");
    assert.deepEqual(p, after);
  });

  test(`${kind}: recovery is capped at maximum`, () => {
    const p = player({ hp: 99, mp: 79 });
    assert.equal(usePotion(p, kind), "used");
    assert.equal(p[kind], p[kind === "hp" ? "maxHp" : "maxMp"]);
  });

  test(`${kind}: full resources and empty inventory never consume anything`, () => {
    const full = player({ hp: 100, mp: 80 });
    const before = structuredClone(full);
    assert.equal(usePotion(full, kind), "full");
    assert.deepEqual(full, before);
    const empty = player({ potions: { hp: 0, mp: 0 } });
    assert.equal(usePotion(empty, kind), "empty");
    assert.equal(empty.potionCooldown, 0);
  });
}

test("invalid purchase quantities and inherited object keys cannot spend money", () => {
  const p = player();
  const original = structuredClone(p);
  for (const quantity of [-1, 0, 6, 1.5, NaN, Infinity]) assert.equal(buyPotion(p, "hp", quantity), "invalid");
  for (const kind of ["gold", "__proto__", "toString"]) {
    assert.equal(buyPotion(p, kind, 1), "invalid");
    assert.equal(usePotion(p, kind), "invalid");
  }
  assert.deepEqual(p, original);
});

test("items overflow into pending rewards, not into an overfull bag or into oblivion", () => {
  const owner = { inventory: Array.from({ length: BAG_CAPACITY - 1 }, (_, id) => ({ id })), pendingItems: [] };
  const items = [{ id: 100 }, { id: 101 }, { id: 102 }];
  storeRewardItems(owner, items);
  assert.equal(owner.inventory.length, BAG_CAPACITY);
  assert.equal(owner.inventory.at(-1), items[0]);
  assert.deepEqual(owner.pendingItems, items.slice(1));
  assert.equal(recoverPendingItems(owner), 0);
  owner.inventory.splice(0, 2);
  assert.equal(recoverPendingItems(owner), 2);
  assert.deepEqual(owner.inventory.slice(-2), items.slice(1));
  assert.equal(recoverPendingItems(owner), 0);
});

test("partially recovered pending items preserve order and survive a save round trip", () => {
  const owner = { inventory: Array(BAG_CAPACITY).fill("old"), pendingItems: ["a", "b", "c"] };
  const saved = JSON.parse(JSON.stringify(owner));
  saved.inventory.pop();
  assert.equal(recoverPendingItems(saved), 1);
  assert.deepEqual(saved.pendingItems, ["b", "c"]);
  assert.equal(saved.inventory.at(-1), "a");
});

test("the sale price is deterministic and enhanced gear is worth more", () => {
  const item = { power: 13, level: 1, enhance: 0 };
  assert.equal(itemSalePrice(item), 29);
  assert.equal(itemSalePrice({ ...item, enhance: 3 }), 74);
  assert.equal(itemSalePrice({ power: 0, level: 0, enhance: 0 }), 5);
});

test("dungeon unlocks require both level and the prerequisite completion", () => {
  assert.equal(canEnterDungeon("tomb", 2, {}), false);
  assert.equal(canEnterDungeon("tomb", 3, {}), true);
  assert.equal(canEnterDungeon("bamboo", 4, { tomb: 1 }), false);
  assert.equal(canEnterDungeon("bamboo", 5, {}), false);
  assert.equal(canEnterDungeon("bamboo", 5, { tomb: 1 }), true);
  assert.equal(canEnterDungeon("invalid", 99, {}), false);
});

test("each configured dungeon has unique spawn ids, waves and one final boss", () => {
  const ids = new Set();
  for (const dungeon of Object.values(DUNGEONS)) {
    assert.ok(dungeon.timeLimit > 0 && dungeon.reward.xp > 0);
    assert.ok(dungeon.waves.length >= 2);
    const spawns = dungeon.waves.flat();
    assert.equal(spawns.filter(enemy => enemy.kind === "boss").length, 1);
    assert.equal(dungeon.waves.at(-1)[0].kind, "boss");
    for (const enemy of spawns) {
      assert.ok(!ids.has(enemy.id));
      ids.add(enemy.id);
      assert.ok(enemy.x >= 160 && enemy.x <= 1610 && enemy.y >= 500 && enemy.y <= 970);
    }
  }
});
