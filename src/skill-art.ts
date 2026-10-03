import { SECTS, SKILL_KEYS, type SectId, type SkillDefinition, type SkillKey } from "./sects.ts";

export interface SkillPalette { color: string; light: string; accent: string; dark: string }
export const SKILL_PALETTES: Record<SectId, SkillPalette> = {
  "thieu-lam": { color: "#ffc85a", light: "#fff6d2", accent: "#ec8a35", dark: "#37200c" },
  "thien-vuong": { color: "#ffda79", light: "#fffbea", accent: "#72e3df", dark: "#18302f" },
  "duong-mon": { color: "#55ecae", light: "#e7fff2", accent: "#ffa55b", dark: "#102e26" },
  "ngu-doc": { color: "#baf46b", light: "#f2ffcc", accent: "#c781ff", dark: "#281838" },
  "nga-mi": { color: "#ffaace", light: "#fff7fb", accent: "#a0f0d9", dark: "#361e36" },
  "thuy-yen": { color: "#76dfff", light: "#efffff", accent: "#98aeff", dark: "#162c47" },
  "cai-bang": { color: "#ffab4e", light: "#fff3b7", accent: "#ff643f", dark: "#3c1c14" },
  "thien-nhan": { color: "#ff6688", light: "#ffe9da", accent: "#b489ff", dark: "#301529" },
  "vo-dang": { color: "#92ceff", light: "#f3fcff", accent: "#a4efed", dark: "#152d48" },
  "con-lon": { color: "#bda4ff", light: "#fff8d6", accent: "#ffe177", dark: "#272044" },
};
const byName = new Map<string, { sect: SectId; key: SkillKey }>();
for (const sect of Object.values(SECTS)) for (const key of SKILL_KEYS) byName.set(sect.kit[key].name, { sect: sect.id, key });
export const visualIdentity = (skill: SkillDefinition) => byName.get(skill.name);
let serial = 0;
const rotate = (content: string, angle: number, x = 32, y = 32) => `<g transform="translate(${x} ${y}) rotate(${angle})">${content}</g>`;
const lance = '<path d="M0-25-5-14-2-8v29h4V-8l3-6z"/><path d="M0-22V16" fill="none" stroke-width="1"/><path d="M-6-6H6M-4 17h8" fill="none"/>';
const sword = '<path d="M0-24-4-16-3 9h6l1-25z"/><path d="M0-21V9M-8 10H8M-2 11v8h4v-8" fill="none"/>';
const dagger = '<path d="M0-21-3-12-2 9h4l1-21zM-5 9h10l-3 3v7h-4v-7z"/>';
const leaf = '<path d="M0-20C-14-13-12-2 0 7c12-9 14-20 0-27Z"/>';
const blade = '<path d="M0-23C14-10 12 4-3 14L0-7-8 17-12 19l3-9z"/><path d="M-13 17l9 4M-12 20l-4 7" fill="none"/>';
const bolt = '<path d="m3-25-14 27h10l-4 23L14-5H4l6-20z"/>';
const dragon = '<path d="M-25 17C-12 23 6 10-3 3S-19-7-7-12s17 7 24-3l9 4-8 11-8-1C0 3 20 21-2 25" fill="none" stroke-width="6"/><path d="m11-15 3-10 5 9m-7 10 10-2m-8 0 8 8" fill="none"/><circle cx="20" cy="-12" r="1.8" fill="#fff7db" stroke="none"/>';

