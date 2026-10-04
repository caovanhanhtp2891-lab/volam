import {
  GEM_TYPES,
  gemFromKey,
  gemStats,
  gemName,
  gemMarkup,
  socketCount,
  type GemBag,
  type GemSpec,
} from "./gems.ts";
import { RARITY_COLORS, RARITIES } from "./rarity.ts";
import {
  enhancementCap,
  enhancementMilestones,
  type EquipmentData,
} from "./equipment.ts";
import { displayedStat } from "./combat-scale.ts";
import {
  STAT_LABELS,
  statUnit,
  type GearStats,
  type GearStat,
} from "./gear-stats.ts";
import { GEM_REALMS, canStoreGemReward } from "./gem-realms.ts";
const num = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export function bonusText(stats: Partial<GearStats>): string {
  return Object.entries(stats)
    .filter(([, n]) => n !== 0)
    .map(
      ([key, n]) =>
        `+${num(displayedStat(key as GearStat, n))}${statUnit(key as GearStat)} ${STAT_LABELS[key as GearStat]}`,
    )
    .join(" · ");
}
export function enhancementLinesMarkup(item: EquipmentData): string {
  return `<div class="enhancement-lines"><b>Thuộc tính cường hóa · Giới hạn bậc/phẩm chất +${enhancementCap(item)}</b>${enhancementMilestones(
    item,
  )
    .map(
      (line) =>
        `<div class="enhancement-line ${line.active ? "activated" : "sealed"}" data-enhancement-threshold="${line.threshold}"><span>${line.active ? "✦" : "◇"} +${line.threshold} ${line.active ? "Đã kích hoạt" : "Chưa kích hoạt"}</span><strong>+${num(displayedStat(line.key, line.value))}${statUnit(line.key)} ${STAT_LABELS[line.key]}</strong></div>`,
    )
    .join(
      "",
    )}${item.enhance > enhancementCap(item) ? `<small>Cấp +${item.enhance} từ bản cũ được giữ; đã vượt giới hạn rèn mới.</small>` : ""}</div>`;
}
export function socketSummaryMarkup(item: EquipmentData): string {
  const count = socketCount(item),
    filled = item.gems?.filter(Boolean).length ?? 0;
  return `<div class="socket-summary"><b>Khảm ngọc · ${filled}/${count} lỗ đã mở</b><div class="socket-icons">${Array.from({ length: Math.max(1, count) }, (_, i) => (item.gems?.[i] ? gemMarkup(item.gems[i]!) : `<span class="socket-empty ${count ? "" : "sealed"}">${count ? "◇" : "🔒"}</span>`)).join("")}</div><small>Mỗi +10 mở 1 lỗ · Ngọc chỉ cộng chỉ số khi mặc trang bị.</small></div>`;
}
export function gemBagMarkup(bag: GemBag): string {
  const entries = Object.entries(bag)
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => {
      const x = gemFromKey(a)!,
        y = gemFromKey(b)!;
      return (
        RARITIES.indexOf(y.quality) - RARITIES.indexOf(x.quality) ||
        y.level - x.level ||
        a.localeCompare(b)
      );
    });
  return `<p>Túi ngọc riêng · ${entries.reduce((sum, [, n]) => sum + n, 0)} viên · 5 loại ngũ hành, 10 cấp, 7 phẩm chất.</p><button class="outline-button" data-open-gem-realms>Cày ngọc · 7 bí cảnh</button><p class="dim">Mở chi tiết trang bị → Khảm ngọc. Mỗi +10 mở một lỗ, thay hoặc tháo trả ngọc về túi miễn phí.</p><div class="gem-bag">${
    entries.length
      ? entries
          .map(([key, count]) => {
            const gem = gemFromKey(key)!;
            return `<article class="gem-card" data-gem-stack="${key}" style="--rarity-color:${RARITY_COLORS[gem.quality]}">${gemMarkup(gem)}<div><b>${gemName(gem)}</b><small>${GEM_TYPES[gem.kind].element} · ${count} viên</small><p>${bonusText(gemStats(gem))}</p></div></article>`;
          })
          .join("")
      : '<div class="empty-state">Chưa có ngọc. Hạ thủ hộ trong Bí cảnh cày ngọc để nhận thưởng.</div>'
  }</div>`;
}
export function socketsMarkup(
  item: EquipmentData & { name: string },
  bag: GemBag,
  blocked: boolean,
): string {
  const count = socketCount(item),
    gems = Object.entries(bag).filter(([, n]) => n > 0);
  return `<p><b>${item.name} +${item.enhance}</b> · ${count} lỗ đã mở / ${Math.floor(enhancementCap(item) / 10)} lỗ theo bậc/phẩm chất.</p><p class="dim">Mỗi mốc +10 mở một lỗ. Ngọc không bị nhân hệ số cường hóa; chỉ cộng khi mặc. Thay/tháo ngọc miễn phí và trả viên cũ về túi.</p>${blocked ? '<p class="panel-notice">Rời trận hiện tại để khảm hoặc tháo ngọc.</p>' : ""}${
    count
      ? Array.from({ length: count }, (_, index) => {
          const gem = item.gems?.[index] ?? null;
          return `<article class="socket-row" data-socket-row="${index}">${gem ? gemMarkup(gem) : '<span class="socket-empty">◇</span>'}<div><b>Lỗ ${index + 1} · Mở ở +${(index + 1) * 10}</b><small>${gem ? gemName(gem) : "Chưa khảm"}</small><p>${gem ? bonusText(gemStats(gem)) : "Chọn ngọc trong túi bên dưới."}</p><label>Ngọc trong túi<select data-socket-select="${index}" ${blocked || !gems.length ? "disabled" : ""}>${gems.length ? gems.map(([key, n]) => `<option value="${key}">${gemName(gemFromKey(key)!)} ×${n}</option>`).join("") : "<option>Chưa có ngọc</option>"}</select></label><div class="btnrow"><button class="mini-button" data-socket-insert="${index}" ${blocked || !gems.length ? "disabled" : ""}>${gem ? "Thay ngọc" : "Khảm ngọc"}</button><button class="mini-button" data-socket-remove="${index}" ${blocked || !gem ? "disabled" : ""}>Tháo ngọc</button></div></div></article>`;
        }).join("")
      : '<div class="empty-state">Chưa có lỗ khảm · Cường hóa đến +10 để mở lỗ đầu tiên.</div>'
  }<button class="outline-button" data-open-gem-bag>Túi ngọc</button>`;
}
export function gemRealmsMarkup(
  level: number,
  blocked: boolean,
  bag: GemBag = {},
): string {
  return `<p class="dim">7 bí cảnh cày lại không giới hạn. Vượt tất cả các đợt và Nhận thưởng để lấy ngọc. Thua, hết giờ hoặc rời sớm không có thưởng ngọc. Mỗi lượt có ít nhất 1 viên phẩm chất cao nhất của map.</p><button class="mini-button" data-open-gem-bag>Túi ngọc · Khảm trang bị</button><div class="gem-realms">${Object.values(
    GEM_REALMS,
  )
    .map((d) => {
      const sample: GemSpec = {
          kind: "ruby",
          level: d.gemLevels[1],
          quality: RARITIES[d.qualityTier],
        },
        full = !canStoreGemReward(bag, d.id);
      return `<article class="gem-realm" data-gem-realm-card="${d.id}" style="--rarity-color:${RARITY_COLORS[sample.quality]}">${gemMarkup(sample)}<div><b>${d.name}</b><small>Cấp ${d.minLevel}+ · ${d.waves.length} đợt · ${Math.ceil(d.timeLimit / 60)} phút</small><p>${d.gemCount} ngọc cấp ${d.gemLevels.join("–")} · Phẩm chất tới <strong>${sample.quality}</strong></p><small>+${num(d.reward.gold)} bạc · ${d.reward.stones} đá cường hóa</small><button class="outline-button" data-gem-realm-enter="${d.id}" ${blocked || full || level < d.minLevel ? "disabled" : ""}>${blocked ? "Rời trận hiện tại" : full ? "Khảm ngọc để trống túi" : level < d.minLevel ? `Cần cấp ${d.minLevel}` : "Vào cày ngọc"}</button></div></article>`;
    })
    .join("")}</div>`;
}
