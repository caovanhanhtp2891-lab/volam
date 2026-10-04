import test from 'node:test';
import assert from 'node:assert/strict';
import { TITLES, normalizeJourney, unlockTitles, titleProgress, progressionBonuses, wornTitle } from '../src/character-progression.ts';
import { MILITARY_RANKS } from '../src/military.ts';
import { realmStyle, titleStyle, militaryStyle, fitPrestigeLabel, placePrestigeLabels } from '../src/prestige-art.ts';
import { militaryDragonSpec } from '../src/military-vfx.ts';
import { REALMS, cultivationForPower } from '../src/cultivation.ts';
const player=()=>({level:1,journey:normalizeJourney(),inventory:[],equipment:{},pendingItems:[],dungeonClears:{tomb:0,bamboo:0},goldenClears:[]});

test('28 unique titles have explicit rarity and preserve original stats',()=>{
  assert.equal(TITLES.length,28);assert.equal(new Set(TITLES.map(t=>t.id)).size,28);assert.equal(new Set(TITLES.map(t=>t.name)).size,28);
  for(const t of TITLES){assert.ok(Number.isInteger(t.rarity)&&t.rarity>=1&&t.rarity<=5);assert.ok(t.target>0);for(const value of Object.values(t.bonuses))assert.ok(value>0)}
  assert.deepEqual(TITLES.find(t=>t.id==='eternal').bonuses,{attack:120,defense:80,hp:600,crit:5});
});
test('new achievements unlock only at their real tower, territory and dungeon-run boundaries',()=>{
  for(const id of ['tower-guardian','sky-climber','sky-sovereign','city-lord','unifier','expedition-master']){
    const t=TITLES.find(v=>v.id===id), p=player();assert.equal(titleProgress(t,p),0);
    if(t.metric==='tower')p.tower={highestFloor:t.target-1};
    if(t.metric==='lands')p.military={captured:Array(t.target-1).fill('territory')};
    if(t.metric==='dungeonRuns')p.dungeonClears={tomb:1,bamboo:t.target-2};
    unlockTitles(p);assert.equal(p.journey.unlockedTitles.includes(id),false);
    if(t.metric==='tower')p.tower.highestFloor++;
    if(t.metric==='lands')p.military.captured.push('last');
    if(t.metric==='dungeonRuns')p.dungeonClears.bamboo++;
    unlockTitles(p);assert.equal(p.journey.unlockedTitles.includes(id),true);assert.deepEqual(unlockTitles(p),[]);
  }
});
test('all title conditions unlock at maximal progress; only the selected title adds stats and survives reload',()=>{
  const p=player();p.level=160;Object.assign(p.journey,{kills:10000,elites:500,bosses:1000,rebirths:20});p.tower={highestFloor:100};p.military={captured:Array(9).fill('land')};p.dungeonClears={tomb:50,bamboo:50};p.goldenClears=['boss'];p.inventory=[{enhance:10}];
  unlockTitles(p);assert.equal(p.journey.unlockedTitles.length,28);
  const before=progressionBonuses(p.journey);p.journey.activeTitle='sky-sovereign';const after=progressionBonuses(p.journey);
  assert.equal(after.attack-before.attack,160);assert.equal(after.defense-before.defense,100);assert.equal(after.critDamage-before.critDamage,12);
  const loaded=normalizeJourney(JSON.parse(JSON.stringify(p.journey)));assert.equal(wornTitle(loaded).id,'sky-sovereign');assert.deepEqual(progressionBonuses(loaded),after);
});
test('realm and title badges grow with prestige and military ranks each have distinct colors',()=>{
  let old={fontSize:0,glow:0};for(const r of REALMS){const s=realmStyle(cultivationForPower(r.minPower));assert.ok(s.fontSize>=16&&s.fontSize>=old.fontSize);assert.ok(s.glow>=old.glow);old=s}
  const sorted=[...TITLES].sort((a,b)=>a.rarity-b.rarity);for(let i=1;i<sorted.length;i++)assert.ok(titleStyle(sorted[i]).fontSize>=titleStyle(sorted[i-1]).fontSize);
  assert.equal(new Set(MILITARY_RANKS.map(r=>r.color)).size,7);
  for(let i=1;i<MILITARY_RANKS.length;i++){const a=militaryStyle(MILITARY_RANKS[i-1].id),b=militaryStyle(MILITARY_RANKS[i].id);assert.ok(b.fontSize>a.fontSize&&b.glow>a.glow)}
});
test('military dragons become larger at every rank and simple mode bounds rendering work',()=>{
  for(let i=0;i<MILITARY_RANKS.length;i++){const s=militaryDragonSpec(MILITARY_RANKS[i].id),small=militaryDragonSpec(MILITARY_RANKS[i].id,true);assert.equal(s.count,i>=4?2:1);assert.equal(small.count,1);assert.ok(small.segments<s.segments);if(i){const previous=militaryDragonSpec(MILITARY_RANKS[i-1].id);assert.ok(s.radius>previous.radius&&s.size>previous.size&&s.glow>previous.glow)}}
});
test('label stack keeps military above title above realm and avoids clipping at all camera edges',()=>{
  const labels=[{kind:'military',text:'Hoàng Đế',style:militaryStyle('hoang-de')},{kind:'title',text:'Chí Tôn',style:titleStyle(TITLES.at(-1))},{kind:'realm',text:'Vô Cực',style:realmStyle(cultivationForPower(19.9e9))}];
  for(const x of [20,300,580])for(const bottom of [45,290,800]){
    const rows=placePrestigeLabels(labels,[180,280,260],x,bottom,{left:10,right:590,top:10,bottom:490});
    for(let i=0;i<rows.length;i++){const row=rows[i];assert.ok(row.x-row.width/2>=10&&row.x+row.width/2<=590);assert.ok(row.y-row.label.style.height/2>=10&&row.y+row.label.style.height/2<=490);if(i)assert.ok(row.y-row.label.style.height/2>rows[i-1].y+rows[i-1].label.style.height/2)}
  }
});

test('fitting long badges respects available space without altering their prestige definition',()=>{
  const label={kind:'title',text:'Long achievement name',style:titleStyle(TITLES.find(t=>t.rarity===5))},before=JSON.stringify(label);
  const ctx={font:'',measureText(text){return {width:text.length*parseFloat(this.font.match(/[\d.]+(?=px)/)[0])*.6}}};
  const fit=fitPrestigeLabel(ctx,label,250);ctx.font=`800 ${fit.style.fontSize}px sans-serif`;
  assert.ok(ctx.measureText(label.text).width+52<=250+.01);assert.equal(JSON.stringify(label),before);assert.ok(fit.style.fontSize>=14);
});
