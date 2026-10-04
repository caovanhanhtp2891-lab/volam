import test from "node:test";
import assert from "node:assert/strict";
import { REALMS, combatPower, strengthScore, powerFromScore, cultivationForPower } from "../src/cultivation.ts";

test("twenty-three realms cover every boundary from mortal to limitless", () => {
  assert.deepEqual(REALMS.map(r => r.name), [
    "Phàm Nhân", "Luyện Thể", "Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Đại Thừa", "Độ Kiếp", "Chân Tiên", "Thiên Tiên", "Huyền Tiên", "Kim Tiên", "Thái Ất Kim Tiên", "Đại La Kim Tiên", "Tiên Vương", "Tiên Đế", "Đạo Tổ", "Hỗn Nguyên", "Hồng Mông", "Vô Cực",
  ]);
  for (let i = 1; i < REALMS.length; i++) {
    assert.ok(REALMS[i].minPower > REALMS[i - 1].minPower);
    assert.equal(cultivationForPower(REALMS[i].minPower - 1).rank, i - 1);
    assert.equal(cultivationForPower(REALMS[i].minPower).rank, i);
  }
  assert.equal(REALMS[1].minPower, 2_000);
  assert.equal(REALMS[2].minPower, 5_000);
  assert.equal(REALMS[19].minPower, 6_500_000);
});

test("strength grows linearly in proportion to stats while preserving the order of gear and every stat contribution", () => {
  const base = combatPower(40, 15, 145);
  assert.equal(base, 1717);
  assert.equal(combatPower(240, 15, 145), 7717);
  assert.equal(cultivationForPower(base).realm.name, "Phàm Nhân");
  assert.equal(cultivationForPower(combatPower(240, 15, 145)).realm.name, "Luyện Khí");
  for (const stats of [[41,15,145,0], [40,16,145,0], [40,15,146,0], [40,15,145,1]])
    assert.ok(combatPower(...stats) > base);
  assert.equal(powerFromScore(strengthScore(40,15,145)), base);
  assert.ok(combatPower(220000,0,0) >= 6_500_000, "high enhancement strength can reach Dao To without inflating the power formula");
  assert.equal(cultivationForPower(combatPower(40,15,145)).realm.name, "Phàm Nhân", "removing strong gear lowers the realm");
});

test("mortal progress and nine layers have exact integer boundaries", () => {
  for (const [power,label] of [
    [0,"Phàm Nhân"], [1999,"Phàm Nhân"], [2000,"Luyện Thể · Tầng 1"],
    [2333,"Luyện Thể · Tầng 1"], [2334,"Luyện Thể · Tầng 2"], [4999,"Luyện Thể · Tầng 9"],
    [5000,"Luyện Khí · Tầng 1"], [5555,"Luyện Khí · Tầng 1"], [5556,"Luyện Khí · Tầng 2"], [9999,"Luyện Khí · Tầng 9"],
  ]) assert.equal(cultivationForPower(power).label,label);
  assert.equal(cultivationForPower(1000).progress,.5);
  assert.equal(cultivationForPower(0).nextLabel,"Luyện Thể · Tầng 1");
  assert.equal(cultivationForPower(5555).nextPower,5556);
  assert.equal(cultivationForPower(4999).nextLabel,"Luyện Khí · Tầng 1");
});

test("five phases start at Truc Co and reaching the next realm resets the phase", () => {
  for (const [power,phase] of [[10_000,"Sơ kỳ"],[12_000,"Trung kỳ"],[14_000,"Hậu kỳ"],[16_000,"Đỉnh phong"],[18_000,"Đại viên mãn"]]) {
    assert.equal(cultivationForPower(power).realm.name,"Trúc Cơ");
    assert.equal(cultivationForPower(power).phase,phase);
    assert.equal(cultivationForPower(power).progress,0);
  }
  assert.equal(cultivationForPower(19_999).nextLabel,"Kim Đan · Sơ kỳ");
  assert.equal(cultivationForPower(20_000).phase,"Sơ kỳ");
  assert.equal(cultivationForPower(550_000).realm.name,"Chân Tiên");
  assert.equal(cultivationForPower(6_500_000).label,"Đạo Tổ · Sơ kỳ");
  assert.equal(cultivationForPower(7_999_999).nextLabel,"Hỗn Nguyên · Sơ kỳ");
});

test("progress always points forward, including realms beyond Dao To and the final phase", () => {
  const top=cultivationForPower(13_760_000);
  assert.equal(top.label,"Vô Cực · Đại viên mãn");
  assert.equal(top.nextPower,null); assert.equal(top.nextLabel,null); assert.equal(top.progress,1);
  const samples=[0,Number.MAX_SAFE_INTEGER];
  for (const realm of REALMS) {
    samples.push(realm.minPower,realm.minPower+1);
    for (let i=1;i<=9;i++) samples.push(Math.floor(realm.minPower*(1+i*.11)));
  }
  for (const power of samples) {
    const current=cultivationForPower(power);
    assert.ok(current.progress>=0 && current.progress<=1);
    if(current.nextPower!==null) assert.ok(current.nextPower>power);
    assert.ok(current.rank>=0 && current.rank<REALMS.length);
  }
});

test("invalid or huge input cannot produce negative, infinite or unsafe combat power", () => {
  for(const value of [-1,NaN,Infinity,-Infinity]) assert.equal(cultivationForPower(value).label,"Phàm Nhân");
  assert.equal(combatPower(-100,NaN,Infinity),0);
  assert.equal(powerFromScore(-100),0);
  assert.equal(combatPower(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE),Number.MAX_SAFE_INTEGER);
  assert.equal(cultivationForPower(Number.MAX_VALUE).power,Number.MAX_SAFE_INTEGER);
});
