import test from 'node:test';
import assert from 'node:assert/strict';
import { freshTower, validTower, normalizeTower, towerFloor, towerReward, canEnterTower, completeTowerFloor, spendTowerSigils, TOWER_SET } from '../src/tower.ts';
import { normalizeIdle, FACTIONS } from '../src/idle.ts';
import { allocateAttribute, allocateSkill, recommendAttributes, recommendSkills, applyAttributeRecommendation, applySkillRecommendation, ATTRIBUTE_BUILDS } from '../src/point-allocation.ts';
import { GEAR_SETS, EQUIPMENT_SLOTS, rollGearIdentity, setBonuses } from '../src/gear-catalog.ts';
import { REALMS, cultivationForPower } from '../src/cultivation.ts';
const sum = values => Object.values(values).reduce((a,b) => a+b, 0);
const skills = changes => ({ level: 5, factionId: 'gaibang', skillPoints: 30, skillRanks: { skill1: 1, skill2: 0, ultimate: 0 }, ...changes });

test('old saves start a fresh tower and validation rejects gaps, unsafe counters and aliases', () => {
  assert.equal(validTower(undefined), true); assert.deepEqual(normalizeTower(), freshTower());
  const p = freshTower(); completeTowerFloor(p, 1); const copy = normalizeTower(p); copy.clears[0]++;
  assert.equal(p.clears[0], 1);
  for (const bad of [null, {}, {...p, highestFloor: 2}, {...p, sigils: -1}, {...p, highestFloor: 101}, {...p, clears: [1]}, {...p, clears: [...p.clears.slice(0,99),1]}, {...p, sigils: Infinity}]) assert.equal(validTower(bad), false);
});
test('tower requires level five and sequential victories; all 100 floors increase first-clear rewards', () => {
  const p = freshTower(); let last = {gold:0,xp:0,sigils:0,itemLevel:0};
  assert.equal(canEnterTower(p,1,4),false); assert.equal(completeTowerFloor(p,2),null);
  for(let f=1;f<=100;f++) {
    assert.equal(canEnterTower(p,f,5),true); assert.equal(canEnterTower(p,f+1,160),false);
    const reward=completeTowerFloor(p,f); assert.equal(reward.first,true);
    assert.ok(reward.gold>last.gold && reward.xp>last.xp && reward.itemLevel>last.itemLevel);
    assert.ok(reward.sigils>=last.sigils); last=reward; assert.equal(validTower(p),true);
    assert.equal(towerFloor(f).boss,f%10===0);
  }
  assert.equal(p.highestFloor,100); assert.equal(towerFloor(25).rarity,'Cực phẩm'); assert.equal(towerFloor(60).rarity,'Hoàng Kim');
  for(const f of [0,101,1.5,NaN,Infinity]) assert.equal(towerFloor(f),null);
});
test('replays grant ordinary rewards and rotate slots; 20 sigils buys only after a clear', () => {
  const p=freshTower(); p.sigils=20; assert.equal(spendTowerSigils(p,'weapon'),false);
  const first=completeTowerFloor(p,1), replay=towerReward(p,1);
  assert.equal(replay.first,false); assert.equal(first.gold, replay.gold*2); assert.equal(first.xp,replay.xp*2);
  const slots=new Set([first.slot]); for(let n=0;n<10;n++) slots.add(completeTowerFloor(p,1).slot);
  assert.equal(slots.size,11); assert.equal(spendTowerSigils(p,'militarySeal'),false);
  const before=p.sigils; assert.equal(spendTowerSigils(p,'horse'),true); assert.equal(p.sigils,before-20);
  p.sigils=19; assert.equal(spendTowerSigils(p,'ring2'),false); assert.equal(p.sigils,19);
  p.sigils=1e9; assert.equal(completeTowerFloor(p,1),null);
});
test('exclusive tower set cannot roll as ordinary loot and resonates with every school', () => {
  assert.equal(GEAR_SETS[TOWER_SET].source,'tower');
  for(const element of ['kim','moc','thuy','hoa','tho']) for(const rarity of ['Hoàng Kim','Truyền Thuyết','Thần Thoại']) for(let n=0;n<100;n++) {
    const identity=rollGearIdentity('weapon',rarity,element,()=>n/100);
    assert.notEqual(identity.setId,TOWER_SET);
  }
  const items=EQUIPMENT_SLOTS.map(slot=>({slot,setId:TOWER_SET,element:'tho',rarity:'Tốt',level:10}));
  const base=setBonuses(items);
  for(const element of ['kim','moc','thuy','hoa','tho']) {
    const boosted=setBonuses(items,element);
    for(const stat of Object.keys(base)) assert.equal(boosted[stat],Math.ceil(base[stat]*1.2));
  }
});
test('bulk attributes are exact, Max is capped, invalid input never spends points', () => {
  const p=normalizeIdle({attributePoints:30});
  for(const amount of [0,-1,1.5,31,NaN,Infinity]) assert.equal(allocateAttribute(p,'strength',amount),0);
  assert.equal(allocateAttribute(p,'strength',17),17); assert.equal(p.attributePoints,13);
  assert.equal(allocateAttribute(p,'strength','max'),13); assert.equal(p.attributes.strength,30);
  p.attributePoints=8;p.attributes.strength=99998; assert.equal(allocateAttribute(p,'strength','max'),2);assert.equal(p.attributePoints,6);
});
test('bulk skills respect unlocking and rank 20, leaving points when no skill has room', () => {
  const p=skills({level:1}); assert.equal(allocateSkill(p,'ultimate','max'),0);
  assert.equal(allocateSkill(p,'skill1',20),0); assert.equal(allocateSkill(p,'skill1',10),10);
  assert.equal(allocateSkill(p,'skill1','max'),9); assert.equal(p.skillRanks.skill1,20); assert.equal(p.skillPoints,11);
  assert.equal(applySkillRecommendation(p),0); p.level=5; assert.equal(applySkillRecommendation(p),11);
  const full=skills({skillPoints:80,skillRanks:{skill1:20,skill2:20,ultimate:20}});
  assert.equal(sum(recommendSkills(full)),0); assert.equal(applySkillRecommendation(full),0);assert.equal(full.skillPoints,80);
});
test('recommendations preserve existing assignments, spend available points, differ by school and preview is pure', () => {
  const plans=[];
  for(const faction of FACTIONS) {
    const p=normalizeIdle({attributePoints:100}); const snapshot=JSON.stringify(p); const plan=recommendAttributes(p,faction.id);
    assert.equal(JSON.stringify(p),snapshot); assert.equal(sum(plan),100);
    assert.deepEqual(Object.values(plan),ATTRIBUTE_BUILDS[faction.id].map(n=>n*10)); plans.push(JSON.stringify(plan));
    assert.equal(applyAttributeRecommendation(p,faction.id),100); assert.equal(p.attributePoints,0);
    const s=skills({factionId:faction.id,skillPoints:80});const ranks={...s.skillRanks};assert.equal(applySkillRecommendation(s),59);
    assert.equal(s.skillPoints,21); for(const key of Object.keys(ranks)) assert.equal(s.skillRanks[key],20);
    p.attributes.strength=99999;p.attributePoints=10;const before=sum(p.attributes);assert.equal(applyAttributeRecommendation(p,faction.id),10); assert.equal(sum(p.attributes),before+10);
  }
  assert.ok(new Set(plans).size>=5);
});
test('automatic allocation is opt-in on old saves and persisted on new saves', () => {
  const old=normalizeIdle();assert.equal(old.autoAttributes,false);assert.equal(old.autoSkillPoints,false);
  const p=normalizeIdle({autoAttributes:true,autoSkillPoints:true});assert.equal(p.autoAttributes,true);assert.equal(p.autoSkillPoints,true);
  assert.equal(normalizeIdle({autoAttributes:'true'}).autoAttributes,false);
});
test('last realms have bounded, continuous gaps and the final phases use the preceding span', () => {
  assert.deepEqual(REALMS.slice(-4).map(r=>r.minPower),[10e9,12e9,14.5e9,17.5e9]);
  for(let i=20;i<REALMS.length;i++) assert.ok(REALMS[i].minPower/REALMS[i-1].minPower<=1.25);
  for(const [n, phase] of ['Sơ kỳ','Trung kỳ','Hậu kỳ','Đỉnh phong','Đại viên mãn'].entries()) assert.equal(cultivationForPower(17.5e9+n*.6e9).phase,phase);
  assert.equal(cultivationForPower(19.9e9).nextPower,null);
});
