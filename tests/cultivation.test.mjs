import test from "node:test";
import assert from "node:assert/strict";
import {
  REALMS,
  combatPower,
  cultivationForPower,
} from "../src/cultivation.ts";

test("all nineteen realms follow the requested mortal and immortal order", () => {
  assert.deepEqual(
    REALMS.map((realm) => realm.name),
    [
      "Luyện Thể",
      "Luyện Khí",
      "Trúc Cơ",
      "Kim Đan",
      "Nguyên Anh",
      "Hóa Thần",
      "Luyện Hư",
      "Hợp Thể",
      "Đại Thừa",
      "Độ Kiếp",
      "Chân Tiên",
      "Thiên Tiên",
      "Huyền Tiên",
      "Kim Tiên",
      "Thái Ất Kim Tiên",
      "Đại La Kim Tiên",
      "Tiên Vương",
      "Tiên Đế",
      "Đạo Tổ",
    ],
  );
  for (let i = 1; i < REALMS.length; i++) {
    assert.ok(REALMS[i].minPower > REALMS[i - 1].minPower);
    assert.equal(cultivationForPower(REALMS[i].minPower - 1).rank, i - 1);
    assert.equal(cultivationForPower(REALMS[i].minPower).rank, i);
  }
});

test("cultivation uses current attack, defense and maximum health, including integer rounding", () => {
  assert.equal(combatPower(40, 15, 145), 171);
  assert.equal(combatPower(40 + 200, 15, 145), 771);
  assert.equal(cultivationForPower(171).realm.name, "Luyện Thể");
  assert.equal(cultivationForPower(771).realm.name, "Trúc Cơ");
  assert.equal(
    cultivationForPower(combatPower(40, 15, 145)).realm.name,
    "Luyện Thể",
    "removing stronger gear lowers the realm again",
  );
});

test("the first two realms have nine layers without gaps at fractional boundaries", () => {
  for (const [power, label] of [
    [0, "Luyện Thể · Tầng 1"],
    [27, "Luyện Thể · Tầng 1"],
    [28, "Luyện Thể · Tầng 2"],
    [249, "Luyện Thể · Tầng 9"],
    [250, "Luyện Khí · Tầng 1"],
    [294, "Luyện Khí · Tầng 1"],
    [295, "Luyện Khí · Tầng 2"],
    [649, "Luyện Khí · Tầng 9"],
  ])
    assert.equal(cultivationForPower(power).label, label);
  assert.equal(cultivationForPower(27).nextPower, 28);
  assert.equal(cultivationForPower(249).nextLabel, "Luyện Khí · Tầng 1");
});

test("five phases start at Truc Co and reaching the next realm resets its phase", () => {
  for (const [power, phase] of [
    [650, "Sơ kỳ"],
    [760, "Trung kỳ"],
    [870, "Hậu kỳ"],
    [980, "Đỉnh phong"],
    [1090, "Đại viên mãn"],
  ]) {
    assert.equal(cultivationForPower(power).realm.name, "Trúc Cơ");
    assert.equal(cultivationForPower(power).phase, phase);
    assert.equal(cultivationForPower(power).progress, 0);
  }
  assert.equal(cultivationForPower(1199).nextLabel, "Kim Đan · Sơ kỳ");
  assert.equal(cultivationForPower(1200).phase, "Sơ kỳ");
  assert.equal(cultivationForPower(11000).realm.name, "Chân Tiên");
});

test("the highest realm finishes cleanly and progress always has a valid next target", () => {
  assert.equal(cultivationForPower(30000).label, "Đạo Tổ · Sơ kỳ");
  assert.equal(cultivationForPower(31599).phase, "Đỉnh phong");
  const top = cultivationForPower(31600);
  assert.equal(top.label, "Đạo Tổ · Đại viên mãn");
  assert.equal(top.nextPower, null);
  assert.equal(top.nextLabel, null);
  assert.equal(top.progress, 1);
  for (let power = 0; power < 50000; power += 13) {
    const current = cultivationForPower(power);
    assert.ok(current.progress >= 0 && current.progress <= 1);
    if (current.nextPower !== null) assert.ok(current.nextPower > power);
    assert.ok(current.rank >= 0 && current.rank < 19);
  }
});

test("invalid strength cannot select an immortal realm or produce negative progress", () => {
  for (const power of [-1, NaN, Infinity, -Infinity])
    assert.equal(cultivationForPower(power).label, "Luyện Thể · Tầng 1");
  assert.equal(combatPower(-100, NaN, Infinity), 0);
});
