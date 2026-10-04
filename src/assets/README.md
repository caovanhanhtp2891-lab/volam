# Hình 2D đơn giản, nhẹ

`simple-atlas.webp` giữ atlas NPC/quái/đồ nhặt cũ: **28.026 byte**, 480 × 384 px, trong suốt, tối đa 64 màu. Atlas 5 × 4 chứa 20 ô 96 × 96 px. Tọa độ nằm trong `src/art.ts`.

| Hàng | Nội dung từ trái sang phải |
| --- | --- |
| 1 | Thiếu Lâm, Thiên Vương, Đường Môn, Ngũ Độc, Nga Mi |
| 2 | Thúy Yên, Cái Bang, Thiên Nhẫn, Võ Đang, Côn Lôn |
| 3 | Sơn tặc, sói, Lang Vương, bọ, u binh |
| 4 | Người dẫn đường, thợ rèn, cổng phụ bản, boss cổ mộ, loot |

Mười nhân vật được tạo riêng bằng công cụ tạo ảnh OpenAI ngày 03/10/2026: hình cartoon phẳng, áo trơn, mặt ít nét, mỗi phái có tóc/mũ/vũ khí riêng. Thiếu Lâm đầu trọc/áo tu/côn; Thiên Vương giáp/chùm mũ đỏ/thương; Đường Môn che mặt/nỏ; Ngũ Độc tóc đôi/trượng; Nga Mi áo trắng hồng/sen; Thúy Yên áo xanh/quạt; Cái Bang mũ rơm/gậy/bầu rượu; Thiên Nhẫn áo đen đỏ/song đao; Võ Đang áo đạo/kiếm; Côn Lôn tóc trắng/mũ/pháp khí. Các ô quái/NPC/loot giữ ảnh tạo riêng ngày 02/10/2026.

PNG gốc được cắt từng ô, trim, thu nhỏ tối đa 78 × 78, đặt vào ô 96 × 96, giới hạn 64 màu và xuất WebP lossless. PNG nguồn không nằm trong bundle. Không tải asset bên thứ ba. Ngân sách atlas dưới 32 KB được kiểm tra trong unit test.

`sect-characters.webp` là atlas nhân vật mới **621.026 byte**, 1223 × 1286 px, trong suốt, 5 cột × 4 hàng. Hàng 1–2 là 10 môn phái nam, hàng 3–4 là nữ theo cùng thứ tự: Thiếu Lâm, Thiên Vương, Đường Môn, Ngũ Độc, Nga Mi, Thúy Yên, Cái Bang, Thiên Nhẫn, Võ Đang, Côn Lôn. Hình được tạo riêng bằng OpenAI image generation ngày 03–04/10/2026, lấy cảm hứng kiếm hiệp cổ trang, không dùng asset chính thức. Bản v0.14.0 đã dùng công cụ tạo ảnh sửa 20 ô thành tay không, tránh vũ khí vẽ sẵn trùng với món đang mặc. PNG nguồn được nén WebP chất lượng 88; bundle chỉ chứa WebP. Ngân sách riêng dưới 768 KiB được kiểm tra trong unit test.

`character-art.ts` cung cấp tọa độ mẫu nam/nữ và vùng khuôn mặt. `art.ts` dùng cùng vùng hình cho chọn phái và Canvas; avatar là SVG cắt khuôn mặt từ đúng mẫu này. `character-preview.ts` phóng cùng renderer `drawAnimatedHero` trong trận, không vẽ nhân vật khác cho chân dung. Đổi giới tính cập nhật avatar, shortcut, hình sân và chân dung.

