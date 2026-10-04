import test from 'node:test';
import assert from 'node:assert/strict';
import { MARTIAL_PATHS, DEFAULT_MARTIAL_PATH, martialPath, martialSect, martialSkillNamed, validMartialPath } from '../src/martial-paths.ts';
import { SECTS, SKILL_KEYS, selectSkillTargets } from '../src/sects.ts';
import { skillUsesFlight } from '../src/skill-flight.ts';
import { skillIconMarkup } from '../src/skill-art.ts';
import { drawMartialEffect, drawMartialProjectile } from '../src/martial-effects.ts';

test('ten sects expose twenty real weapon paths and sixty researched active moves',()=>{
  assert.equal(Object.keys(MARTIAL_PATHS).length,10);
  const styles=new Set(), names=new Set();
  for(const [sect,paths] of Object.entries(MARTIAL_PATHS)) {
    assert.equal(paths.length,2);assert.notEqual(paths[0].id,paths[1].id);
    for(const p of paths) {
      styles.add(p.art);
      for(const [i,key] of SKILL_KEYS.entries()) {
        const s=p.kit[key];names.add(s.name);
        assert.equal(s.sectId,sect);assert.equal(s.pathId,p.id);assert.equal(s.art,p.art);
        assert.ok(Number.isInteger(s.sourceId)&&s.sourceId>0);assert.equal(s.unlock,[1,3,5][i]);
        assert.ok(s.range>0&&s.radius>0&&s.cooldown>0&&s.mp>0&&s.mp<=SECTS[sect].baseMp);
        assert.equal(skillUsesFlight(s),s.damage>0&&s.projectile&&!s.dash);
        assert.deepEqual(martialSkillNamed(sect,s.name),{key,definition:s});
      }
    }
  }
  assert.equal(styles.size,20);assert.equal(names.size,60);
});

test('JX1 weapon distinctions and signature moves remain on the correct paths',()=>{
  assert.equal(martialPath('thieu-lam','staff').kit.ultimate.name,'Hoành Tảo Thiên Quân');
  assert.equal(martialPath('thieu-lam','blade').kit.ultimate.name,'Vô Tướng Trảm');
  assert.equal(martialPath('thien-vuong','spear').kit.ultimate.sourceId,323);
  assert.equal(martialPath('thien-vuong','hammer').kit.ultimate.sourceId,325);
  assert.equal(martialPath('duong-mon','dart').kit.ultimate.sourceId,339);
  assert.equal(martialPath('duong-mon','bolts').kit.ultimate.sourceId,302);
  assert.equal(martialPath('thien-nhan','halberd').weapon,'halberd');
  assert.equal(martialPath('thien-nhan','blade').kit.ultimate.name,'Thiên Ngoại Lưu Tinh');
  assert.equal(martialPath('thuy-yen','blade').weapon,'blade');
  assert.equal(martialPath('thuy-yen','twins').weapon,'daggers');
  assert.equal(martialPath('nga-mi','sword').kit.ultimate.name,'Tam Nga Tề Tuyết');
  assert.equal(martialPath('nga-mi','palm').weapon,undefined);
  assert.equal(martialPath('cai-bang','palm').kit.ultimate.name,'Phi Long Tại Thiên');
  assert.equal(martialPath('cai-bang','staff').kit.ultimate.name,'Thiên Hạ Vô Cẩu');
});

test('old saves get stable defaults without changing school base stats; foreign and malformed choices are rejected',()=>{
  for(const sect of Object.keys(SECTS)) {
    assert.equal(martialPath(sect).id,DEFAULT_MARTIAL_PATH[sect]);assert.equal(validMartialPath(sect,undefined),true);
    for(const bad of [null,0,{},'__proto__','constructor','unknown']) assert.equal(validMartialPath(sect,bad),false);
    for(const p of MARTIAL_PATHS[sect]) {
      assert.equal(validMartialPath(sect,p.id),true);
      const s=martialSect(sect,p.id);
      for(const key of ['baseHp','baseMp','baseAttack','baseDefense','speed','element'])assert.equal(s[key],SECTS[sect][key]);
      assert.equal(s.basicRange,p.basicRange);assert.equal(martialSect(sect,p.id),s);
    }
  }
  assert.equal(validMartialPath('thieu-lam','qi'),false);
});

