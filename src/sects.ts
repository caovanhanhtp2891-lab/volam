export type SectId = "thieu-lam" | "thien-vuong" | "duong-mon" | "ngu-doc" | "nga-mi" | "thuy-yen" | "cai-bang" | "thien-nhan" | "vo-dang" | "con-lon";
export type SkillKey = "skill1" | "skill2" | "ultimate";
export type EffectMotif = "staff" | "bell" | "spear" | "arrows" | "trap" | "poison" | "lotus" | "fan" | "frost" | "dragon" | "spiral" | "blades" | "shadow" | "taiji" | "swords" | "lightning";
export const HERO_SIZE = { width: 56, height: 76, radius: 12 } as const;
export const SKILL_KEYS: SkillKey[] = ["skill1", "skill2", "ultimate"];

// Keep the saved faction IDs from the idle campaign stable.
export const SECT_BY_FACTION: Record<string, SectId> = {
  shaolin: "thieu-lam", tianwang: "thien-vuong", tangmen: "duong-mon", wudu: "ngu-doc", emei: "nga-mi",
  cuiyan: "thuy-yen", gaibang: "cai-bang", tianren: "thien-nhan", wudang: "vo-dang", kunlun: "con-lon",
};

export interface SkillDefinition {
  name: string;
  description: string;
  motif: EffectMotif;
  shape: "target" | "area" | "cone" | "line" | "chain";
  anchor: "self" | "target";
  range: number;
  radius: number;
  damage: number;
  mp: number;
  cooldown: number;
  unlock: number;
  requiresTarget?: boolean;
  hits?: number;
  heal?: number;
  healOnHit?: boolean;
  shield?: number;
  dash?: boolean;
  breakArmor?: number;
  slow?: number;
  stun?: number;
  poison?: number;
  burn?: number;
  corrode?: number;
  zone?: number;
}

export interface Sect {
  id: SectId;
  name: string;
  element: string;
  title: string;
  description: string;
  color: string;
  accent: string;
  baseHp: number;
  baseMp: number;
  baseAttack: number;
  baseDefense: number;
  speed: number;
  basicRange: number;
  kit: Record<SkillKey, SkillDefinition>;
}

const skill = (name: string, description: string, motif: EffectMotif, changes: Partial<SkillDefinition> = {}): SkillDefinition => ({
  name, description, motif, shape: "target", anchor: "target", range: 170, radius: 70, damage: 1.65, mp: 8, cooldown: 4, unlock: 1, requiresTarget: true, ...changes,
});
const second = (name: string, description: string, motif: EffectMotif, changes: Partial<SkillDefinition> = {}) => skill(name, description, motif, { mp: 14, cooldown: 7, unlock: 3, ...changes });
const ultimate = (name: string, description: string, motif: EffectMotif, changes: Partial<SkillDefinition> = {}) => skill(name, description, motif, { shape: "area", anchor: "self", range: 210, radius: 180, damage: 3.1, mp: 20, cooldown: 15, unlock: 5, ...changes });

