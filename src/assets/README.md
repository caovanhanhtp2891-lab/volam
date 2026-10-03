# Hình 2D đơn giản, nhẹ

`simple-atlas.webp` là ảnh duy nhất game cần tải: **28.026 byte**, 480 × 384 px, trong suốt, tối đa 64 màu. Atlas 5 × 4 chứa 20 ô 96 × 96 px. Tọa độ nằm trong `src/art.ts`.

| Hàng | Nội dung từ trái sang phải |
| --- | --- |
| 1 | Thiếu Lâm, Thiên Vương, Đường Môn, Ngũ Độc, Nga Mi |
| 2 | Thúy Yên, Cái Bang, Thiên Nhẫn, Võ Đang, Côn Lôn |
| 3 | Sơn tặc, sói, Lang Vương, bọ, u binh |
| 4 | Người dẫn đường, thợ rèn, cổng phụ bản, boss cổ mộ, loot |

Mười nhân vật được tạo riêng bằng công cụ tạo ảnh OpenAI ngày 03/10/2026: hình cartoon phẳng, áo trơn, mặt ít nét, mỗi phái có tóc/mũ/vũ khí riêng. Thiếu Lâm đầu trọc/áo tu/côn; Thiên Vương giáp/chùm mũ đỏ/thương; Đường Môn che mặt/nỏ; Ngũ Độc tóc đôi/trượng; Nga Mi áo trắng hồng/sen; Thúy Yên áo xanh/quạt; Cái Bang mũ rơm/gậy/bầu rượu; Thiên Nhẫn áo đen đỏ/song đao; Võ Đang áo đạo/kiếm; Côn Lôn tóc trắng/mũ/pháp khí. Các ô quái/NPC/loot giữ ảnh tạo riêng ngày 02/10/2026.

PNG gốc được cắt từng ô, trim, thu nhỏ tối đa 78 × 78, đặt vào ô 96 × 96, giới hạn 64 màu và xuất WebP lossless. PNG nguồn không nằm trong bundle. Không tải asset bên thứ ba. Ngân sách atlas dưới 32 KB được kiểm tra trong unit test.

Nhân vật trong sân vẽ **46 × 50**, bán kính collider 12; bóng và thanh HP gọn. `src/combat-art.ts` dùng cùng sprite với màn chọn phái/ảnh đại diện, nhún theo quãng đường thật, đảo hướng và nghiêng người khi đánh/thi triển. Lướt chạy qua nhiều frame. Có một khung/phái, chưa có animation bốn hướng hoặc bộ sprite nam/nữ độc lập; giới tính vẫn được lưu, có điểm nhấn dây buộc đơn giản. Vòng trang bị và màu vũ khí vẫn hiển thị, không đổi áo đến mức mất nhận diện phái.

Ba mươi icon võ công v0.8.0 dùng SVG nội tuyến trong `src/skill-art.ts`: mỗi chiêu có hình riêng, nền tròn, ánh màu tĩnh và nét vũ khí/biểu tượng sáng. Hình tự vẽ bằng vector, lấy cảm hứng từ đặc trưng võ học Võ Lâm/Kiếm Thế, không lấy asset chính thức. `src/sect-effects.ts` vẽ 16 nhóm motif với biến thể theo cấp chiêu/phái, viền màu/lõi trắng, vệt chuyển động, cánh sen, thương trận, cổ trùng, băng tinh, hỏa long, ma đao, thái cực, mưa kiếm và lôi trận. Đạn được phân biệt theo 10 phái thay vì chỉ năm hệ.

Mỗi hiệu ứng dùng hình học có giới hạn: tối đa 8 nét/cánh chính (sen tuyệt chiêu thêm 6 cánh trong), 8 tia trang trí và một quầng sáng nhỏ đã lưu theo màu. Không tạo gradient trong vòng vẽ, không dùng shadowBlur/filter/flash toàn màn hình/hệ particle. Quầng sáng 96 × 96 được tạo một lần theo màu và dùng lại; không tải thêm texture. Đầy đủ/Gọn lưu từng nhân vật; Gọn bỏ quầng sáng và giảm số cánh/tia/nhánh. Tối đa 24 hiệu ứng thoáng và 6 trận, trận giữ vòng phạm vi rõ. Preview dùng cùng renderer, không thi triển gameplay. Chiêu tầm xa có dấu tụ lực nhỏ, đạn và hiệu ứng trúng khi đến nơi; một hiệu ứng lớn cho mỗi lần cast để tránh chồng nhiều vòng khi đánh đông quái.

