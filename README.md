# Giang Hồ Dị Truyện

Game web kiếm hiệp 2D với giao diện dọc và vòng chơi idle, phát triển theo [PLAN.md](./PLAN.md). Bố cục và luồng thao tác tham khảo [Võ Lâm Idle](https://jxoffline.khoa-vnd92.workers.dev/); mã game và hình ảnh được triển khai trong kho `volam`.

## Giao diện và vòng chơi idle

- Chọn một trong 10 môn phái thuộc 5 hệ ngũ hành, đặt tên và giới tính nhân vật. Hiện các phái dùng ba nhịp chiến đấu của engine: cận chiến, tầm xa và hồi phục/khiên; tên võ công theo từng phái.
- Sân đấu nằm phía trên, năm tab **Giang hồ / Nhân vật / Võ công / Hành trang / Khác** nằm dưới. Giao diện xanh rêu, viền vàng, dùng chung trên điện thoại và desktop.
- Có 16 vùng, 160 ải; mỗi ải có 4 đợt, trùm ở đợt cuối của mỗi ải thứ 10. **Vượt ải** mở ải kế tiếp; **Luyện công** lặp lại ải hiện tại. Chỉ đi tới vùng/ải đã mở.
- Tự tìm quái, dùng võ công, dùng thuốc và nhặt đồ. WASD hoặc joystick chuyển sang điều khiển tay; bấm **Tự động** để tiếp tục. Khắc chế ngũ hành tăng 25% hoặc giảm 20% sát thương.
- Nhân vật có tay/chân chuyển động theo quãng đường thật, quay mặt theo tám hướng, động tác đánh/thi triển và lướt có thời gian. Camera bám mềm; chuyển đợt giữ vị trí nhân vật. Quái có động tác lao đánh, phản ứng trúng đòn và ngã xuống.
- Đánh thường cận chiến có vệt chém, đòn tầm xa có đạn bay và gây sát thương khi chạm mục tiêu. Hiệu ứng theo năm hệ: kim nhận, lá/ám khí, băng, lửa và lôi. Chiêu ngoài tầm không tiêu hao MP hoặc hồi chiêu.
- Trang bị bật ra rồi rơi xuống đất, có icon theo vị trí, tên và màu phẩm chất; đồ Hiếm/Cực phẩm có cột sáng. Chạm đồ để đi tới nhặt hoặc dùng **E**. Đồ tự nhặt bay về nhân vật, thông báo có thể mở so sánh với trang bị đang dùng. Đồ chưa nhặt được lưu cùng nhân vật; túi đầy vẫn nhặt được bạc, trang bị tự nhặt được giữ trong Đồ chờ nhận.
- Lên cấp nhận 5 điểm tiềm năng và 1 điểm võ học. Cộng/rút tiềm năng thay đổi chỉ số thật. Võ công nâng đến bậc 20, có thể rút các điểm đã nâng, giữ bậc nhập môn.
- Nhân vật có 11 vị trí trang bị và 60 ô hành trang, tự mặc đồ tốt hơn nếu bật tùy chọn; đồ vượt sức chứa vẫn được giữ trong **Đồ chờ nhận**. Có cửa hàng, cường hóa, bình HP/MP, về thành và quay lại ải.
- Tự lưu mỗi 10 giây và khi giao dịch. Ba ô nhân vật lưu độc lập; hỗ trợ file `.volamsave`, mã JSON, sao lưu trước khi nạp/tạo lại và khôi phục bản sao lưu. File không hợp lệ không thay thế nhân vật hiện tại.
- Thưởng ngày chỉ nhận một lần cho mỗi nhân vật, tính theo giờ Việt Nam. Khi tải lại nhân vật đang luyện ải, nhận thưởng vắng mặt tối đa 4 giờ; ở thành không nhận thưởng luyện công.
- Trong tab **Khác**, chọn **Rừng Trúc · Phiêu lưu** để trở lại nhiệm vụ, NPC và hai phụ bản của bản cũ. Save cũ tự chuyển sang chế độ phiêu lưu, giữ nhân vật và vật phẩm.

Ảnh đại diện, quái và NPC dùng atlas gốc của `volam`; nhân vật, hiệu ứng và trang bị dưới đất được vẽ trên Canvas. Đây là triển khai vòng chơi và giao diện tương ứng; chưa thay thế toàn bộ dữ liệu kỹ năng, sprite/animation, bot, bộ trang bị và chế tác chuyên sâu của game tham chiếu.

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

Khi kiểm tra bản build theo đường dẫn GitHub Pages, dùng cùng `base` khi build và preview:

```bash
pnpm exec vite build --base=/volam/
pnpm run preview --base=/volam/ --port 4174 --strictPort
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
- `4`: đánh thường vào mục tiêu trong tầm.
- `E`: nhặt đồ và bạc quanh nhân vật.
- `Q` / `R`: dùng bình HP / MP; mobile có hai nút nhỏ cạnh vùng điều khiển.
- `B`: mở/đóng túi đồ; `J`: xem nhật ký nhiệm vụ.
- `K`: mở tab Võ công; click NPC Mộc sư huynh, Lão Thiết hoặc cổng Cổ Mộ để tương tác.
- Click một điểm trên mặt đất để di chuyển tới điểm đó.
- Chạm trang bị dưới đất: đi tới và nhặt. Chạm thông báo đồ vừa nhặt: xem so sánh và mặc đồ.

Prototype đã có gameplay local gồm điểm võ học/nâng kỹ năng, NPC, nhiệm vụ nhận thưởng, cửa hàng/bình hồi phục, bán đồ và hai phụ bản solo, cùng nền online P3.

## Chức năng gameplay mới

- **Bình hồi phục:** Kim Sang Dược hồi 40% HP tối đa; Hồi Khí Đan hồi 40% MP tối đa. Hồi chiêu dùng chung 8 giây; tài nguyên đầy không tiêu hao bình. Tân thủ nhận 3 bình HP và 2 bình MP, bình xếp riêng ngoài 60 ô hành trang.
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

Bộ kiểm tra giao diện idle mới:

```bash
VOLAM_PLAYWRIGHT_PATH="$(node -p 'require.resolve("playwright")')" \
VOLAM_CHROMIUM_PATH=/usr/bin/chromium \
VOLAM_TEST_URL=http://127.0.0.1:5173 \
node tests/idle-browser-smoke.cjs
```

Bộ này kiểm tra 10 màn chọn phái, chiến đấu tự động thật, đánh trùm/mở vùng, cộng/rút điểm, thưởng ngày chống nhận lặp, import/export/khôi phục bản sao lưu, ba ô nhân vật, thưởng vắng mặt không lặp, save cũ, online và sáu kích thước viewport từ 320×568 đến 1440×900. Test boss dùng fixture mạnh để kiểm tra luồng; không thay thế playtest cân bằng toàn bộ 160 ải.

Kiểm tra chuyển động, lướt, đạn bay và luồng đồ rơi bằng cùng các biến môi trường:

```bash
node tests/combat-browser-smoke.cjs
```

Bộ này kiểm tra quãng đường di chuyển thật, không mất MP ngoài tầm, lướt qua nhiều frame, sát thương sau khi đạn tới, trang bị rơi từ boss, đồ dưới đất sau reload, chạm nhặt/so sánh/mặc và túi đầy không làm mất đồ hoặc cản nhặt bạc.

Browser test kiểm tra mua/bán, bình hồi phục, migrate save, kích thước mobile, hai phụ bản/đợt/boss, nhận thưởng lặp, túi đầy, tải lại, chết và timeout. Bài kiểm tra clear phụ bản dùng fixture nhân vật mạnh để kiểm chứng luồng nhanh; không thay thế playtest cân bằng ở cấp tối thiểu.

Giao diện chiếm một viewport, hỗ trợ màn hình dọc và điện thoại xoay ngang: sân đấu ở trên, menu ở dưới, minimap theo vị trí thật, joystick, Auto và nút kỹ năng tròn. Các tab thông tin cuộn nội bộ, không kéo cả trang. Nút thu gọn/mở rộng cho phép tập trung vào sân đấu. Sát thương thường xuất hiện bằng số nổi và nhật ký, không bật toast liên tục che menu.

Đồ họa dùng hình 2D phẳng, ít màu: một atlas **19 KB** cho ảnh đại diện, quái, boss, NPC và icon chiêu. Nhân vật có các khớp tay/chân vẽ trên Canvas, màu áo và vũ khí theo phái; không tải thêm ảnh animation. Nền/cây/đá vẽ bằng hình đơn giản và lưu sẵn, không tải ảnh nền lớn. Game vẽ tối đa 30 FPS, minimap khoảng 5 lần/giây; số hiệu ứng/đạn và đồ bay được giới hạn để nhẹ trên điện thoại. Chi tiết nguồn ảnh và ngân sách nằm trong [src/assets/README.md](./src/assets/README.md). Server authoritative cho chiến đấu, tổ đội online và bang hội vẫn là các mốc kế tiếp.