export const SECTS: Record<SectId, Sect> = {
  "thieu-lam": {
    id: "thieu-lam", name: "Thiếu Lâm", element: "Kim", title: "Côn pháp · Đỡ đòn", description: "Côn quét rộng, chuông vàng bảo vệ và chấn lực khống chế.", color: "#e9b657", accent: "#fff0be", baseHp: 165, baseMp: 80, baseAttack: 20, baseDefense: 11, speed: 140, basicRange: 82,
    kit: {
      skill1: skill("Vi Đà Côn", "Quét côn hình quạt, đánh nhiều quái phía trước.", "staff", { shape: "cone", anchor: "self", range: 155, radius: 125, damage: 1.6 }),
      skill2: second("Kim Chung Tráo", "Khiên 32% HP trong 5 giây, không cần mục tiêu.", "bell", { anchor: "self", requiresTarget: false, damage: 0, shield: .32, radius: 44 }),
      ultimate: ultimate("Đại Lực Kim Cang", "Chấn lực quanh mình, làm choáng quái; boss chịu choáng ngắn.", "bell", { stun: 1.2, radius: 175 }),
    },
  },
  "thien-vuong": {
    id: "thien-vuong", name: "Thiên Vương", element: "Kim", title: "Thương pháp · Xung phong", description: "Đâm thương, áp sát và phá giáp giữa vòng vây.", color: "#d7ba69", accent: "#d6efea", baseHp: 145, baseMp: 90, baseAttack: 21, baseDefense: 9, speed: 165, basicRange: 95,
    kit: {
      skill1: skill("Truy Tinh Thương", "Đâm một đường thẳng, phá giáp quái trúng đòn trong 4 giây.", "spear", { shape: "line", anchor: "self", range: 190, radius: 25, breakArmor: 4 }),
      skill2: second("Trục Nguyệt Bộ", "Lướt áp sát mục tiêu trong tầm; dừng trước vật cản.", "spear", { range: 285, dash: true, damage: 1.4 }),
      ultimate: ultimate("Bá Vương Phá Trận", "Thương trận đánh quanh mình, phá giáp và tạo khiên 18% HP.", "spear", { radius: 190, breakArmor: 5, shield: .18 }),
    },
  },
  "duong-mon": {
    id: "duong-mon", name: "Đường Môn", element: "Mộc", title: "Ám khí · Độc tiễn", description: "Ám khí tẩm độc bắn xa, cơ quan ghìm chân và độc tiễn tỏa quạt.", color: "#73c994", accent: "#cdeada", baseHp: 110, baseMp: 110, baseAttack: 24, baseDefense: 5, speed: 160, basicRange: 210,
    kit: {
      skill1: skill("Truy Tâm Tiễn", "Ba mũi ám tiễn tẩm độc liên tiếp, gây độc trong 3 giây.", "arrows", { range: 390, damage: .7, hits: 3, poison: 3 }),
      skill2: second("Lôi Hỏa Cơ Quan", "Đặt bẫy tại mục tiêu, gây sát thương mỗi giây và làm chậm trong 4 giây.", "trap", { shape: "area", range: 340, radius: 90, damage: .4, zone: 4, slow: .6 }),
      ultimate: ultimate("Bạo Vũ Lê Hoa", "Ba loạt ám khí tẩm độc tỏa quạt, gây độc trong 4 giây.", "arrows", { shape: "cone", radius: 280, range: 330, damage: 1.15, hits: 3, poison: 4 }),
    },
  },
  "ngu-doc": {
    id: "ngu-doc", name: "Ngũ Độc", element: "Mộc", title: "Độc thuật · Bào mòn", description: "Độc kéo dài, trận độc giữ quái và cổ thuật bào mòn boss.", color: "#b987da", accent: "#caec9a", baseHp: 115, baseMp: 135, baseAttack: 22, baseDefense: 5, speed: 145, basicRange: 190,
    kit: {
      skill1: skill("Độc Chưởng", "Độc chưởng tầm xa, độc gây sát thương và ăn mòn 28% giáp trong 3 giây.", "poison", { range: 340, damage: 1.2, poison: 3, corrode: 3 }),
      skill2: second("Ngũ Độc Trận", "Trận độc 4 giây tại mục tiêu, làm chậm, ăn mòn giáp và gây sát thương định kỳ.", "poison", { shape: "area", range: 320, radius: 105, damage: .4, zone: 4, slow: .65, corrode: 2 }),
      ultimate: ultimate("Vạn Cổ Phệ Tâm", "Cổ thuật đánh vùng, gây độc và ăn mòn 28% giáp trong 6 giây.", "poison", { anchor: "target", range: 360, radius: 175, damage: 2, poison: 6, corrode: 6 }),
    },
  },
  "nga-mi": {
    id: "nga-mi", name: "Nga Mi", element: "Thủy", title: "Liên hoa · Hồi phục", description: "Hoa sen hồi phục, khiên hộ thể và tuyệt chiêu cứu nguy.", color: "#ef9eba", accent: "#fff0f3", baseHp: 125, baseMp: 140, baseAttack: 18, baseDefense: 7, speed: 150, basicRange: 150,
    kit: {
      skill1: skill("Phật Quang Phổ Chiếu", "Hồi 22% HP, đồng thời đánh quái gần trong tầm 180.", "lotus", { anchor: "self", range: 180, requiresTarget: false, damage: .82, heal: .22 }),
      skill2: second("Liên Hoa Hộ Thể", "Khiên 28% HP trong 5 giây và hồi 8% HP.", "lotus", { anchor: "self", requiresTarget: false, damage: 0, shield: .28, heal: .08, radius: 48 }),
      ultimate: ultimate("Từ Hàng Phổ Độ", "Hồi 38% HP, tạo khiên 20% HP và đánh quái xung quanh.", "lotus", { requiresTarget: false, heal: .38, shield: .2, damage: 1.55, radius: 150 }),
    },
  },
  "thuy-yen": {
    id: "thuy-yen", name: "Thúy Yên", element: "Thủy", title: "Băng phiến · Làm chậm", description: "Quạt tuyết, băng trận và đóng băng nhiều mục tiêu.", color: "#7bc7ec", accent: "#e0f5ff", baseHp: 115, baseMp: 130, baseAttack: 22, baseDefense: 6, speed: 155, basicRange: 190,
    kit: {
      skill1: skill("Phi Tuyết Liên Thiên", "Quạt tuyết hình nón, làm chậm 3 giây.", "fan", { shape: "cone", anchor: "self", range: 260, radius: 200, slow: .45 }),
      skill2: second("Băng Tâm Ngọc Cốt", "Băng trận quanh mình, làm chậm và tạo khiên 15% HP.", "frost", { shape: "area", anchor: "self", requiresTarget: false, radius: 135, damage: 1.1, slow: .35, shield: .15 }),
      ultimate: ultimate("Băng Phong Vạn Lý", "Băng tinh đánh vùng và đóng băng quái; boss chịu hiệu ứng ngắn.", "frost", { anchor: "target", range: 360, radius: 175, damage: 2.6, stun: 1.4 }),
    },
  },
  "cai-bang": {
    id: "cai-bang", name: "Cái Bang", element: "Hỏa", title: "Chưởng pháp · Hỏa long", description: "Rồng lửa đánh vùng, túy quyền hồi sức và thiêu đốt.", color: "#e6a45d", accent: "#ffe6b8", baseHp: 105, baseMp: 125, baseAttack: 26, baseDefense: 5, speed: 145, basicRange: 150,
    kit: {
      skill1: skill("Giáng Long Chưởng", "Hỏa long đánh vùng quanh mục tiêu tầm xa, thiêu đốt 2 giây.", "dragon", { shape: "area", range: 360, radius: 100, damage: 1.35, burn: 2 }),
      skill2: second("Túy Điệp Cuồng Vũ", "Túy quyền đánh quanh mình và hồi 10% HP.", "spiral", { shape: "area", anchor: "self", requiresTarget: false, radius: 130, damage: 1.2, heal: .1 }),
      ultimate: ultimate("Phi Long Tại Thiên", "Rồng lửa giáng xuống vùng mục tiêu, để lại hỏa trận 3 giây.", "dragon", { anchor: "target", range: 400, radius: 170, damage: 3.1, zone: 3, burn: 3 }),
    },
  },
  "thien-nhan": {
    id: "thien-nhan", name: "Thiên Nhẫn", element: "Hỏa", title: "Song đao · Đột kích", description: "Hai nhát đao, ảnh bộ áp sát và vòng ma diệm hồi sức khi trúng.", color: "#e77177", accent: "#ffc6b6", baseHp: 120, baseMp: 100, baseAttack: 25, baseDefense: 6, speed: 175, basicRange: 80,
    kit: {
      skill1: skill("Liệt Hỏa Song Nhận", "Hai nhát đao chéo, thiêu đốt mục tiêu trong 2 giây.", "blades", { range: 155, damage: .98, hits: 2, burn: 2 }),
      skill2: second("Huyễn Ảnh Bộ", "Lướt áp sát, gây choáng ngắn và tạo khiên 10% HP.", "shadow", { range: 285, damage: 1.4, dash: true, stun: .6, shield: .1 }),
      ultimate: ultimate("Ma Diệm Thất Sát", "Song đao đánh vòng rộng; thiêu đốt 3 giây và hồi 15% HP nếu trúng quái.", "blades", { radius: 195, damage: 2.9, burn: 3, heal: .15, healOnHit: true }),
    },
  },
  "vo-dang": {
    id: "vo-dang", name: "Võ Đang", element: "Thổ", title: "Kiếm khí · Thái cực", description: "Kiếm khí xuyên tuyến, thái cực hộ thể và mưa kiếm.", color: "#96b4ee", accent: "#edf0ff", baseHp: 125, baseMp: 125, baseAttack: 23, baseDefense: 7, speed: 150, basicRange: 145,
    kit: {
      skill1: skill("Lưỡng Nghi Kiếm", "Kiếm khí theo đường thẳng, xuyên nhiều quái.", "swords", { shape: "line", anchor: "self", range: 280, radius: 30, damage: 1.6 }),
      skill2: second("Thái Cực Hộ Thể", "Thái cực làm chậm quái gần và tạo khiên 24% HP.", "taiji", { shape: "area", anchor: "self", requiresTarget: false, radius: 110, damage: .85, slow: .55, shield: .24 }),
      ultimate: ultimate("Vạn Kiếm Quy Tông", "Mưa kiếm đánh toàn vùng quanh mình, phá giáp 4 giây.", "swords", { radius: 205, breakArmor: 4 }),
    },
  },
  "con-lon": {
    id: "con-lon", name: "Côn Lôn", element: "Thổ", title: "Lôi pháp · Lan truyền", description: "Lôi điện nhảy giữa quái, lôi trận và thiên lôi khống chế.", color: "#78d4c4", accent: "#e6ffcf", baseHp: 130, baseMp: 115, baseAttack: 24, baseDefense: 7, speed: 145, basicRange: 190,
    kit: {
      skill1: skill("Ngũ Lôi Chưởng", "Tia sét nhảy tối đa 3 quái; mỗi bước giảm sát thương.", "lightning", { shape: "chain", range: 370, radius: 165, damage: 1.6 }),
      skill2: second("Lôi Động Cửu Thiên", "Lôi trận đánh vùng mục tiêu, làm choáng quái trúng đòn.", "lightning", { shape: "area", range: 350, radius: 110, damage: 1.2, stun: 1 }),
      ultimate: ultimate("Thiên Lôi Trấn Địa", "Thiên lôi rộng, làm choáng và phá giáp; boss chịu choáng ngắn.", "lightning", { anchor: "target", range: 400, radius: 180, damage: 3.25, stun: 1.3, breakArmor: 4 }),
    },
  },
};