Nhân vật trong sân vẽ **56 × 76**, collider bán kính 12; bóng và thanh HP gọn. Hai nửa thân dưới bước luân phiên theo quãng đường thật bằng cách crop atlas, đảo hướng và nghiêng người khi đánh/thi triển. Chân dừng khi đứng yên, cưỡi ngựa hoặc lướt. Mỗi phái/giới tính có một khung, chưa có bộ animation bốn hướng. Hoa văn/ngọc bội trang bị được giữ nhỏ trên áo; vũ khí có kiểu món cụ thể dùng `held-weapon-art.ts`, tỷ lệ riêng với cán/chuôi và ngón tay đè trên điểm cầm; `actor-rig.ts` giữ điểm tay của từng phái và điểm yên ngựa. Cả chân dung lẫn sân dùng cùng renderer.

`military-art.ts` vẽ 7 ấn chức vị bằng SVG nội tuyến với núm ấn, thân ngọc/kim loại, dây tua, huy hiệu và chữ triện. Hoàng Đế có núm rồng và tua đỏ. Ô ấn trống có nét đứt; ảnh của ô, danh sách sắc phong và phần tóm tắt dùng chung hàm. Không thêm bitmap cho ấn hoặc bản đồ lãnh thổ; bản đồ dùng CSS/SVG, nền công thành tái sử dụng renderer nền phụ bản.


Ba mươi icon võ công v0.8.0 dùng SVG nội tuyến trong `src/skill-art.ts`: mỗi chiêu có hình riêng, nền tròn, ánh màu tĩnh và nét vũ khí/biểu tượng sáng. Hình tự vẽ bằng vector, lấy cảm hứng từ đặc trưng võ học Võ Lâm/Kiếm Thế, không lấy asset chính thức. `src/sect-effects.ts` vẽ 16 nhóm motif với biến thể theo cấp chiêu/phái, viền màu/lõi trắng, vệt chuyển động, cánh sen, thương trận, cổ trùng, băng tinh, hỏa long, ma đao, thái cực, mưa kiếm và lôi trận. Đạn được phân biệt theo 10 phái thay vì chỉ năm hệ.

Mỗi hiệu ứng dùng hình học có giới hạn: tối đa 8 nét/cánh chính (sen tuyệt chiêu thêm 6 cánh trong), 8 tia trang trí, tối đa 12 vạch phù trận và một quầng sáng nhỏ đã lưu theo màu. Không tạo gradient trong vòng vẽ, không dùng shadowBlur/filter/flash toàn màn hình/hệ particle. Quầng sáng 96 × 96 được tạo một lần theo màu và dùng lại; không tải thêm texture. Đầy đủ/Gọn lưu từng nhân vật; Gọn bỏ quầng sáng và giảm số cánh/tia/nhánh. Tối đa 24 hiệu ứng thoáng và 6 trận, trận giữ vòng phạm vi rõ. Preview dùng cùng renderer, không thi triển gameplay. Chiêu tầm xa có dấu tụ lực nhỏ, đạn và hiệu ứng trúng khi đến nơi; một hiệu ứng lớn cho mỗi lần cast để tránh chồng nhiều vòng khi đánh đông quái.

Nền Rừng Trúc/phụ bản/sân luyện được vẽ một lần từ dữ liệu trong `src/map-art.ts`, minimap tái sử dụng nền. Vật cản và collider dùng cùng dữ liệu. Game vẽ tối đa 30 FPS, minimap khoảng 5 lần/giây; mô phỏng/input giữ cập nhật theo thời gian. UI không cần backdrop blur.

`src/equipment-art.ts` giữ SVG/Path2D dùng chung cho trang bị trên đất, túi, nhân vật và so sánh. `src/cultivation-art.ts` vẽ vòng cảnh giới dưới chân theo 23 bậc ở v0.9.0 (Phàm Nhân vòng mờ, 22 bậc sau đổi màu/chi tiết), có giới hạn số vòng/phù văn/hạt và dùng quầng sáng đã lưu. Tên cảnh giới giữ bên trong chiều ngang sân đấu; nhãn đã đưa gần nhân vật nhỏ hơn.

