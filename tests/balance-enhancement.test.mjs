import test from 'node:test';
import assert from 'node:assert/strict';
import { RARITIES, RARITY_STRENGTH, MAX_ENHANCEMENT, EQUIPMENT_BALANCE_VERSION, equipmentPrimaryPower, rollGearBonuses, gearStats, loadoutStats, enhancementInfo, attemptEnhancement, enhancementAffixes, migrateEquipmentBalance, emptyStats } from '../src/equipment.ts';
import { combatModifiers, secondaryScore } from '../src/gear-stats.ts';
import { combatPower, cultivationForPower } from '../src/cultivation.ts';
import { EQUIPMENT_SLOTS } from '../src/gear-catalog.ts';
import { HEALTH_COLORS, playerHealthRelation } from '../src/health-bars.ts';
import { equipmentVisualState } from '../src/equipment-vfx.ts';
import { equipmentMarkup, equipmentEffectLabel } from '../src/equipment-art.ts';
const piece = (changes={}) => ({ id:'forge-test', slot:'weapon', level:80, rarity:'Hoàng Kim', power:700, enhance:0, bonuses:{attack:80,crit:5}, balanceVersion:EQUIPMENT_BALANCE_VERSION, ...changes });

test('hostility takes precedence over teammates; neutral players do not get an allied health bar',()=>{
  assert.equal(playerHealthRelation(true,true),'hostile');
  assert.equal(playerHealthRelation(true,false,true),'hostile');
  assert.equal(playerHealthRelation(false,true),'ally');
  assert.equal(playerHealthRelation(false,false),'neutral');
  assert.equal(playerHealthRelation(false,false,true),'self');
  assert.equal(HEALTH_COLORS.ally,HEALTH_COLORS.self);
  assert.notEqual(HEALTH_COLORS.hostile,HEALTH_COLORS.ally);
  assert.notEqual(HEALTH_COLORS.neutral,HEALTH_COLORS.ally);
});

test('rarity separates same-level primary stats even between the worst high-quality and best low-quality roll',()=>{
  assert.deepEqual(RARITY_STRENGTH,[1,1.4,2,3,4.5,6.8,10]);
  for(const level of [1,10,80,160]) for(const slot of EQUIPMENT_SLOTS) for(let tier=1;tier<RARITIES.length;tier++){
    assert.ok(equipmentPrimaryPower(level,RARITIES[tier],slot,()=>0)>equipmentPrimaryPower(level,RARITIES[tier-1],slot,()=>1),`${level}/${slot}/${RARITIES[tier]}`);
  }
  const rolls=RARITIES.map(r=>rollGearBonuses(160,r,'weapon',()=>.5));
  for(let i=1;i<rolls.length;i++) assert.ok(rolls[i].attack>rolls[i-1].attack);
});

test('old gear is rebalanced once without rerolling or losing identity, affixes, enhancement or set',()=>{
  for(const rarity of RARITIES){
    const old=piece({rarity,enhance:10,balanceVersion:undefined,setId:'kim-phong',element:'kim',bonuses:{attack:10,hp:100,crit:2,mp:0}});
    const initial=structuredClone(old);migrateEquipmentBalance(old);
    assert.equal(old.id,initial.id);assert.equal(old.setId,initial.setId);assert.equal(old.enhance,10);
    assert.ok(old.power>=initial.power);assert.ok(old.bonuses.attack>=initial.bonuses.attack);assert.equal(old.bonuses.mp,0);
    assert.deepEqual(Object.keys(old.bonuses),Object.keys(initial.bonuses));
    const upgraded=JSON.stringify(old);migrateEquipmentBalance(old);assert.equal(JSON.stringify(old),upgraded);
    assert.deepEqual(gearStats(migrateEquipmentBalance(JSON.parse(upgraded))),gearStats(old));
  }
  assert.throws(()=>migrateEquipmentBalance(piece({balanceVersion:999})),/save-invalid/);
});

test('all 100 upgrade steps cost resources exactly once and have a strictly decreasing success rate',()=>{
  const gear=piece(),owner={gold:1e9,refiningStones:1e6};let previousChance=Infinity;
  for(let rank=0;rank<MAX_ENHANCEMENT;rank++){
    const info=enhancementInfo(gear),before=structuredClone(owner),stats=gearStats(gear);
    assert.equal(info.capped,false);assert.ok(info.chance<previousChance);previousChance=info.chance;
    assert.equal(attemptEnhancement(gear,owner,()=>0),'success');assert.equal(gear.enhance,rank+1);
    assert.equal(owner.gold,before.gold-info.cost);assert.equal(owner.refiningStones,before.refiningStones-info.stones);
    assert.ok(gearStats(gear).attack>stats.attack);
  }
  assert.equal(previousChance,.015);assert.equal(gear.enhance,100);
  const before=JSON.stringify([gear,owner]);assert.equal(attemptEnhancement(gear,owner,()=>{throw Error('must not roll')}),'capped');assert.equal(JSON.stringify([gear,owner]),before);
  assert.equal(enhancementInfo(piece({enhance:99})).stones,10);
});

