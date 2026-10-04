import type { MartialArt, SkillKey } from "./sects.ts";
import { JX1_SKILL_REFERENCE } from "./jx1-skill-reference.ts";

export type SkillDelivery = "travel" | "ground" | "melee" | "self";
export type SkillPattern = "single" | "sweep" | "fan" | "spiral" | "rain" | "burst" | "guard" | "storm";
export type SkillContact = "slash" | "shards" | "flame" | "venom" | "lightning" | "radiance";
export interface MartialVisual {
  sourceId: number;
  delivery: SkillDelivery;
  pattern: SkillPattern;
  streams: number;
  contact: SkillContact;
}
const v = (sourceId: number, delivery: SkillDelivery, pattern: SkillPattern, streams: number, contact: SkillContact): MartialVisual =>
  ({ sourceId, delivery, pattern, streams, contact });
// Presentation is authored for this renderer. Source tables distinguish moving
// missiles, point effects, radial waves and self buffs; counts stay bounded here.
export const MARTIAL_VISUALS: Record<MartialArt, readonly [MartialVisual, MartialVisual, MartialVisual]> = {
  staff: [v(10,"melee","single",1,"slash"), v(11,"self","sweep",6,"slash"), v(319,"self","burst",6,"radiance")],
  saber: [v(19,"travel","fan",2,"slash"), v(20,"self","burst",3,"radiance"), v(321,"travel","fan",2,"slash")],
  spear: [v(30,"melee","single",2,"slash"), v(35,"melee","single",3,"slash"), v(323,"melee","fan",5,"radiance")],
  hammer: [v(29,"melee","single",1,"radiance"), v(324,"melee","sweep",2,"radiance"), v(325,"melee","burst",3,"radiance")],
  dart: [v(50,"travel","fan",2,"venom"), v(340,"ground","spiral",6,"venom"), v(339,"travel","spiral",3,"venom")],
  bolts: [v(54,"ground","rain",5,"venom"), v(58,"travel","spiral",3,"venom"), v(302,"ground","rain",8,"venom")],
  "poison-saber": [v(65,"travel","single",1,"venom"), v(384,"self","burst",5,"venom"), v(355,"travel","fan",2,"venom")],
  "poison-palm": [v(63,"travel","single",1,"venom"), v(69,"self","guard",4,"venom"), v(353,"ground","burst",6,"venom")],
  "ice-swords": [v(85,"travel","single",1,"shards"), v(385,"travel","fan",2,"shards"), v(328,"travel","fan",3,"shards")],
  "lotus-palm": [v(80,"travel","single",1,"shards"), v(92,"self","guard",6,"radiance"), v(91,"self","burst",8,"shards")],
  "ice-saber": [v(99,"travel","single",1,"shards"), v(105,"ground","rain",4,"shards"), v(336,"travel","fan",5,"shards")],
  "ice-twins": [v(102,"melee","sweep",2,"shards"), v(111,"self","burst",3,"shards"), v(337,"travel","spiral",2,"shards")],
  "dragon-palm": [v(122,"travel","single",1,"flame"), v(128,"travel","fan",8,"flame"), v(357,"travel","fan",3,"flame")],
  "dog-staff": [v(119,"travel","single",1,"flame"), v(125,"self","sweep",8,"flame"), v(359,"travel","fan",3,"flame")],
  "fire-rain": [v(145,"travel","single",1,"flame"), v(148,"ground","burst",7,"flame"), v(362,"ground","rain",8,"flame")],
  "fire-spear": [v(135,"travel","single",1,"flame"), v(141,"self","sweep",8,"flame"), v(361,"melee","single",3,"flame")],
  "sword-array": [v(155,"travel","single",1,"lightning"), v(158,"ground","storm",3,"lightning"), v(368,"melee","fan",3,"lightning")],
  qi: [v(153,"travel","single",1,"lightning"), v(157,"self","guard",4,"radiance"), v(365,"ground","storm",5,"lightning")],
  "wind-saber": [v(169,"travel","single",1,"lightning"), v(176,"travel","spiral",2,"lightning"), v(372,"travel","fan",3,"lightning")],
  thunder: [v(172,"travel","single",3,"lightning"), v(179,"ground","storm",3,"lightning"), v(375,"ground","storm",4,"lightning")],
};
export function martialVisual(art: MartialArt, key: SkillKey = "skill1"): MartialVisual {
  return MARTIAL_VISUALS[art][key === "skill1" ? 0 : key === "skill2" ? 1 : 2];
}
export function martialFlightSpeed(visual: MartialVisual): number {
  return Math.max(300, Math.min(1100, JX1_SKILL_REFERENCE[visual.sourceId].speed * 24));
}