Tinh anh dùng sprite quái có sẵn với vòng/nhãn vàng. Lửa trại dùng hai khúc gỗ và ba lớp ngọn lửa vẽ Canvas, phạm vi nét đứt, tối đa ba lửa cùng lúc; nhấp nhô theo thời gian, không có bitmap hoặc bộ particle mới. Atlas vẫn giữ 28.026 byte ở v0.6.0.

URL ảnh được Vite xử lý cho GitHub Pages `/volam/`. Kiểm tra bằng `pnpm test` và các bộ browser `sects-browser.cjs`, `combat-browser-smoke.cjs`, `cultivation-browser-smoke.cjs`, `skill-art-browser.cjs`, `hud-browser.cjs`.

Danh hiệu v0.7.0 dùng `src/title-art.ts`: 12 motif riêng (lá, mũi kiếm, tinh thể, vương miện, trận phù, kim tiền, tia lửa, song kiếm, tinh tú, mặt trời, sen và quỹ đạo), vài nét Canvas dưới chân, một danh hiệu được đeo. Preview dùng cùng hàm vẽ; không thêm sprite, texture hay hệ particle. Có thể tắt tên/hiệu ứng trong Cài đặt; atlas giữ 28.026 byte.

`src/character-preview.ts` vẽ chân dung toàn thân trên Canvas 360 × 400 cho màn Nhân vật. Áo, vũ khí, giới tính và cảnh giới lấy cùng dữ liệu nhân vật đang chơi. Đài vàng được vẽ một lần rồi tái sử dụng; chân dung có cùng nhịp thở với nhân vật sân đấu, vòng sáng dùng lại `cultivation-art`. Chỉ vẽ chân dung khi mở Nhân vật; sân đấu ẩn trong Nhân vật/Túi đồ được bỏ qua phần vẽ, mô phỏng vẫn tiếp tục. Khung và ô trang bị dùng CSS, không tải thêm ảnh từ game trong ảnh tham chiếu.

Trang bị v0.11.0 dùng 28 đường vector trong `equipment-art.ts`, không thêm bitmap. Khung bậc, huy hiệu ngũ hành và vệt cường hóa dùng SVG/CSS; tôn trọng giảm chuyển động của trình duyệt. `gear-effects.ts` vẽ tối đa 8 biểu tượng xoay và 4 hạt cho một bộ đủ 11, hai biểu tượng ở chế độ Gọn; từng hệ có kiếm/lá/băng/lửa/ngọc riêng. `mount-art.ts` vẽ bốn dáng ngựa bằng hình học có giới hạn, chân chạy theo quãng đường thật, đảo hướng, yên/giáp theo trang bị; bóng/rider được đặt cùng tọa độ mặt đất, collider giữ bán kính nhân vật. Chân dung cưỡi dùng lại sprite môn phái và cùng renderer ngựa. Atlas giữ nguyên 28.026 byte; tất cả hiệu ứng mới dùng quầng sáng cache có sẵn.

Trang bị/vật phẩm hiện dùng bốn atlas vẽ riêng bằng OpenAI image generation ngày 03–04/10/2026, lấy cảm hứng kiếm hiệp cổ trang, không dùng hình game chính thức. Hình trong suốt, không gắn vòng sáng vào bitmap; PNG nguồn giữ trong workspace tạo ảnh, bundle chỉ có WebP chất lượng 83–85.

| Atlas | Kích thước | Lưới | Nội dung | Dung lượng |
| --- | --- | --- | --- | ---: |
| `gear-weapons.webp` | 1402 × 1122 | 5 × 4 | 20 vũ khí | 500.820 byte |
| `gear-clothing.webp` | 1145 × 1374 | 5 × 6 | 9 giáp, 9 mũ, 6 giày, 6 đai | 651.948 byte |
| `gear-jewelry.webp` | 1292 × 1218 | 6 × 6 | 34 trang sức/ngựa và 2 bình HP/MP | 666.418 byte |
| `gear-relics.webp` | 1536 × 1024 | 6 × 4 | 24 linh binh/giáp/trang sức mới | 610.920 byte |

