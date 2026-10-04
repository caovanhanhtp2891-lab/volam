# Giang Hồ Dị Truyện

Game web kiếm hiệp 2D với giao diện dọc và vòng chơi idle, phát triển theo [PLAN.md](./PLAN.md). Bố cục và luồng thao tác tham khảo [Võ Lâm Idle](https://jxoffline.khoa-vnd92.workers.dev/); mã game và hình ảnh được triển khai trong kho `volam`.

## Leo tháp và phân bổ điểm (v0.20.0)

- Mở **Trấn Thiên Tháp** từ nút **Leo tháp** trong hoạt động Giang hồ, yêu cầu cấp 5. Có 100 tầng, cần vượt tầng trước để mở tầng sau; có thể đánh lại tầng đã vượt. Mỗi trận 2 đợt trong 3 phút; tầng bội 10 có thủ lĩnh. Quái tăng từ cấp 6 đến 155, tăng sinh lực, công và phòng theo tầng.
- Thưởng sau khi hạ toàn bộ cả 2 đợt: bạc, XP, đá, ấn tháp và 1 món bộ Trấn Thiên. Bạc cơ bản `150 + 50 × tầng + 3 × tầng²`; XP cơ bản `80 + 28 × tầng + 2 × tầng²`. Lần đầu gấp đôi bạc/XP, thêm 1 đá và 1 ấn. XP vẫn chịu hệ số XP trong cài đặt và giới hạn cấp 160. Thua, hết giờ hoặc rời sớm không thưởng tầng.
- Đồ Hiếm tầng 1–24, Cực phẩm tầng 25–59, Hoàng Kim tầng 60–100; cấp đồ theo quái. Vị trí nhận luân phiên qua 11 ô, kể cả nhẫn thứ hai/ngựa. **20 ấn tháp** đổi 1 món tự chọn vị trí, cấp/phẩm chất theo tầng cao nhất. Túi đầy: thưởng chiến đấu chuyển sang quà chờ nhận; đổi ấn yêu cầu có ô trống. Bộ Trấn Thiên có mốc 2/4/6/11 món, cộng hưởng +20% với mọi môn phái và huy hiệu tháp riêng. Không mua bằng bạc hoặc rơi ngoài tháp.
- Tầng cao nhất, số lần vượt và ấn tháp lưu riêng theo nhân vật, giữ qua trùng sinh. Save cũ khởi tạo tháp chưa vượt. Trận đang đánh không lưu: tải lại đưa về trạng thái trước trận, không nhận thưởng phần đã đánh.
- **Nhân vật → Tiềm năng** và **Võ công**: nhập số nguyên dương rồi **Cộng**, hoặc **Max** để cộng toàn bộ điểm phù hợp giới hạn (tiềm năng 100.000 mỗi dòng, võ học bậc 20/đủ cấp mở chiêu). Nhập quá số điểm/giới hạn không trừ điểm.
- **Đề xuất** xem bảng hiện tại → cộng thêm → sau cộng trước khi **Áp dụng**. Tỷ lệ riêng 10 môn phái, cân đối với điểm đã có, không rút điểm cũ; chiêu khóa/đạt trần giữ điểm dư. **Khác → Tự động** có tùy chọn tự cộng tiềm năng/võ học theo môn phái khi lên cấp; mặc định tắt, lưu lựa chọn. Bật chỉ áp dụng ở lần lên cấp tiếp theo.

Kiểm tra logic: `pnpm test`; trình duyệt: `node --experimental-strip-types tests/tower-points-browser.cjs` với Playwright/Chromium/URL như hướng dẫn bên dưới. Bao phủ trận thật ở các mốc 1/10/25/60/100, thưởng lại, đổi đồ/túi đầy, timeout/thua, cộng điểm/cancel/Max và tự cộng khi nhận XP, màn hình 320–1280px.

## Vạn thú · Bí cảnh · v0.19.0

**Giang hồ → Khám phá · Bản đồ lớn** mở 16 map, mỗi map rộng **3.600 × 2.400**, có bốn khu vực đặt tên riêng, đường nối và mốc khu. Có thể đi bộ, cưỡi ngựa hoặc bấm **Đổi khu** để dịch chuyển. Map mở khi đủ cấp vào vùng hoặc đã mở ải tương ứng, giữ quyền truy cập sau trùng sinh. Mỗi map có 24 quái thường, ba tinh anh và một boss; các khu lần lượt có cấp 1–3, 4–5, 6–8, 9–10 cộng mức của vùng. Quái thường/tinh anh/boss hồi sinh sau 12/20/60 giây trong phiên chơi. **Về thành** trở lại chế độ luyện công trước đó và thu hồi đồ dưới đất.

**32 mẫu hình mới** gồm 24 loài thường và tám thủ lĩnh: thú rừng, độc trùng, sơn tặc, quân cổ mộ, yêu linh, thạch linh, quái sa mạc và tuyết. Bộ hình dùng chung cho khám phá, luyện ải, bí cảnh và **Sổ quái**; quái có nhịp di chuyển, tấn công và trúng đòn. Cung thủ/yêu linh đánh xa, boss có chiêu báo trước vị trí và màu theo ngũ hành. Atlas WebP ~907 KB; nền khám phá ghép các ô địa hình ở tỷ lệ giữ chi tiết, cache tối đa hai map lớn.

**Hành trang → Phụ bản** có 12 bí cảnh, từ Cổ Mộ cấp 3 đến Thiên Kiếp Cổ Cảnh cấp 155. Mười bí cảnh mới có 3–6 đợt, 2–3 boss và quân hộ vệ. XP, bạc, đá, token và số món thưởng tăng theo độ khó; bí cảnh cấp 60+ bảo đảm đồ cam, cấp 120+ bảo đảm đồ đỏ. Băng Viên thưởng bốn món đỏ, Long Điện/Thiên Kiếp thưởng năm món đỏ mỗi lượt hoàn thành. Có thêm vật phẩm rơi từ quái và boss. Nhận thưởng trở về vị trí trước khi vào bí cảnh; túi đầy chuyển vào **Đồ chờ nhận**, bấm nhận lặp không cấp lại thưởng. Ngã xuống, rời sớm hoặc hết giờ không nhận thưởng hoàn thành. Bí cảnh local chưa giới hạn lượt/ngày.

File lưu cũ giữ nhân vật, trang bị, bạc và số lần vượt Cổ Mộ/Trúc Lâm; bổ sung bản ghi cho bí cảnh mới. Vị trí ngoài giới hạn map cũ, lửa trại và tinh anh trong map khám phá được lưu và tải lại. Tải lại trang tái tạo quái trong thế giới; thời gian hồi sinh của quái chưa lưu qua phiên.

Kiểm tra dữ liệu và phần thưởng bằng `tests/exploration-dungeons.test.mjs`; kiểm tra di chuyển, 16 quần thể, sáu đợt Băng Viên, đồ đỏ, túi đầy, tải lại và giao diện bằng `tests/exploration-dungeons-browser.cjs`.

## Đồng hành · Công thành · v0.18.0

Cử động thân trên có nhịp lấy đà → ra đòn → thu thế; bước chân nâng và đổi trọng tâm theo quãng đường thật. Vũ khí, áo/mũ và trang sức đi theo thân người khi tung chiêu; cưỡi ngựa giữ riêng tư thế chân trên yên.

**Giang hồ → Sự kiện** (cũng có trong Khác): vòng quay 50 bạc/lượt với tám phần thưởng và bảng xác suất; tài xỉu cược 10–5.000 bạc, thắng nhận 2 lần tiền cược gồm vốn, bộ ba đồng số luôn thua; xổ số chọn hai số 00–99, trùng đúng thứ tự nhận 90 lần gồm vốn. Dùng bạc trong game. Kết quả, tiền cược và phần thưởng lưu cùng nhau trước khi chạy hiệu ứng 2,2 giây; tải lại không trả thưởng lần nữa. Nếu lưu thất bại, hoàn tác cả lượt. Có lịch sử 30 lượt; bình HP vượt giới hạn 99 đổi thành 20 bạc/bình.

**Đồng hành BOT** gồm mười nhân vật của mười phái. Bot xuất hiện và di chuyển trong map; bật Trợ chiến để ba đồng đội cùng đánh quái, hồi phục tổ đội và ghi nhận phần thưởng cho nhân vật. Bot có HP, vai trò đánh xa/cận chiến/đỡ đòn/hồi phục, lấy đà và đạn bay gây sát thương khi chạm. Mặc định trợ chiến tắt; bot trong công thành luôn tham chiến.

**Công thành theo yêu cầu**: chọn bất kỳ thành nào ngay từ cấp 1 và đội 3/6/9 bot, gọi trận miễn phí bất cứ lúc nào ngoài các trận đang đánh. Bản đồ thành riêng có tường, cổng và chiến kỳ; phá cổng rồi đoạt cờ, cuối cùng hạ Thống lĩnh và quân bảo vệ trong 4 phút. Hai phe dùng hình và chiêu môn phái. Ra lệnh **Phá mục tiêu / Diệt quân / Theo tôi** ngay trên sân. Đồng đội gục hồi sinh sau 8 giây. Thắng nhận 100 + cấp × 6 bạc, cấp × 7 XP (áp dụng buff XP) và 2 đá; rút quân/hết giờ/thất bại/tải lại trận đang đánh không nhận thưởng. Chiến công, chiếm lãnh thổ và ấn quân hàm tiếp tục theo chiến dịch cũ. Save cũ giữ nhân vật và trang bị, bắt đầu với lịch sử hoạt động trống.

Kiểm tra luật cược, lưu/tải, bot và đường đi trong `tests/activities.test.mjs`; kiểm tra giao diện, trả thưởng, hoàn tác khi hết dung lượng lưu, bot gây sát thương, thắng công thành cấp 1, ra lệnh, rút quân/hết giờ/tải lại và bố cục 320/390/844/1280px bằng `tests/activities-browser.cjs`. Chạy `pnpm test`, `pnpm typecheck` và build `--base=/volam/`; kiểm tra hồi quy với các bài đường bay/cưỡi ngựa và quân hàm.

## Vạn pháp · Linh binh · v0.17.0

Kỹ năng có chuyển động theo môn phái: Hỏa long Cái Bang và song đao Thiên Nhẫn có ngọn lửa, lõi nóng và tàn lửa bay; Ngũ Độc/Đường Môn có bọt độc, hơi ăn mòn; Thúy Yên có ánh băng; Côn Lôn có tia điện đổi nhánh; Nga Mi có cánh sen bay; Võ Đang có quỹ đạo kiếm sáng; Thiếu Lâm/Thiên Vương có tia va chạm kim loại. Ra chiêu, đạn bay, dấu trúng và trận kéo dài dùng cùng lớp chuyển động. Chế độ Gọn giảm 14 hạt xuống 4, giữ nguyên tầm và sát thương.

**Thiêu đốt gây sát thương mỗi giây** sau khi trúng chiêu Hỏa; hai nhát Liệt Hỏa không làm lùi nhịp sát thương. **Ăn mòn làm yếu giáp** trong thời gian độc/trận độc của Ngũ Độc. Lửa bám lên quái, độc sủi bọt và vệt ăn mòn ngừng khi hết trạng thái hoặc quái chết. Xem thử tại **Võ công → Xem hiệu ứng**; khi chọn quái, bảng mục tiêu hiện trạng thái và phòng thủ đang có hiệu lực.

**108 chủng loại trang bị**, thêm 24 mẫu vẽ mới: Lưu Tinh Chùy, Huyết Nguyệt Loan Đao, Băng Phách Trường Kích, Thái Dương Thần Kiếm, Xà Vương Pháp Trượng, Bích Vân Thần Cung, Bạch Hổ Chiến Giáp, Tinh Hà Tiên Bào và các mũ/giày/đai/trang sức tương ứng. Sáu thiên hướng có dòng chỉ số ưu tiên được tăng 20% khi tạo món: **Cuồng Phong** (tốc độ/nhịp đánh), **Huyết Sát** (công/hút máu), **Thiết Bích** (HP/phòng/giảm sát thương), **Băng Tâm** (MP/hồi MP), **Thiên Lôi** (chí mạng/sát thương chí mạng), **Dưỡng Sinh** (HP/hồi HP). Số dòng vẫn theo bảy phẩm chất. Mẫu mới rơi trong chiến đấu và mua được tại **Hành trang → Mẫu trang bị → Chọn mua**; tiệm bán Tốt, đồ cam/đỏ vẫn theo bảng rơi. Không cấp đồ mẫu miễn phí. Ngũ hành, bộ 11 món và thuộc tính ẩn giữ nguyên điều kiện.

**HP, MP, công, phòng, hồi phục và sát thương tăng đồng bộ 100 lần**; phần trăm và tốc độ giữ nguyên. Chi phí nội lực, khiên và HP/công/phòng của quái cũng theo thang mới. Lực chiến/cảnh giới của nhân vật cũ giữ nguyên cách quy đổi. File lưu cũ được chuyển một lần, giữ tỷ lệ HP/MP, trang bị, bạc và tiến trình; lưu/tải lại không nhân nhiều lần. Các bảng thuộc tính, so sánh và cường hóa hiển thị cùng đơn vị với chiến đấu.

Kiểm tra: 147 unit tests, typecheck, build `--base=/volam/`; `tests/elemental-upgrade-browser.cjs` kiểm tra nạp bản lưu cũ, giữ lực chiến, thời điểm trúng, sát thương theo thời gian, hết trạng thái và mua/lưu/tải đủ 24 mẫu. Kiểm tra hồi phục/hút máu và bộ bằng `advanced-equipment-browser.cjs`, đường bay/cưỡi ngựa bằng `flight-riding-browser.cjs`, đủ 30 chiêu bằng `sects-browser.cjs`.

## Sơn hà · Thần huyết · v0.16.0

**Bản đồ** cạnh minimap mở 16 vùng có hình xem trước và chọn trực tiếp ải. Đủ cấp quái **hoặc** đã mở bằng vượt ải đều được di chuyển, kể cả các ải 12, 22…; giữ quyền quay lại map đã mở sau trùng sinh. Chuyển map thu hồi đồ chưa nhặt, reset mục tiêu/chiêu đang bay và đặt nhân vật vào vùng mới. Phụ bản, công thành và boss theo giờ cần rời trận trước. Nền vẽ mới riêng cho 16 vùng, có lá, cánh hoa, sương, cát hoặc tuyết theo địa hình; atlas ~703 KB, cache tối đa bốn nền, có nền dự phòng khi ảnh chưa tải.

**Bảy phẩm chất**: Trắng (Thường) → Lục (Tốt) → Lam (Hiếm) → Tím (Cực phẩm) → Vàng (Hoàng Kim) → Cam (Truyền Thuyết) → Đỏ (Thần Thoại). Đỏ quý nhất, 14 dòng thuộc tính; cam 12 dòng. Từ lam có linh quang nhẹ; vàng có song hoàn, cam có phù văn, đỏ có bát ấn và cột sáng cao nhất khi rơi. Hiệu ứng xuất hiện trong túi, màn Nhân vật, vũ khí cầm, ngựa và sân đấu; +7/+10 tăng thêm hiệu ứng. Quy tắc này thay thế quy tắc chỉ có vòng từ +7 ở các bản trước. Chế độ Gọn và reduced motion giảm chuyển động, giữ màu phẩm chất. Ngũ hành/bộ giữ huy hiệu riêng; màu vòng phẩm chất luôn nhận ra được.

Đồ cam bắt đầu rơi ở cấp quái 61, đỏ ở cấp 101. Quái thường: cam 0,2%, đỏ 0,05% **trong lượt rơi trang bị**; tinh anh: 1,5%/0,2%; boss ải: 4%/1%. Boss vẫn đảm bảo từ Cực phẩm, tinh anh từ Hiếm; boss Hoàng Kim theo giờ vẫn đảm bảo Hoàng Kim như trước. Đồ từ vàng trở lên luôn được bảo vệ khỏi bộ lọc vứt đồ. Save năm phẩm chất cũ tải bình thường, không đổi đồ đang sở hữu.

Kiểm tra: `pnpm test`, `pnpm typecheck`, build `--base=/volam/`, `tests/regions-rarity-browser.cjs` (chuyển map thật từ thành/phiêu lưu, khóa cấp, chọn ải lẻ, 16 nền, đồ đỏ rơi từ boss và lưu/tải), cùng các bài trang bị, cưỡi ngựa và bố cục. Quy trình phát hành đã ghi trong [AGENTS.md](./AGENTS.md): hoàn tất phát triển phải push GitHub và xác nhận Pages của đúng commit thành công.

## Kỵ mã hành vân · v0.15.0

Sáu loại ngựa có **24 khung bước chân liền thân** thay cho chân cắt từ ảnh đứng. Chu kỳ chạy theo quãng đường thực, dừng khi nhân vật dừng; người ngồi trên yên nhún cùng ngựa. Chế độ Đầy đủ có bụi vó nhỏ, Gọn bỏ bụi. Nhân vật đi bộ giảm xoắn/gãy ở gấu áo và có nhịp thở khi đứng. Kiếm/côn có lấy đà–vung–thu hồi, thương đâm về trước, cung/nỏ kéo dây; điểm cầm giữ tại bàn tay.

Địch trúng Thúy Yên có vệt lạnh khi chậm và **lớp băng bao quanh khi bị đóng băng**, mờ dần khi hết khóa; không bước/vung tay trong thời gian khóa. Độc có bọt xanh, choáng khác có sao vàng, phân biệt với băng. Các dấu chỉ xuất hiện khi trạng thái thực đã được áp dụng, mất khi hết hạn hoặc địch chết. Màn xem chiêu cũng minh họa trạng thái, không tiêu hao tài nguyên nhân vật.

Kiểm tra 24 khung của sáu loại ngựa, dừng/di chuyển, trạng thái trước/sau chạm, khóa vị trí địch và tan băng trong `tests/flight-riding-browser.cjs`; chu kỳ, thu hồi vũ khí và hạn trạng thái trong `tests/actor-status.test.mjs`. Atlas bước chân WebP thêm ~476 KB, giữ nguyên 20 mẫu nhân vật và collider bán kính 12. Nhân vật/ngựa hiện vẫn dùng góc nhìn có đảo trái/phải, chưa có bộ ảnh riêng cho bốn hướng.

## Băng vũ & Kỵ mã · v0.14.0

Thúy Yên phóng cụm băng có mặt tinh thể và vệt lạnh; khi tới địch mới trừ HP, làm chậm/đóng băng và nổ thành mảnh băng cùng vết nứt dưới chân. Phi Tuyết Liên Thiên hình quạt và Lưỡng Nghi Kiếm của Võ Đang cũng có đường bay thật. Lôi điện Côn Lôn nối lần lượt giữa các mục tiêu; hỏa/độc trận tầm xa bắt đầu tại lần chạm đầu. Đạn xuất phát ở tay cầm vũ khí, kể cả trên ngựa.

20 hình nam/nữ đã bỏ vũ khí vẽ sẵn. Vũ khí đang mặc được vẽ với cán, chuôi và ngón tay đúng điểm cầm riêng của mỗi phái, thay cho icon túi phóng lên người. Sáu dáng ngựa mới có yên/cương, thân và chân rõ; người cưỡi dùng thân trên, chân gập, giày và dây cương, cùng nhịp nhún với ngựa. Bấm **H** hoặc **Lên/Xuống ngựa** khi đã mặc ngựa; xem chiêu ở **Võ công → Xem hiệu ứng**. Renderer cưỡi dùng chung cho sân và Nhân vật. Chưa có animation bốn hướng riêng.

Kiểm tra đường bay trước sát thương, trạng thái tại lúc chạm và 20 tư thế nam/nữ bằng `tests/flight-riding-browser.cjs`; dữ liệu điểm cầm, dáng chân và mảnh băng bằng `tests/actor-flight.test.mjs`.

## Hiệu ứng ra chiêu, trúng địch và hình vật phẩm

30 chiêu có chuỗi **tụ lực → ra chiêu/đạn bay → trúng địch**. Dấu trúng đòn của 10 phái khác nhau: kim cang chấn Thiếu Lâm, thương xuyên Thiên Vương, phi châm/vệt độc Đường Môn, độc xà Ngũ Độc, sen Nga Mi, băng tinh Thúy Yên, long trảo Cái Bang, hỏa diệm Thiên Nhẫn, kiếm khí Võ Đang và lôi điện Côn Lôn. Đòn thường cũng dùng hình của phái. Dấu trúng xuất hiện tại mỗi quái thực sự nhận sát thương, gồm mục tiêu phụ; đạn hủy khi mục tiêu đã chết. Chiêu hộ thể/hồi phục không hiện dấu trúng giả lên địch. **Võ công → Xem hiệu ứng** dùng cùng renderer với mục tiêu tập luyện, không tiêu hao MP/nộ.

**84 mẫu trang bị vẽ mới** và bình HP/MP có chi tiết kim loại, vải, ngọc và đá quý. Túi, cửa hàng, so sánh và trang bị rơi dùng cùng bộ hình; vũ khí cầm trong sân/chân dung dùng hình tỷ lệ riêng theo kiểu món. Bạc, đá tinh luyện, lệnh bài và rương thưởng có biểu tượng riêng. Năm phẩm chất giữ màu viền bạc/lục/lam/tím/vàng; **+0–+6 chưa có vòng sáng**, **+7 mở vòng linh khí**, **+10 thêm phù văn/vòng phụ**. Phẩm chất Hoàng Kim không tự mở vòng khi chưa cường hóa cao. Vòng bộ trang bị cần món đang mặc từ +7; hiệu ứng cảnh giới/danh hiệu vẫn theo tiến trình tương ứng.

Ba atlas trang bị/vật phẩm WebP tổng ~1,82 MB, tách khỏi atlas nhân vật. Icon Canvas cache tối đa 160; hiệu ứng không tạo gradient mỗi frame. Chế độ Gọn giảm tia/hạt; giao diện hỗ trợ reduced motion. Kiểm tra bằng `pnpm build`, unit test và `tests/skill-art-browser.cjs`, `tests/sects-browser.cjs`, `tests/equipment-art-browser.cjs`, `tests/browser-smoke.cjs`.

## Tranh đoạt lãnh thổ, ấn quân hàm và hình nhân vật

**Giang hồ → Tranh đoạt lãnh thổ** mở chiến dịch công thành solo gồm 9 thành: Biên Thành → Tương Dương → Đại Lý → Phượng Tường → Thành Đô → Dương Châu → Lâm An → Biện Kinh → Hoàng Thành. Cần cấp 10/20/30/45/60/80/100/125/150 và chiếm thành trước. Mỗi trận có 3 đợt, 4 phút; đợt cuối có Thống lĩnh. Chiến công và thưởng chiếm thành chỉ nhận một lần. Rút quân, ngã xuống hoặc hết giờ không nhận chiến công của thành chưa chiếm. Đây là chiến dịch local của từng nhân vật; chưa có tranh thành PvP/bang hội hoặc nhiệm kỳ chức vị.

**Nhân vật → ô Ấn quân hàm** ở góc phải dưới là ô thứ 12, bên cạnh 11 ô trang bị thường. Nhận sắc phong rồi chọn **Mang ấn**; mỗi nhân vật chỉ mang một ấn. Ấn cộng trực tiếp vào chỉ số, lực chiến và các thuộc tính chiến đấu nâng cao. Đổi/tháo ấn thay đúng phần cộng, không cộng dồn các ấn đã nhận; ấn không chiếm ô túi hoặc ảnh hưởng bộ 11 món. Tiến trình lãnh thổ và ấn lưu riêng theo nhân vật, giữ sau trùng sinh. File lưu cũ bắt đầu với ô ấn trống.

| Chức vị | Thành đã chiếm | Chiến công |
| --- | ---: | ---: |
| Hương Trưởng | 1 | 80 |
| Huyện Lệnh | 2 | 200 |
| Thái Thú | 3 | 380 |
| Tổng Đốc | 5 | 1.000 |
| Đại Tướng Quân | 6 | 1.500 |
| Thừa Tướng | 8 | 3.000 |
| Hoàng Đế | 9 | 4.300 |

**20 mẫu nhân vật cổ trang** cho nam/nữ của 10 môn phái, lấy cảm hứng từ phong cách Võ Lâm Truyền Kỳ. Màn chọn phái, nhân vật trong trận và màn Nhân vật dùng chung hình; avatar cắt khuôn mặt từ đúng mẫu phái/giới tính đó. Đổi giới tính trong Cài đặt cập nhật mọi nơi. Sprite cao 56 × 76, giữ collider bán kính 12 và bước chân theo quãng đường thật. Atlas thân người WebP ~621 KB và atlas sáu dáng ngựa ~329 KB; atlas NPC/quái cũ vẫn ~28 KB. Trang bị thêm hoa văn nhỏ và linh khí để giữ rõ trang phục môn phái.

Kiểm thử tiến trình công thành, 7 ấn, thay/tháo/lưu tải/trùng sinh, hết giờ/thất bại, hình chung cho 20 mẫu và giao diện di động:

```bash
node --experimental-strip-types tests/military-characters-browser.cjs
```

## Võ học và trang bị môn phái

- 30 icon có huy hiệu môn phái; tụ lực, đạn và tuyệt chiêu dùng cùng biểu tượng. Bổ sung tua thương Thiên Vương, đai côn/kim chung Thiếu Lâm, độc nha Ngũ Độc, cánh sen Nga Mi, băng tinh Thúy Yên và kiếm trận Võ Đang; giữ hỏa long Cái Bang, ma diệm Thiên Nhẫn, ám khí độc Đường Môn và lôi điện Côn Lôn.
- **84 mẫu trang bị**, thêm 24 mẫu như Bàn Long Côn, Liệt Diễm Đao, Bạo Vũ Phi Châm, Hàn Ngọc Kiếm, Tử Điện Kiếm, Liên Hoa Phiến, Hàng Long Bào, Phượng Vũ Giáp, Thái Cực Bội và Ngũ Độc Bình. Mỗi mẫu có hình, vật liệu, hoa văn và đá riêng.
- **16 bộ**, gồm 5 bộ ngũ hành cũ, 10 bộ môn phái và bộ Trấn Thiên. 15 bộ thường rơi từ quái và có đủ 11 vị trí trong Tiệm; Trấn Thiên nhận riêng từ leo tháp/đổi ấn tháp. Cùng hệ vẫn nhận +20%; tên môn phái gợi ý lối chơi, không khóa quyền mặc. Huy hiệu, linh khí, hoa văn trên áo/vũ khí và vòng dưới chân lấy đúng bộ đang mặc.
- **14 loại chỉ số**, đồ mới có **2/3/5/7/10 dòng phụ** từ Thường đến Hoàng Kim. Cường hóa, bảng so sánh, Mặc đồ mạnh nhất và lực chiến tính cả các dòng mới. Đồ cũ giữ nguyên các dòng đã có.

| Bộ mới | Môn phái | Lối chơi |
| --- | --- | --- |
| Kim Cang | Thiếu Lâm | Giảm sát thương, hồi sinh lực |
| Bá Vương | Thiên Vương | Xuyên giáp, công kích |
| Bạo Vũ | Đường Môn | Tốc độ đánh, chí mạng |
| Ngũ Độc | Ngũ Độc | Hút sinh lực, hồi nội lực |
| Liên Hoa | Nga Mi | Hồi sinh lực, giảm sát thương |
| Băng Phách | Thúy Yên | Né tránh, sát thương chí mạng |
| Hàng Long | Cái Bang | Sát thương chí mạng, hút sinh lực |
| Ma Diệm | Thiên Nhẫn | Xuyên giáp, sát thương chí mạng |
| Thái Cực | Võ Đang | Hồi nội lực, giảm sát thương |
| Tử Lôi | Côn Lôn | Chí mạng, tốc độ đánh |

**Nhân vật → Chỉ số chiến đấu nâng cao** xem tám dòng mới sau giới hạn: sát thương chí mạng tối đa +150% trên nền 150%; tốc độ đánh thường 80%; hút sinh lực 20% HP thực lấy từ quái (không tính sát thương vượt HP còn lại); xuyên giáp 60%; giảm sát thương 50% sau phòng thủ/trước hộ thể; né tránh 35%; hồi HP 1.000/giây và hồi MP cộng thêm 300/giây. Hồi phục trang bị hoạt động khi mô phỏng chiến đấu chạy. Các giới hạn không sửa dòng gốc trên món đồ.

**Bảo khố → Bộ trang bị** xem trước màu linh khí và huy hiệu; Chọn mua giữ đúng bộ đã xem. Chạy `tests/advanced-equipment-browser.cjs` với Playwright để kiểm tra tám dòng trong chiến đấu thật, hiển thị/cường hóa 14 dòng, lưu tải, 15 huy hiệu và mua đúng bộ.

## Võ học, bước chân và bản đồ theo cấp

- Nâng 30 icon võ công với khung sáng và màu riêng từng phái. Hỏa long Cái Bang có vảy, sừng, râu và vuốt; Thiên Nhẫn có hỏa diệm trên song nhận/ảnh bộ; ám khí Đường Môn có vệt độc và gây độc thật trong 3–4 giây. Các tuyệt chiêu có phù trận, vẫn hỗ trợ chế độ Đầy đủ/Gọn.
- Tầm đánh xuất hiện ở màn chọn phái, bảng Võ công, nút kỹ năng và **Xem chiêu**. Nét đứt minh họa hình quạt/xuyên tuyến/vòng tầm đánh; khi thi triển tay cũng hiện phạm vi thoáng qua. Mục tiêu ngoài tầm báo **XA QUÁ**; không trừ MP hoặc bắt đầu hồi chiêu khi thi triển không hợp lệ.
- Nhân vật trên sân tăng lên **56 × 76**, hai chân bước luân phiên theo quãng đường di chuyển và dừng khi đứng yên. Khi cưỡi ngựa hoặc lướt, chân nhân vật không chạy tại chỗ. Atlas nhân vật riêng ~664 KB; collider vẫn bán kính 12.
- Trong **Giang hồ → Bản đồ luyện công**, đủ cấp **11 / 21 / 31 / … / 151** có thể chọn ngay đầu vùng tương ứng, không cần hạ boss vùng trước. Map mới sinh quái đúng cấp ải; vùng đã vào được lưu cùng nhân vật. Vượt đủ bốn đợt vẫn mở ải kế tiếp như trước.

Kiểm tra riêng luồng mở map theo cấp, quái mạnh hơn, tầm đánh và hai chân di chuyển bằng cùng cấu hình Playwright/Chromium/URL ở phần kiểm thử:

```bash
node --experimental-strip-types tests/world-upgrade-browser.cjs
```

## Phàm nhân nhập đạo · v0.9.0

- Sân đấu chiếm toàn bộ phần màn hình phía trên menu đáy. Ảnh đại diện, cấp, tên/lực chiến và HP/MP/XP ở góc trái; bạc, quà ngày, cài đặt ở góc phải. Minimap và nhiệm vụ có thể thu gọn ở bên phải; thông báo nhặt đồ ở bên trái. Joystick/Tự động bên trái, cụm nút tròn kỹ năng/thuốc/về thành bên phải, nhật ký một dòng sát menu.
- Chạm **Nhân vật / Võ công / Hành trang / Khác** để mở bảng cuộn bên trong màn hình. Chạm **Giang hồ** để quay về sân; chạm lần nữa mở bảng hoạt động (ải, luyện công, lịch boss, phụ bản, lửa trại). Nút × đóng bảng hoạt động. Chạm ảnh đại diện mở chỉ số, bánh răng mở cài đặt, dòng nhật ký mở lịch sử; nút trong minimap ẩn/hiện HUD.
- **23 cảnh giới** từ Phàm Nhân đến Vô Cực: Phàm Nhân dưới 100.000, Luyện Thể từ 100.000 đến dưới 1 triệu, Đạo Tổ từ 10 tỷ; sau đó Hỗn Nguyên từ 12 tỷ, Hồng Mông từ 14,5 tỷ, Vô Cực từ 17,5 tỷ. Bảng đầy đủ ở phần cảnh giới và trong game.
- Lực chiến mới tăng theo tổng chỉ số; số cạnh tên rút gọn K/tr/tỷ, bảng Nhân vật giữ con số đầy đủ. So sánh đồ và xem trước cường hóa đồ đang mặc hiển thị mức lực chiến nhân vật thực sự đạt sau thay đổi. Giữ nguyên chỉ số chiến đấu và dữ liệu lưu; không cộng lại vào công/phòng hay trang bị.
- Giữ hình 2D đơn giản: atlas vẫn **28.026 byte**, không thêm ảnh nền/texture. Phàm Nhân chỉ có vòng mờ; bậc cao dùng vòng sáng Canvas giới hạn như trước.

## Võ học rực sáng · v0.8.0

Thiết kế lại **30 icon và hiệu ứng võ công** theo đặc trưng thập đại môn phái, lấy cảm hứng từ võ học Võ Lâm/Kiếm Thế. Hình SVG/Canvas do dự án tự vẽ; không sao chép texture hay tải ảnh kỹ năng bên ngoài.

| Phái | Hình chiêu và màu riêng |
| --- | --- |
| Thiếu Lâm | Côn quét vàng, kim chung, bàn tay kim cang |
| Thiên Vương | Thương xuyên, vệt lướt vàng–ngọc, lục thương phá trận |
| Đường Môn | Ám tiễn lục, cơ quan lõi hỏa, ám khí tỏa quạt |
| Ngũ Độc | Linh xà, ngũ độc trận, cổ trùng/bọ cạp tím–lục |
| Nga Mi | Liên hoa hồng–ngọc, hộ thể, sen nhiều lớp hồi phục |
| Thúy Yên | Quạt tuyết, băng tâm, cột băng tinh lam trắng |
| Cái Bang | Hỏa long cam vàng, bầu rượu/xoáy lửa, song long |
| Thiên Nhẫn | Song nhận đỏ, ảnh bộ tím, vòng ma đao |
| Võ Đang | Lưỡng nghi kiếm khí, thái cực/bát quái, mưa kiếm lam |
| Côn Lôn | Lôi tím lõi trắng, lôi trận, thiên lôi tam kích/phù vàng |

- **Võ công → Xem chiêu**: xem thử cả ba chiêu, kể cả chiêu chưa mở; không tốn MP/nộ hoặc kích hoạt hồi chiêu. Màn chọn phái cũng dùng icon/renderer mới.
- **Khác → Hiệu ứng võ công**: chọn Đầy đủ hoặc Gọn; lưu riêng từng nhân vật. Gọn giảm ánh sáng và chi tiết, vẫn giữ hình chiêu/phạm vi trận. Nút tuyệt chiêu viền vàng khi đã đủ cấp/MP/nộ và hết hồi chiêu.
- Đạn có hình riêng theo phái; hiệu ứng lớn của chiêu tầm xa xuất hiện khi đạn tới mục tiêu. Chiêu đánh nhiều quái chỉ có một hiệu ứng lớn, các lần trúng còn lại dùng hiệu ứng nhỏ để dễ quan sát sân. Sét lan vẽ đường bay giữa những mục tiêu đã chọn, dùng thời điểm/sát thương cũ.
- Atlas giữ **28.026 byte**, không thêm bitmap. Chỉ thêm vector và quầng sáng 96px lưu một lần theo màu, dùng lại; không tạo gradient động, blur, flash toàn màn hình hoặc hệ particle. Giữ 30 FPS, tối đa 24 hiệu ứng thoáng/6 trận. Chế độ Gọn bỏ quầng sáng của kỹ năng và giảm số nét trang trí.

Kiểm tra hình thật và chế độ đồ họa trên build production bằng cùng các biến Playwright/Chromium/URL ở phần kiểm thử:

```bash
node --experimental-strip-types tests/skill-art-browser.cjs
```

Bộ này xem đủ 30 chiêu, kiểm tra ảnh có chuyển động và khác nhau, MP/nộ/XP/hồi chiêu không đổi khi xem, cài đặt tồn tại sau reload, số thao tác vẽ giảm mỗi frame và sáu kích thước màn hình. Xuất bảng hình vào `/tmp/volam-skill-gallery.png`. Bộ `sects-browser.cjs` kiểm tra đủ 30 chiêu trong trận thật, màu phái, sát thương/status và các trường hợp cast không hợp lệ. Mức mượt trên thiết bị điện thoại thật cần tiếp tục playtest.

## Giao diện và vòng chơi idle

- Chọn một trong 10 môn phái thuộc 5 hệ ngũ hành, đặt tên và giới tính nhân vật. Mỗi phái có ngoại hình riêng và bộ 2 võ công + 1 tuyệt chiêu với hành vi chiến đấu khác nhau.
- Sân đấu phủ phần màn hình phía trên menu, các bảng mở khi chạm năm tab **Giang hồ / Nhân vật / Võ công / Hành trang / Khác** nằm dưới. Giao diện xanh rêu, viền vàng, dùng chung trên điện thoại và desktop.
- **Nhân vật** và **Túi đồ** mở thành màn riêng với khung vàng cổ theo ảnh tham chiếu. Nhân vật đứng giữa trên đài tu luyện có vòng cảnh giới chuyển động, trang bị xếp 6 ô bên trái và 5 ô bên phải. Chân dung có áo/vũ khí theo phái, giới tính và đồ đang mặc; HP/MP và bảy chỉ số hiện phía dưới. Chạm trang bị để xem chi tiết; cường hóa bằng nút có giá bạc/đá rồi xem trước và xác nhận, mở chi tiết không tự trừ tiền.
- Túi đồ dùng lưới 60 ô có viền phẩm chất, hình trang bị, cấp độ và mức cường hóa. Màn túi có số ô đang dùng, bạc/đá, Mặc đồ mạnh nhất, Vứt đồ theo lọc, Lưu/Tải và Tiệm; danh sách để mặc/bán/cường hóa nằm dưới lưới, trang bị đang mặc nằm trong mục có thể mở rộng. Nút **×** đưa về sân đấu.
- Có 16 vùng, 160 ải; mỗi ải có 4 đợt, trùm ở đợt cuối của mỗi ải thứ 10. **Vượt ải** mở ải kế tiếp; **Luyện công** lặp lại ải hiện tại. Vùng mới mở khi đủ cấp đầu vùng hoặc vượt ải; các ải bên trong tiếp tục mở theo tiến trình.
- Tự tìm quái, dùng võ công, dùng thuốc và nhặt đồ. WASD hoặc joystick chuyển sang điều khiển tay; bấm **Tự động** để tiếp tục. Khắc chế ngũ hành tăng 25% hoặc giảm 20% sát thương.
- Nhân vật 56 × 76, áo/tóc/vũ khí riêng cho từng phái và giới tính; nhún/đảo hướng theo di chuyển, nghiêng người khi đánh/thi triển và lướt có thời gian. Camera bám mềm; chuyển đợt giữ vị trí nhân vật. Quái có động tác lao đánh, phản ứng trúng đòn và ngã xuống.
- Cảnh giới tu tiên tự tính từ lực chiến hiện tại: đủ 23 bậc từ Phàm Nhân đến Vô Cực. Tên cảnh giới và tầng/giai đoạn nằm trên đầu nhân vật; vòng sáng dưới chân tăng màu, lớp vòng, phù văn, hoa sen, tia và hạt sáng theo bậc. Tab **Nhân vật** hiển thị cảnh giới, lực chiến còn thiếu và bảng các ngưỡng.
- Đánh thường cận chiến có vệt chém, đòn tầm xa có đạn bay và gây sát thương khi chạm mục tiêu. Hiệu ứng theo năm hệ: kim nhận, lá/ám khí, băng, lửa và lôi. Chiêu ngoài tầm không tiêu hao MP hoặc hồi chiêu.
- Trang bị bật ra rồi rơi xuống đất, có hình kiếm, áo, mũ, giày, nhẫn và thú cưỡi theo vị trí; màu và ánh sáng theo phẩm chất dùng chung trên đất, Hành trang, Nhân vật và màn so sánh. Đồ Hiếm/Cực phẩm có cột sáng và quầng sáng dưới chân khi mặc; vũ khí phát sáng theo màu trang bị. Đồ nằm trên sân ít nhất 1,6 giây trước khi tự nhặt. Chạm đồ để đi tới nhặt hoặc dùng **E**. Đồ tự nhặt bay về nhân vật, thông báo có thể mở so sánh với trang bị đang dùng. Đồ chưa nhặt được lưu cùng nhân vật; túi đầy vẫn nhặt được bạc, trang bị tự nhặt được giữ trong Đồ chờ nhận.
- Lên cấp nhận 5 điểm tiềm năng và 1 điểm võ học. Cộng/rút tiềm năng thay đổi chỉ số thật. Võ công nâng đến bậc 20, có thể rút các điểm đã nâng, giữ bậc nhập môn.
- Nhân vật có 11 vị trí trang bị và 60 ô hành trang, tự mặc đồ tốt hơn nếu bật tùy chọn; đồ vượt sức chứa vẫn được giữ trong **Đồ chờ nhận**. Có cửa hàng, cường hóa, bình HP/MP, về thành và quay lại ải.
- Tự lưu mỗi 10 giây và khi giao dịch. Ba ô nhân vật lưu độc lập; hỗ trợ file `.volamsave`, mã JSON, sao lưu trước khi nạp/tạo lại và khôi phục bản sao lưu. File không hợp lệ không thay thế nhân vật hiện tại.
- Thưởng ngày chỉ nhận một lần cho mỗi nhân vật, tính theo giờ Việt Nam. Khi tải lại nhân vật đang luyện ải, nhận thưởng vắng mặt tối đa 4 giờ; ở thành không nhận thưởng luyện công.
- Trong tab **Khác**, chọn **Rừng Trúc · Phiêu lưu** để trở lại nhiệm vụ, NPC và hai phụ bản của bản cũ. Save cũ tự chuyển sang chế độ phiêu lưu, giữ nhân vật và vật phẩm. Thẻ **Sân luyện mới đã sẵn sàng** trong Giang hồ có nút **Vào luyện công** để bật sân luyện tự động với nhân vật đó.
- Tab **Khác** hiển thị bản **v0.20.0 · Trấn Thiên Tháp & Tiềm năng** để xác định bản đang tải.

Ảnh đại diện, nhân vật của 10 phái, quái và NPC dùng một atlas WebP 28 KB; hiệu ứng và trang bị dưới đất được vẽ trên Canvas. Đây là triển khai vòng chơi và giao diện tương ứng; chưa thay thế toàn bộ dữ liệu kỹ năng, sprite/animation, bot, bộ trang bị và chế tác chuyên sâu của game tham chiếu.

## Trang bị và boss Hoàng Kim · v0.5.0

- 11 hình trang bị vector dùng chung trên đất, trong túi và trên nhân vật. Không thêm ảnh bitmap: atlas vẫn 28 KB. Bậc trang bị 1–16 theo mỗi 10 cấp; cấp trang bị biểu thị sức mạnh, chưa có yêu cầu cấp để mặc.
- 5 phẩm chất: **Thường (xám), Tốt (lục), Hiếm (lam), Cực phẩm (tím), Hoàng Kim (vàng)**. Hoàng Kim có khung viền vàng/ký hiệu riêng và cột sáng vàng khi rơi. Trang bị mới có 2/3/5/7/10 dòng phụ theo phẩm chất, cùng chỉ số chính; các dòng trùng loại cộng chung khi hiển thị.
- Dòng phụ gồm 14 loại: công, phòng, sinh lực, nội lực, chí mạng, tốc độ di chuyển và tám dòng chiến đấu nâng cao mô tả phía trên. Mặc vào cộng trực tiếp cho nhân vật/combat; cường hóa tăng theo 4% mỗi bậc, tối đa +10; chỉ số chính có mức tăng tối thiểu 1 điểm mỗi bậc, dòng phụ làm tròn phần tăng lên. Vì vậy đồ cấp thấp vẫn tăng sức mạnh khi +1. Chi tiết hiển thị từng dòng và chênh lệch so với món đang mặc. Save cũ giữ chỉ số chính, không tự tạo dòng ngẫu nhiên khi tải.
- **Hành trang → Mặc đồ mạnh nhất** chọn món tăng tổng điểm lực chiến cao nhất cho từng vị trí, kể cả chỉ số phụ/cường hóa. Món cũ về túi; không mất đồ khi túi đầy.
- **Vứt đồ theo lọc** chọn phẩm chất tối đa, cấp trang bị tối đa, chỉ đồ yếu hơn/bằng món đang mặc. Xem danh sách rồi xác nhận hoặc hủy. Luôn giữ đồ bộ, đồ Hoàng Kim, đồ +1 trở lên, đồ đang mặc và Đồ chờ nhận. Đổi bộ lọc phải xem lại trước khi xác nhận; không vứt cả đồ mới nhặt sau khi xem trước.
- Boss xuất hiện theo giờ Việt Nam **12:00–12:20 Kim Giáp Lang Vương, 19:00–19:20 Hoàng Kim Thủ Vệ, 21:00–21:20 Xích Diệm Ma Vương**. Tab Giang hồ hiển thị đếm ngược và lịch. Từ cấp 5 có thể vào đấu trường trong khung giờ; có đòn báo vùng đỏ và cuồng nộ dưới 50% HP.
- Hạ boss chắc chắn rơi **1 món Hoàng Kim**, 15% rơi thêm món thứ hai; thưởng 900 XP, 800 bạc, 8 đá. Mỗi nhân vật nhận một lần mỗi khung giờ; lưu cả dấu đã hạ và đồ chưa nhặt. Rời đấu trường thu hồi đồ; túi đầy chuyển Đồ chờ nhận. Hết giờ/chết/rời sớm không cấp thưởng hạ boss. Trận đang đánh không tiếp tục sau reload, có thể vào lại nếu chưa hạ và còn giờ. Luyện ải và nhiệm vụ Lang Vương được giữ riêng.

Lịch boss và phần thưởng hiện chạy local theo đồng hồ thiết bị, lưu trên trình duyệt; chưa dùng giờ server hay chống chỉnh save/đồng hồ. Việc chuẩn hóa bằng server nằm trong P3/P5 của PLAN.

## Cường hóa, tinh anh và lửa trại · v0.6.0

- Chạm trang bị đang mặc hoặc nút **Rèn** trong túi để xem bảng chỉ số hiện tại → bậc kế tiếp, chi phí và tỷ lệ. Chỉ trừ nguyên liệu khi bấm xác nhận. Đồ đang mặc cập nhật ngay công/phòng/HP/MP/chí mạng/tốc độ/lực chiến; đồ trong túi chỉ cộng sau khi mặc. Không cộng lặp khi tải lại.
- Mỗi lần dùng **1 đá**, bạc = `45 + bậc hiện tại × 35`. Tỷ lệ lên +1–+3: **100%**, +4–+6: **78%**, +7–+8: **58%**, +9–+10: **42%**. Thất bại mất nguyên liệu đã báo, giữ nguyên bậc/chỉ số; thiếu nguyên liệu hoặc đã +10 không bị trừ. Cường hóa trong phụ bản bị chặn để giao dịch được lưu đúng.
- Hạ quái **thường có cấp không cao hơn nhân vật** trong luyện ải hoặc Rừng Trúc sẽ tích lũy cơ hội gặp tinh anh. Trước 6 con chưa quay xác suất; từ con thứ 6: **15%**, mỗi con tiếp theo tăng 5 điểm phần trăm, tối đa 60%; con thứ 20 chắc chắn xuất hiện nếu trước đó chưa gặp. Khi xuất hiện, bộ đếm về 0; tối đa 1 tinh anh xuất hiện thêm còn sống. Quái tinh anh có sẵn không chặn cơ chế này. Phụ bản và đấu trường Hoàng Kim giữ đội hình riêng.
- Tinh anh xuất hiện thêm mạnh hơn quái thường 2 cấp, có vòng/nhãn vàng và rơi đồ Hiếm. Lưu bộ đếm, vị trí/HP tinh anh còn sống; tải lại có thể tiếp tục đánh. Tinh anh này không tự hồi sinh sau khi chết; cần hạ quái thường để gọi lượt tiếp theo.
- Hạ tinh anh, kể cả tinh anh có sẵn trong phụ bản, tạo **lửa trại 90 giây**, phạm vi **120 đơn vị**, thưởng **`6 + cấp tinh anh × 2` XP mỗi 3 giây**. Chỉ nhận khi nhân vật ở gần và đúng bản đồ; nhiều lửa không cộng chồng. Bấm lửa trên sân hoặc **Đến lửa trại** trong Giang hồ để dừng auto và đi tới; bấm **Tự động** để đánh tiếp.
- Tối đa 3 lửa đồng thời, vẽ trực tiếp bằng Canvas; không thêm ảnh vào atlas 28 KB. Lửa trên cùng ải giữ qua các đợt, nhưng không cấp XP khi về thành, đổi bản đồ, vào boss hoặc đứng xa. Lửa phụ bản chỉ thuộc lượt đang chạy. Lửa trên world/luyện ải giữ thời hạn khi reload; không gia hạn và không nhận bù XP lúc đóng tab, tải lại hoặc chạy nền.

## Cài đặt, trùng sinh và danh hiệu · v0.7.0

- **Khác → Buff kinh nghiệm** chọn **x1, x5, x10, x100 hoặc x1000**; lưu riêng từng nhân vật. Mọi nguồn đi qua cùng phép tính XP: quái, nhiệm vụ, boss Hoàng Kim, thưởng phụ bản, lửa trại và vắng mặt. XP vắng mặt dùng hệ số trong bản lưu, không nhân bạc/đá/đồ. Lên nhiều cấp nhận đủ điểm võ học/tiềm năng; cấp tối đa **160**, XP dư bị bỏ và không chuyển sang lượt trùng sinh.
- **Khác → Hiển thị** bật/tắt số sát thương, minimap, tên danh hiệu và hiệu ứng danh hiệu. Ẩn tên/hiệu ứng không tháo danh hiệu hoặc mất chỉ số. Tùy chọn lưu theo từng ô nhân vật; đổi khi đã rời phụ bản để không mất cài đặt do checkpoint của lượt chưa lưu.
- **Nhân vật → Trùng sinh** xem trước rồi xác nhận khi đạt cấp 160 và đã rời phụ bản/boss Hoàng Kim. Mỗi lần về cấp 1/XP 0, trở lại thành tại ải 1 và nhận vĩnh viễn **+80 công, +50 phòng, +600 HP, +120 MP, +4 tốc**. Chỉ số theo cấp được tính lại từ cấp 1; điểm tiềm năng, võ học đã nâng, đồ/cường hóa, bạc/đá, vật phẩm chờ nhận, thành tích/danh hiệu và các ải đã mở đều giữ. Các chiêu vẫn cần cấp 3/5 để dùng lại. Đồ dưới đất được thu hồi, kể cả vào hàng chờ khi túi đầy.
- Trùng sinh tạo bản sao lưu trước, kiểm tra lại cấp/số lần khi xác nhận, chặn nhấn lặp; không thực hiện nếu không tạo được backup. Bonus tính từ số lần trùng sinh, không cộng lại vào dữ liệu gốc mỗi lần sync/reload. Không làm mới lượt thưởng ngày hoặc lượt boss Hoàng Kim.
- **Nhân vật → Danh hiệu** có 12 danh hiệu, xem trước hiệu ứng, tiến độ mở, đeo/tháo. Chỉ danh hiệu đang đeo cộng chỉ số thật và lực chiến; các danh hiệu đã mở không cộng chồng. Thành tích hạ quái/tinh anh/boss và cấp cao nhất giữ qua trùng sinh. Save cũ nhận cài đặt x1, 0 trùng sinh, không tự đeo danh hiệu; mở các điều kiện đã biết từ tiến trình cũ.

| Danh hiệu | Điều kiện mở | Chỉ số khi đeo | Hiệu ứng vector |
| --- | --- | --- | --- |
| Sơ Nhập Giang Hồ | Gia nhập môn phái | +20 HP | Lá xanh |
| Bách Chiến Hiệp Khách | Hạ 100 quái | +15 công, +2 tốc | Bốn mũi kiếm |
| Tinh Anh Liệp Thủ | Hạ 5 tinh anh | +20 công, +10 phòng | Tinh thể hổ phách |
| Trảm Ma Đại Hiệp | Hạ 10 boss | +35 công, +200 HP | Vương miện đỏ |
| Phá Trận Cao Thủ | Vượt cả hai phụ bản | +20 phòng, +60 MP | Trận phù lam tím |
| Hoàng Kim Liệp Thủ | Hạ boss Hoàng Kim | +40 công, +3% chí mạng | Kim tiền vàng |
| Bách Luyện Thành Cương | Sở hữu đồ +5 | +30 phòng, +150 HP | Tia lửa |
| Thần Binh Chi Chủ | Sở hữu đồ +10 | +60 công, +4% chí mạng | Song kiếm tím |
| Võ Lâm Cao Thủ | Từng đạt cấp 50 | +25 công, +15 phòng, +30 MP | Tinh tú xanh |
| Nhất Đại Tông Sư | Từng đạt cấp 160 | +80 công, +400 HP | Mặt trời kim sắc |
| Niết Bàn Tái Sinh | Trùng sinh lần đầu | +300 HP, +80 MP, +5 tốc | Sen hồng |
| Luân Hồi Chí Tôn | Trùng sinh 5 lần | +120 công, +80 phòng, +600 HP, +5% chí mạng | Hai quỹ đạo |

Hiệu ứng dưới chân dùng vài nét Canvas, tối đa một hiệu ứng danh hiệu trên nhân vật; atlas vẫn 28 KB. Những cơ chế này thuộc bản local lưu trên trình duyệt; authority và thời gian server tiếp tục thuộc P3/P5 của PLAN.

## Hình trang bị và linh quang · v0.12.0

- Mỗi món có các lớp vật liệu, men màu, nét chạm khắc, viền sáng và đá ngọc ở đúng vị trí. Sáu vật liệu gồm thép, vàng, ngọc, lụa, da và gỗ. Viền bạc/lục/lam/tím/vàng thể hiện phẩm chất; Hoàng Kim có khung kim long và ấn văn.
- **+3:** viền khắc sáng tĩnh; **+7:** vòng linh khí xoay; **+10:** thêm phù văn và vòng phụ. Ngũ hành và bộ trang bị đổi màu linh khí và huy hiệu. Tay nhân vật cầm đúng một trong 20 hình vũ khí, đảo hướng và vung khi đánh; giáp có vai/miếng hộ tâm hoặc nét thêu, mũ có trâm/giác quan, giày có viền, pháp bảo phát sáng từ +7. Món Hiếm trở lên rơi có cột màu để dễ tìm; vòng sáng và hạt chỉ xuất hiện từ +7, +10 thêm phù văn.
- **Nhân vật → Mẫu đồ** hoặc **Túi đồ → Mẫu trang bị** mở Bảo khố. Chọn vị trí, phẩm chất, +0/+3/+7/+10 và ngũ hành/bộ để xem mẫu. **Chọn mua** mở Tiệm với đúng kiểu và bộ; món mua thực tế vẫn Tốt, +0, giá theo cấp. Mẫu minh họa không cấp trang bị hoặc thay đổi bạc/chỉ số.
- Hình trong sân được cache tối đa 160 icon 128×128; không tạo gradient vật liệu mỗi khung hình. Linh khí mỗi món tối đa 6 hạt, đồ rơi tối đa 5 hạt. Cài đặt **Gọn** và tùy chọn giảm chuyển động của trình duyệt dừng animation trong bảng đồ; Gọn còn giảm hạt và cột sáng trong sân.

Kiểm tra hình ảnh: `node --experimental-strip-types tests/equipment-art-browser.cjs` với các biến Playwright bên dưới. Kiểm thử mua đủ 20 kiểu vũ khí, nhẫn thứ hai, ngựa mới, mặc/lưu/tải; xem đủ 84 mẫu, chế độ Gọn/giảm chuyển động, cache khi vẽ và sáu kích thước màn hình. Unit test: `node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs`.

## Bộ ngũ hành và cưỡi ngựa · v0.11.0

- Trang bị có **108 chủng loại**: 26 vũ khí, 12 giáp, 12 mũ, 8 giày, 8 đai, 8 dây chuyền, 9 nhẫn, 8 hộ uyển, 11 ngọc bội/pháp bảo và 6 ngựa. Cấp 1–160 chia 16 bậc; khung họa tiết tăng ở bậc 5/9/13. Bảy phẩm chất từ trắng đến đỏ; mỗi kiểu có hình riêng trong túi, chân dung, món rơi và tay nhân vật.
- Năm bộ **Kim Phong / Thanh Trúc / Hàn Nguyệt / Xích Diệm / Huyền Nham** ứng với Kim/Mộc/Thủy/Hỏa/Thổ. Đồ Hoàng Kim mới luôn thuộc một bộ; đồ khác có cơ hội thuộc bộ. Đồ rơi ưu tiên hệ môn phái 60% khi chọn hệ. Save cũ giữ nguyên chỉ số, không tự thêm dòng phụ, hệ hoặc bộ.
- **2 món:** +6 công, +4 phòng; **4 món:** thêm +90 HP, +24 MP; **6 món:** thêm chỉ số đặc trưng của hệ. **Đủ 11 vị trí**, gồm hai nhẫn và ngựa, mở thuộc tính ẩn bên dưới và trận sáng riêng. Công/phòng/HP/MP của bộ nhân với bậc món thấp nhất; cùng hệ môn phái tăng các thuộc tính bộ 20%, làm tròn lên. Bộ chỉ đếm các ô đang mặc; ngựa vẫn tính vào bộ khi đi bộ. Phối nhiều bộ nhận những mốc riêng đã đủ, không nhận thuộc tính ẩn của bộ thiếu món.

| Bộ | Thuộc tính ẩn ở bậc 1, chưa cộng đồng hệ |
| --- | --- |
| Kim Phong · Kim | Kiếm Tâm: +30 công, +5% chí mạng |
| Thanh Trúc · Mộc | Sinh Sinh Bất Tức: +250 HP, +12 tốc |
| Hàn Nguyệt · Thủy | Băng Tâm: +160 HP, +120 MP |
| Xích Diệm · Hỏa | Liệt Diễm: +40 công, +8 tốc |
| Huyền Nham · Thổ | Bất Động Sơn: +30 phòng, +250 HP |

- **Nhân vật → Ngũ hành** hoặc **Túi đồ → Bộ ngũ hành** xem mốc đang bật/tắt, số vị trí đã sở hữu và mặc các món của một bộ từ túi. So sánh lực chiến và Mặc đồ mạnh nhất tính cả thuộc tính bộ; thao tác mặc vẫn giữ đồ cũ trong túi. Vứt đồ theo lọc giữ mảnh bộ; có thể bán từng món bằng luồng xác nhận cũ.
- **Tiệm → Chọn mảnh bộ** mua đúng bộ, vị trí và **kiểu món** còn thiếu: phẩm chất Tốt, cấp bằng cấp nhân vật, hai dòng phụ ngẫu nhiên, giá `120 + cấp × 8` bạc. Mua vào túi, không tự thay trang bị; túi đầy/thiếu bạc/đang trong phụ bản không mua được.
- **Tiệm → Mua Tuấn Mã** giá 200 bạc hoặc nhặt ngựa từ quái. Mặc vào ô Ngựa, bấm **Lên/Xuống ngựa** trong Nhân vật, nút **♞** trên sân hoặc **H**. Không có ngựa thì nút đưa tới Tiệm. Ngựa có dáng chạy, quay hướng, yên/giáp và ánh sáng theo phẩm chất/cường hóa, hiện cả trên sân và chân dung. Vẫn đánh thường/thi triển khi cưỡi; chờ hết chiêu lướt để lên xuống.
- Tốc độ cưỡi tăng `30 + bậc phẩm chất × 5 + bậc trang bị` phần trăm (Tuấn Mã cơ bản +36%, cao nhất +66%). Đi bộ trở lại tốc độ gốc; thao tác không cộng dồn và không tăng lực chiến/cảnh giới chỉ vì lên ngựa. Trạng thái cưỡi lưu cùng từng nhân vật; save cũ đi bộ, không có ngựa đang mặc thì tự về đi bộ.

Kiểm tra bổ sung: `node --experimental-strip-types tests/gear-mount-browser.cjs` với cùng các biến môi trường Playwright bên dưới. Bộ này chạy luồng mua/mặc đồ thật, bật/tắt đủ bộ, kiểm tra dự đoán lực chiến, tốc độ di chuyển khi cưỡi, hình ngựa thực sự được vẽ trên hai Canvas, lưu/tải, dữ liệu sai và sáu kích thước màn hình. Unit test `gear-sets.test.mjs` kiểm tra biên mốc bộ, đồng hệ, bậc thấp nhất, giữ đồ khi thay, đồ cũ và tốc độ không cộng dồn.

## Cảnh giới theo lực chiến

Tổng điểm sức mạnh **S = Công × 3 + Phòng × 2 + HP tối đa × 0,15 + MP cộng thêm × 0,1 + chí mạng cộng thêm × 8 + tốc độ cộng thêm × 2 + điểm tám dòng nâng cao**. Điểm nâng cao dùng giá trị sau giới hạn: sát thương chí mạng × 2, tốc độ đánh × 5, hút sinh lực × 10, xuyên giáp × 5, giảm sát thương × 8, né tránh × 8, hồi HP × 2 và hồi MP × 3. Lực chiến = **⌊S³ / 1.000⌋**, giới hạn ở số nguyên an toàn của JavaScript. Bao gồm trang bị/cường hóa, tiềm năng, trùng sinh và danh hiệu đang đeo; không làm thay đổi sát thương/HP hoặc ghi thang điểm mới vào chỉ số gốc. Mọi dòng đều góp phần; trang bị mạnh hơn theo tổng điểm vẫn tăng lực chiến. Thay đồ/cường hóa cập nhật ngay cả bảng Nhân vật, thanh trên và vòng cảnh giới. HP đang mất không làm tụt cảnh giới; save cũ được tính lại mà không tạo lại nhân vật.

Chí mạng chiến đấu = 12% cơ bản + trang bị + danh hiệu, giới hạn 40%; điểm sức mạnh vẫn tính toàn bộ dòng để xếp đồ. Phần MP/tốc/chí mạng cộng thêm không tính lại giá trị cơ bản của môn phái. Con số cạnh tên được rút gọn, số đầy đủ có trong tooltip và tab Nhân vật. Trong túi, **Điểm trang bị** là điểm xếp hạng của riêng món; **chênh lệch lực chiến** là dự đoán thật sau khi thay món đang mặc, gồm cả HP do phòng thủ của bộ đồ tạo ra. Cường hóa món chưa mặc không cộng cho nhân vật.

| Bậc | Cảnh giới | Lực chiến từ |
| --- | --- | ---: |
| 1 | Phàm Nhân | 0 |
| 2 | Luyện Thể | 100.000 |
| 3 | Luyện Khí | 1.000.000 |
| 4 | Trúc Cơ | 3.000.000 |
| 5 | Kim Đan | 8.000.000 |
| 6 | Nguyên Anh | 20.000.000 |
| 7 | Hóa Thần | 50.000.000 |
| 8 | Luyện Hư | 100.000.000 |
| 9 | Hợp Thể | 200.000.000 |
| 10 | Đại Thừa | 400.000.000 |
| 11 | Độ Kiếp | 700.000.000 |
| 12 | Chân Tiên | 1.000.000.000 |
| 13 | Thiên Tiên | 1.500.000.000 |
| 14 | Huyền Tiên | 2.200.000.000 |
| 15 | Kim Tiên | 3.000.000.000 |
| 16 | Thái Ất Kim Tiên | 4.200.000.000 |
| 17 | Đại La Kim Tiên | 5.600.000.000 |
| 18 | Tiên Vương | 7.200.000.000 |
| 19 | Tiên Đế | 8.800.000.000 |
| 20 | Đạo Tổ | 10.000.000.000 |
| 21 | Hỗn Nguyên | 12.000.000.000 |
| 22 | Hồng Mông | 14.500.000.000 |
| 23 | Vô Cực | 17.500.000.000 |

Mỗi bậc kéo dài đến dưới ngưỡng tiếp theo, tránh trùng mốc: đúng 100.000 vào Luyện Thể, đúng 1 triệu vào Luyện Khí. Phàm Nhân chưa chia tầng; Luyện Thể/Luyện Khí có 9 tầng; từ Trúc Cơ có **Sơ kỳ → Trung kỳ → Hậu kỳ → Đỉnh phong → Đại viên mãn**. Vô Cực chia theo các mốc 17,5 / 18,1 / 18,7 / 19,3 / 19,9 tỷ. Ba bậc cuối tăng khoảng 20–21% mỗi bậc; chỉ đổi ngưỡng cảnh giới, giữ công thức lực chiến và sát thương đang có. Cảnh giới tự đổi theo lực chiến; chưa có thao tác dùng đan hoặc nhiệm vụ thiên kiếp. Các bậc sau Đạo Tổ dành cho tiến trình trùng sinh dài hạn; nhịp đạt mốc cần tiếp tục playtest. Dữ liệu nằm trong `src/cultivation.ts`.

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

Kiểm tra bố cục theo ảnh, vị trí nút chạm trên sáu viewport, thao tác mở/đóng bảng, minimap/nhiệm vụ/nhật ký và dự đoán lực chiến chính xác khi thay đồ/cường hóa:

```bash
node tests/hud-browser.cjs
```

Bộ này chạy trên build production với cùng các biến Playwright/Chromium/URL dưới đây; ảnh chụp lưu `/tmp/volam-hud-<width>x<height>.png`.

Bộ kiểm tra giao diện idle mới:

```bash
VOLAM_PLAYWRIGHT_PATH="$(node -p 'require.resolve("playwright")')" \
VOLAM_CHROMIUM_PATH=/usr/bin/chromium \
VOLAM_TEST_URL=http://127.0.0.1:5173 \
node tests/idle-browser-smoke.cjs
```

Bộ này kiểm tra 10 màn chọn phái, chiến đấu tự động thật, đánh trùm/mở vùng, cộng/rút điểm, thưởng ngày chống nhận lặp, import/export/khôi phục bản sao lưu, ba ô nhân vật, thưởng vắng mặt không lặp, save cũ, online và sáu kích thước viewport từ 320×568 đến 1440×900. Kiểm tra thêm chân dung trong màn Nhân vật, trang bị ở hai bên, mở chi tiết/xem trước không trừ tiền, xác nhận cường hóa trừ đúng bạc/đá, chạm trực tiếp vào hình để so sánh/mặc và bật sân luyện từ nhân vật cũ mà giữ cấp độ, đồ, nhiệm vụ và điểm võ học. Test boss dùng fixture mạnh để kiểm tra luồng; không thay thế playtest cân bằng toàn bộ 160 ải.

Kiểm tra chuyển động, lướt, đạn bay và luồng đồ rơi bằng cùng các biến môi trường:

```bash
node tests/combat-browser-smoke.cjs
```

Bộ này kiểm tra quãng đường di chuyển thật, không mất MP ngoài tầm, lướt qua nhiều frame, sát thương sau khi đạn tới, trang bị rơi từ boss, đồ dưới đất sau reload, chạm nhặt/so sánh/mặc và túi đầy không làm mất đồ hoặc cản nhặt bạc.

Kiểm tra cảnh giới bằng cùng các biến môi trường:

```bash
node tests/cultivation-browser-smoke.cjs
```

Bộ này mặc đổi đồ mạnh/yếu qua giao diện thật, kiểm tra cảnh giới sau reload, 23 tên được vẽ trên đầu dù giữ nguyên cấp nhân vật, màu sáng thực trên Canvas, vòng sáng chuyển động khi đứng yên, bảng ngưỡng và sáu kích thước màn hình. Ảnh chụp mặc định lưu vào `/tmp/volam-cultivation`; có thể đổi bằng `VOLAM_CAPTURE_DIR`.

Kiểm tra trang bị nhiều dòng, mặc bộ mạnh nhất, lọc/vứt đồ và lịch boss bằng cùng các biến môi trường:

```bash
node tests/equipment-browser.cjs
```

Bộ này kiểm tra sáu dòng cộng thật khi mặc, tải lại, xem trước/hủy/bảo vệ đồ khi lọc, boss trước/đúng/hết giờ Việt Nam, đồ Hoàng Kim dưới đất sau reload, không nhận lượt hai, túi đầy chuyển hàng chờ và sáu kích thước màn hình. Fixture mạnh chỉ kiểm tra luồng nhận thưởng, không thay thế playtest boss.

Kiểm tra cường hóa và tinh anh/lửa trại bằng cùng các biến môi trường:

```bash
node tests/enhancement-elite-browser.cjs
```

Bộ này kiểm tra xem trước/chi phí/tỷ lệ, thất bại/thiếu đồ/+10, cộng chỉ số khi mặc và reload; diệt quái thường gọi tinh anh thật, tải tiếp trận, diệt tinh anh tạo lửa, XP gần/xa/hết hạn, không thưởng offline và sáu kích thước màn hình.

Browser test kiểm tra mua/bán, bình hồi phục, migrate save, kích thước mobile, hai phụ bản/đợt/boss, nhận thưởng lặp, túi đầy, tải lại, chết và timeout. Bài kiểm tra clear phụ bản dùng fixture nhân vật mạnh để kiểm chứng luồng nhanh; không thay thế playtest cân bằng ở cấp tối thiểu.

Kiểm tra XP, trùng sinh và danh hiệu bằng cùng các biến môi trường:

```bash
node --experimental-strip-types tests/character-progression-browser.cjs
```

Bộ này kiểm tra XP thật từ quái/lửa trại/vắng mặt ở cả 5 hệ số, nhiệm vụ, thưởng phụ bản và boss Hoàng Kim; max cấp/điểm/XP dư, xem trước/hủy/trùng sinh hai lần, backup lỗi, nhấn lặp và giữ đồ/ải. Kiểm tra chỉ số khi đeo/tháo danh hiệu, lưu/tải, 12 hiệu ứng có ảnh khác nhau, công tắc hiển thị và sáu viewport. Fixture mạnh kiểm tra luồng, không thay thế cân bằng.

Giao diện chiếm một viewport, hỗ trợ màn hình dọc và điện thoại xoay ngang: sân đấu ở trên, menu ở dưới, minimap theo vị trí thật, joystick, Auto và nút kỹ năng tròn. Các tab thông tin cuộn nội bộ, không kéo cả trang. Nút thu gọn/mở rộng cho phép tập trung vào sân đấu. Sát thương thường xuất hiện bằng số nổi và nhật ký, không bật toast liên tục che menu.

Đồ họa dùng atlas nhân vật **621.026 byte**, 1223 × 1286, 20 mẫu nam/nữ; atlas NPC/quái/đồ nhặt cũ vẫn **28.026 byte**, 480 × 384. Nhân vật vẽ ở 56 × 76; hình sân, màn Nhân vật và avatar lấy cùng mẫu môn phái/giới tính. Bốn atlas trang bị/vật phẩm WebP tổng ~2,43 MB; icon kỹ năng là SVG nội tuyến; 30 chiêu dùng hình Canvas nhiều lớp theo côn, thương, ám khí, độc, sen, quạt, băng, rồng, song đao, thái cực, kiếm và lôi. Không tải thêm ảnh chiêu. Nền vẽ một lần, game vẽ tối đa 30 FPS, minimap khoảng 5 lần/giây; tối đa 24 hiệu ứng thoáng và 6 trận kéo dài. Vòng cảnh giới và màu trang bị được giữ. Chi tiết nguồn ảnh và giới hạn animation: [src/assets/README.md](./src/assets/README.md). Chiến đấu online có authority, tổ đội và bang hội vẫn nằm trong lộ trình.

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

Dữ liệu chung ở `src/sects.ts`, hình hiệu ứng ở `src/sect-effects.ts`, icon/palette ở `src/skill-art.ts`. Boss chịu choáng/đóng băng tối đa 0,35 giây. Lướt kiểm tra cả đường qua collider; không đủ MP/nộ, ngoài tầm, bị khóa cấp hoặc đường lướt bị chặn sẽ không mất MP/hồi chiêu. Độc, bẫy và hỏa trận thực sự gây sát thương theo thời gian. Nội lực hồi 0,7 MP/giây khi chơi. Những con số này phục vụ prototype, cần playtest cân bằng cho cả 10 phái ở cấp nhập môn và boss.

Save giữ các `factionId` hiện có và mã archetype `kim/hoa/thuy` để tương thích ba ô nhân vật/file xuất. Save rất cũ chưa có `factionId` sẽ dùng Thiên Vương/Cái Bang/Nga Mi tương ứng, giữ cấp/XP, bạc, trang bị và điểm võ học; bán kính nhân vật chuyển về 12. Mỗi phái có hình nam/nữ riêng, một khung cho mỗi mẫu, nhún/đảo hướng, hai chân bước luân phiên và động tác đánh/thi triển; chưa có bộ đi bộ bốn hướng.

Kiểm tra thêm 10 phái, đủ 30 chiêu, DOT/bẫy/sét lan, chi phí khi cast không hợp lệ và viewport:

```bash
node --experimental-strip-types tests/sects-browser.cjs
```

Dùng các biến Playwright/Chromium/URL như các bộ browser test ở trên. Unit test `pnpm test` kiểm tra bộ chiêu, ngũ hành, save, hình học mục tiêu và ngân sách atlas dưới 32 KB.
