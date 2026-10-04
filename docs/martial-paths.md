# Thập phái · Song tu — v0.29.0

Mỗi phái có hai hướng tu luyện và mỗi hướng có ba kỹ năng chủ động. Có thể chọn hướng khi tạo nhân vật hoặc mở **Nhân vật / Võ công → Đổi võ công**, xem thử rồi áp dụng khi đang trong thành và đã hết hồi chiêu. Hai hướng dùng chung điểm và bậc võ học của ba ô chiêu; đổi hướng không cấp thêm điểm, không thay đổi trang bị, ngọc, tâm pháp hay Tri kỷ.

## Nguồn tra cứu

Đối chiếu ngày **04/10/2026** với dữ liệu JX1 công khai trong kho cộng đồng `vunhutha/jx1linux`, chốt tại commit `9c65c6547fe572e0b09227a0b083f42509bedcae`:

- [Bảng kỹ năng — client/settings/skills.txt](https://github.com/vunhutha/jx1linux/blob/9c65c6547fe572e0b09227a0b083f42509bedcae/client/settings/skills.txt): tên, ID, mô tả, giới hạn vũ khí, số chiêu con, loại sát thương và cách xuất chiêu.
- [Bảng vũ khí — client/settings/clientweaponskill.txt](https://github.com/vunhutha/jx1linux/blob/9c65c6547fe572e0b09227a0b083f42509bedcae/client/settings/clientweaponskill.txt): đối chiếu họ vũ khí. `EqtLimit` trong bảng kỹ năng: kiếm `0`, đao `1`, côn/bổng `2`, thương/mâu `3`, chùy `4`, phi đao `101`, tụ tiễn `102`; `-2` không giới hạn.

Bảng tiếng Việt dùng mã TCVN3; tên được chuyển sang Unicode và chuẩn hóa viết hoa. Mỗi định nghĩa trong `src/martial-paths.ts` giữ `sourceId` để tra lại đúng dòng. Ví dụ Truy Phong Quyết chùy là **325**; bản đao cùng tên có ID khác. Hoành Tảo Thiên Quân là côn Thiếu Lâm, Vô Tướng Trảm là đao; Thúy Yên có đơn đao/song đao.

Đây là dữ liệu **JX1 cộng đồng**, có thể khác theo phiên bản máy chủ. Trang chính thức [Võ Lâm Truyền Kỳ VNG](https://volam.zing.vn/) bị chính sách mạng của môi trường trả 403, nên chưa đối chiếu trực tiếp được. Những phái có nhiều hơn hai hướng trong một số phiên bản chỉ được chọn hai hướng theo phạm vi yêu cầu lần này.

## Bộ chiêu và hình ảnh

| Môn phái | Hướng | Chiêu 1 | Chiêu 2 | Tuyệt chiêu | Nhận diện hiệu ứng |
| --- | --- | --- | --- | --- | --- |
| Thiếu Lâm | Côn | Kim Cang Phục Ma | Hoành Tảo Lục Hợp | Hoành Tảo Thiên Quân | Côn ảnh vàng, vòng quét và chấn lực |
| Thiếu Lâm | Đao | Ma Ha Vô Lượng | Sư Tử Hống | Vô Tướng Trảm | Đao khí kim quang, sóng sư tử |
| Thiên Vương | Thương | Hồi Phong Lạc Nhạn | Dương Quan Tam Điệp | Truy Tinh Trục Nguyệt | Thương ảnh liên kích 2 / 3 / 5 lần |
| Thiên Vương | Chùy | Trảm Long Quyết | Thừa Long Quyết | Truy Phong Quyết | Chùy vàng, sóng chấn động |
| Đường Môn | Phi đao | Truy Tâm Tiễn | Ngân Đao Xạ Nguyệt | Nhiếp Hồn Nguyệt Ảnh | Phi đao nguyệt nhận, độc xanh tím |
| Đường Môn | Tụ tiễn | Mạn Thiên Hoa Vũ | Thiên La Địa Võng | Bạo Vũ Lê Hoa | Chùm ám tiễn mảnh, độc tại điểm trúng |
| Ngũ Độc | Đao | Huyết Đao Độc Sát | Bách Độc Xuyên Tâm | Huyền Âm Trảm | Nguyệt trảm độc xanh tím |
| Ngũ Độc | Chưởng | Độc Sa Chưởng | Vô Hình Độc | Âm Phong Thực Cốt | Chưởng độc, khí độc và trận độc |
| Nga Mi | Kiếm | Nhất Diệp Tri Thu | Thôi Song Vọng Nguyệt | Tam Nga Tề Tuyết | Kiếm khí băng trắng hồng |
| Nga Mi | Chưởng / thủ | Phiêu Tuyết Xuyên Vân | Phật Tâm Từ Hữu | Phật Quang Phổ Chiếu | Chưởng băng, hoa sen và phật quang |
| Thúy Yên | Đơn đao | Phong Hoa Tuyết Nguyệt | Vũ Đả Lê Hoa | Băng Tung Vô Ảnh | Nguyệt đao băng xanh |
| Thúy Yên | Song đao | Phong Quyển Tàn Tuyết | Bích Hải Triều Sinh | Băng Tâm Tiên Tử | Hai vệt băng giao nhau, vòng băng |
| Cái Bang | Chưởng | Kiến Nhân Thần Thủ | Kháng Long Hữu Hối | Phi Long Tại Thiên | Rồng vàng có đầu, sừng, vảy và vuốt |
| Cái Bang | Bổng | Diên Môn Thác Bát | Bổng Đả Ác Cẩu | Thiên Hạ Vô Cẩu | Bổng ảnh vàng lục, bổng trận |
| Thiên Nhẫn | Đao / Ma nhẫn | Đơn Chỉ Liệt Diệm | Ma Diệm Thất Sát | Thiên Ngoại Lưu Tinh | Hỏa cầu, ma diệm, lưu tinh lửa |
| Thiên Nhẫn | Kích / Chiến nhẫn | Tàn Dương Như Huyết | Liệt Hỏa Tình Thiên | Vân Long Kích | Kích đỏ, hỏa tuyến và liên kích |
| Võ Đang | Kiếm | Thương Hải Minh Nguyệt | Kiếm Phi Kinh Thiên | Nhân Kiếm Hợp Nhất | Kiếm ảnh xanh trắng, lướt kiếm |
| Võ Đang | Khí / quyền | Nộ Lôi Chỉ | Tọa Vọng Vô Ngã | Thiên Địa Vô Cực | Chỉ khí, nộ lôi và Thái cực |
| Côn Lôn | Đao | Hô Phong Pháp | Cuồng Phong Sậu Điện | Ngạo Tuyết Tiêu Phong | Phong đao xanh vàng, vệt gió |
| Côn Lôn | Kiếm | Thiên Tế Tấn Lôi | Cuồng Lôi Chấn Địa | Lôi Động Cửu Thiên | Lôi điện tím vàng, sét giáng |

Hình ảnh là **nét vẽ SVG/Canvas mới**, mô phỏng bản sắc võ công; không dùng sprite hay âm thanh gốc VNG và không cam kết giống từng khung hình. Tầm đánh, hệ số sát thương, hồi chiêu, MP, cấp mở 1/3/5, khống chế và hồi phục được điều chỉnh cho chiến đấu idle. Chẳng hạn Phật Tâm Từ Hữu dùng hồi HP/khiên và Tọa Vọng Vô Ngã dùng khiên nội lực để phù hợp hệ thống hiện có. Đây không phải thông số nguyên bản JX1.

Biểu tượng, xem thử và chiêu thực chiến cùng dùng họ hiệu ứng của hướng đang chọn. Chiêu bay chỉ gây sát thương/trạng thái lúc va chạm; cận chiến có lấy đà, ra chiêu và hiệu ứng trúng. Tầm đánh hiển thị lấy từ chính định nghĩa được dùng khi kiểm tra mục tiêu. Nét viền tối giữ chiêu rõ trên nền map; chế độ Gọn giảm chi tiết. Hình vũ khí cầm theo hướng tu luyện, còn món đang mặc giữ nguyên chỉ số và dữ liệu.

## Giữ file lưu và kiểm thử

File cũ thiếu `martialPath` được gán hướng mặc định đúng phái. Giữ nguyên điểm/bậc kỹ năng, cấp độ, bạc, trang bị, ngọc, tâm pháp và Tri kỷ. Hướng không thuộc phái hoặc dữ liệu sai bị từ chối. Đổi hướng lưu thất bại sẽ hoàn tác; xem thử không đổi hướng đang dùng. Hồi chiêu tiếp tục chạy trong thành để có thể đổi sau khi chờ đủ thời gian.

- `pnpm test`: kiểm tra 20 hướng, 60 tên/ID, vũ khí đặc trưng, mục tiêu và tầm đánh, file cũ, biểu tượng, hình học Canvas hữu hạn và chế độ Gọn, cùng các kiểm tra hồi quy hiện có.
- `VOLAM_TEST_URL=http://127.0.0.1:4175/volam/ node --experimental-strip-types tests/martial-paths-browser.cjs`: tạo đủ 20 hướng, thi triển thật 60 chiêu, tiêu hao/hồi chiêu/sát thương/trạng thái, xem thử/đổi hướng, điểm chung, tải lại/file cũ, chặn đổi trong trận và bố cục 320px/390px/ngang/desktop.
- `pnpm typecheck` và `pnpm exec vite build --base=/volam/`; workflow Pages chạy lại kiểm tra logic trước khi triển khai.