`item-art.ts` giữ thứ tự/tọa độ của 110 ô, dùng chung crop SVG và Canvas, giữ tỷ lệ nguồn. `equipment-art.ts` giữ khung phẩm chất/ID gradient riêng từng icon, huy hiệu bộ/ngũ hành và cache Canvas 128 × 128 LRU tối đa 160. Đường vector 108 món trong `equipment-design.ts` làm phương án tạm trước khi ảnh Canvas tải xong; cache đổi khóa khi atlas sẵn sàng. `set-art.ts` giữ 14 huy hiệu Path2D tĩnh. Bạc, đá, lệnh bài và rương có SVG tự vẽ; bạc/đá rơi dùng lại hình đó.

Bảy phẩm chất giữ viền trắng/lục/lam/tím/vàng/cam/đỏ. Từ lam có linh quang, vàng có song hoàn, cam có phù văn, đỏ có tám ấn/tám hạt và cột rơi cao nhất. +7/+10 tăng thêm vòng và phù văn. Huy hiệu ngũ hành/bộ dùng lớp riêng, không che màu phẩm chất. Gọn giảm chi tiết chuyển động; reduced motion dừng hoạt ảnh CSS. Đây là quy tắc v0.16 trở đi, thay cho ngưỡng +7 của các bản cũ.

`drawSkillImpact` vẽ 10 dấu trúng ngắn riêng, tách khỏi `drawSectEffect` ra chiêu/trận kéo dài. `dealDamage` tạo dấu ở tọa độ quái nhận sát thương; đòn cận chiến, đòn thường và mục tiêu phụ đều được thể hiện, đạn đã mất mục tiêu không tạo dấu. `drawSkillFlight` dùng cùng đường bay cong trong trận và xem thử. Preview có hình mục tiêu tập luyện và ba giai đoạn; chiêu không gây sát thương kết thúc quanh người dùng. Giới hạn 24 hiệu ứng thoáng/6 vùng, chế độ Gọn và cache glow giữ nguyên.


`riding-horses.webp` (v0.14.0): **329.040 byte**, 1536 × 1024, atlas trong suốt 3 × 2, sáu dáng Tuấn Mã, Bạch Mã, Chiến Mã, Xích Diệm, Hoa Mã và Ô Dạ. Tạo riêng bằng OpenAI image generation ngày 03/10/2026, WebP chất lượng 86; không tải hình bên thứ ba. `mount-art.ts` crop thân/chân ngựa, chuyển động theo quãng đường; `mounted-character-art.ts` đồng bộ người và ngựa, đặt thân trên ở yên, hai chân gập với giày và dây cương. Chân dung dùng lại renderer, không đặt người đứng chồng lên ngựa. Vòng cường hóa chỉ mở từ +7, +10 thêm phù văn.

`ice-effects.ts` vẽ tinh thể băng và mảnh vỡ bằng vector, không thêm bitmap hiệu ứng. `skill-flight.ts` giữ đường bay, tốc độ theo phái và tối đa 12 mảnh băng (3 ở chế độ Gọn). Đạn từ tay đến tâm va chạm địch; vụ nổ chỉ được tạo khi sát thương thực sự xảy ra. Hỏa/độc trận tầm xa chờ đạn đến; lôi điện nhảy theo thứ tự mục tiêu. Kiểm tra production `/volam/` bằng `tests/flight-riding-browser.cjs`.


`horse-walk.webp` (v0.15.0): **475.804 byte**, 1024 × 1536, 24 dáng bước chân cho sáu giống ngựa. Tạo riêng bằng OpenAI image generation ngày 04/10/2026, sửa bố cục bằng cùng công cụ và chuyển sang WebP chất lượng 86. Khu vực trống có alpha 0; không dùng hình game chính thức. `horse-animation.ts` ghi vùng nguồn của từng dáng theo biên alpha của hình, giữ vùng cắt dọc chung cho bốn khung mỗi giống. Mỗi khung chạy chỉ vẽ một thân ngựa liền chân, không cắt xoay bốn mảnh chân. `actor-animation.ts` lấy khung và nhịp yên theo quãng đường đã đi; dừng dùng lại atlas đứng. Bụi vó giới hạn hai đám nhỏ, bỏ ở Gọn.