test('failure at +99 keeps every stat and affix; insufficient high-rank materials never charge',()=>{
  const gear=piece({enhance:99}),info=enhancementInfo(gear),owner={gold:info.cost*2,refiningStones:20};const before=JSON.stringify(gear);
  assert.equal(attemptEnhancement(gear,owner,()=>.99),'failed');assert.equal(JSON.stringify(gear),before);
  assert.equal(owner.gold,info.cost);assert.equal(owner.refiningStones,10);
  owner.refiningStones=9;const poor=JSON.stringify(owner);assert.equal(attemptEnhancement(gear,owner,()=>{throw Error('must not roll')}),'poor');assert.equal(JSON.stringify(owner),poor);
});

test('each decade opens a missing affix without changing the saved roll or duplicating present lines',()=>{
  const gear=piece(),stored=JSON.stringify(gear.bonuses);
  for(let rank=0;rank<=100;rank++){
    gear.enhance=rank;const extra=enhancementAffixes(gear);
    assert.equal(Object.keys(extra).length,Math.min(Math.floor(rank/10),12));
    for(const key of Object.keys(extra)){assert.equal(gear.bonuses[key],undefined);assert.ok(gearStats(gear)[key]>0)}
    assert.equal(JSON.stringify(gear.bonuses),stored);
  }
  const complete=piece({enhance:100,bonuses:Object.fromEntries(Object.keys(emptyStats()).map(k=>[k,1]))});assert.deepEqual(enhancementAffixes(complete),{});
});

test('high ranks increase primary stat gains while advanced affix caps still prevent immunity and infinite attack speed',()=>{
  const gain=rank=>gearStats(piece({enhance:rank+1})).attack-gearStats(piece({enhance:rank})).attack;
  assert.ok(gain(98)>gain(50));assert.ok(gain(50)>gain(1));
  const stats=gearStats(piece({enhance:100,bonuses:Object.fromEntries(Object.keys(emptyStats()).map(k=>[k,1000]))}));
  const caps=combatModifiers(stats);assert.equal(caps.damageReduction,50);assert.equal(caps.dodge,35);assert.equal(caps.attackSpeed,80);assert.equal(caps.lifeSteal,20);
  assert.equal(secondaryScore({...emptyStats(),crit:280}),secondaryScore({...emptyStats(),crit:28}),'unusable crit does not inflate power');
});

test('realistic level-160 equipment progresses through the new realms without cubic power inflation',()=>{
  const power=(rarity,enhance)=>{
    const items=EQUIPMENT_SLOTS.map(slot=>piece({slot,level:160,rarity,enhance,power:equipmentPrimaryPower(160,rarity,slot,()=>.5),bonuses:rollGearBonuses(160,rarity,slot,()=>.5)}));
    const s=loadoutStats(items);return combatPower(1200+s.attack,600+s.defense,6000+s.hp+Math.floor(s.defense*1.45),secondaryScore(s));
  };
  const plain=power('Tốt',0),gold=power('Hoàng Kim',50),mythic=power('Thần Thoại',100);
  assert.ok(plain<gold&&gold<mythic);assert.ok(mythic<25e6);assert.equal(cultivationForPower(mythic).realm.name,'Vô Cực');
  const base=combatPower(100,50,1000);assert.equal(combatPower(200,100,2000),base*2);
});

test('+100 is displayed as the maximum in icons and high-forge effects stay bounded in simple mode',()=>{
  for(const enhance of [10,30,60,90,100]){
    const gear=piece({enhance});assert.equal(equipmentVisualState(gear).enhance,enhance);assert.ok(equipmentVisualState(gear).motes<=12);assert.equal(equipmentVisualState(gear,true).motes,0);
    assert.match(equipmentEffectLabel(gear.rarity,enhance),new RegExp(`\\+${enhance}`));
    const art=equipmentMarkup('weapon','#ffd35a',gear.rarity,'',gear);assert.match(art,new RegExp(`data-enhancement="${enhance}"`));
    if(enhance===100)assert.match(art,/enhanced-max/);else assert.doesNotMatch(art,/enhanced-max/);
  }
});
