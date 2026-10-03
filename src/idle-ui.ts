import { spriteMarkup } from "./art";
import { APP_VERSION, RELEASE_NAME } from "./release";

export function idleShell(): string {
  return `
  <div class="app-shell" data-page="log">
    <header class="topbar">
      <div class="hero-portrait"><div class="avatar-orb" id="avatar-orb">劍</div><b id="idle-level">1</b></div>
      <div class="topmid"><div class="hero-row"><strong id="character-name">Giang Hồ Dị Truyện</strong><span id="header-combat-power" aria-label="Lực chiến">⚔ 0</span></div><span id="idle-stage-label" class="hidden">Võ lâm · Idle</span><div class="meter xp-meter"><span id="xp-bar"></span><small id="xp-label">Hành tẩu giang hồ</small></div></div>
      <div class="gold-header"><i>◆</i><b id="gold-label">0</b></div>
      <button class="icon-button gift-button" id="gift-btn" aria-label="Phần thưởng hằng ngày">🎁<i></i></button>
      <button class="icon-button" id="compact-btn" aria-label="Thu gọn hoặc mở rộng sân đấu" aria-pressed="false">⛶</button>
    </header>
    <section class="canvas-frame">
      <canvas id="game-canvas" width="600" height="600" aria-label="Sân đấu Giang Hồ Dị Truyện"></canvas>
      <div class="arena-resources"><div class="meter hp-meter"><span id="hp-bar"></span><small id="hp-label">Sinh lực</small></div><div class="meter mp-meter"><span id="mp-bar"></span><small id="mp-label">Nội lực</small></div></div>
      <div class="canvas-badge" id="canvas-badge">HOA SƠN · ẢI 1</div><div class="canvas-tip" id="canvas-tip"></div>
      <div id="loot-notices" class="loot-notices" aria-label="Trang bị vừa nhặt"></div>
      <div class="mobile-map-card"><div class="mobile-map-title"><b id="mobile-map-name">HOA SƠN</b></div><canvas id="mobile-minimap" width="190" height="120" aria-label="Bản đồ nhỏ"></canvas><div class="mobile-map-channel">Đợt 1/4</div></div>
      <button class="arena-chip" id="mobile-auto" aria-pressed="false">⚙ Tự động</button>
      <div class="arena-left-buttons"><button class="arena-chip" id="training-btn">⚔ Luyện công</button><button class="arena-chip" id="rotation-btn" aria-pressed="true">⟳ Xoay chiêu: Bật</button></div>
      <div class="mobile-hud" id="mobile-hud"><div class="joystick" id="joystick" aria-label="Cần điều khiển di chuyển"><div class="joystick-ring"><div class="joystick-knob" id="joystick-knob"></div></div></div><button id="mobile-pickup" class="mobile-pickup" aria-label="Nhặt đồ">${spriteMarkup("loot")}</button></div>
      <div class="combat-bar"><div class="combat-status"><span id="combat-status-text">Chưa có mục tiêu</span></div><div class="skill-bar" id="skill-bar"></div><div class="potion-shortcuts"><button class="potion-button potion-hp" data-use-potion="hp" aria-label="Dùng bình HP"><span>HP</span><small>0</small></button><button class="potion-button potion-mp" data-use-potion="mp" aria-label="Dùng bình MP"><span>MP</span><small>0</small></button><button class="town-button" id="town-btn">Về<br>thành</button></div></div>
    </section>
    <main class="game-layout">
      <section class="world-panel tab-page" data-page="log">
        <div id="legacy-training" class="legacy-training hidden"><b>Sân luyện mới đã sẵn sàng</b><p>Vào luyện công để nhân vật tự tìm quái, ra chiêu và nhặt trang bị. Giữ nguyên cấp độ, hành trang và nhiệm vụ của bạn.</p><button id="legacy-training-btn" class="outline-button">Vào luyện công</button></div>
        <div class="todo-card"><b>Việc cần làm</b><button id="todo-reward" class="mini-button">Có quà chờ nhận</button><button class="mini-button" data-idle-open="dungeon">Phụ bản</button></div>
        <div class="stage-card"><div><strong id="stage-name">Hoa Sơn · Ải 1/10</strong><small id="stage-description">Chọn môn phái để bắt đầu</small></div><div class="stage-actions"><button id="stage-prev" aria-label="Ải trước">◀</button><button id="stage-push" aria-pressed="true">Vượt ải</button><button id="stage-next" aria-label="Ải tiếp theo">▶</button></div></div>
        <div class="card golden-card"><div><b>✦ Boss Hoàng Kim</b><small id="golden-status">12:00 · 19:00 · 21:00 (VN)</small></div><button id="golden-boss-btn" class="mini-button">Lịch boss</button></div>
        <div class="hunt-status"><span id="elite-hunt-status">Hạ quái thường để tìm tinh anh.</span><button id="campfire-btn" class="mini-button" disabled>Đến lửa trại</button></div>
        <section class="quest-panel"><button id="quest-toggle" class="quest-toggle" aria-label="Mở nhiệm vụ" aria-expanded="false">⌄</button><b id="quest-title">Dấu chân trong Rừng Trúc</b><p id="quest-text"></p><div class="quest-progress"><span id="quest-kill-progress"></span><span id="quest-boss-progress"></span></div><small id="quest-reward"></small></section>
        <div class="log-panel"><div id="log-list" class="log-list"></div></div>
        <div class="target-panel"><div id="target-content"></div></div>
        <h3>Bản đồ luyện công <small>16 vùng · 160 ải</small></h3><div id="region-list" class="region-list"></div>
        <div class="controls-panel"><p>WASD / joystick: di chuyển · 1–3: võ công · 4: đánh thường · Q/R: thuốc · E: nhặt · B: hành trang · K: võ công</p></div>
      </section>
      <section class="character-panel tab-page" data-page="char">
        <div class="card character-heading"><div><b id="character-sect">Chưa gia nhập môn phái</b><small id="level-label">Cấp 1</small><p>Lực chiến <strong id="combat-power">0</strong></p></div><span id="character-element" class="element-badge">金</span></div>
        <div id="cultivation-card" class="card cultivation-card"><div class="cultivation-heading"><div><small id="realm-plane">Phàm giới · Bậc 1/19</small><strong id="realm-name">Luyện Thể</strong><span id="realm-phase">Tầng 1</span></div><button id="realm-guide-btn" class="mini-button">19 cảnh giới</button></div><div id="realm-meter" class="realm-meter" role="progressbar" aria-label="Tiến tới cảnh giới tiếp theo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="realm-progress"></span></div><p id="realm-next"></p><small class="dim">Tăng lực chiến bằng cấp độ, tiềm năng và trang bị đang mặc.</small></div>
        <div id="equipment-grid" class="equipment-grid"></div><p class="dim">Chạm trang bị để xem trước chỉ số và cường hóa. Đồ tốt hơn có thể mặc trong Hành trang.</p>
        <h3>Tiềm năng <small id="attribute-points">0 điểm</small></h3><div id="attribute-list" class="card"></div>
        <h3>Chỉ số nhân vật</h3><div id="stat-grid" class="stat-grid"></div>
        <div class="currency-row"><span>✦ <b id="stone-label">0</b> đá tinh luyện</span><span>◇ <b id="token-label">0</b> lệnh bài</span></div>
        <div class="hidden"><b id="mobile-gold"></b><b id="mobile-stones"></b><span class="character-shortcut"></span></div>
        <div class="btnrow"><button class="outline-button" data-idle-open="smith">⚒ Thợ rèn</button><button class="outline-button" data-idle-open="dungeon">◇ Phụ bản</button></div>
      </section>
      <section class="inventory-panel tab-page" data-page="inventory">
        <div class="mobile-sheet-handle"><b id="inventory-title">Hành trang</b><button id="mobile-sheet-close" aria-label="Trở về Giang hồ">×</button></div>
        <div class="panel-tabs"><button class="tab-button active" data-tab="bag">Túi đồ <span id="bag-count">0/60</span></button><button class="tab-button" data-tab="skills">Võ công</button><button class="tab-button" data-tab="smith">Rèn</button><button class="tab-button" data-tab="dungeon">Phụ bản</button><button class="tab-button" data-tab="shop">Tiệm</button></div>
        <div id="inventory-content"></div>
      </section>
      <section class="settings-panel tab-page" data-page="more">
        <div class="release-stamp">v${APP_VERSION} · ${RELEASE_NAME}</div>
        <h3>Nhân vật</h3><div class="card"><label class="form-row">Tên <input id="settings-name" maxlength="16" placeholder="Tân thủ"></label><label class="form-row">Giới tính <select id="settings-sex"><option value="male">Nam</option><option value="female">Nữ</option></select></label><button id="save-name" class="outline-button">Lưu tên và giới tính</button></div>
        <h3>Tốc độ game</h3><div class="card"><label class="form-row">Tốc độ <select id="game-speed"><option value="1">x1</option><option value="1.5">x1.5</option><option value="2.5">x2.5</option></select></label><small class="dim">Tăng tốc mô phỏng chiến đấu và hồi chiêu.</small></div>
        <h3>Lưu game</h3><div class="card"><p class="dim">Tự lưu mỗi 10 giây. Ba nhân vật lưu riêng trên thiết bị này. Xuất file để sao lưu hoặc chuyển thiết bị.</p><div class="btnrow"><button id="save-btn" class="outline-button">Lưu tiến trình</button><button id="load-btn" class="outline-button">Tải tiến trình</button></div><div class="btnrow"><button id="export-save" class="outline-button">Tải file lưu</button><button id="import-save" class="outline-button">Nạp từ file</button></div><button id="restore-backup" class="mini-button">Khôi phục bản sao lưu trước</button><input id="save-file" type="file" accept=".json,.volamsave" hidden><textarea id="save-code" rows="3" placeholder="Mã lưu game" aria-label="Mã lưu game"></textarea><div class="btnrow"><button id="export-code" class="mini-button">Xuất mã</button><button id="import-code" class="mini-button">Nhập mã</button></div></div>
        <h3>Tự động</h3><div class="card settings-checks"><label><input type="checkbox" data-setting="autoSkills"> Xoay chiêu tự động</label><label><input type="checkbox" data-setting="autoPotions"> Tự dùng thuốc khi sinh lực dưới 40%</label><label><input type="checkbox" data-setting="autoLoot"> Tự nhặt đồ và bạc sau khi rơi</label><label><input type="checkbox" data-setting="autoEquip"> Tự mặc trang bị tốt hơn</label><label><input type="checkbox" data-setting="muted"> Tắt tiếng hiệu ứng</label></div>
        <h3>Trợ giúp</h3><div class="card"><div class="btnrow"><button id="guide-btn" class="outline-button">Hướng dẫn</button><button id="slot-btn" class="outline-button">Đổi nhân vật</button></div><div class="btnrow"><button id="adventure-btn" class="outline-button">Rừng Trúc · Phiêu lưu</button><button id="idle-mode-btn" class="outline-button">Về luyện ải</button></div><button id="reset-btn" class="outline-button danger-text">Tạo lại nhân vật</button></div>
        <h3>Kết nối online</h3><div class="card"><span id="connection-pill" class="connection-pill"><i></i><span id="connection-label">Ngoại tuyến</span></span><button id="online-btn" class="outline-button">Kết nối online</button><p class="dim">Phiên online của volam: người chơi và di chuyển qua WebSocket.</p></div>
        <div class="guild-teaser hidden"><button id="guild-btn">Bang hội</button></div>
      </section>
    </main>
    <nav class="bottom-nav" aria-label="Menu chính"><button class="active" data-idle-tab="log"><span>☯</span>Giang hồ</button><button data-idle-tab="char"><span>♙</span>Nhân vật<i id="attribute-dot"></i></button><button data-idle-tab="skill"><span>⚔</span>Võ công<i id="skill-dot"></i></button><button data-idle-tab="inv"><span>▣</span>Hành trang</button><button data-idle-tab="more"><span>⚙</span>Khác</button></nav>
    <div id="mobile-sheet-backdrop" class="hidden"></div><div id="mobile-chat" class="hidden"></div>
    <div id="sect-overlay" class="sect-overlay"><div class="sect-dialog ornamental"><div class="dialog-eyebrow">GIANG HỒ DỊ TRUYỆN</div><h1>Chọn môn phái</h1><p class="dialog-lead">Kim khắc Mộc · Mộc khắc Thổ · Thổ khắc Thủy · Thủy khắc Hỏa · Hỏa khắc Kim.</p><div class="card"><label class="form-row">Tên nhân vật <input id="hero-name-input" maxlength="16" placeholder="Tân thủ"></label><label class="form-row">Giới tính <select id="hero-sex-input"><option value="auto">Theo môn phái</option><option value="male">Nam</option><option value="female">Nữ</option></select></label></div><div id="sect-cards" class="sect-cards"></div><div id="sect-detail" class="sect-detail"></div><button class="outline-button" id="join-sect">Gia nhập</button><button class="outline-button hidden" id="selection-load">Tiếp tục nhân vật đã lưu</button></div></div>
    <div id="utility-overlay" class="utility-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="utility-title"><div class="utility-dialog ornamental" tabindex="-1"><button id="utility-close" class="dialog-close" aria-label="Đóng hộp thoại">×</button><h2 id="utility-title"></h2><div id="utility-content"></div></div></div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  </div>`;
}