`actor-animation.ts` còn giữ lấy đà, ra đòn và thu hồi theo nhóm vũ khí, độ kéo dây cung/nỏ và nhịp thở nhỏ. `enemy-status-art.ts` vẽ lớp băng, vệt lạnh, bọt độc hoặc sao choáng từ hạn hiệu ứng thực trong `enemy-status.ts`. Không tải thêm bitmap/blur/gradient cho trạng thái; giới hạn chi tiết, Gọn giảm hạt. Màn xem chiêu dùng lại renderer trạng thái với mục tiêu tập luyện. Atlas nhân vật, trang bị và NPC/quái giữ nguyên.

## Nền luyện công v0.16.0

`training-regions.webp`: 1536 × 1024, 16 ô 384 × 256 theo thứ tự `REGIONS` (4 cột × 4 hàng), khoảng 703 KB. Hình gốc được tạo mới cho game bằng công cụ sinh ảnh, không lấy ảnh từ game tham khảo. Có nền rừng thông, sơn đạo, cổ mộ, trúc lâm, đạo quán, rừng thu/phong, hoa tím, đồi trà, thiền viện, ghềnh sông, dược viên, sa mạc, biên thành và hai vùng tuyết. Dùng chung cho sân đấu, minimap và thẻ chuyển map. Canvas nền cache tối đa bốn vùng; ảnh tải xong tăng revision để thay nền dự phòng. Thời tiết Canvas tối đa 20 hạt (Gọn: 4), không tạo ảnh/gradient mỗi frame.

`elemental-motion.ts` v0.17 dùng quỹ đạo xác định theo thời gian: lửa đổi ngọn, tàn lửa bay, bọt độc nổi/vệt ăn mòn, tinh thể sáng, lôi điện đổi nhánh, cánh sen và tia kim loại. Mỗi lớp tối đa 14 hạt (Gọn 4); không tạo gradient/filter/blur theo frame. `enemy-status-art.ts` dùng cùng lớp cho thiêu đốt/ăn mòn thật, ngừng khi hết trạng thái hoặc chết. Atlas linh binh mới chứa sáu vũ khí, ba giáp, ba mũ, hai giày, hai đai, hai dây chuyền, hai nhẫn, hai hộ uyển và hai pháp bảo; thứ tự 24 ô nằm trong `item-art.ts`.

## Cảnh vật rõ nét v0.26.0

`scenery-props.webp`: 1448 × 1086, 4 cột × 3 hàng, 12 ô 362 × 362, alpha trong suốt, 1.028.510 byte. Tạo hình mới bằng OpenAI image generation ngày 04/10/2026; chỉ chuyển định dạng sang WebP chất lượng 88, không lấy tài nguyên của game tham khảo. Hình PNG gốc giữ tại `/workspace/generated_images/exec-0743f544-cf34-43de-91c3-560cb46da919.png` trong môi trường làm việc.

Thứ tự ô: thông, trúc, phong đỏ, hoa anh đào; cổ tự, cổng đá, đá rêu, tinh thể; thông tuyết, cổ tự tuyết, di tích sa mạc, cây lá rộng. `scenery-sprites.ts` vẽ nhỏ hơn ảnh nguồn, lấy chân ở đáy ô. `landscape-art.ts` vẽ nền và đường đi ở độ phân giải bản đồ, thêm hạt sỏi/cỏ/đá/nước và riêng khoáng mạch cho map ngọc. Cache nền đổi revision khi atlas tải xong; nền thành cũng cập nhật sau khi tải. Minimap/thẻ vùng dùng lại phong cảnh. Atlas 16 ô cũ còn giữ để tương thích tài nguyên/kiểm tra; không kéo lên nền sân chơi.

