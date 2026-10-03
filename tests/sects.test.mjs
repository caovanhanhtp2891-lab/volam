import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { SECTS, SKILL_KEYS, HERO_SIZE, resolveSectId, selectSkillTargets } from "../src/sects.ts";
import { skillIconMarkup } from "../src/sect-effects.ts";

const actor = { x: 0, y: 0 };
const enemy = (id, x, y, changes = {}) => ({ id, x, y, radius: 10, dead: false, ...changes });
const ids = result => result.targets.map(target => target.id);

test("ten familiar sects have thirty named skills, usable costs and distinct icons", () => {
  assert.equal(Object.keys(SECTS).length, 10);
  const names = new Set(), icons = new Set();
  for (const sect of Object.values(SECTS)) for (const key of SKILL_KEYS) {
    const skill = sect.kit[key];
    names.add(skill.name);
    icons.add(skillIconMarkup(skill, key, sect.color));
    assert.ok(skill.mp > 0 && skill.mp <= sect.baseMp);
    assert.ok(skill.cooldown > 0 && skill.damage >= 0);
    assert.equal(skill.unlock, key === "skill1" ? 1 : key === "skill2" ? 3 : 5);
  }
  assert.equal(names.size, 30);
  assert.equal(icons.size, 30);
  assert.ok(HERO_SIZE.width <= 46 && HERO_SIZE.height <= 50);
  assert.ok(statSync(new URL("../src/assets/simple-atlas.webp", import.meta.url)).size < 32768);
});

test("old sect aliases migrate to schools with matching base stats; invalid IDs are rejected", () => {
  for (const [old, next, hp, mp, attack, defense] of [["kim", "thien-vuong", 145, 90, 21, 9], ["hoa", "cai-bang", 105, 125, 26, 5], ["thuy", "nga-mi", 125, 140, 18, 7]]) {
    assert.equal(resolveSectId(old), next);
    const s = SECTS[next];
    assert.deepEqual([s.baseHp, s.baseMp, s.baseAttack, s.baseDefense], [hp, mp, attack, defense]);
  }
  for (const id of Object.keys(SECTS)) assert.equal(resolveSectId(id), id);
  for (const id of [null, 3, {}, "", "__proto__", "constructor", "unknown"]) assert.equal(resolveSectId(id), null);
});

test("an aimed skill rejects dead or distant targets before resources are charged", () => {
  const skill = SECTS["duong-mon"].kit.skill1;
  for (const target of [undefined, enemy("far", 1000, 0), enemy("dead", 100, 0, { dead: true })]) {
    assert.equal(selectSkillTargets(skill, actor, target ? [target] : [], target).valid, false);
  }
  const target = enemy("edge", skill.range + 10, 0);
  assert.deepEqual(ids(selectSkillTargets(skill, actor, [target], target)), ["edge"]);
});

test("self healing and protective skills work with no enemy nearby", () => {
  for (const id of ["thieu-lam", "nga-mi", "thuy-yen", "cai-bang", "vo-dang"]) {
    const result = selectSkillTargets(SECTS[id].kit.skill2, actor, []);
    assert.equal(result.valid, true);
    assert.deepEqual(result.center, actor);
  }
  assert.equal(selectSkillTargets(SECTS["nga-mi"].kit.ultimate, actor, []).valid, true);
});

test("cone attacks exclude enemies behind and beside the caster", () => {
  const aim = enemy("aim", 100, 0);
  const enemies = [aim, enemy("ahead", 130, 50), enemy("behind", -60, 0), enemy("side", 20, 80), enemy("far", 700, 0)];
  assert.deepEqual(ids(selectSkillTargets(SECTS["thuy-yen"].kit.skill1, actor, enemies, aim)), ["aim", "ahead"]);
});

test("piercing swords hit a narrow forward line and use its actual direction", () => {
  const aim = enemy("aim", 0, 120);
  const enemies = [aim, enemy("inline", 20, 250), enemy("off-line", 90, 200), enemy("behind", 0, -60)];
  assert.deepEqual(ids(selectSkillTargets(SECTS["vo-dang"].kit.skill1, actor, enemies, aim)), ["aim", "inline"]);
});

test("targeted poison fields center on the target and exclude out-of-field enemies", () => {
  const aim = enemy("aim", 250, 0), close = enemy("close", 300, 30);
  const result = selectSkillTargets(SECTS["ngu-doc"].kit.skill2, actor, [aim, close, enemy("caster", 0, 0), enemy("dead", 260, 0, { dead: true })], aim);
  assert.deepEqual(result.center, { x: 250, y: 0 });
  assert.deepEqual(ids(result), ["aim", "close"]);
});

test("chain lightning jumps to nearest unvisited targets, at most three, within jump range", () => {
  const aim = enemy("aim", 100, 0);
  const enemies = [aim, enemy("third", 270, 0), enemy("second", 160, 0), enemy("fourth", 310, 0), enemy("far", 1000, 0)];
  assert.deepEqual(ids(selectSkillTargets(SECTS["con-lon"].kit.skill1, actor, enemies, aim)), ["aim", "second", "third"]);
  assert.deepEqual(ids(selectSkillTargets(SECTS["con-lon"].kit.skill1, actor, [aim, enemies[4]], aim)), ["aim"]);
});
