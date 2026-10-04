import test from "node:test";
import assert from "node:assert/strict";
import {
  GEAR_VARIANTS,
  variantsForSlot,
  rollGearIdentity,
  validGearIdentity,
} from "../src/gear-catalog.ts";
import { GEAR_DESIGNS } from "../src/equipment-design.ts";
import {
  equipmentMarkup,
  equipmentEffectLabel,
  weaponCenter,
} from "../src/equipment-art.ts";
import { equipmentVisualState } from "../src/equipment-vfx.ts";

test("all 108 types have their own silhouette and material fittings, and are obtainable from ordinary drops", () => {
  assert.equal(Object.keys(GEAR_VARIANTS).length, 108);
  assert.deepEqual(
    Object.keys(GEAR_DESIGNS).sort(),
    Object.keys(GEAR_VARIANTS).sort(),
  );
  assert.equal(
    new Set(Object.values(GEAR_DESIGNS).map((art) => art.shape)).size,
    108,
  );
  for (const [variant, meta] of Object.entries(GEAR_VARIANTS)) {
    const choices = variantsForSlot(meta.slot),
      index = choices.indexOf(variant);
    const rolled = rollGearIdentity(
      meta.slot,
      "Tốt",
      "kim",
      () => (index + 0.1) / choices.length,
    );
    assert.equal(rolled.variant, variant);
    assert.equal(validGearIdentity({ slot: meta.slot, ...rolled }), true);
    for (const layer of ["shape", "accent", "engraving", "gem"])
      assert.ok(GEAR_DESIGNS[variant][layer]);
  }
});
test("SVG paints stay local to their icon, unsafe colors cannot become markup, old gear still renders", () => {
  const a = equipmentMarkup("weapon", "#ffd35a", "Hoàng Kim", "", {
    variant: "axe",
    level: 160,
    enhance: 100,
    element: "hoa",
  });
  const b = equipmentMarkup("weapon", "#ffd35a", "Hoàng Kim", "", {
    variant: "axe",
    level: 160,
    enhance: 100,
    element: "hoa",
  });
  const ids = (markup) =>
    [...markup.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const first = ids(a),
    second = ids(b);
  assert.ok(first.length >= 5);
  assert.equal(
    first.some((id) => second.includes(id)),
    false,
  );
  for (const id of [...a.matchAll(/url\(#([^\)]+)\)/g)].map(
    (match) => match[1],
  ))
    assert.ok(first.includes(id));
  assert.match(a, /gear-body/);
  assert.match(a, /gear-engraving/);
  assert.match(a, /enhanced-max/);
  assert.doesNotMatch(
    equipmentMarkup("weapon", '" onload="bad', "Tốt"),
    /onload/,
  );
  assert.match(equipmentMarkup("ring2", "#c9d5df"), /data-variant="rubyring"/);
});
test("quality and enhancement effects use real worn item values; simple mode removes moving motes", () => {
  const qualities = ["Thường", "Tốt", "Hiếm", "Cực phẩm", "Hoàng Kim"];
  assert.deepEqual(
    qualities.map((rarity) => equipmentVisualState({ rarity }).beam),
    [0, 36, 70, 98, 125],
  );
  assert.deepEqual(
    [0, 2, 3, 6, 7, 9, 10].map(
      (enhance) => equipmentVisualState({ enhance }).band,
    ),
    [0, 0, 1, 1, 2, 2, 3],
  );
  assert.equal(
    equipmentVisualState({ rarity: "Hoàng Kim", enhance: 10 }, true).motes,
    0,
  );
  assert.equal(
    equipmentVisualState({ rarity: "Hoàng Kim", enhance: 10 }).motes,
    6,
  );
  assert.match(equipmentEffectLabel("Tốt", 10), /\+10/);
  for (const variant of variantsForSlot("weapon")) {
    const center = weaponCenter(variant, 64);
    assert.equal(center.length, 2);
    assert.ok(
      center.every((value) => Number.isFinite(value) && Math.abs(value) <= 32),
    );
  }
});