Ngọc dùng SVG mặt cắt sắc, màu theo loại và viền/ánh sáng theo phẩm chất trong `gems.ts`; không tải thêm atlas ngọc. `skill-radiance.ts` vẽ xung kích/mảnh vỡ theo thời gian và bọt độc, giới hạn số hạt và giảm chi tiết trong Gọn.

## Sơn thủy v0.30.0

Hai atlas được tạo riêng bằng OpenAI image generation ngày 04/10/2026, lấy cảm hứng bối cảnh kiếm hiệp Võ Lâm Truyền Kỳ. Không dùng sprite hoặc ảnh bản đồ chính thức. PNG nguồn được chuyển sang WebP; bản phát hành chỉ chứa hai WebP, tổng 1.427.924 byte (khoảng 1,36 MiB).

| Atlas | Kích thước | Lưới | Dung lượng | Chất lượng WebP |
| --- | --- | --- | ---: | ---: |
| `wuxia-ground.webp` | 1254 × 1254 | 2 × 2 | 725.120 byte | 88 |
| `wuxia-landmarks.webp` | 1254 × 1254 | 4 × 4, trong suốt | 702.804 byte | 92 |

Nền theo thứ tự: cỏ rêu, sân lát đá, đất cát, tuyết băng. Cảnh vật theo hàng: sơn đình, vách đá/thông, mộ môn Tần Lăng, cầu gỗ; cổng đạo quán, trà quán, phong đỏ, nhà sơn cốc; đồi trà, thiền viện, bến thuyền, dược viên; di tích sa mạc, vọng lâu biên ải, thông tuyết, băng nham.

`wuxia-scenes.ts` chọn nền, đường và cảnh vật cho 16 vùng; `wuxia-sprites.ts` cắt ô trực tiếp, tạo bốn tile nền 288 × 288 một lần. `landscape-art.ts` vẽ đường cong theo cùng tọa độ chuẩn hóa cho đường và sỏi ở sân đấu, map lớn và minimap. Nền được lưu đệm ở độ phân giải bản đồ; tải xong atlas tăng revision để thay cả nền thành, phụ bản, tháp và công thành. Không tạo ảnh nền theo từng khung hình. Ngân sách dưới 900 KiB mỗi atlas được kiểm tra trong unit test; `auto-map-browser.cjs` kiểm tra cảnh vật 16 vùng, bốn nền và việc dùng lại cache.

## Võ học JX1 v0.31.0

Không thêm atlas bitmap. `martial-visuals.ts` giữ 60 kiểu trình bày riêng dựa trên bảng skill/missile và script 10 phái của `phucnb/JXLinux-8.1.11` tại commit `ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764`; dữ liệu đối chiếu gọn nằm trong `jx1-skill-reference.ts`, nguồn và phương pháp ở `docs/martial-paths.md`. Đọc dữ liệu để thiết kế lại, không chép script hoặc sprite của kho tham khảo vào bản phát hành.

`martial-effects.ts` vẽ tám kiểu xuất chiêu (đơn luồng, quét, tỏa quạt, xoắn, mưa, bùng, hộ thể, lôi giáng) và sáu họ hiệu ứng trúng. Mưa/lôi theo trục đứng của thế giới; chiêu bay/cận chiến mới xoay theo mục tiêu. Luồng/hạt tối đa tám ở Đầy đủ, hai–ba ở Gọn; dùng quầng sáng cache có sẵn, không tạo gradient/blur/texture theo khung hình. Icon có nét mưa/lôi/vòng hộ thể theo đúng kiểu chiêu. Xem thử lúc tạo nhân vật và trong Võ công cùng dùng renderer thực chiến với ba pha tụ lực/ra chiêu/trúng hoặc hộ thể.
