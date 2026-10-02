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
- `Q` / `R`: dùng bình HP / MP; mobile có hai nút nhỏ cạnh vùng điều khiển.
- `B`: mở/đóng túi đồ; `J`: xem nhật ký nhiệm vụ.
- `K`: mở tab Võ công; click NPC Mộc sư huynh, Lão Thiết hoặc cổng Cổ Mộ để tương tác.
- Click một điểm trên mặt đất để di chuyển tới điểm đó.

Prototype đã có gameplay local gồm điểm võ học/nâng kỹ năng, NPC, nhiệm vụ nhận thưởng, cửa hàng/bình hồi phục, bán đồ và hai phụ bản solo, cùng nền online P3.

## Chức năng gameplay mới

- **Bình hồi phục:** Kim Sang Dược hồi 40% HP tối đa; Hồi Khí Đan hồi 40% MP tối đa. Hồi chiêu dùng chung 8 giây; tài nguyên đầy không tiêu hao bình. Tân thủ nhận 3 bình HP và 2 bình MP, bình xếp riêng ngoài 12 ô trang bị.
- **Tiệm:** mở tab Tiệm trong Túi đồ hoặc nói chuyện Châu thương nhân ở Thanh Khê. Mua 1/5 bình bằng bạc (20 bạc/HP, 15 bạc/MP), tối đa 99 bình mỗi loại. Tiệm đóng khi ở phụ bản.
- **Bán đồ:** trong Túi đồ, bấm Bán rồi Xác nhận bán; có Hủy. Không bán trang bị đang mặc hoặc bán trong phụ bản. Giá hiển thị trước, tăng theo chỉ số/cấp/cường hóa.
- **Cổ Mộ Bí Ẩn:** cấp 3+, 3 phút, hai đợt gồm U Binh/Mộ Tướng rồi Cổ Mộ Thủ Vệ. Thưởng chính: 320 XP, 420 bạc, 3 đá, 1 token và một món Hiếm cấp 8.
- **Trúc Lâm Thí Luyện:** cấp 5+ và đã nhận thưởng hoàn thành Cổ Mộ, 4 phút, ba đợt Trúc Lang → hộ vệ tinh anh → Lang Vương Thí Luyện. Thưởng chính: 500 XP, 650 bạc, 5 đá, 2 token và một món Hiếm cấp 10.
- Quái phụ bản không hồi sinh; phải dọn hết đợt trước để mở đợt sau. Boss báo vùng đánh đỏ, thêm đòn Cuồng Nộ dưới 50% HP. Ngã xuống/hết giờ/rời sớm sẽ về Rừng Trúc, không có thưởng hoàn thành; chưa áp dụng quota ngày trong bản local.
- **Đồ chờ nhận:** nhận thưởng phụ bản sẽ thu hồi toàn bộ đồ/bạc/đá còn trên đất. Đồ vượt sức chứa túi được giữ trong Đồ chờ nhận; bán bớt rồi bấm Nhận vào túi. Nhận thưởng, mua/bán và thu hồi tự lưu. Túi đồ có nút Lưu/Tải cho mobile; save cũ được bổ sung dữ liệu mới mà không reset nhân vật.

Lượt phụ bản đang chơi chưa được lưu/khôi phục khi tải lại trang: checkpoint trước lúc vào được giữ, lượt đã nhận thưởng được lưu sau khi trở về Rừng Trúc. Các giao dịch và phần thưởng trên đây là **prototype local**, không phải tiến trình online chống gian lận hoặc chức năng bang hội/tổ đội hoàn chỉnh.

## Kiểm thử

Node.js 22.18+ hoặc 24, không cần thư viện test bổ sung:

```bash
pnpm test
pnpm typecheck
pnpm exec vite build --base=/volam/
```

GitHub Actions chạy unit test trước khi build/deploy Pages. Browser smoke test tùy chọn trong `tests/browser-smoke.cjs`, cần Playwright và Chromium cài sẵn; đặt `VOLAM_PLAYWRIGHT_PATH`, `VOLAM_CHROMIUM_PATH` và `VOLAM_TEST_URL` khi khác mặc định rồi chạy `node tests/browser-smoke.cjs`.

Browser test kiểm tra mua/bán, bình hồi phục, migrate save, kích thước mobile, hai phụ bản/đợt/boss, nhận thưởng lặp, túi đầy, tải lại, chết và timeout. Bài kiểm tra clear phụ bản dùng fixture nhân vật mạnh để kiểm chứng luồng nhanh; không thay thế playtest cân bằng ở cấp tối thiểu.

Giao diện mobile chiếm một viewport, hỗ trợ màn hình dọc và điện thoại xoay ngang: HUD gọn ở các góc, nhiệm vụ có nút thu gọn, minimap theo vị trí thật, joystick, Auto và nút kỹ năng tròn cố định không bị kéo giãn. Nút Nhặt nằm riêng phía trên kỹ năng; túi đồ/võ công/rèn/phụ bản mở trong bottom-sheet cuộn nội bộ. Sát thương thường xuất hiện bằng số nổi và nhật ký, không bật toast liên tục che menu.

Đồ họa dùng hình 2D phẳng, ít màu: một atlas **19 KB** cho ba môn phái, quái, boss, NPC, loot và icon chiêu. Nền/cây/đá vẽ bằng hình đơn giản và lưu sẵn, không tải ảnh nền lớn. Game vẽ tối đa 30 FPS, minimap khoảng 5 lần/giây và giảm hiệu ứng mờ/phát sáng để nhẹ trên điện thoại. Chi tiết nguồn ảnh, ngân sách và giới hạn animation nằm trong [src/assets/README.md](./src/assets/README.md). Server authoritative cho chiến đấu, tổ đội online và bang hội vẫn là các mốc kế tiếp.
