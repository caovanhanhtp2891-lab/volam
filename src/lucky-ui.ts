import {
  WHEEL_PRIZES,
  luckyBusy,
  wheelOdds,
  wheelLuckMultiplier,
  MAX_WHEEL_LUCK,
  type LuckyGame,
  type LuckyProgress,
} from "./lucky-events";
const safe = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
import { equipmentMarkup } from "./equipment-art";
import { gemMarkup } from "./gems";
const prizeSummary = (r: import("./lucky-events").LuckyReceipt): string =>
  r.reward
    ? r.reward.kind === "gem"
      ? "Đã nhận vào Túi ngọc"
      : "Đã nhận vào túi/Đồ chờ nhận"
    : r.silver
      ? `nhận ${r.silver} bạc`
      : r.stones
        ? `nhận ${r.stones} đá`
        : r.potions
          ? `nhận ${r.potions} bình HP`
          : "Không trúng";
const labels = { wheel: "Vòng quay", dice: "Tài xỉu", lottery: "Xổ số" };
export function luckyMarkup(
  progress: LuckyProgress,
  game: LuckyGame,
  gold: number,
): string {
  const last = progress.history.find((r) => r.game === game);
  const sector = 360 / WHEEL_PRIZES.length,
    odds = wheelOdds(progress);
  const sectors = WHEEL_PRIZES.map(
    (p, i) => `${p.color} ${i * sector}deg ${(i + 1) * sector}deg`,
  ).join(",");
  return `<div class="activity-tabs">${Object.entries(labels)
    .map(
      ([id, label]) =>
        `<button class="mini-button" data-lucky-tab="${id}" aria-pressed="${game === id}">${label}</button>`,
    )
    .join("")}</div>
    <p class="dim">Dùng bạc kiếm trong game. Mỗi lượt mở thưởng trong 2,2 giây.</p><p class="event-wallet">Đang có <b id="event-gold">${gold.toLocaleString("vi-VN")}</b> bạc</p>
    <section class="lucky-stage" data-lucky-stage="${game}" data-round="${last?.round ?? 0}">${game === "wheel" ? `<div class="wheel-pointer">▼</div><div class="lucky-wheel" style="--sector-angle:${sector}deg;background:conic-gradient(${sectors})">${WHEEL_PRIZES.map((p, i) => `<span style="--sector:${i}">${i < 8 ? p.name : ["Đồ Vàng", "Đồ Cam", "Đồ Đỏ", "Ngọc 6", "Ngọc 8", "Ngọc 10"][i - 8]}</span>`).join("")}<b>✦</b></div>` : game === "dice" ? `<div class="dice-tray">${[0, 1, 2].map((i) => `<span class="event-die" data-die="${i}">⚀</span>`).join("")}</div>` : `<div class="lottery-digits"><span data-digit="0">0</span><span data-digit="1">0</span></div>`}<strong id="lucky-result" aria-live="polite">${last ? "Kết quả lượt gần nhất" : "Chọn và bắt đầu một lượt"}</strong></section>
    ${game === "wheel" ? `<div class="wheel-luck"><b>May mắn +${((wheelLuckMultiplier(progress) - 1) * 100).toFixed(1)}%</b><span>${progress.wheelMisses ?? 0}/${MAX_WHEEL_LUCK} điểm · Tổng ${progress.wheelSpins ?? 0} lượt quay</span><small>Mỗi lượt chưa trúng vật phẩm hiếm cộng 1 điểm (+0,4% tỷ lệ hiếm), tối đa ×5. Trúng vật phẩm hiếm: đặt lại điểm. Lưu theo nhân vật.</small></div><button class="outline-button" data-play-lucky="wheel">Quay · 50 bạc</button><div class="wheel-odds">${WHEEL_PRIZES.map((p, i) => `<span class="${p.reward ? "rare-wheel-prize" : ""}" style="--prize-color:${p.color}">${p.reward?.kind === "equipment" ? equipmentMarkup("weapon", p.color, p.reward.rarity) : p.reward?.kind === "gem" ? gemMarkup(p.reward.gem) : `<i style="background:${p.color}"></i>`}${p.name}<b>${Number(odds[i].toFixed(6))}%</b></span>`).join("")}</div><small class="dim">Tỷ lệ hiện tại theo bảng; các ô trên vòng quay chỉ minh họa, không có tỷ lệ bằng nhau. Trang bị đúng cấp nhân vật, túi đầy chuyển Đồ chờ nhận; ngọc vào Túi ngọc. Túi đầy 99 bình HP: bình dư đổi thành 20 bạc/bình.</small>` : `<div class="event-bet"><label>Số bạc cược<input id="event-stake" type="number" min="10" max="5000" step="1" value="50" inputmode="numeric"></label>${game === "dice" ? `<label>Cửa cược<select id="event-choice"><option value="tai">Tài · 11–17</option><option value="xiu">Xỉu · 4–10</option></select></label>` : `<label>Số chọn · 00–99<input id="event-choice" type="text" maxlength="2" pattern="[0-9]{2}" value="00" inputmode="numeric"></label>`}</div><p class="dim">${game === "dice" ? "Ba xúc xắc. Bộ ba đồng số: cả Tài và Xỉu đều thua. Thắng nhận 2 lần tiền cược, gồm tiền vốn." : "Hai chữ số ngẫu nhiên. Trùng đủ hai số theo thứ tự: nhận 90 lần tiền cược, gồm tiền vốn."} Cược 10–5.000 bạc.</p><button class="outline-button" data-play-lucky="${game}">Mở thưởng</button>`}
    <h3>Lịch sử gần nhất</h3><div class="event-history">${
      progress.history
        .slice(0, 10)
        .map(
          (r) =>
            `<article><b>#${r.round} · ${labels[r.game]}</b><span data-receipt="${r.round}" data-reveal-at="${r.revealAt}">${r.revealAt > Date.now() ? "Đang mở thưởng…" : `${safe(r.result)} · ${prizeSummary(r)}`}</span><small>Cược ${r.stake} bạc${r.game !== "wheel" ? ` · Chọn ${r.choice === "tai" ? "Tài" : r.choice === "xiu" ? "Xỉu" : safe(r.choice)}` : ""}</small></article>`,
        )
        .join("") || `<p class="dim">Chưa có lượt chơi.</p>`
    }</div>`;
}
export function updateLuckyPresentation(
  progress: LuckyProgress,
  gold: number,
  now: number,
): void {
  const stage = document.querySelector<HTMLElement>("[data-lucky-stage]");
  if (!stage) return;
  const game = stage.dataset.luckyStage as LuckyGame,
    r = progress.history.find((r) => r.game === game);
  document.getElementById("event-gold")!.textContent =
    gold.toLocaleString("vi-VN");
  document
    .querySelectorAll<HTMLButtonElement>("[data-play-lucky]")
    .forEach((button) => {
      button.disabled = luckyBusy(progress, now);
    });
  if (!r) return;
  const pending = r.revealAt > now,
    p = Math.max(0, Math.min(1, (now - r.at) / 2200));
  stage.classList.toggle("rolling", pending);
  const wheel = stage.querySelector<HTMLElement>(".lucky-wheel");
  if (wheel) {
    const angle =
      (1080 +
        360 -
        (r.numbers[0] * (360 / WHEEL_PRIZES.length) +
          180 / WHEEL_PRIZES.length)) *
      (1 - Math.pow(1 - p, 3));
    wheel.style.transform = `rotate(${angle}deg)`;
    wheel.style.setProperty("--wheel-angle", `${angle}deg`);
  }
  stage.querySelectorAll<HTMLElement>("[data-die]").forEach((die, i) => {
    die.textContent = String.fromCodePoint(
      0x2680 + (pending ? Math.floor(now / 75 + i * 2) % 6 : r.numbers[i] - 1),
    );
  });
  stage.querySelectorAll<HTMLElement>("[data-digit]").forEach((digit, i) => {
    digit.textContent = String(
      pending ? Math.floor(now / 50 + i * 3) % 10 : r.numbers[i],
    );
  });
  document.getElementById("lucky-result")!.textContent = pending
    ? "Đang mở thưởng…"
    : `${r.result} · ${prizeSummary(r)}`;
  progress.history.forEach((receipt) => {
    const label = document.querySelector<HTMLElement>(
      `[data-receipt="${receipt.round}"]`,
    );
    if (label && now >= receipt.revealAt)
      label.textContent = `${receipt.result} · ${prizeSummary(receipt)}`;
  });
}