Nền Rừng Trúc/phụ bản/sân luyện được vẽ một lần từ dữ liệu trong `src/map-art.ts`, minimap tái sử dụng nền. Vật cản và collider dùng cùng dữ liệu. Game vẽ tối đa 30 FPS, minimap khoảng 5 lần/giây; mô phỏng/input giữ cập nhật theo thời gian. UI không cần backdrop blur.

`src/equipment-art.ts` giữ SVG/Path2D dùng chung cho trang bị trên đất, túi, nhân vật và so sánh. `src/cultivation-art.ts` vẽ vòng cảnh giới dưới chân theo 23 bậc ở v0.9.0 (Phàm Nhân vòng mờ, 22 bậc sau đổi màu/chi tiết), có giới hạn số vòng/phù văn/hạt và dùng quầng sáng đã lưu. Tên cảnh giới giữ bên trong chiều ngang sân đấu; nhãn đã đưa gần nhân vật nhỏ hơn.

Tinh anh dùng sprite quái có sẵn với vòng/nhãn vàng. Lửa trại dùng hai khúc gỗ và ba lớp ngọn lửa vẽ Canvas, phạm vi nét đứt, tối đa ba lửa cùng lúc; nhấp nhô theo thời gian, không có bitmap hoặc bộ particle mới. Atlas vẫn giữ 28.026 byte ở v0.6.0.

URL ảnh được Vite xử lý cho GitHub Pages `/volam/`. Kiểm tra bằng `pnpm test` và các bộ browser `sects-browser.cjs`, `combat-browser-smoke.cjs`, `cultivation-browser-smoke.cjs`, `skill-art-browser.cjs`, `hud-browser.cjs`.

Danh hiệu v0.7.0 dùng `src/title-art.ts`: 12 motif riêng (lá, mũi kiếm, tinh thể, vương miện, trận phù, kim tiền, tia lửa, song kiếm, tinh tú, mặt trời, sen và quỹ đạo), vài nét Canvas dưới chân, một danh hiệu được đeo. Preview dùng cùng hàm vẽ; không thêm sprite, texture hay hệ particle. Có thể tắt tên/hiệu ứng trong Cài đặt; atlas giữ 28.026 byte.

`src/character-preview.ts` vẽ chân dung toàn thân trên Canvas 360 × 400 cho màn Nhân vật. Áo, vũ khí, giới tính và cảnh giới lấy cùng dữ liệu nhân vật đang chơi. Đài vàng được vẽ một lần rồi tái sử dụng; chân dung có nhịp thở/dải buộc chuyển động, vòng sáng dùng lại `cultivation-art`. Chỉ vẽ chân dung khi mở Nhân vật; sân đấu ẩn trong Nhân vật/Túi đồ được bỏ qua phần vẽ, mô phỏng vẫn tiếp tục. Khung và ô trang bị dùng CSS, không tải thêm ảnh từ game trong ảnh tham chiếu.

Trang bị v0.11.0 dùng 28 đường vector trong `equipment-art.ts`, không thêm bitmap. Khung bậc, huy hiệu ngũ hành và vệt cường hóa dùng SVG/CSS; tôn trọng giảm chuyển động của trình duyệt. `gear-effects.ts` vẽ tối đa 8 biểu tượng xoay và 4 hạt cho một bộ đủ 11, hai biểu tượng ở chế độ Gọn; từng hệ có kiếm/lá/băng/lửa/ngọc riêng. `mount-art.ts` vẽ bốn dáng ngựa bằng hình học có giới hạn, chân chạy theo quãng đường thật, đảo hướng, yên/giáp theo trang bị; bóng/rider được đặt cùng tọa độ mặt đất, collider giữ bán kính nhân vật. Chân dung cưỡi dùng lại sprite môn phái và cùng renderer ngựa. Atlas giữ nguyên 28.026 byte; tất cả hiệu ứng mới dùng quầng sáng cache có sẵn.

Trang bị v0.12.0 có 60 silhouette trong `equipment-design.ts`, mỗi món dùng chung lớp vật liệu/men/hoa văn/đá trên SVG và Canvas. `equipment-art.ts` cấp ID gradient riêng từng SVG; icon Canvas 128×128 cache LRU tối đa 160, Path2D chỉ gồm các đường tĩnh. `equipment-vfx.ts` vẽ linh khí 0/2/4/6 hạt theo phẩm chất/cường hóa và tối đa 5 hạt/cột sáng cho đồ rơi; không tạo hệ particle lưu trạng thái. `worn-equipment-art.ts` thêm miếng giáp, mũ, ngọc bội và viền giày trên sprite môn phái/chân dung. Gọn và reduced motion dừng animation CSS; Gọn bỏ hạt/glow/cột mới trên sân. Hai dáng Đạp Tuyết/Ô Truy bổ sung thành sáu ngựa, atlas vẫn 28.026 byte.