function iconArt(sect: SectId, key: SkillKey, accent: string): string {
  const ult = key === "ultimate", second = key === "skill2";
  const ring = '<circle cx="32" cy="32" r="21" fill="none" opacity=".65"/>';
  switch (sect) {
    case "thieu-lam":
      if (!second && !ult) return '<path d="M7 39C4 17 23 4 47 9L37 13C18 13 13 29 7 39" opacity=".6"/>' + rotate('<path d="M-3-24h6v48h-6z"/><path d="M-4-20h8M-4 20h8M0-16v32" fill="none"/>', 42);
      if (second) return ring + '<path d="M16 47h32l-5-9V25c0-15-22-15-22 0v13z"/><path d="M25 17h14M18 43h28M28 51h8" fill="none" stroke-width="2"/>';
      return ring + '<path d="M20 46 15 32c-2-5 4-8 6-2l2 4V18c0-5 5-5 5 0v11-16c0-5 5-5 5 0v16-14c0-4 5-4 5 0v16-10c0-4 5-4 5 0v18c0 8-6 14-14 14z"/><path d="M23 40q9-9 16 0" fill="none"/>';
    case "thien-vuong":
      if (ult) return ring + Array.from({ length: 6 }, (_, i) => rotate(lance, i * 60)).join('') + '<circle cx="32" cy="32" r="5"/>';
      return (second ? `<path d="M8 40C6 12 34 2 52 24M12 48C37 58 57 31 46 13" fill="none" stroke="${accent}" stroke-width="3"/>` : '<path d="m9 48 6-2M8 38l8-5m8 21 3-6" fill="none" opacity=".7"/>') + rotate(lance, second ? 60 : 42);
    case "duong-mon":
      if (second) return ring + `<g stroke="${accent}"><path d="M20 16h24v31H20z"/><path d="m16 27 32 10m-32 0 32-10" fill="none"/></g><circle cx="32" cy="32" r="10"/><circle cx="32" cy="32" r="4" fill="${accent}"/>`;
      if (ult) return '<path d="M9 46a29 29 0 0 1 46 0" fill="none" stroke-width="2"/>' + Array.from({length: 7},(_,i)=>rotate(dagger, -66+i*22,32,40)).join('');
      return [-12,0,12].map((x,i)=>rotate(dagger,42,32+x,32+(i-1)*5)).join('');
    case "ngu-doc":
      if (second) return ring + `<path d="m32 8 7 18 20 2-15 12 4 20-16-11-16 11 4-20L5 28l20-2z" fill="none" stroke="${accent}" stroke-width="2"/><path d="M32 23c-4 8-9 10-9 17a9 9 0 0 0 18 0c0-7-5-9-9-17z"/>`;
      if (ult) return `<path d="M26 45C6 55 9 27 19 26c9-1 1-15 9-18s15 5 8 11" fill="none" stroke="${accent}" stroke-width="5"/><ellipse cx="34" cy="36" rx="8" ry="12"/><path d="M28 30 17 19l-6 5 6 5m24 1 10-11 6 5-6 5M26 36l-12 4m13 4-9 8m23-16 11 4m-12 4 8 8" fill="none" stroke-width="2"/>`;
      return '<path d="M32 51c-15-2-18-14-7-19-16-11-13-25 7-27 20 2 23 16 7 27-9 4 6 10 9 1" fill="none" stroke-width="7"/><path d="M24 18l6 3m10-3-6 3M27 29l5 8 5-8" fill="none"/>';
    case "nga-mi": {
      const petals = ult ? 9 : 5;
      return (second ? `<path d="m32 7 22 9v15c0 14-22 26-22 26S10 45 10 31V16z" fill="none" stroke="${accent}" stroke-width="2"/>` : '') + Array.from({length:petals},(_,i)=>rotate(leaf,i*360/petals)).join('') + `<ellipse cx="32" cy="40" rx="16" ry="5" fill="${accent}" stroke="none" opacity=".7"/><circle cx="32" cy="32" r="${ult?8:5}" fill="#fff7fb"/><path d="M32 28v8m-4-4h8" stroke="${accent}" stroke-width="2"/>`;
    }
    case "thuy-yen":
      if (!second && !ult) return '<path d="M32 54 7 21a36 36 0 0 1 50 0z"/>' + [-36,-24,-12,0,12,24,36].map(a=>`<path d="M32 54 32 15" fill="none" transform="rotate(${a} 32 54)" opacity=".5"/>`).join('') + '<path d="M10 23q22-22 44 0" fill="none"/>';
      if (second) return ring + '<path d="m32 13 13 13-13 25-13-25z"/><path d="m19 26 13 8 13-8M32 13v38" fill="none"/>' + [0,90,180,270].map(a=>rotate('<path d="m0-29-3 5 3 5 3-5z"/>',a)).join('');
      return [-14,0,14].map((x,i)=>rotate('<path d="m0-26-7 18 3 23 4 9 4-9 3-23z"/><path d="M0-24v45m-7-8 7 4 7-4" fill="none"/>',i===0?-16:i===2?16:0,32+x,31+i%2*5)).join('');
    case "cai-bang":
      if (second) return '<path d="M27 10h10l-3 8c15 9 5 15 4 17 21 21-34 30-19 3 3-5 12-7 5-13-4-4-3-9 3-15z"/><path d="M21 34q12-6 21 0M24 46q9 5 15-1" fill="none"/><path d="M9 26q-7 19 9 29M48 9q17 21 6 36" fill="none" opacity=".8"/>';
      return (ult ? ring + '<g transform="translate(32 32) scale(.76)">' + rotate(dragon,180,0,0) + '</g>' : '') + rotate(dragon,ult?-20:0);
    case "thien-nhan":
      if (second) return `<path d="M8 17h18M4 29h19M8 42h17" fill="none" stroke="${accent}" stroke-width="3"/><path d="M31 14 49 9l9 25-21 17-10-23z"/><path d="m34 25 17-3-8 10z" fill="${accent}"/><path d="m39 41 11-8" fill="none"/>`;
      if (ult) return ring + Array.from({length:6},(_,i)=>rotate(blade,i*60)).join('') + '<circle cx="32" cy="32" r="7" fill="#301529"/>';
      return rotate(blade,40,25,29) + rotate(blade,-40,41,31);
    case "vo-dang":
      if (second) return '<circle cx="32" cy="32" r="23" fill="#122239"/><path d="M32 9a23 23 0 0 1 0 46c-15 0-15-23 0-23s15-23 0-23Z" fill="#f3fcff"/><circle cx="32" cy="20" r="4" fill="#122239"/><circle cx="32" cy="44" r="4" fill="#f3fcff" stroke="none"/>';
      if (ult) return ring + [-60,-40,-20,0,20,40,60].map(a=>rotate(sword,a,32,37)).join('');
      return '<path d="M10 49C-2 28 24 4 49 10 27 11 11 33 10 49" opacity=".6"/>' + rotate(sword,38);
    case "con-lon":
      if (second) return `<path d="M18 8h28v47H18z" fill="${accent}"/><path d="M22 13h20M23 50h18" stroke="#56376d" fill="none"/>` + '<g transform="translate(32 31) scale(.6)">' + bolt + '</g>';
      return (ult ? '<path d="M9 24c-8-12 10-22 17-12C34 0 51 8 48 18c15-1 15 13 6 13H12" fill="none" stroke-width="3"/>' + rotate(bolt,0,22,37) + rotate(bolt,18,44,39) : rotate(bolt,22));
  }
}

