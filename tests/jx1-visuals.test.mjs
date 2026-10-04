import test from 'node:test';
import assert from 'node:assert/strict';
import { JX1_SKILL_REFERENCE, JX1_REFERENCE_COMMIT } from '../src/jx1-skill-reference.ts';
import { MARTIAL_PATHS } from '../src/martial-paths.ts';
import { MARTIAL_VISUALS, martialFlightSpeed } from '../src/martial-visuals.ts';
import { selectSkillTargets } from '../src/sects.ts';
import { skillUsesFlight } from '../src/skill-flight.ts';

test('all sixty active skills resolve to the pinned JXLinux skill and missile tables', () => {
  assert.equal(JX1_REFERENCE_COMMIT, 'ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764');
  const ids = new Set();
  for (const paths of Object.values(MARTIAL_PATHS)) for (const path of paths) for (const skill of Object.values(path.kit)) {
    const v = skill.visual, source = JX1_SKILL_REFERENCE[skill.sourceId];
    assert.equal(v.sourceId, skill.sourceId); assert.ok(source);
    assert.ok(v.streams >= 1 && v.streams <= 8);
    assert.equal(skillUsesFlight(skill), v.delivery === 'travel');
    if (v.delivery === 'travel') { assert.ok(source.missile > 0); assert.ok(martialFlightSpeed(v) >= 300); }
    if (v.delivery === 'ground') {
      assert.ok([6, 7].includes(source.form));
      assert.ok(source.move === 0 || source.speed === 0, 'point missiles remain stationary even when their movement kind is linear');
      assert.equal(skill.anchor, 'target');
    }
    if (v.delivery === 'self') { assert.equal(skill.anchor, 'self'); assert.equal(skill.requiresTarget, false); }
    ids.add(skill.sourceId);
  }
  assert.equal(ids.size, 60); assert.equal(Object.keys(JX1_SKILL_REFERENCE).length, 60);
  assert.equal(Object.keys(MARTIAL_VISUALS).length, 20);
});

test('point rain, fire and lightning select victims around the aim rather than around the caster', () => {
  const actor = { x: 0, y: 0 }, aim = { id: 'aim', x: 260, y: 0, radius: 10, dead: false };
  const byCaster = { id: 'caster', x: 30, y: 0, radius: 10, dead: false };
  const nearby = { id: 'nearby', x: 280, y: 30, radius: 10, dead: false };
  for (const [sect, pathId, key] of [['duong-mon','bolts','ultimate'], ['thien-nhan','blade','ultimate'], ['vo-dang','qi','ultimate'], ['con-lon','sword','ultimate']]) {
    const skill = MARTIAL_PATHS[sect].find(p => p.id === pathId).kit[key];
    assert.equal(skill.projectile, false);
    const selected = selectSkillTargets(skill, actor, [aim, byCaster, nearby], aim);
    assert.deepEqual(selected.center, { x: aim.x, y: aim.y });
    assert.deepEqual(selected.targets.map(e => e.id), ['aim', 'nearby']);
  }
});

test('source distinctions retain linear double blades, triple ice rays, radial staff and ground meteors', () => {
  assert.equal(JX1_SKILL_REFERENCE[19].count, 2); assert.equal(JX1_SKILL_REFERENCE[321].count, 2);
  assert.equal(JX1_SKILL_REFERENCE[328].count, 3); assert.equal(JX1_SKILL_REFERENCE[336].count, 5);
  assert.equal(JX1_SKILL_REFERENCE[357].move, 5); assert.equal(JX1_SKILL_REFERENCE[359].move, 5);
  assert.equal(JX1_SKILL_REFERENCE[362].missile, 171); assert.equal(JX1_SKILL_REFERENCE[362].event, 363);
  assert.equal(JX1_SKILL_REFERENCE[375].count, 4); assert.equal(JX1_SKILL_REFERENCE[375].event, 387);
  assert.equal(MARTIAL_VISUALS['dragon-palm'][1].streams, 8);
  assert.equal(MARTIAL_VISUALS['ice-saber'][2].streams, 5);
  assert.equal(MARTIAL_VISUALS['fire-rain'][2].pattern, 'rain');
  assert.equal(MARTIAL_VISUALS.thunder[2].pattern, 'storm');
});