export function resolveSectId(value: unknown): SectId | null {
  if (typeof value !== "string") return null;
  const aliases: Record<string, SectId> = { kim: "thien-vuong", hoa: "cai-bang", thuy: "nga-mi" };
  return Object.hasOwn(SECTS, value) ? value as SectId : Object.hasOwn(aliases, value) ? aliases[value] : null;
}

export function skillReachLabel(skill: SkillDefinition): string {
  if (!skill.requiresTarget && skill.damage === 0) return "Hộ thể · bản thân";
  if (skill.shape === "area" && skill.anchor === "self") return `Tầm đánh ${skill.radius} · quanh mình`;
  if (skill.shape === "area") return `Tầm đánh ${skill.range} · bán kính ${skill.radius}`;
  if (skill.shape === "cone") return `Tầm đánh ${skill.range} · hình quạt`;
  if (skill.shape === "line") return `Tầm đánh ${skill.range} · xuyên tuyến`;
  if (skill.shape === "chain") return `Tầm đánh ${skill.range} · lan ${skill.radius}`;
  return `Tầm đánh ${skill.range}${skill.dash ? " · lướt áp sát" : ""}`;
}

interface Point { x: number; y: number; }
export interface SkillTarget extends Point { id: string; radius: number; dead: boolean; }

