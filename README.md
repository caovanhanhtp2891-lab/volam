# Giang Hồ Dị Truyện

Game web kiếm hiệp 2D với giao diện dọc và vòng chơi idle, phát triển theo [PLAN.md](./PLAN.md). Bố cục và luồng thao tác tham khảo [Võ Lâm Idle](https://jxoffline.khoa-vnd92.workers.dev/); mã game và hình ảnh được triển khai trong kho `volam`.

## Giao diện và vòng chơi idle

- Chọn một trong 10 môn phái thuộc 5 hệ ngũ hành, đặt tên và giới tính nhân vật. Mỗi phái có ngoại hình riêng và bộ 2 võ công + 1 tuyệt chiêu với hành vi chiến đấu khác nhau.
- Sân đấu nằm phía trên, năm tab **Giang hồ / Nhân vật / Võ công / Hành trang / Khác** nằm dưới. Giao diện xanh rêu, viền vàng, dùng chung trên điện thoại và desktop.
- Có 16 vùng, 160 ải; mỗi ải có 4 đợt, trùm ở đợt cuối của mỗi ải thứ 10. **Vượt ải** mở ải kế tiếp; **Luyện công** lặp lại ải hiện tại. Chỉ đi tới vùng/ải đã mở.
- Tự tìm quái, dùng võ công, dùng thuốc và nhặt đồ. WASD hoặc joystick chuyển sang điều khiển tay; bấm **Tự động** để tiếp tục. Khắc chế ngũ hành tăng 25% hoặc giảm 20% sát thương.
- Nhân vật nhỏ 46 × 50, áo/tóc/vũ khí riêng cho từng phái; nhún/đảo hướng theo di chuyển, nghiêng người khi đánh/thi triển và lướt có thời gian. Camera bám mềm; chuyển đợt giữ vị trí nhân vật. Quái có động tác lao đánh, phản ứng trúng đòn và ngã xuống.
- Cảnh giới tu tiên tự tính từ lực chiến hiện tại: đủ 19 bậc từ Luyện Thể đến Đạo Tổ. Tên cảnh giới và tầng/giai đoạn nằm trên đầu nhân vật; vòng sáng dưới chân tăng màu, lớp vòng, phù văn, hoa sen, tia và hạt sáng theo bậc. Tab **Nhân vật** hiển thị cảnh giới, lực chiến còn thiếu và bảng các ngưỡng.
- Đánh thường cận chiến có vệt chém, đòn tầm xa có đạn bay và gây sát thương khi chạm mục tiêu. Hiệu ứng theo năm hệ: kim nhận, lá/ám khí, băng, lửa và lôi. Chiêu ngoài tầm không tiêu hao MP hoặc hồi chiêu.
- Trang bị bật ra rồi rơi xuống đất, có hình kiếm, áo, mũ, giày, nhẫn và thú cưỡi theo vị trí; màu và ánh sáng theo phẩm chất dùng chung trên đất, Hành trang, Nhân vật và màn so sánh. Đồ Hiếm/Cực phẩm có cột sáng và quầng sáng dưới chân khi mặc; vũ khí phát sáng theo màu trang bị. Đồ nằm trên sân ít nhất 1,6 giây trước khi tự nhặt. Chạm đồ để đi tới nhặt hoặc dùng **E**. Đồ tự nhặt bay về nhân vật, thông báo có thể mở so sánh với trang bị đang dùng. Đồ chưa nhặt được lưu cùng nhân vật; túi đầy vẫn nhặt được bạc, trang bị tự nhặt được giữ trong Đồ chờ nhận.
- Lên cấp nhận 5 điểm tiềm năng và 1 điểm võ học. Cộng/rút tiềm năng thay đổi chỉ số thật. Võ công nâng đến bậc 20, có thể rút các điểm đã nâng, giữ bậc nhập môn.
- Nhân vật có 11 vị trí trang bị và 60 ô hành trang, tự mặc đồ tốt hơn nếu bật tùy chọn; đồ vượt sức chứa vẫn được giữ trong **Đồ chờ nhận**. Có cửa hàng, cường hóa, bình HP/MP, về thành và quay lại ải.
- Tự lưu mỗi 10 giây và khi giao dịch. Ba ô nhân vật lưu độc lập; hỗ trợ file `.volamsave`, mã JSON, sao lưu trước khi nạp/tạo lại và khôi phục bản sao lưu. File không hợp lệ không thay thế nhân vật hiện tại.
- Thưởng ngày chỉ nhận một lần cho mỗi nhân vật, tính theo giờ Việt Nam. Khi tải lại nhân vật đang luyện ải, nhận thưởng vắng mặt tối đa 4 giờ; ở thành không nhận thưởng luyện công.
- Trong tab **Khác**, chọn **Rừng Trúc · Phiêu lưu** để trở lại nhiệm vụ, NPC và hai phụ bản của bản cũ. Save cũ tự chuyển sang chế độ phiêu lưu, giữ nhân vật và vật phẩm. Thẻ **Sân luyện mới đã sẵn sàng** trong Giang hồ có nút **Vào luyện công** để bật sân luyện tự động với nhân vật đó.
- Tab **Khác** hiển thị bản **v0.4.0 · Thập đại môn phái** để xác định bản đang tải.

Ảnh đại diện, nhân vật của 10 phái, quái và NPC dùng một atlas WebP 28 KB; hiệu ứng và trang bị dưới đất được vẽ trên Canvas. Đây là triển khai vòng chơi và giao diện tương ứng; chưa thay thế toàn bộ dữ liệu kỹ năng, sprite/animation, bot, bộ trang bị và chế tác chuyên sâu của game tham chiếu.

## Cảnh giới theo lực chiến

Lực chiến = phần nguyên của **Công × 3 + Phòng × 2 + HP tối đa × 0,15**, bao gồm trang bị đã mặc/cường hóa và tiềm năng. Cảnh giới dùng chính con số này; thay đồ hoặc phân phối lại tiềm năng sẽ cập nhật tên và vòng sáng ngay. HP đang mất khi chiến đấu không làm tụt cảnh giới. Tiến trình cũ không cần thêm trường lưu hoặc tạo lại nhân vật.

| Bậc | Cảnh giới        | Lực chiến từ |
| --- | ---------------- | -----------: |
| 1   | Luyện Thể        |            0 |
| 2   | Luyện Khí        |          250 |
| 3   | Trúc Cơ          |          650 |
| 4   | Kim Đan          |        1.200 |
| 5   | Nguyên Anh       |        2.000 |
| 6   | Hóa Thần         |        3.000 |
| 7   | Luyện Hư         |        4.200 |
| 8   | Hợp Thể          |        5.600 |
| 9   | Đại Thừa         |        7.200 |
| 10  | Độ Kiếp          |        9.000 |
| 11  | Chân Tiên        |       11.000 |
| 12  | Thiên Tiên       |       13.000 |
| 13  | Huyền Tiên       |       15.000 |
| 14  | Kim Tiên         |       17.000 |
| 15  | Thái Ất Kim Tiên |       19.000 |
| 16  | Đại La Kim Tiên  |       21.500 |
| 17  | Tiên Vương       |       24.000 |
| 18  | Tiên Đế          |       27.000 |
| 19  | Đạo Tổ           |       30.000 |

Hai bậc đầu chia đều thành 9 tầng; từ Trúc Cơ chia thành **Sơ kỳ → Trung kỳ → Hậu kỳ → Đỉnh phong → Đại viên mãn** trong khoảng lực chiến của mỗi bậc. Đạo Tổ chia theo các mốc 30.000 / 30.400 / 30.800 / 31.200 / 31.600. Ngưỡng được chọn cho quy mô chỉ số hiện tại của 160 cấp; dữ liệu nằm trong `src/cultivation.ts`. Việc chuyển bậc tự diễn ra khi đủ lực chiến, chưa có thao tác dùng đan hoặc nhiệm vụ thiên kiếp riêng.

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

Bộ này kiểm tra 10 màn chọn phái, chiến đấu tự động thật, đánh trùm/mở vùng, cộng/rút điểm, thưởng ngày chống nhận lặp, import/export/khôi phục bản sao lưu, ba ô nhân vật, thưởng vắng mặt không lặp, save cũ, online và sáu kích thước viewport từ 320×568 đến 1440×900. Kiểm tra thêm hình trang bị ở cả 11 vị trí, chạm trực tiếp vào hình để so sánh/mặc và bật sân luyện từ nhân vật cũ mà giữ cấp độ, đồ, nhiệm vụ và điểm võ học. Test boss dùng fixture mạnh để kiểm tra luồng; không thay thế playtest cân bằng toàn bộ 160 ải.

Kiểm tra chuyển động, lướt, đạn bay và luồng đồ rơi bằng cùng các biến môi trường:

```bash
node tests/combat-browser-smoke.cjs
```

Bộ này kiểm tra quãng đường di chuyển thật, không mất MP ngoài tầm, lướt qua nhiều frame, sát thương sau khi đạn tới, trang bị rơi từ boss, đồ dưới đất sau reload, chạm nhặt/so sánh/mặc và túi đầy không làm mất đồ hoặc cản nhặt bạc.

Kiểm tra cảnh giới bằng cùng các biến môi trường:

```bash
node tests/cultivation-browser-smoke.cjs
```

Bộ này mặc đổi đồ mạnh/yếu qua giao diện thật, kiểm tra cảnh giới sau reload, 19 tên được vẽ trên đầu dù giữ nguyên cấp nhân vật, màu sáng thực trên Canvas, vòng sáng chuyển động khi đứng yên, bảng ngưỡng và sáu kích thước màn hình. Ảnh chụp mặc định lưu vào `/tmp/volam-cultivation`; có thể đổi bằng `VOLAM_CAPTURE_DIR`.

Browser test kiểm tra mua/bán, bình hồi phục, migrate save, kích thước mobile, hai phụ bản/đợt/boss, nhận thưởng lặp, túi đầy, tải lại, chết và timeout. Bài kiểm tra clear phụ bản dùng fixture nhân vật mạnh để kiểm chứng luồng nhanh; không thay thế playtest cân bằng ở cấp tối thiểu.

Giao diện chiếm một viewport, hỗ trợ màn hình dọc và điện thoại xoay ngang: sân đấu ở trên, menu ở dưới, minimap theo vị trí thật, joystick, Auto và nút kỹ năng tròn. Các tab thông tin cuộn nội bộ, không kéo cả trang. Nút thu gọn/mở rộng cho phép tập trung vào sân đấu. Sát thương thường xuất hiện bằng số nổi và nhật ký, không bật toast liên tục che menu.

Đồ họa dùng một atlas **28.026 byte**, 480 × 384, 20 ô: 10 phái và 10 hình quái/NPC/loot. Nhân vật vẽ ở 46 × 50, nhỏ hơn khoảng 40% so với sprite 76 × 83 trước đây. Icon kỹ năng là SVG nội tuyến; 30 chiêu dùng nét Canvas gọn theo côn, thương, ám khí, độc, sen, quạt, băng, rồng, song đao, thái cực, kiếm và lôi. Không tải thêm ảnh chiêu. Nền vẽ một lần, game vẽ tối đa 30 FPS, minimap khoảng 5 lần/giây; tối đa 24 hiệu ứng thoáng và 6 trận kéo dài. Vòng cảnh giới và màu trang bị được giữ. Chi tiết nguồn ảnh và giới hạn animation: [src/assets/README.md](./src/assets/README.md). Chiến đấu online có authority, tổ đội và bang hội vẫn nằm trong lộ trình.

## Võ công của thập đại môn phái · v0.4.0

Màn nhập môn có 10 ô nhỏ, chọn phái để xem cả ba icon, mô tả và hiệu ứng trước khi bấm **Gia nhập**. Tên, giới tính, các ô nhân vật và tiến trình idle vẫn được giữ. Phím 1/2/3 tương ứng chiêu cấp 1/3/5; tuyệt chiêu cần 100 nộ. Nội lực: 8/14/20 MP; hồi chiêu: 4/7/15 giây. Bậc võ học vẫn tối đa 20 và có rút điểm.

| Phái | Chiêu 1 | Chiêu 2 | Tuyệt chiêu | Đặc điểm |
| --- | --- | --- | --- | --- |
| Thiếu Lâm | Vi Đà Côn | Kim Chung Tráo | Đại Lực Kim Cang | Côn quét nón, khiên, chấn vùng |
| Thiên Vương | Truy Tinh Thương | Trục Nguyệt Bộ | Bá Vương Phá Trận | Thương xuyên tuyến, lướt, phá giáp |
| Đường Môn | Truy Tâm Tiễn | Lôi Hỏa Cơ Quan | Bạo Vũ Lê Hoa | Ba ám khí, bẫy 4 giây, mưa tiễn |
| Ngũ Độc | Độc Chưởng | Ngũ Độc Trận | Vạn Cổ Phệ Tâm | Độc theo thời gian, trận, độc vùng |
| Nga Mi | Phật Quang Phổ Chiếu | Liên Hoa Hộ Thể | Từ Hàng Phổ Độ | Hồi máu, khiên, hoa sen |
| Thúy Yên | Phi Tuyết Liên Thiên | Băng Tâm Ngọc Cốt | Băng Phong Vạn Lý | Quạt tuyết, làm chậm, đóng băng |
| Cái Bang | Giáng Long Chưởng | Túy Điệp Cuồng Vũ | Phi Long Tại Thiên | Hỏa long, hồi sức, hỏa trận |
| Thiên Nhẫn | Liệt Hỏa Song Nhận | Huyễn Ảnh Bộ | Ma Diệm Thất Sát | Song đao, áp sát, hồi sức khi trúng |
| Võ Đang | Lưỡng Nghi Kiếm | Thái Cực Hộ Thể | Vạn Kiếm Quy Tông | Kiếm xuyên tuyến, thái cực, mưa kiếm |
| Côn Lôn | Ngũ Lôi Chưởng | Lôi Động Cửu Thiên | Thiên Lôi Trấn Địa | Sét lan tối đa 3 quái, choáng, phá giáp |

Dữ liệu chung ở `src/sects.ts`, hình hiệu ứng/icon ở `src/sect-effects.ts`. Boss chịu choáng/đóng băng tối đa 0,35 giây. Lướt kiểm tra cả đường qua collider; không đủ MP/nộ, ngoài tầm, bị khóa cấp hoặc đường lướt bị chặn sẽ không mất MP/hồi chiêu. Độc, bẫy và hỏa trận thực sự gây sát thương theo thời gian. Nội lực hồi 0,7 MP/giây khi chơi. Những con số này phục vụ prototype, cần playtest cân bằng cho cả 10 phái ở cấp nhập môn và boss.

Save giữ các `factionId` hiện có và mã archetype `kim/hoa/thuy` để tương thích ba ô nhân vật/file xuất. Save rất cũ chưa có `factionId` sẽ dùng Thiên Vương/Cái Bang/Nga Mi tương ứng, giữ cấp/XP, bạc, trang bị và điểm võ học; bán kính nhân vật chuyển về 12. Sprite có một khung/phái, nhún/đảo hướng/động tác đơn giản, chưa có bộ đi bộ bốn hướng hoặc hai bộ sprite nam/nữ riêng.

Kiểm tra thêm 10 phái, đủ 30 chiêu, DOT/bẫy/sét lan, chi phí khi cast không hợp lệ và viewport:

```bash
node --experimental-strip-types tests/sects-browser.cjs
```

Dùng các biến Playwright/Chromium/URL như các bộ browser test ở trên. Unit test `pnpm test` kiểm tra bộ chiêu, ngũ hành, save, hình học mục tiêu và ngân sách atlas dưới 32 KB.
