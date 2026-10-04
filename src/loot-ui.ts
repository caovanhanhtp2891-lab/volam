import { RARITIES, RARITY_NAMES } from "./equipment";

export function lootSettingsMarkup(): string {
  const grades = (all: boolean) => Array.from({ length: 16 }, (_, i) => `<option value="${i + 1}">${all && i === 0 ? "Mọi bậc · " : ""}Bậc ${i + 1} · cấp ${i * 10 + 1}–${i * 10 + 10}</option>`).join("");
  const rarities = (max: number) => RARITIES.slice(0, max).map((name, i) => `<option value="${i}">${RARITY_NAMES[i]} · ${name}</option>`).join("");
  return `<h3 id="loot-settings-heading">Nhặt đồ · Tự vứt đồ</h3><div class="card loot-settings-card">
    <label class="form-row">Nhặt từ phẩm chất<select data-loot-setting="minRarity" aria-label="Phẩm chất nhặt tối thiểu">${rarities(7)}</select></label>
    <label class="form-row">Nhặt từ bậc<select data-loot-setting="minGrade" aria-label="Bậc nhặt tối thiểu">${grades(true)}</select></label>
    <p class="dim">Áp dụng khi bật Tự nhặt đồ. Đồ chưa đạt lọc vẫn nằm trên đất để nhặt tay. Bạc, đá, đồ bộ, đồ đã cường hóa và Hoàng Kim trở lên luôn được thu hồi. Rời trận sẽ thu hồi đồ còn lại.</p>
    <label class="discard-check"><input type="checkbox" data-loot-setting="autoDiscard"> Tự vứt đồ trong túi theo điều kiện bên dưới</label>
    <label class="form-row">Vứt đến phẩm chất<select data-loot-setting="maxDiscardRarity" aria-label="Phẩm chất vứt tối đa">${rarities(4)}</select></label>
    <label class="form-row">Vứt đến bậc<select data-loot-setting="maxDiscardGrade" aria-label="Bậc vứt tối đa">${grades(false)}</select></label>
    <label class="discard-check"><input type="checkbox" data-loot-setting="weakerOnly"> Chỉ vứt đồ yếu hơn hoặc bằng món đang mặc</label>
    <p class="dim">Tự vứt mặc định Tắt. Khi bật, áp dụng ngay cho túi và đồ mới nhận; không nhận bạc. Luôn giữ đồ đang mặc, đồ bộ, đồ cường hóa, Hoàng Kim trở lên và Đồ chờ nhận. Cài đặt lưu riêng từng nhân vật.</p>
  </div>`;
}
