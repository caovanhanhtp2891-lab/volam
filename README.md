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
- Click một điểm trên mặt đất để di chuyển tới điểm đó.

Prototype hiện chạy cục bộ trên trình duyệt, chưa có tài khoản, server authoritative, tổ đội online hoặc bang hội. Đây là nền P0–P2 để kiểm chứng cảm giác di chuyển, chiến đấu, loot và boss trước khi triển khai backend.
