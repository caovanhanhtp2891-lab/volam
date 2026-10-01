# Giang Hồ Dị Truyện

Prototype game web kiếm hiệp 2D theo [PLAN.md](./PLAN.md).

## Chạy local

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Mở địa chỉ Vite in ra trong terminal. Build production:

```bash
pnpm build
pnpm preview
```

## Chạy nền online P3

Mở thêm một terminal để chạy server session/World WebSocket:

```bash
pnpm --config.store-dir=/tmp/volam-pnpm-store run server:build
pnpm --config.store-dir=/tmp/volam-pnpm-store run server:start
```

Server mặc định ở `http://127.0.0.1:8787`. Kiểm tra nhanh:

```bash
curl -fsS http://127.0.0.1:8787/api/health/ready
```

Trong game, chọn môn phái rồi bấm **Kết nối online**. Bản P3 hiện có guest session lưu JSON, health check, snapshot WebSocket, input di chuyển được kiểm tra phía server và hiển thị người chơi đang kết nối; chiến đấu, tổ đội và bang hội vẫn là các mốc kế tiếp.

Trong môi trường cloud bị giới hạn thư mục store mặc định của pnpm, dùng:

```bash
pnpm --config.store-dir=/tmp/volam-pnpm-store install --frozen-lockfile
pnpm --config.store-dir=/tmp/volam-pnpm-store run build
```

## Điều khiển prototype

- `WASD` hoặc phím mũi tên: di chuyển.
- Click quái: chọn mục tiêu và tự áp sát/đánh thường.
- `1`, `2`: dùng võ công; `3`: tuyệt chiêu khi đủ nộ và đạt cấp 5.
- `E`: nhặt đồ và bạc quanh nhân vật.
- `B`: mở/đóng túi đồ; `J`: xem nhật ký nhiệm vụ.
- `K`: mở tab Võ công; click NPC Mộc sư huynh, Lão Thiết hoặc cổng Cổ Mộ để tương tác.
- Click một điểm trên mặt đất để di chuyển tới điểm đó.

Prototype đã có lát gameplay local gồm điểm võ học/nâng kỹ năng, NPC, nhiệm vụ nhận thưởng và phụ bản solo 3 phút với boss Cổ Mộ Thủ Vệ, nền online P3, cùng giao diện P6 portrait 9:16 responsive cho mobile. Bản P6 thêm HUD kiểu game dọc, minimap, tài nguyên, chat hệ thống, Auto chiến đấu, joystick chạm, menu đáy, bottom-sheet, thanh kỹ năng lớn hơn, sprite nhân vật/quái/loot, hiệu ứng kỹ năng 2D và số sát thương/XP nổi; server authoritative cho chiến đấu, tổ đội online và bang hội vẫn là các mốc kế tiếp.