export function skillIconMarkup(skill: SkillDefinition, key: SkillKey, fallback: string): string {
  const identity = visualIdentity(skill), sect = identity?.sect ?? "vo-dang", palette = SKILL_PALETTES[sect];
  const id = `skill-art-${++serial}`, color = identity ? palette.color : fallback;
  return `<svg viewBox="0 0 64 64" aria-hidden="true" data-motif="${skill.motif}" data-icon-skill="${key}" data-visual="${sect}-${key}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}-halo"><stop stop-color="${color}" stop-opacity=".45"/><stop offset="1" stop-color="${palette.dark}"/></radialGradient><linearGradient id="${id}-ink" x2=".6" y2="1"><stop stop-color="${palette.light}"/><stop offset=".4" stop-color="${color}"/><stop offset="1" stop-color="${palette.accent}"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#${id}-halo)" stroke="${key === "ultimate" ? "#ffe8a6" : color}" stroke-width="1.5"/><circle cx="32" cy="32" r="27" fill="none" stroke="${color}" stroke-opacity=".35"/><g fill="url(#${id}-ink)" stroke="${palette.light}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${iconArt(sect,key,palette.accent)}</g><path d="m10 9 3 4-4-1m42 36 3 4-4-1" fill="${palette.light}" opacity=".8"/></svg>`;
}
