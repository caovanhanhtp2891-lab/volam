# Thập phái · Võ học JX1 — v0.31.0

Mỗi phái có hai hướng tu luyện và mỗi hướng có ba kỹ năng chủ động. Có thể chọn hướng khi tạo nhân vật hoặc mở **Nhân vật / Võ công → Đổi võ công**, xem thử rồi áp dụng khi đang trong thành và đã hết hồi chiêu. Hai hướng dùng chung điểm và bậc võ học của ba ô chiêu; đổi hướng không cấp thêm điểm, không thay đổi trang bị, ngọc, tâm pháp hay Tri kỷ.

## Nguồn tra cứu

Nguồn chính do người dùng cung cấp: [phucnb/JXLinux-8.1.11](https://github.com/phucnb/JXLinux-8.1.11), đối chiếu ngày **04/10/2026**, chốt tại commit **`ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764`**:

- [client/settings/skills.txt](https://github.com/phucnb/JXLinux-8.1.11/blob/ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764/client/settings/skills.txt): đối chiếu đủ 60 tên/ID, vũ khí, `SkillStyle`, `ChildSkillId`, `ChildSkillNum`, `MisslesForm`, mục tiêu và sự kiện phát chiêu.
- [client/settings/missles.txt](https://github.com/phucnb/JXLinux-8.1.11/blob/ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764/client/settings/missles.txt): cách di chuyển, tốc độ, thời gian tồn tại, vùng sát thương, hoạt ảnh bay (`AnimFile2`) và trúng (`AnimFile4`). Tên file dùng đúng cách viết `missles` của kho.
- [client/settings/skilltemplate.txt](https://github.com/phucnb/JXLinux-8.1.11/blob/ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764/client/settings/skilltemplate.txt) và [missletemplate.txt](https://github.com/phucnb/JXLinux-8.1.11/blob/ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764/client/settings/missletemplate.txt): giải thích các kiểu sinh/phát đạn. `SkillStyle=1` dẫn sang chiêu con trong bảng kỹ năng; chiêu `SkillStyle=0` dùng ID missile ở `ChildSkillId`. Không tra mọi `ChildSkillId` như một ID kỹ năng.
- [server/jxser/server1/script/skill](https://github.com/phucnb/JXLinux-8.1.11/tree/ff20fda5a34332b8d4b6c31b1c6c6d7f8227c764/server/jxser/server1/script/skill): đọc `shaolin.lua`, `tianwang.lua`, `tangmen.lua`, `wudu.lua`, `emei.lua`, `cuiyan.lua`, `gaibang.lua`, `tianren.lua`, `wudang.lua`, `kunlun.lua`. Script có thể đổi số luồng/tầm/tốc độ theo bậc: Phi Long Tại Thiên dùng `skill_misslenum_v`; Thiên Hạ Vô Cẩu tăng tới 3 luồng; Thiên Ngoại Lưu Tinh sinh sự kiện 363; Lôi Động Cửu Thiên có sự kiện 387.

`src/jx1-skill-reference.ts` lưu 60 bản ghi thông tin đối chiếu gọn, gồm ID missile, kiểu phát/di chuyển, số lượng cơ sở và sự kiện. `src/martial-visuals.ts` chuyển chúng thành bố cục phù hợp Canvas, tối đa tám luồng. Mỗi chiêu giữ `sourceId` và thông tin kiểu xuất chiêu riêng, dùng chung trong trận, biểu tượng và xem thử.

Tên tiếng Việt được chuyển từ TCVN3 sang Unicode. Giới hạn vũ khí: kiếm `0`, đao `1`, côn/bổng `2`, thương/mâu `3`, chùy `4`, phi đao `101`, tụ tiễn `102`; `-2` không giới hạn. Dữ liệu trước đây đã đối chiếu thêm với [vunhutha/jx1linux](https://github.com/vunhutha/jx1linux/tree/9c65c6547fe572e0b09227a0b083f42509bedcae). Đây là phiên bản JX1 cộng đồng; hai hướng mỗi phái được chọn theo phạm vi game hiện tại.

## Bộ chiêu và hình ảnh

| Môn phái | Hướng | Chiêu 1 | Chiêu 2 | Tuyệt chiêu | Nhận diện hiệu ứng |
| --- | --- | --- | --- | --- | --- |
| Thiếu Lâm | Côn | Kim Cang Phục Ma | Hoành Tảo Lục Hợp | Hoành Tảo Thiên Quân | Côn ảnh vàng, vòng quét và chấn lực |
| Thiếu Lâm | Đao | Ma Ha Vô Lượng | Sư Tử Hống | Vô Tướng Trảm | Song đao khí kim quang, sóng sư tử |
| Thiên Vương | Thương | Hồi Phong Lạc Nhạn | Dương Quan Tam Điệp | Truy Tinh Trục Nguyệt | Thương ảnh liên kích 2 / 3 / 5 lần |
| Thiên Vương | Chùy | Trảm Long Quyết | Thừa Long Quyết | Truy Phong Quyết | Chùy vàng, sóng chấn động |
| Đường Môn | Phi đao | Truy Tâm Tiễn | Ngân Đao Xạ Nguyệt | Nhiếp Hồn Nguyệt Ảnh | Phi đao bay, nguyệt nhận xoay tại vùng địch, độc xanh tím |
| Đường Môn | Tụ tiễn | Mạn Thiên Hoa Vũ | Thiên La Địa Võng | Bạo Vũ Lê Hoa | Mưa ám khí tại vùng địch, nguyệt nhận xoắn và độc khi trúng |
| Ngũ Độc | Đao | Huyết Đao Độc Sát | Bách Độc Xuyên Tâm | Huyền Âm Trảm | Nguyệt trảm độc xanh tím |
| Ngũ Độc | Chưởng | Độc Sa Chưởng | Vô Hình Độc | Âm Phong Thực Cốt | Chưởng độc, khí độc và trận độc |
| Nga Mi | Kiếm | Nhất Diệp Tri Thu | Thôi Song Vọng Nguyệt | Tam Nga Tề Tuyết | Kiếm khí băng trắng hồng |
| Nga Mi | Chưởng / thủ | Phiêu Tuyết Xuyên Vân | Phật Tâm Từ Hữu | Phật Quang Phổ Chiếu | Chưởng băng, hoa sen và phật quang |
| Thúy Yên | Đơn đao | Phong Hoa Tuyết Nguyệt | Vũ Đả Lê Hoa | Băng Tung Vô Ảnh | Băng vũ tại vùng địch, năm luồng băng đao tỏa quạt |
| Thúy Yên | Song đao | Phong Quyển Tàn Tuyết | Bích Hải Triều Sinh | Băng Tâm Tiên Tử | Song đao quét chéo, sóng băng, song băng đao bay xoắn |
| Cái Bang | Chưởng | Kiến Nhân Thần Thủ | Kháng Long Hữu Hối | Phi Long Tại Thiên | Rồng vàng có đầu, sừng, vảy và vuốt |
| Cái Bang | Bổng | Diên Môn Thác Bát | Bổng Đả Ác Cẩu | Thiên Hạ Vô Cẩu | Bổng ảnh vàng cam bay, quét vòng hỏa kình |
| Thiên Nhẫn | Đao / Ma nhẫn | Đơn Chỉ Liệt Diệm | Ma Diệm Thất Sát | Thiên Ngoại Lưu Tinh | Hỏa cầu, ma diệm, lưu tinh lửa |
| Thiên Nhẫn | Kích / Chiến nhẫn | Tàn Dương Như Huyết | Liệt Hỏa Tình Thiên | Vân Long Kích | Kích đỏ, hỏa tuyến và liên kích |
| Võ Đang | Kiếm | Thương Hải Minh Nguyệt | Kiếm Phi Kinh Thiên | Nhân Kiếm Hợp Nhất | Kiếm khí xanh trắng, kiếm lôi giáng, lướt kiếm |
| Võ Đang | Khí / quyền | Nộ Lôi Chỉ | Tọa Vọng Vô Ngã | Thiên Địa Vô Cực | Chỉ lôi bay, khiên Thái cực và lôi trận tại vùng địch |
| Côn Lôn | Đao | Hô Phong Pháp | Cuồng Phong Sậu Điện | Ngạo Tuyết Tiêu Phong | Phong đao xanh vàng, vệt gió |
| Côn Lôn | Kiếm | Thiên Tế Tấn Lôi | Cuồng Lôi Chấn Địa | Lôi Động Cửu Thiên | Lôi điện tím vàng, sét giáng |

Hình ảnh là **nét vẽ SVG/Canvas mới**, mô phỏng bản sắc võ công; không dùng sprite hay âm thanh gốc VNG và không cam kết giống từng khung hình. Tầm đánh, hệ số sát thương, hồi chiêu, MP, cấp mở 1/3/5, khống chế và hồi phục được điều chỉnh cho chiến đấu idle. Chẳng hạn Phật Tâm Từ Hữu dùng hồi HP/khiên và Tọa Vọng Vô Ngã dùng khiên nội lực để phù hợp hệ thống hiện có. Đây không phải thông số nguyên bản JX1.

Bản v0.31 phân biệt **đạn bay, chiêu tại vùng địch, cận chiến và hộ thể**. Bạo Vũ Lê Hoa là mưa ám khí; Ma Diệm Thất Sát/Thiên Ngoại Lưu Tinh là ma diệm/mưa lửa tại vùng địch; Kiếm Phi Kinh Thiên/Thiên Địa Vô Cực/Lôi Động Cửu Thiên giáng xuống tại điểm chọn. Chiêu tại vùng địch chờ 380 ms, giữ tâm vùng khi phát và không trúng kẻ đã rời bán kính. Đạn bay chỉ gây sát thương/trạng thái khi chạm. Nga Mi tam kiếm, Thúy Yên ngũ đao, Cái Bang đa long và bổng hỏa dùng số luồng riêng; Thiếu Lâm/Thiên Vương có vệt côn, đao, thương, chùy riêng.

Hiệu ứng trúng có sáu họ riêng: vết chém, băng vỡ, lửa bùng, độc khí, lôi điện, quang hoa. Không vẽ lại nguyên vũ khí lớn tại mỗi điểm trúng. Mưa/lôi giữ hướng từ trên xuống; chiêu có hướng mới xoay về phía địch. Tụ lực, xuất chiêu và trúng/hộ thể có ba pha; xem thử lúc tạo nhân vật và trong Võ công dùng cùng renderer. Gọn giảm luồng/hạt, quầng sáng lưu đệm, không tải thêm atlas kỹ năng.

Màn tạo nhân vật có lưới 10 phái, hai lựa chọn võ công ngay bên dưới, dấu chọn và nút bắt đầu ghi rõ phái/vũ khí. Có thể chạm hoặc dùng phím mũi tên để đổi một trong hai hướng; xem thử ba chiêu trước khi bắt đầu. Trang bị khởi đầu của hướng dùng vũ khí mang đúng loại vũ khí. File lưu cũ không bị thay trang bị.

## Giữ file lưu và kiểm thử

File cũ thiếu `martialPath` được gán hướng mặc định đúng phái. Giữ nguyên điểm/bậc kỹ năng, cấp độ, bạc, trang bị, ngọc, tâm pháp và Tri kỷ. Hướng không thuộc phái hoặc dữ liệu sai bị từ chối. Đổi hướng lưu thất bại sẽ hoàn tác; xem thử không đổi hướng đang dùng. Hồi chiêu tiếp tục chạy trong thành để có thể đổi sau khi chờ đủ thời gian.

- `pnpm test`: 251 kiểm tra logic gồm 20 hướng, 60 tên/ID, vũ khí đặc trưng, mục tiêu và tầm đánh, file cũ, biểu tượng, hình học Canvas hữu hạn và chế độ Gọn, cùng các kiểm tra hồi quy hiện có.
- `VOLAM_TEST_URL=http://127.0.0.1:4175/volam/ node --experimental-strip-types tests/martial-paths-browser.cjs`: tạo đủ 20 hướng, thi triển thật 60 chiêu, tiêu hao/hồi chiêu/sát thương/trạng thái, xem thử/đổi hướng, điểm chung, tải lại/file cũ, chặn đổi trong trận và bố cục 320px/390px/ngang/desktop.
- `pnpm typecheck` và `pnpm exec vite build --base=/volam/`; workflow Pages chạy lại kiểm tra logic trước khi triển khai.

- `tests/jx1-creation-browser.cjs`: chạm thật 10 phái/20 hướng, xem 60 chiêu trên bốn viewport, chọn bằng bàn phím, tạo nhân vật đúng hướng/vũ khí và tải lại.
- `tests/jx1-visuals.test.mjs`: đối chiếu 60 bản ghi, kiểu ra chiêu và mục tiêu tại vùng địch.
- `tests/flight-riding-browser.cjs`: thời điểm va chạm, ba chặng lôi điện theo tốc độ mới, trạng thái trúng địch và 20 mẫu nhân vật cưỡi sáu loại ngựa; hồi quy Auto/map và chat trên trình duyệt.
