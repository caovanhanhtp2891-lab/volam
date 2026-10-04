const icons = {
  companion: '<path d="M20 8c-9-12-22 6 0 24C42 14 29-4 20 8z"/><path d="M8 34h24"/>',
  dungeon: '<path d="M8 29V15l12-8 12 8v14h-8V19h-8v10z"/><path d="M4 31h32M12 13V7m16 6V7"/>',
  tower: '<path d="M13 34V11h14v23M10 11l10-7 10 7M10 19h20M10 27h20M8 35h24M18 35v-5h4v5"/>',
  siege: '<path d="M6 32V15h7v6h5V15h5v6h5V15h6v17zM17 32v-7h6v7M20 15V5m0 0h12l-3 4 3 4H20"/>',
  boss: '<path d="M11 14L6 5l11 7m12 2 5-9-11 7M10 15l10-5 10 5v12l-10 9-10-9zM14 20l4 2m8-2-4 2M15 29l5-3 5 3M20 22v4"/>',
  realm: '<path d="M5 32l7-18 8 12 7-21 8 27zM12 14l5 6m10-15 5 12"/>',
  wheel: '<circle cx="20" cy="21" r="14"/><circle cx="20" cy="21" r="4"/><path d="M20 7v10m0 8v10M6 21h10m8 0h10M10 11l7 7m6 6 7 7M30 11l-7 7m-6 6-7 7M17 2h6l-3 5z"/>',
  dice: '<rect x="5" y="11" width="22" height="22" rx="4"/><path d="M19 8l5-4 12 16-6 5"/><circle cx="11" cy="17" r="1"/><circle cx="21" cy="17" r="1"/><circle cx="16" cy="22" r="1"/><circle cx="11" cy="27" r="1"/><circle cx="21" cy="27" r="1"/>',
  lottery: '<path d="M5 11h30v7a4 4 0 000 8v5H5v-5a4 4 0 000-8zM25 12v18M12 21l3-4 3 4-3 4z"/>',
  map: '<path d="M5 10l10-5 10 5 10-5v25l-10 5-10-5-10 5zM15 5v25M25 10v25"/>',
  bot: '<circle cx="20" cy="11" r="6"/><path d="M10 33v-7a10 10 0 0120 0v7M6 33h28M16 20l4 7 4-7"/>',
  book: '<path d="M20 11C14 7 8 7 4 10v23c6-3 11-2 16 1 5-3 10-4 16-1V10c-4-3-10-3-16 1v23M9 15h6m-6 6h6m10-6h6m-6 6h6"/>',
};
function tile(icon: keyof typeof icons, title: string, subtitle: string, attributes: string, color: string): string {
  return `<button class="activity-tile" ${attributes} style="--activity-color:${color}"><span class="activity-icon" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg></span><span><b>${title}</b><small>${subtitle}</small></span><i aria-hidden="true">›</i></button>`;
}
export function activityHubMarkup(): string {
  return `<div class="activity-intro"><small>HÀNH TẨU GIANG HỒ</small><h2>Hoạt động</h2><p>Chọn thử thách, săn thưởng và khám phá.</p></div>
    <section class="activity-group"><h3>Chinh phục <small>Trang bị · Chiến công</small></h3><div class="activity-grid todo-card">
      ${tile("dungeon", "Phụ bản", "Bí cảnh · Thủ lĩnh · Đồ quý", 'data-idle-open="dungeon"', "#a89aff")}
      ${tile("companion", "Bí cảnh bắt vợ", "10 tầng · Thu phục mỹ nhân", "data-open-bond-realms", "#eda8d2")}
      ${tile("realm", "Bí cảnh cày ngọc", "7 tầng · Ngọc cấp 1–10", "data-open-gem-realms", "#78e3df")}
      ${tile("tower", "Leo tháp", "100 tầng · Bộ Trấn Thiên", "data-open-tower", "#bb9af5")}
      ${tile("siege", "Công thành chiến", "Phá cổng · Giữ cờ · Đội BOT", "data-open-siege", "#f2b975")}
      ${tile("boss", "Săn boss", "Hoàng Kim · Lịch xuất hiện", "data-open-golden-boss", "#f4c969")}
      ${tile("realm", "Tranh đoạt lãnh thổ", "9 thành · Ấn quân hàm", "data-open-territories", "#e8d28f")}
    </div></section>
    <section class="activity-group"><h3>Du ngoạn <small>Bản đồ · Đồng hành</small></h3><div class="activity-grid">
      ${tile("map", "Khám phá bản đồ", "16 vùng · Bốn khu mỗi map", "data-open-exploration", "#82d6ba")}
      ${tile("realm", "Túi ngọc", "Khảm ngọc · Mỗi +10 mở 1 lỗ", "data-open-gem-bag", "#b8a0ff")}
      ${tile("companion", "Tri kỷ", "Mang theo · Chỉ số · Trợ chiến", "data-open-companions", "#b4e6d3")}
      ${tile("bot", "Đồng hành BOT", "Tổ đội · Tuần tra · Đồ sát", "data-open-bots", "#80bedf")}
      ${tile("book", "Sổ quái", "32 loài · Chiêu thức · Đồ rơi", "data-open-bestiary", "#bed087")}
    </div></section>
    <section class="activity-group"><h3>Vui chơi <small>Dùng bạc trong game</small></h3><div class="activity-grid">
      ${tile("wheel", "Quay thưởng", "Vòng quay · Bạc · Vật phẩm", 'data-open-events data-event-game="wheel"', "#f3d685")}
      ${tile("dice", "Tài xỉu", "Ba viên xúc xắc · Đặt cửa", 'data-open-events data-event-game="dice"', "#eca69d")}
      ${tile("lottery", "Xổ số", "Chọn số · Mở thưởng", 'data-open-events data-event-game="lottery"', "#a1c9ee")}
    </div></section>
    <div class="activity-rewards"><button id="todo-reward" class="mini-button">Có quà chờ nhận</button><button class="mini-button" data-open-daily>Quà hằng ngày</button></div>`;
}
