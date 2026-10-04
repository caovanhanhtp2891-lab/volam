import { SECTS, SKILL_KEYS, type SectId, type Sect, type SkillDefinition, type SkillKey, type MartialArt, type EffectMotif } from "./sects.ts";
import type { GearVariant } from "./gear-catalog.ts";

export interface MartialPath {
  id: string; name: string; weapon?: GearVariant; weaponLabel: string;
  description: string; basicRange: number; art: MartialArt;
  kit: Record<SkillKey, SkillDefinition>;
}
// Names, weapon families and the source IDs are cross-checked against the JX1
// skill table. Costs, unlocks and geometry are adapted to this game's idle combat.
const move = (sourceId: number, name: string, description: string, motif: EffectMotif, changes: Partial<SkillDefinition> = {}): SkillDefinition => ({
  sourceId, name, description, motif, shape: "target", anchor: "target", requiresTarget: true,
  range: 180, radius: 65, damage: 1.6, mp: 8, cooldown: 4, unlock: 1, projectile: false, ...changes,
});
const next = (id: number, name: string, description: string, motif: EffectMotif, changes: Partial<SkillDefinition> = {}) => move(id, name, description, motif, { mp: 14, cooldown: 7, unlock: 3, ...changes });
const finisher = (id: number, name: string, description: string, motif: EffectMotif, changes: Partial<SkillDefinition> = {}) => move(id, name, description, motif, { damage: 3, mp: 22, cooldown: 15, unlock: 5, ...changes });
const path = (id: string, name: string, weapon: GearVariant | undefined, weaponLabel: string, description: string, basicRange: number, art: MartialArt, kit: MartialPath["kit"]): MartialPath => ({ id, name, weapon, weaponLabel, description, basicRange, art, kit });
export const MARTIAL_PATHS: Record<SectId, readonly [MartialPath, MartialPath]> = {
  "thieu-lam": [
    path("staff", "Côn pháp", "staff", "Côn", "Côn vàng quét ngang, chấn lực quanh thân, giữ thế trước vòng vây.", 88, "staff", {
      skill1: move(10, "Kim Cang Phục Ma", "Côn vàng bổ thẳng, đánh mục tiêu phía trước.", "staff", { range: 145 }),
      skill2: next(11, "Hoành Tảo Lục Hợp", "Quét côn thành vòng sáu hướng, làm chậm địch gần.", "staff", { shape: "area", anchor: "self", requiresTarget: false, radius: 145, slow: .6, damage: 1.45 }),
      ultimate: finisher(319, "Hoành Tảo Thiên Quân", "Côn ảnh xoay rộng, chấn lực làm choáng trong vòng đánh.", "staff", { shape: "area", anchor: "self", requiresTarget: false, radius: 190, stun: .8 }),
    }),
    path("blade", "Đao pháp", "blade", "Đao", "Đao khí màu kim, đao luân bay xa và tiếng sư tử chấn địch.", 95, "saber", {
      skill1: move(19, "Ma Ha Vô Lượng", "Đao khí cong xuyên tuyến, kim quang nổ khi trúng.", "blades", { shape: "line", anchor: "self", range: 270, radius: 30, projectile: true }),
      skill2: next(20, "Sư Tử Hống", "Tiếng sư tử tạo sóng vàng, làm choáng địch quanh mình.", "bell", { shape: "area", anchor: "self", requiresTarget: false, radius: 135, damage: .9, stun: 1 }),
      ultimate: finisher(321, "Vô Tướng Trảm", "Ba luồng đao khí vàng tỏa quạt xuyên nhiều mục tiêu.", "blades", { shape: "cone", anchor: "self", range: 340, radius: 220, projectile: true }),
    }),
  ],
  "thien-vuong": [
    path("spear", "Thương pháp", "spear", "Thương", "Thương đâm liên kích, mũi thương và vệt kim quang thẳng.", 100, "spear", {
      skill1: move(30, "Hồi Phong Lạc Nhạn", "Hai mũi thương liên tiếp vào mục tiêu trong tầm.", "spear", { range: 170, damage: .9, hits: 2 }),
      skill2: next(35, "Dương Quan Tam Điệp", "Ba lần đâm xuyên tuyến phía trước, phá giáp trong 3 giây.", "spear", { shape: "line", anchor: "self", range: 205, radius: 25, damage: .72, hits: 3, breakArmor: 3 }),
      ultimate: finisher(323, "Truy Tinh Trục Nguyệt", "Năm thương ảnh liên kích, ánh vàng bật ra ở mỗi lần trúng.", "spear", { range: 210, damage: .72, hits: 5 }),
    }),
    path("hammer", "Chùy pháp", "hammer", "Chùy", "Chùy nặng giáng kim quang, sóng chấn động và khống chế cận chiến.", 78, "hammer", {
      skill1: move(29, "Trảm Long Quyết", "Giáng chùy xuống mục tiêu, chấn lực màu vàng.", "bell", { range: 135, damage: 1.8 }),
      skill2: next(324, "Thừa Long Quyết", "Chùy đập vùng phía trước, tạo khiên 15% HP.", "bell", { shape: "cone", anchor: "self", range: 170, radius: 130, damage: 1.55, shield: .15 }),
      ultimate: finisher(325, "Truy Phong Quyết", "Ba lần giáng chùy trong vùng, choáng ngắn và phá giáp.", "bell", { shape: "area", anchor: "self", radius: 160, range: 160, damage: 1.1, hits: 3, stun: .7, breakArmor: 3 }),
    }),
  ],
  "duong-mon": [
    path("dart", "Phi đao", "poisondarts", "Phi đao", "Phi đao lưỡi cong tẩm độc, bay nhanh thành tuyến hoặc tỏa quạt.", 220, "dart", {
      skill1: move(50, "Truy Tâm Tiễn", "Ba phi đao độc liên tiếp, lưu độc 3 giây.", "arrows", { range: 390, projectile: true, hits: 3, damage: .7, poison: 3 }),
      skill2: next(340, "Ngân Đao Xạ Nguyệt", "Phi đao xoay tròn tỏa quạt, độc khí tại điểm trúng.", "arrows", { shape: "cone", anchor: "self", range: 350, radius: 230, projectile: true, damage: 1.45, poison: 3 }),
      ultimate: finisher(339, "Nhiếp Hồn Nguyệt Ảnh", "Ba đợt nguyệt nhận bám mục tiêu, gây độc trong 5 giây.", "arrows", { range: 410, projectile: true, hits: 3, damage: 1.1, poison: 5 }),
    }),
    path("bolts", "Tụ tiễn", "crossbow", "Tụ tiễn", "Chùm ám tiễn mảnh, nhiều mũi tỏa rộng và dấu độc xanh tím.", 230, "bolts", {
      skill1: move(54, "Mạn Thiên Hoa Vũ", "Chùm ám tiễn tỏa quạt, gây độc trên nhiều mục tiêu.", "arrows", { shape: "cone", anchor: "self", range: 340, radius: 230, projectile: true, damage: 1.35, poison: 3 }),
      skill2: next(58, "Thiên La Địa Võng", "Ám tiễn phủ vùng mục tiêu, làm chậm và lưu độc.", "arrows", { shape: "area", range: 380, radius: 100, projectile: true, damage: 1.45, poison: 3, slow: .65 }),
      ultimate: finisher(302, "Bạo Vũ Lê Hoa", "Ba loạt ám tiễn dày tỏa quạt, độc sát diện rộng.", "arrows", { shape: "cone", anchor: "self", range: 400, radius: 280, projectile: true, hits: 3, damage: 1.05, poison: 4 }),
    }),
  ],
  "ngu-doc": [
    path("blade", "Đao pháp", "blade", "Đao độc", "Đao khí xanh tím, độc sát trên vết chém và ăn mòn giáp.", 95, "poison-saber", {
      skill1: move(65, "Huyết Đao Độc Sát", "Lưỡi đao độc bay tới mục tiêu, để lại độc 3 giây.", "blades", { range: 310, projectile: true, poison: 3, damage: 1.25 }),
      skill2: next(384, "Bách Độc Xuyên Tâm", "Đao độc xuyên tuyến, bào mòn giáp 3 giây.", "blades", { shape: "line", anchor: "self", range: 260, radius: 30, projectile: true, poison: 4, corrode: 3 }),
      ultimate: finisher(355, "Huyền Âm Trảm", "Nguyệt trảm độc tỏa quạt, lưu độc và ăn mòn giáp.", "blades", { shape: "cone", anchor: "self", range: 300, radius: 200, projectile: true, damage: 2.5, poison: 6, corrode: 4 }),
    }),
    path("palm", "Chưởng pháp", undefined, "Thủ · độc chưởng", "Chưởng độc, khí độc xanh và trận độc bào mòn lâu dài.", 190, "poison-palm", {
      skill1: move(63, "Độc Sa Chưởng", "Chưởng độc bay tới mục tiêu, ăn mòn giáp trong 3 giây.", "poison", { range: 340, projectile: true, poison: 3, corrode: 3, damage: 1.2 }),
      skill2: next(69, "Vô Hình Độc", "Vòng độc quanh mình gây sát thương định kỳ trong 4 giây.", "poison", { shape: "area", anchor: "self", requiresTarget: false, radius: 140, damage: .6, zone: 4, poison: 2, slow: .65 }),
      ultimate: finisher(353, "Âm Phong Thực Cốt", "Luồng chưởng độc phủ vùng mục tiêu, bào mòn 6 giây.", "poison", { shape: "area", range: 380, radius: 165, projectile: true, damage: 2.25, poison: 6, corrode: 6 }),
    }),
  ],
  "nga-mi": [
    path("sword", "Kiếm pháp", "frostsword", "Kiếm", "Kiếm khí băng trắng hồng, kiếm ảnh tách ba và dấu tuyết khi trúng.", 150, "ice-swords", {
      skill1: move(85, "Nhất Diệp Tri Thu", "Một kiếm khí băng bay thẳng, làm chậm mục tiêu.", "swords", { range: 320, projectile: true, slow: .55 }),
      skill2: next(385, "Thôi Song Vọng Nguyệt", "Hai kiếm khí xuyên tuyến, băng hoa nở khi trúng.", "swords", { shape: "line", anchor: "self", range: 340, radius: 28, projectile: true, damage: 1, hits: 2, slow: .55 }),
      ultimate: finisher(328, "Tam Nga Tề Tuyết", "Ba luồng kiếm khí băng tỏa quạt, đóng băng ngắn.", "swords", { shape: "cone", anchor: "self", range: 360, radius: 245, projectile: true, damage: 2.8, stun: .6 }),
    }),
    path("palm", "Chưởng pháp", undefined, "Thủ · chưởng", "Chưởng băng và phật quang, hoa sen hộ thể để duy trì sinh lực.", 160, "lotus-palm", {
      skill1: move(80, "Phiêu Tuyết Xuyên Vân", "Chưởng băng xuyên mây, làm chậm mục tiêu.", "frost", { range: 300, projectile: true, damage: 1.35, slow: .6 }),
      skill2: next(92, "Phật Tâm Từ Hữu", "Phật quang hộ thân, khiên 25% HP và hồi 15% HP.", "lotus", { anchor: "self", requiresTarget: false, damage: 0, radius: 50, shield: .25, heal: .15 }),
      ultimate: finisher(91, "Phật Quang Phổ Chiếu", "Phật quang tỏa quanh thân, băng sát và hồi 25% HP.", "lotus", { shape: "area", anchor: "self", requiresTarget: false, radius: 170, damage: 1.9, heal: .25, slow: .6 }),
    }),
  ],
  "thuy-yen": [
    path("blade", "Đơn đao", "blade", "Đơn đao", "Nguyệt đao băng xanh, lưỡi cong bay xa rồi vỡ thành tinh thể.", 170, "ice-saber", {
      skill1: move(99, "Phong Hoa Tuyết Nguyệt", "Nguyệt đao băng bay tới mục tiêu, làm chậm 3 giây.", "frost", { range: 320, projectile: true, slow: .5 }),
      skill2: next(105, "Vũ Đả Lê Hoa", "Băng đao tỏa quạt, tinh thể phủ nhiều mục tiêu.", "frost", { shape: "cone", anchor: "self", range: 300, radius: 200, projectile: true, damage: 1.5, slow: .5 }),
      ultimate: finisher(336, "Băng Tung Vô Ảnh", "Ba nguyệt đao băng liên kích, đóng băng ngắn tại điểm trúng.", "frost", { range: 370, projectile: true, hits: 3, damage: 1, stun: .9 }),
    }),
    path("twins", "Song đao", "daggers", "Song đao", "Hai luồng hàn khí giao nhau, sóng băng quanh thân và băng hoa nổ.", 95, "ice-twins", {
      skill1: move(102, "Phong Quyển Tàn Tuyết", "Song đao tạo hai vệt băng chéo phía trước.", "frost", { shape: "cone", anchor: "self", range: 200, radius: 135, damage: .85, hits: 2, slow: .5 }),
      skill2: next(111, "Bích Hải Triều Sinh", "Sóng băng tỏa quanh mình, tạo khiên 15% HP.", "frost", { shape: "area", anchor: "self", requiresTarget: false, radius: 145, damage: 1.5, slow: .6, shield: .15 }),
      ultimate: finisher(337, "Băng Tâm Tiên Tử", "Hai luồng băng đao xoay rộng, đóng băng địch gần.", "frost", { shape: "area", anchor: "self", requiresTarget: false, radius: 180, damage: 2.85, stun: 1 }),
    }),
  ],
  "cai-bang": [
    path("palm", "Chưởng pháp", undefined, "Thủ · giáng long", "Rồng vàng cam có đầu, thân và vuốt; rồng bay ra rồi chấn nổ khi trúng.", 160, "dragon-palm", {
      skill1: move(122, "Kiến Nhân Thần Thủ", "Một hỏa long bay thẳng đến mục tiêu, thiêu đốt 2 giây.", "dragon", { range: 340, projectile: true, damage: 1.4, burn: 2 }),
      skill2: next(128, "Kháng Long Hữu Hối", "Song long tỏa quạt, hỏa sát trên nhiều mục tiêu.", "dragon", { shape: "cone", anchor: "self", range: 330, radius: 220, projectile: true, damage: 1.65, burn: 2 }),
      ultimate: finisher(357, "Phi Long Tại Thiên", "Tam long giáng xuống vùng mục tiêu, lưu hỏa trận 3 giây.", "dragon", { shape: "area", range: 400, radius: 170, projectile: true, damage: 3, zone: 3, burn: 3 }),
    }),
    path("staff", "Bổng pháp", "dragonstaff", "Bổng", "Bổng ảnh màu vàng lục, vệt quét nối nhau và bổng trận đánh rộng.", 95, "dog-staff", {
      skill1: move(119, "Diên Môn Thác Bát", "Bổng chọc phía trước, đánh mục tiêu trong tầm.", "staff", { range: 170, damage: 1.65 }),
      skill2: next(125, "Bổng Đả Ác Cẩu", "Ba bổng ảnh quét vùng phía trước, làm chậm địch.", "staff", { shape: "cone", anchor: "self", range: 200, radius: 150, hits: 3, damage: .65, slow: .6 }),
      ultimate: finisher(359, "Thiên Hạ Vô Cẩu", "Bổng trận phủ quanh mình, phá giáp trong 4 giây.", "staff", { shape: "area", anchor: "self", requiresTarget: false, radius: 195, damage: 3, breakArmor: 4 }),
    }),
  ],
  "thien-nhan": [
    path("blade", "Đao pháp · Ma nhẫn", "firesaber", "Đao", "Hỏa cầu đỏ cam, ma diệm và mưa lửa rơi xuống vùng mục tiêu.", 190, "fire-rain", {
      skill1: move(145, "Đơn Chỉ Liệt Diệm", "Hỏa cầu bay ra từ tay, bùng lửa khi trúng.", "blades", { range: 340, projectile: true, damage: 1.4, burn: 2 }),
      skill2: next(148, "Ma Diệm Thất Sát", "Ma diệm phủ vùng mục tiêu, để lại hỏa trận 3 giây.", "blades", { shape: "area", range: 350, radius: 105, projectile: true, damage: 1.4, burn: 3, zone: 3 }),
      ultimate: finisher(362, "Thiên Ngoại Lưu Tinh", "Mưa lưu tinh lửa giáng xuống vùng, lưu thiêu đốt 4 giây.", "blades", { shape: "area", range: 390, radius: 180, projectile: true, damage: 2.8, burn: 4 }),
    }),
    path("halberd", "Kích pháp · Chiến nhẫn", "halberd", "Kích · mâu", "Kích đâm cận chiến, hỏa tuyến và mũi long kích liên tiếp.", 105, "fire-spear", {
      skill1: move(135, "Tàn Dương Như Huyết", "Kích đâm xuyên tuyến, vệt đỏ rực phía trước.", "spear", { shape: "line", anchor: "self", range: 185, radius: 24, damage: 1.6, burn: 1 }),
      skill2: next(141, "Liệt Hỏa Tình Thiên", "Kích quét hỏa tuyến hình quạt, thiêu đốt 2 giây.", "spear", { shape: "cone", anchor: "self", range: 215, radius: 145, damage: 1.55, burn: 2 }),
      ultimate: finisher(361, "Vân Long Kích", "Ba lần long kích vào mục tiêu, hồi 12% HP khi trúng.", "spear", { range: 220, hits: 3, damage: 1.1, heal: .12, healOnHit: true }),
    }),
  ],
  "vo-dang": [
    path("sword", "Kiếm pháp", "sword", "Kiếm", "Kiếm ảnh xanh trắng, kiếm khí thẳng và nhân kiếm hợp nhất cận chiến.", 100, "sword-array", {
      skill1: move(155, "Thương Hải Minh Nguyệt", "Kiếm khí xanh trắng tới mục tiêu, ánh kiếm bật khi trúng.", "swords", { range: 260, projectile: true }),
      skill2: next(158, "Kiếm Phi Kinh Thiên", "Kiếm khí xuyên tuyến, phá giáp trong 3 giây.", "swords", { shape: "line", anchor: "self", range: 300, radius: 27, projectile: true, damage: 1.55, breakArmor: 3 }),
      ultimate: finisher(368, "Nhân Kiếm Hợp Nhất", "Lướt theo kiếm áp sát, ba nhát kiếm và khiên 15% HP.", "swords", { range: 285, dash: true, hits: 3, damage: 1.1, shield: .15 }),
    }),
    path("qi", "Khí tông", undefined, "Thủ · quyền khí", "Quyền khí, nộ lôi và vòng Thái cực; hộ thể bằng nội lực.", 195, "qi", {
      skill1: move(153, "Nộ Lôi Chỉ", "Chỉ khí mang lôi quang bay thẳng đến mục tiêu.", "lightning", { range: 340, projectile: true, damage: 1.65 }),
      skill2: next(157, "Tọa Vọng Vô Ngã", "Thái cực hộ thân, tạo khiên 28% HP bằng nội lực.", "taiji", { anchor: "self", requiresTarget: false, radius: 52, damage: 0, shield: .28 }),
      ultimate: finisher(365, "Thiên Địa Vô Cực", "Vòng quyền khí Thái cực phủ vùng, ba đợt khí kình.", "taiji", { shape: "area", range: 380, radius: 170, projectile: true, hits: 3, damage: 1, slow: .6 }),
    }),
  ],
  "con-lon": [
    path("blade", "Đao pháp", "blade", "Đao", "Đao khí mang gió, vòng xoáy hẹp và phong trảm xanh vàng.", 95, "wind-saber", {
      skill1: move(169, "Hô Phong Pháp", "Phong đao bay thẳng tới mục tiêu, làm chậm ngắn.", "blades", { range: 300, projectile: true, slow: .7 }),
      skill2: next(176, "Cuồng Phong Sậu Điện", "Phong trảm xuyên tuyến, phá giáp trong 3 giây.", "blades", { shape: "line", anchor: "self", range: 330, radius: 32, projectile: true, damage: 1.55, breakArmor: 3 }),
      ultimate: finisher(372, "Ngạo Tuyết Tiêu Phong", "Ba phong đao tỏa quạt, cuồng phong đánh rộng.", "blades", { shape: "cone", anchor: "self", range: 360, radius: 245, projectile: true, damage: 2.9, slow: .55 }),
    }),
    path("sword", "Kiếm pháp", "thundersword", "Kiếm", "Lôi điện tím vàng, sét liên hoàn và thiên lôi giáng xuống.", 195, "thunder", {
      skill1: move(172, "Thiên Tế Tấn Lôi", "Lôi điện truyền qua tối đa ba mục tiêu gần nhau.", "lightning", { shape: "chain", range: 370, radius: 155, projectile: true, damage: 1.5 }),
      skill2: next(179, "Cuồng Lôi Chấn Địa", "Thiên lôi giáng vùng mục tiêu, làm choáng ngắn.", "lightning", { shape: "area", range: 350, radius: 110, projectile: true, damage: 1.55, stun: .7 }),
      ultimate: finisher(375, "Lôi Động Cửu Thiên", "Ba đợt lôi điện giáng xuống vùng, chấn nổ và phá giáp.", "lightning", { shape: "area", range: 400, radius: 180, projectile: true, hits: 3, damage: 1.05, stun: .9, breakArmor: 4 }),
    }),
  ],
};
export const DEFAULT_MARTIAL_PATH: Record<SectId, string> = {
  "thieu-lam": "staff", "thien-vuong": "spear", "duong-mon": "dart", "ngu-doc": "palm", "nga-mi": "palm",
  "thuy-yen": "blade", "cai-bang": "palm", "thien-nhan": "blade", "vo-dang": "sword", "con-lon": "sword",
};
for (const [id, paths] of Object.entries(MARTIAL_PATHS)) for (const p of paths) for (const key of SKILL_KEYS) {
  Object.assign(p.kit[key], { sectId: id, pathId: p.id, art: p.art });
}
export function validMartialPath(sect: SectId, value: unknown): boolean {
  return value === undefined || typeof value === "string" && MARTIAL_PATHS[sect].some(p => p.id === value);
}
export function martialPath(sect: SectId, value?: string): MartialPath {
  return MARTIAL_PATHS[sect].find(p => p.id === value) ?? MARTIAL_PATHS[sect].find(p => p.id === DEFAULT_MARTIAL_PATH[sect])!;
}
const schools = new Map<string, Sect>();
export function martialSect(sect: SectId, value?: string): Sect {
  const p = martialPath(sect, value), key = `${sect}/${p.id}`;
  if (!schools.has(key)) schools.set(key, { ...SECTS[sect], title: p.name, description: p.description, basicRange: p.basicRange, kit: p.kit });
  return schools.get(key)!;
}
export function martialSkillNamed(sect: SectId, name: string): { key: SkillKey; definition: SkillDefinition } | undefined {
  for (const p of MARTIAL_PATHS[sect]) for (const key of SKILL_KEYS) if (p.kit[key].name === name) return { key, definition: p.kit[key] };
}