export function selectSkillTargets<T extends SkillTarget>(skill: SkillDefinition, actor: Point, enemies: readonly T[], aim?: T): { targets: T[]; center: Point; angle: number; valid: boolean } {
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const validAim = aim && !aim.dead && dist(actor, aim) <= skill.range + aim.radius ? aim : undefined;
  const center = skill.anchor === "target" && validAim ? { x: validAim.x, y: validAim.y } : { x: actor.x, y: actor.y };
  const angle = validAim ? Math.atan2(validAim.y - actor.y, validAim.x - actor.x) : 0;
  if (skill.requiresTarget && !validAim) return { targets: [], center, angle, valid: false };
  const alive = enemies.filter(enemy => !enemy.dead);
  let targets: T[] = [];
  if (skill.shape === "target") targets = validAim ? [validAim] : [];
  if (skill.shape === "area") targets = alive.filter(enemy => dist(center, enemy) <= skill.radius + enemy.radius);
  if (skill.shape === "cone" || skill.shape === "line") targets = alive.filter(enemy => {
    const dx = enemy.x - actor.x, dy = enemy.y - actor.y;
    const forward = dx * Math.cos(angle) + dy * Math.sin(angle);
    const side = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
    if (skill.shape === "line") return forward >= 0 && forward <= skill.range + enemy.radius && side <= skill.radius + enemy.radius;
    return dist(actor, enemy) <= skill.range + enemy.radius && forward >= 0 && side <= Math.max(0, forward) * .8 + enemy.radius;
  });
  if (skill.shape === "chain" && validAim) {
    targets = [validAim];
    while (targets.length < 3) {
      const from = targets[targets.length - 1];
      const next = alive.filter(enemy => !targets.includes(enemy) && dist(from, enemy) <= skill.radius + enemy.radius).sort((a, b) => dist(from, a) - dist(from, b))[0];
      if (!next) break;
      targets.push(next);
    }
  }
  return { targets, center, angle, valid: true };
}