test('all targeted paths reject dead and out-of-range enemies; defensive skills work without a target',()=>{
  const actor={x:0,y:0};
  for(const paths of Object.values(MARTIAL_PATHS)) for(const p of paths) for(const s of Object.values(p.kit)) {
    const edge={id:'edge',x:s.range+10,y:0,radius:10,dead:false};
    if(s.requiresTarget) {
      assert.equal(selectSkillTargets(s,actor,[edge],edge).valid,true);
      assert.equal(selectSkillTargets(s,actor,[{...edge,x:edge.x+.01}],{...edge,x:edge.x+.01}).valid,false);
      assert.equal(selectSkillTargets(s,actor,[{...edge,dead:true}],{...edge,dead:true}).valid,false);
    } else assert.equal(selectSkillTargets(s,actor,[]).valid,true);
  }
});

test('twenty path icons preserve their visual identity in every skill slot',()=>{
  const identities=new Set();
  for(const [id,paths] of Object.entries(MARTIAL_PATHS)) for(const p of paths) for(const key of SKILL_KEYS){
    const icon=skillIconMarkup(p.kit[key],key,SECTS[id].color);
    assert.match(icon,new RegExp(`data-visual="${id}-${p.id}-${key}"`));assert.match(icon,new RegExp(`data-martial-art="${p.art}"`));
    assert.doesNotMatch(icon,/undefined|NaN/);identities.add(`${id}/${p.id}/${key}`);
  }
  assert.equal(identities.size,60);
});

function traceContext() {
  const commands=[];let depth=0;
  const target={globalAlpha:1};
  const c=new Proxy(target,{get:(o,k)=> k in o?o[k]:(...args)=>{
    if(k==='save')depth++;if(k==='restore')depth--;
    for(const n of args.filter(v=>typeof v==='number'))assert.ok(Number.isFinite(n));
    commands.push([k,...args]);
  },set:(o,k,v)=>{o[k]=v;commands.push([k,v]);return true}});
  return {c,commands,depth:()=>depth};
}
test('cast, release, impact and flight draw bounded distinct geometry; simple mode reduces contact particles',()=>{
  const signatures=new Set();
  for(const [sect,paths] of Object.entries(MARTIAL_PATHS))for(const p of paths){
    const full=traceContext(),simple=traceContext();
    for(const phase of ['cast','release','impact'])drawMartialEffect(full.c,{x:10,y:20,radius:80,sect,art:p.art,skill:'ultimate',phase},.5);
    drawMartialEffect(simple.c,{x:10,y:20,radius:80,sect,art:p.art,skill:'ultimate',phase:'impact',quality:'simple'},.5);
    const contact=traceContext();drawMartialEffect(contact.c,{x:10,y:20,radius:80,sect,art:p.art,skill:'ultimate',phase:'impact'},.5);
    assert.ok(contact.commands.length>simple.commands.length);assert.equal(full.depth(),0);assert.equal(simple.depth(),0);
    assert.ok(full.commands.length<1400);assert.ok(full.commands.length>25);signatures.add(JSON.stringify(full.commands));
    const flight=traceContext();drawMartialProjectile(flight.c,0,0,.3,sect,p.art,'skill1',1000,false,p.kit.skill1.motif);
    assert.equal(flight.depth(),0);assert.ok(flight.commands.length>15);
    assert.ok(!full.commands.some(x=>['createLinearGradient','createRadialGradient','filter','shadowBlur'].includes(x[0])));
  }
  assert.equal(signatures.size,20);
});
