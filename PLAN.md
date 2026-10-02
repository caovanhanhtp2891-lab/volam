# PLAN — Game web kiếm hiệp 2D

> Tài liệu thiết kế và kế hoạch phát triển cho repository `volam`.
> Ngày lập: 01/10/2026. Cập nhật visual/mobile: 02/10/2026. Trạng thái: P0–P5 local, nền online P3 và giao diện mobile một viewport đã triển khai; có HUD gọn, minimap vị trí thật, chat, Auto, floating combat text và ảnh kiếm hiệp 2D. Chiến đấu authoritative, P6 tổ đội/phụ bản online và bang hội vẫn nằm ở các milestone sau.
> Tên làm việc: **Giang Hồ Dị Truyện**; có thể đổi trước khi phát hành.

Tài liệu này là bản thiết kế để bắt đầu lập trình. Các hệ thống gameplay và tiêu chí nghiệm thu là mục tiêu triển khai; số liệu cân bằng, thời gian và hiệu năng sẽ được cập nhật sau khi có bản chơi thử.

Lát visual ngày 02/10/2026: đã thay hình khối nhân vật/quái/NPC/loot bằng atlas tạo riêng, bổ sung nền rừng và cảnh vật, xuất WebP, sửa nút kỹ năng bị flex kéo thành bầu dục, tách các vùng chạm và hỗ trợ mobile dọc/ngang. Nhiệm vụ mặc định thu gọn; mục tiêu chỉ hiện khi chọn quái. Đây là bước hoàn thiện hình ảnh/UX, không đánh dấu hoàn thành milestone online. Animation hiện là nhún/đảo hướng sprite; nền minh họa chưa thay cho tilemap/collider được thiết kế riêng.

Điều chỉnh theo yêu cầu hình 2D thật đơn giản và nhẹ: dùng một atlas phẳng 384 × 384 px, tối đa 64 màu, 19 KB; ngân sách atlas dưới 32 KB. Loại ảnh nền/cảnh vật chi tiết khỏi bản tải; vẽ nền và vật cản một lần từ dữ liệu gameplay rồi tái sử dụng. Giới hạn vẽ 30 FPS, minimap khoảng 5 lần/giây, giảm blur/glow và gradient động. Dữ liệu ảnh giảm khoảng 99,1% so với bộ ảnh 2,06 MB; bố cục và các thao tác mobile vẫn được giữ.

**Mục lục nhanh:**

- [Mục tiêu và phạm vi phiên bản](#1-mục-tiêu-sản-phẩm).
- [Thế giới, nhân vật và môn phái](#4-thế-giới-và-nội-dung-ban-đầu).
- [Chiến đấu, quái và boss](#7-di-chuyển-và-chiến-đấu).
- [Lên cấp và nhiệm vụ](#9-lên-cấp-nhiệm-vụ-và-nhịp-tiến-triển).
- [Trang bị, loot và cường hóa](#10-trang-bị-rớt-đồ-và-túi-đồ).
- [Phụ bản và tổ đội](#12-phụ-bản-và-hoạt-động-pve).
- [Bang hội và kinh tế](#14-bang-hội).
- [Giao diện, đồ họa và hoạt ảnh 2D](#16-uiux-và-khả-năng-tiếp-cận).
- [Kiến trúc, networking và dữ liệu](#18-kiến-trúc-kỹ-thuật-đề-xuất).
- [Vận hành, hiệu năng và kiểm thử](#24-triển-khai-vận-hành-và-cấu-hình).
- [Lộ trình triển khai và backlog](#27-lộ-trình-triển-khai-chi-tiết).
- [Tiêu chí hoàn thành và nghiệm thu](#29-definition-of-done).

## 1. Mục tiêu sản phẩm

Xây dựng game nhập vai kiếm hiệp chơi ngay trên trình duyệt. Người chơi tạo nhân vật, gia nhập môn phái, học võ công và tuyệt chiêu, đánh quái lên cấp, nhặt trang bị, cường hóa, vượt phụ bản, khiêu chiến boss và tham gia bang hội.

Cảm giác hướng tới: hành trình từ tân thủ đến cao thủ, có mục tiêu nâng cấp rõ ràng mỗi lần chơi, có đồ để săn và có đồng đội để cùng vượt thử thách. Kiếm Thế là tham chiếu về vòng chơi; tên, cốt truyện, bản đồ, đồ họa, âm thanh và nội dung của dự án được xây dựng riêng.

### 1.1. Những yêu cầu đã chốt

- Nền tảng web, mở trình duyệt là chơi; desktop là mục tiêu đầu tiên.
- Nhân vật 2D chuyển động đơn giản, nhìn rõ vị trí và hành động.
- Có môn phái và bộ kỹ năng khác nhau, bao gồm tuyệt chiêu.
- Có quái thường, tinh anh, boss, XP và cấp độ.
- Có rớt đồ dưới đất, nhặt đồ, túi đồ, mặc trang bị và cường hóa.
- Có nhiều dạng phụ bản, phần thưởng và cơ chế boss riêng.
- Có bang hội, thành viên, đóng góp và nội dung cùng chơi.

### 1.2. Giả định thiết kế để bắt đầu

- PvE là trọng tâm. PvP, công thành và giao dịch tự do là giai đoạn mở rộng.
- Một nhân vật do người chơi điều khiển; chưa làm hệ đồng đội AI hoặc pet chiến đấu.
- Góc nhìn từ trên xuống, bản đồ tile 2D vuông; chưa làm bản đồ isometric.
- Điều khiển chủ động bằng bàn phím/chuột; chưa có auto đánh hay auto cày khi offline.
- Online quy mô nhỏ: một khu vực có khoảng 20–50 người; tổ đội tối đa 4 người.
- Một máy chủ/khu vực hoạt động trước; chưa chia nhiều cụm máy chủ hoặc liên server.
- Kiến trúc hỗ trợ nhiều người chơi ngay từ bản online, nhưng bản thử chiến đấu đầu tiên có thể chạy cục bộ.
- Chưa thu tiền trong MVP. Không cần hệ nạp tiền để chứng minh game chơi được.
- Các con số trong tài liệu là cấu hình khởi đầu để playtest, không phải cân bằng đã được xác nhận.

### 1.3. Tiêu chuẩn thành công

- Người mới hiểu di chuyển, đánh quái, nhặt và mặc đồ trong 10 phút đầu.
- Sau 20–30 phút, người chơi đã thấy cấp tăng, trang bị tốt hơn và một kỹ năng mới.
- Trong 30–60 phút đầu, người chơi hoàn thành một mục tiêu boss dễ.
- Phiên chơi 15–30 phút có ít nhất một mục tiêu hoàn tất và một mục tiêu tiếp theo rõ ràng.
- Môn phái khác nhau về cách đánh, không chỉ đổi màu hiệu ứng.
- Cái chết, mất kết nối hoặc tải lại trang không tạo mất đồ, nhân đôi đồ hay mất tiến trình đã lưu.
- Online MVP chạy được vòng chơi có lưu dữ liệu; bản V1 hoàn tất các hệ thống người dùng yêu cầu, kể cả bang hội.

## 2. Phạm vi theo phiên bản

| Hệ thống | Bản thử chiến đấu | MVP online 1 | MVP online 2 | V1 đủ tính năng chính |
| --- | --- | --- | --- | --- |
| Mục tiêu | Chứng minh cảm giác chơi | Chơi solo có lưu dữ liệu | Chơi cùng bạn | Hành trình kiếm hiệp đầy đủ ban đầu |
| Nhân vật | 1 nhân vật tạm | Tài khoản, tối đa 3 nhân vật | Giữ nguyên | Thêm tùy biến ngoại hình cơ bản |
| Cấp tối đa | 10 | 30 | 30 | 60 |
| Môn phái | 1 | 3 | 3 | 5 |
| Bản đồ | 1 sân thử | 1 thị trấn + 3 bãi quái | Giữ nguyên | 2 thị trấn + 6 bãi quái |
| Kỹ năng | Đánh thường + 2 chiêu | 6 kỹ năng/môn phái | Giữ nguyên | 8 kỹ năng/môn phái |
| Trang bị | Vũ khí, áo; đồ thử | 8 ô, 4 phẩm chất | Giữ nguyên | 5 phẩm chất, bộ trang bị giới hạn |
| Cường hóa | Chưa có | +0 đến +10 | Giữ nguyên | +0 đến +15 |
| Phụ bản | 1 boss thử trong sân | 2 phụ bản solo | 2 solo + 2 tổ đội | 6 phụ bản thường + 1 hoạt động tuần |
| Boss | 1 boss thử | 2 boss phụ bản + 1 boss vùng | Thêm 2 boss tổ đội | 3 boss thế giới + boss của 6 phụ bản và hoạt động tuần |
| Nhiệm vụ | Tutorial ngắn | Tuyến chính cấp 1–30 | Thêm nhiệm vụ tổ đội | Tuyến chính 1–60, ngày, tuần, bang |
| Online | Chạy cục bộ | Nhìn thấy người khác, chat; chiến đấu solo | Tổ đội 2–4 người | Bang hội và hoạt động chung |
| Bang hội | Chưa có | Chưa có | Chưa có | Tạo, gia nhập, quản lý, đóng góp, boss bang |
| PvP/giao dịch tự do | Chưa có | Chưa có | Chưa có | Vẫn là mở rộng sau V1 |

Quy ước đếm: thị trấn và bãi quái là bản đồ công cộng; phụ bản là instance riêng, không cộng vào số bản đồ công cộng. Boss phụ bản, boss vùng và boss thế giới là nhóm nội dung riêng.

MVP online 1 và 2 là mốc kiểm chứng giữa đường. Hoàn thành MVP chưa có nghĩa đã hoàn thành yêu cầu bang hội; chỉ bàn giao đầy đủ phạm vi chính ở V1.

### 2.1. Ngoài phạm vi V1

- Thế giới liền mạch hàng nghìn người hoặc một trận công thành hàng trăm nhân vật.
- Giao dịch trực tiếp, chợ người chơi, đấu giá và chuyển vàng giữa tài khoản.
- Pet, thú cưỡi có chỉ số, hôn nhân, nhà ở, nghề chế tạo, hệ kinh mạch phức tạp.
- Auto farm offline, bot hợp lệ, phát triển native app.
- Voice chat, video, cắt cảnh dài, hệ thời tiết ảnh hưởng chiến đấu.
- Chuyển môn phái hoặc hợp nhất máy chủ.

## 3. Vòng chơi cốt lõi

### 3.1. Trong một phiên chơi

1. Đăng nhập, chọn nhân vật, xuất hiện tại điểm hồi sinh hợp lệ.
2. Nhận nhiệm vụ hoặc chọn mục tiêu: lên cấp, săn một món đồ, kiếm nguyên liệu, vượt boss.
3. Tới bãi quái/phụ bản phù hợp cấp và sức mạnh.
4. Di chuyển, sử dụng chiêu, né đòn báo trước, đánh bại mục tiêu.
5. Nhận XP và tiền; đồ/nguyên liệu xuất hiện để nhặt.
6. So sánh trang bị mới, mặc đồ, bán đồ không cần, giữ nguyên liệu.
7. Học/nâng chiêu hoặc cường hóa trang bị.
8. Thử nội dung khó hơn; khi mở tổ đội/bang hội, cùng người khác hoàn thành mục tiêu chung.

### 3.2. Mục tiêu dài hạn

- Hoàn thành tuyến cốt truyện và chạm cấp tối đa.
- Mở toàn bộ chiêu của môn phái; chọn một hướng xây dựng nhân vật.
- Săn trang bị đúng chỉ số, nâng một bộ dùng được cho boss khó.
- Vượt mỗi phụ bản và các mức khó được mở.
- Đóng góp bang, cùng bang đánh boss tuần, đạt thành tựu PvE.

### 3.3. Vòng chơi mẫu cần triển khai trước

Tạo nhân vật → nói chuyện NPC → di chuyển tới bãi quái → đánh 5 quái → lên cấp → nhặt kiếm tốt hơn → mặc kiếm → nhận chiêu mới → đánh boss nhỏ → nhận thưởng → tải lại trang và giữ tiến trình.

Đây là đường nghiệm thu xuyên suốt. Mọi hệ thống nền phải hỗ trợ được đường này trước khi mở rộng số lượng nội dung.

## 4. Thế giới và nội dung ban đầu

### 4.1. Cốt truyện khung

Người chơi bắt đầu tại Thanh Khê Trấn sau một cuộc phục kích đoàn thương nhân. Những dấu vết dẫn tới Hắc Liên Hội và các di tích chứa bí kíp thất truyền. Qua việc giúp dân, gia nhập môn phái và vượt phụ bản, người chơi tìm ra kế hoạch thu thập các mảnh Thiên Cơ Lệnh.

Cốt truyện chia chương theo cấp. Mỗi chương có một bãi quái chính, một mối đe dọa, phần thưởng phát triển nhân vật và nhiệm vụ kết chương bằng boss/phụ bản.

### 4.2. Bản đồ công cộng

| Bản đồ | Cấp khuyến nghị | Chức năng | Bản phát hành |
| --- | --- | --- | --- |
| Thanh Khê Trấn | 1–30 | Hồi sinh, NPC, cửa hàng, thợ rèn, bảng nhiệm vụ, cổng phụ bản | MVP 1 |
| Rừng Trúc | 1–10 | Tutorial, quái cận chiến, học nhặt đồ và né đòn | MVP 1 |
| Cổ Mộ Ngoại Vi | 11–20 | Quái độc, quái đánh xa, tinh anh tuần tra | MVP 1 |
| Hắc Phong Sơn | 21–30 | Quái theo nhóm, boss vùng, nguyên liệu cường hóa | MVP 1 |
| Lạc Dương Thành | 31–60 | Trung tâm giai đoạn sau, bang hội và trang bị cao cấp | V1 |
| Hàn Tuyết Cốc | 31–40 | Chậm tốc, băng trận và boss thế giới | V1 |
| Xích Sa Hoang Mạc | 41–50 | Quái nhanh, sát thương vùng, mục tiêu tinh anh | V1 |
| Thiên Cơ Cấm Địa | 51–60 | Quái phối hợp, nguyên liệu hiếm, cổng nội dung cuối | V1 |

- Kích thước thử: thị trấn 64×64 tile; bãi quái 96×96 đến 128×128 tile.
- Tile mặc định 32×32 pixel, 1 đơn vị logic = 1 tile.
- Bản đồ gồm lớp nền, trang trí, vật cản, khu an toàn, vùng sinh quái, cổng chuyển map, điểm hồi sinh.
- Không cần tải toàn bộ map thế giới cùng lúc; preload map sắp tới và tài nguyên dùng chung.
- Map công cộng mở thêm channel khi đầy; người trong cùng party/bang có thể chọn channel giống nhau nếu còn chỗ.

### 4.3. NPC cần có

- Người hướng dẫn tân thủ: tutorial và chuỗi nhiệm vụ đầu.
- Sứ giả môn phái: chọn phái, xem vai trò và thử chiêu trước khi chọn.
- Truyền công sư: học và nâng cấp võ công.
- Thợ rèn: cường hóa, xem nguyên liệu/tỷ lệ/chi phí.
- Thương nhân: mua bình HP/MP, bán trang bị không cần.
- Người coi kho: kho cá nhân từ MVP 2.
- Quản sự phụ bản: danh sách, yêu cầu vào, tổ đội và số lượt còn lại.
- Bang hội sứ giả: mở ở V1, tạo/tìm/gia nhập bang.

## 5. Tài khoản và nhân vật

### 5.1. Tạo nhân vật

- Mỗi tài khoản có tối đa 3 nhân vật trong V1.
- Tên 3–16 ký tự, hỗ trợ chữ tiếng Việt, số và khoảng trắng hợp lệ; kiểm tra Unicode nhất quán.
- Chọn một trong vài sprite/avatar có sẵn; ngoại hình ban đầu không ảnh hưởng chỉ số.
- Mọi nhân vật bắt đầu cấp 1, chưa gia nhập phái.
- Được phát vũ khí tân thủ trung tính dùng trước cấp 5; khi vào phái nhận vũ khí đúng loại để không bị kẹt vì chưa săn được đồ.
- Cấp 5 mở chọn phái; có mô tả vai trò và phòng thử kỹ năng tạm.
- Chọn phái lần đầu không tốn phí; hiển thị xác nhận vì V1 chưa có đổi phái.
- Có một ô lưu vị trí; nếu vị trí không hợp lệ sau cập nhật, trả về thị trấn tương ứng.

### 5.2. Chỉ số

| Chỉ số | Công dụng | Ghi chú |
| --- | --- | --- |
| HP tối đa | Sức sống | Không xuống dưới 0 |
| MP tối đa | Tài nguyên thi triển chiêu | Một số chiêu dùng thêm nộ |
| Công lực | Đầu vào sát thương | Một chỉ số tấn công chính trong MVP |
| Phòng ngự | Giảm sát thương trực tiếp | Không đạt miễn nhiễm tuyệt đối |
| Chí mạng | Xác suất tăng sát thương | Giới hạn cấu hình 50% trong V1 |
| Sát thương chí mạng | Hệ số khi chí mạng | Mặc định 150%, trần ban đầu 250% |
| Tốc đánh | Tần suất đánh thường | Trần để bảo đảm hoạt ảnh và server xử lý được |
| Tốc chạy | Di chuyển và né vùng đánh | Không tích lũy vô hạn |
| Kháng hiệu ứng | Giảm thời gian khống chế | Không bỏ qua mọi cơ chế boss |
| Ngũ hành | Danh tính phái, tương tác giai đoạn sau | Chưa bật tương khắc trong MVP chỉ có 3 phái |

V1 không cần thêm hàng chục chỉ số như né tránh, chính xác, xuyên giáp, hút máu và nhiều loại công lực ngay từ đầu. Có thể bổ sung sau khi các chỉ số cơ bản đã có vai trò rõ.

### 5.3. Công thức nền để làm prototype

Với cấp `L`, trước trang bị và nội tại:

```text
HP nền        = 160 + 35 × (L - 1)
MP nền        = 80 + 12 × (L - 1)
Công lực nền  = 14 + 3 × (L - 1)
Phòng ngự nền = 6 + 2 × (L - 1)
```

- Môn phái có hệ số riêng: phái đỡ đòn tăng HP, phái sát thương tăng công, phái hỗ trợ tăng MP.
- Chỉ số tổng = chỉ số nền theo phái + trang bị + nội tại + buff hợp lệ.
- Các phần trăm áp dụng theo nhóm cộng/nhân đã định nghĩa; không tùy ý chồng phép nhân.
- Sức mạnh hiển thị chỉ là ước lượng hướng dẫn, không là điều kiện duy nhất để vào nội dung.
- Tất cả công thức nằm trong cấu hình/simulation và có test mẫu tại cấp 1, 10, 30, 60.

### 5.4. Chết và hồi sinh

- Chết ngoài thế giới: chọn hồi sinh tại thị trấn/điểm gần nhất; chưa rớt hoặc mất đồ.
- MVP không trừ XP, không tụt cấp, không làm hỏng trang bị.
- Trong phụ bản: số lần hồi sinh và xử lý cả đội chết tùy loại phụ bản.
- Có miễn nhiễm ngắn 2 giây sau hồi sinh, kết thúc sớm khi tấn công; không áp dụng để bỏ qua cơ chế phụ bản.
- Mất kết nối không đồng nghĩa chết hoặc thoát mọi sát thương; server tiếp tục xử lý theo chính sách ở phần networking.

## 6. Môn phái, võ công và tuyệt chiêu

### 6.1. Năm môn phái dự kiến

| Phái | Hành | Vũ khí/đặc điểm | Vai trò | Mở ở |
| --- | --- | --- | --- | --- |
| Kim Phong | Kim | Kiếm, áp sát, lướt ngắn | Cận chiến, bền, đánh đơn mục tiêu | MVP 1 |
| Xích Diệm | Hỏa | Pháp trượng, hỏa trận | Đánh xa, sát thương vùng, cần giữ khoảng cách | MVP 1 |
| Huyền Thủy | Thủy | Phiến, thủy pháp | Hồi phục, làm chậm, vẫn tự đánh quái được | MVP 1 |
| Thanh Mộc | Mộc | Cung, độc và bẫy | Đánh xa, sát thương theo thời gian | V1 |
| Thổ Sơn | Thổ | Thương/khiên, chắn đòn | Đỡ đòn, giữ quái, bảo vệ tổ đội | V1 |

- MVP phải cho cả 3 phái vượt các nhiệm vụ solo; Huyền Thủy không phụ thuộc tổ đội để lên cấp.
- Tổ đội 4 người không bắt buộc đúng một healer/một tank, nhưng phối hợp vai trò có lợi.
- Khi đủ 5 phái, có thể thử tương khắc `Kim → Mộc → Thổ → Thủy → Hỏa → Kim` với chênh lệch nhỏ, ví dụ +5% sát thương. Chỉ bật sau khi đánh giá mất cân bằng; không làm rào cản nội dung PvE.

### 6.2. Bộ kỹ năng mẫu

Mỗi phái có 6 kỹ năng trong MVP: đánh thường, 3 chiêu chủ động, 1 nội tại, 1 tuyệt chiêu. V1 thêm 1 chiêu chủ động và 1 nội tại; tổng 8 kỹ năng, không phải 8 nút cần bấm.

| Phái | Đánh thường | Ba chiêu chủ động MVP | Nội tại | Tuyệt chiêu |
| --- | --- | --- | --- | --- |
| Kim Phong | Kiếm Kích | Phá Giáp Trảm; Phi Kiếm Bộ; Hộ Thân Kiếm | Kiếm Tâm | Vạn Kiếm Quy Tông |
| Xích Diệm | Hỏa Đạn | Liệt Hỏa Cầu; Hỏa Trận; Diễm Thân | Dư Hỏa | Thiên Hỏa Giáng Lâm |
| Huyền Thủy | Thủy Tiễn | Hàn Băng Chưởng; Hồi Xuân; Thủy Thuẫn | Tĩnh Tâm | Băng Hà Thiên Vũ |
| Thanh Mộc | Liên Tiễn | Độc Tiễn; Mộc Bẫy; Phong Bộ | Tích Độc | Vạn Tiễn Phong Lâm |
| Thổ Sơn | Thương Kích | Chấn Địa; Khiêu Chiến; Sơn Thuẫn | Bất Động | Địa Long Hộ Trận |

Mỗi chiêu cần mô tả: phạm vi, kiểu mục tiêu, sát thương/hồi phục, MP, thời gian thi triển, cooldown, hiệu ứng trạng thái, hoạt ảnh, khả năng bị ngắt và tương tác boss.

### 6.3. Lịch mở chiêu và nâng chiêu

- Cấp 1: đánh thường tân thủ.
- Cấp 5: gia nhập phái, thay đánh thường và mở chiêu chủ động thứ nhất.
- Cấp 10: chiêu chủ động thứ hai.
- Cấp 15: nội tại thứ nhất.
- Cấp 20: chiêu chủ động thứ ba.
- Cấp 25: chuỗi nhiệm vụ thử thách để học tuyệt chiêu.
- Cấp 35: chiêu chủ động thứ tư ở V1.
- Cấp 45: nội tại thứ hai ở V1.
- Từ cấp 6, mỗi lần lên cấp nhận 1 điểm võ học; điểm dư được giữ lại.
- Kỹ năng có tối đa 5 bậc; bậc đánh thường không tốn điểm. Mỗi lần tăng bậc chủ động/nội tại tốn 1 điểm và lượng bạc nhỏ.
- Bậc 1 mở bởi nhiệm vụ/cấp, bậc cao có yêu cầu cấp; không thể nâng vượt mức server cho phép.
- Cho reset điểm tại NPC: lần đầu miễn phí, các lần sau tốn bạc theo cấp. Không mất chiêu đã mở.

### 6.4. Tuyệt chiêu

- Cần đủ 100 nộ; nộ tăng qua hành động chiến đấu hợp lệ, có cooldown riêng 60–90 giây tùy phái.
- Mặc định: gây sát thương cho kẻ địch phù hợp cấp +4 nộ/giây tối đa; nhận sát thương +2/giây; hồi HP thực cho đồng đội đang chiến đấu +4/giây. Tổng tăng tối đa 6 nộ/giây.
- Đánh vật thể hoặc hồi phần HP không thiếu không tạo nộ.
- Sau 15 giây không giao chiến, nộ giảm dần để tránh tích vô hạn giữa các lần vào boss.
- Thi triển phải có tín hiệu rõ, đủ mạnh và có khoảng trống để boss phản ứng; không phủ kín màn hình.
- Không tạo hiệu ứng rung/nháy mạnh bắt buộc; có tùy chọn giảm hiệu ứng.

### 6.5. Ràng buộc thiết kế kỹ năng

- Chiêu cơ bản phải dễ đọc, phát động nhanh, cooldown thường 3–12 giây.
- Không cho khóa cứng boss bằng choáng liên tục; boss có kháng hoặc giới hạn thời gian khống chế riêng.
- DOT/HOT ghi rõ số tick và quy tắc cộng dồn; ví dụ tối đa 3 lớp độc cùng nguồn, thay nguồn theo chính sách cấu hình.
- Hồi phục tính lượng HP thực hồi, không cộng đóng góp vì spam vào người đầy máu.
- Dùng chung global cooldown thử 0,35 giây; đánh thường có interval riêng, không khóa người chơi lâu.
- Thanh hotbar 6 ô cho kỹ năng chủ động, đánh thường theo chuột; nội tại hiển thị riêng.

## 7. Di chuyển và chiến đấu

### 7.1. Điều khiển

| Thao tác | Điều khiển mặc định |
| --- | --- |
| Di chuyển | WASD hoặc phím mũi tên |
| Chọn mục tiêu/đánh thường | Chuột trái vào quái |
| Dùng chiêu | 1–6; click ô kỹ năng khi cần |
| Đổi mục tiêu gần | Tab |
| Nhặt đồ/tương tác NPC/cổng | F khi đủ gần |
| Bình HP / MP | Q / E |
| Túi / nhân vật / võ công | B / C / K |
| Nhiệm vụ / bản đồ / bang | J / M / G |
| Chat | Enter |
| Đóng cửa sổ, hủy thao tác | Esc |

- Click-to-move là mở rộng sau khi WASD ổn định; chưa cần pathfinding cho người chơi trong MVP.
- Khi đang gõ chat hoặc ở input, các phím tắt gameplay không kích hoạt.
- Không cho đi xuyên tile chắn; đi chéo chuẩn hóa tốc độ.
- Vị trí logic dùng đơn vị world/tile; pixel chỉ dùng cho hiển thị.
- Chiêu đánh trúng dựa trên hình học và trạng thái server, không dựa vào frame client hay sprite nhìn có chạm nhau hay không.

### 7.2. Công thức sát thương khởi đầu

```text
Sát thương thô = Công lực × Hệ số chiêu + Sát thương cộng thêm
K             = 80 + 12 × Cấp người tấn công
Giảm bởi giáp = Phòng ngự mục tiêu / (Phòng ngự mục tiêu + K)
Sát thương    = max(1, floor(Sát thương thô × (1 - Giảm bởi giáp)))
Nếu chí mạng: nhân hệ số chí mạng, rồi làm tròn xuống
```

- Sau giáp, áp dụng buff/debuff và kháng theo thứ tự cố định được test.
- Chiêu đỡ đòn/miễn nhiễm có thể tạo 0 sát thương rõ ràng; `max(1, ...)` chỉ cho đòn thường hợp lệ không bị miễn nhiễm.
- Server quyết định hit, chí mạng, sát thương, HP, chết, phần thưởng và RNG.
- MVP không cần cơ chế miss ngẫu nhiên; người chơi né bằng vị trí và tránh telegraph.
- PvP sau này có hệ số riêng, không sửa toàn bộ cân bằng PvE để phù hợp đấu trường.

### 7.3. Hình học và vùng đánh

- Circle: sát thương quanh vị trí/mục tiêu.
- Cone: quét hình quạt trước mặt nhân vật.
- Line: đường chém hoặc projectile có bán kính.
- Target: chiêu cần một entity còn sống, trong tầm và có đường nhìn.
- Ground: đặt vùng đánh tại tọa độ world hợp lệ.
- AOE không xuyên tường trừ khi nội dung đánh dấu rõ.
- Projectile cập nhật ở server; client vẽ hiệu ứng và sửa theo kết quả xác nhận.
- Di chuyển lướt phải kiểm tra từng đoạn đường hoặc collision sweep để không vượt vật cản.

### 7.4. Hiệu ứng trạng thái

- Hỗ trợ đầu tiên: làm chậm, choáng ngắn, độc, cháy, hồi phục theo thời gian, khiên.
- Mỗi hiệu ứng có nguồn, thời điểm bắt đầu/kết thúc, số lớp, nhóm cộng dồn, quy tắc refresh và dispel.
- Boss nhận khống chế theo hệ số; không cho chồng choáng làm mất toàn bộ trận đánh.
- Có icon và thời gian còn lại; trạng thái gây mất điều khiển có dấu hiệu trực quan.
- Loại bỏ hiệu ứng đúng lúc chuyển map/chết/hồi sinh theo cấu hình; không mặc định mọi buff sống mãi.

### 7.5. AI quái

```text
Idle → Patrol → AcquireTarget → Chase → Attack → ReturnHome
                                  ↘ Telegraph → Cast ↗
Bất kỳ trạng thái còn sống → Dead → Chờ respawn
```

- Quái có phạm vi phát hiện, phạm vi truy đuổi, vị trí nhà và cooldown riêng.
- Vượt leash: quay về, mất aggro, hồi HP; không cho kéo boss về thị trấn.
- Quái cận chiến tìm đường trên grid; quái xa giữ khoảng cách hợp lý.
- Tránh chạy pathfinding đầy đủ cho mọi quái mỗi tick; cache đường và tính lại khi bị chắn/mục tiêu đổi đáng kể.
- Threat ban đầu dựa trên sát thương, hồi HP thực và kỹ năng khiêu chiến; hệ số healer/tank được cấu hình.
- Thị trấn là khu an toàn, không sinh quái; cổng được bố trí tránh camp điểm xuất hiện.

### 7.6. Các loại quái cần có

| Nhóm | Hành vi | Mục tiêu thiết kế |
| --- | --- | --- |
| Thường cận chiến | Đuổi và đánh đơn giản | Học đánh, lên cấp |
| Thường đánh xa | Bắn có nhịp, giữ khoảng cách | Học áp sát/đổi mục tiêu |
| Quái độc/thiêu đốt | DOT dễ nhận biết | Học bình hồi và thoát vùng |
| Tinh anh | Nhiều HP, 1–2 chiêu báo trước | Mục tiêu săn đồ nhỏ |
| Hỗ trợ quái | Hồi/buff đồng minh | Ưu tiên mục tiêu |
| Boss | Nhiều phase, telegraph, phần thưởng riêng | Kiểm tra kỹ năng và phối hợp |

MVP 1 có ít nhất 12 định nghĩa quái thường, 3 tinh anh và 3 định nghĩa boss đúng phạm vi. Có thể dùng chung sprite, nhưng hành vi/phần thưởng phải phù hợp khu vực.

## 8. Boss và độ khó

### 8.1. Nguyên tắc

- Người chơi nhìn được đòn nguy hiểm trước khi sát thương xảy ra.
- Telegraph phổ biến 0,8–1,5 giây, được điều chỉnh theo độ trễ mục tiêu; chiêu nhẹ có thể nhanh hơn.
- Boss khó hơn bằng cơ chế, vị trí và phối hợp, không chỉ tăng HP.
- Không yêu cầu animation 60 frame để né được; hình tròn/quạt/đường cảnh báo đã đủ.
- Khi đổi phase phải có tín hiệu; chết do cơ chế phải giải thích được trong combat log ngắn.
- Mỗi boss có đồ đặc trưng và nguyên liệu đúng cấp.

### 8.2. Ba boss đầu tiên của MVP 1

| Boss | Nội dung | Cơ chế chính | Kỹ năng người chơi học |
| --- | --- | --- | --- |
| Lang Vương | Boss cuối Trúc Lâm Thí Luyện | Lao theo đường thẳng, gọi 2 sói con | Né đường đánh, đổi mục tiêu |
| Cổ Mộ Thủ Vệ | Boss cuối Cổ Mộ Bí Ẩn | Quét quạt, ô đất độc, lộ lõi ở phase 2 | Giữ vị trí, dùng chiêu lúc có cơ hội |
| Hắc Phong Trại Chủ | Boss vùng cấp 28–30 | Đập vòng tròn, cuồng nộ khi thấp HP | Kiểm tra trang bị và sử dụng phòng thủ |

Boss vùng MVP 1 là encounter riêng cho một người hoặc một party được hỗ trợ sau đó; chưa dùng chia thưởng toàn bản đồ. Hệ boss thế giới nhiều nhóm là nội dung V1 riêng.

### 8.3. Boss thế giới V1

- Ba boss ở Hàn Tuyết Cốc, Xích Sa Hoang Mạc, Thiên Cơ Cấm Địa.
- Thử lịch 2 giờ/lần trong khoảng hoạt động công bố; thông báo trước 10 phút, cho xem giờ địa phương.
- Chỉ spawn trên channel sự kiện được quản lý; không nhân quà bằng đổi channel.
- Snapshot danh sách người tham gia trước khi boss chết; đánh giá đóng góp và thời gian hoạt động.
- Đóng góp tính cả sát thương, hồi HP thực, đỡ sát thương và thực hiện cơ chế; không chỉ xếp hạng DPS.
- Người đủ điều kiện nhận thưởng cá nhân; không độc quyền cho người đánh phát cuối.
- Mỗi tài khoản có giới hạn phần thưởng chính theo boss/ngày, lưu server; nhân vật khác không lách hạn mức.
- Có phần thưởng tham gia nhỏ cho người đạt ngưỡng tối thiểu; người đứng AFK không nhận quà chính.
- Không hardcode ngưỡng trước playtest; đo và thử cách để phái hỗ trợ có quyền nhận thưởng công bằng.

## 9. Lên cấp, nhiệm vụ và nhịp tiến triển

### 9.1. XP

```text
XP cần từ cấp L lên L+1 = floor(100 + 35 × L + 8 × L²)
```

Ví dụ: cấp 1 cần 143 XP; cấp 10 cần 1.250 XP; cấp 20 cần 4.000 XP; cấp 29 cần 7.843 XP. Ở cấp tối đa, XP hiện tại không tiếp tục tạo level ngoài phạm vi cấu hình.

- XP từ quái, tinh anh, boss và nhiệm vụ; không chỉ từ cày quái thường.
- Phần thưởng XP theo định nghĩa quái, chênh lệch cấp và đóng góp hợp lệ.
- Đánh quái thấp hơn nhiều cấp giảm XP/tiền; tránh cày map tân thủ bằng nhân vật mạnh.
- Giết quái vượt cấp không cấp XP vô hạn; có trần bonus và hạn chế power leveling.
- Khi đủ XP, xử lý nhiều lần lên cấp trong một giao dịch logic, giữ phần XP dư.
- Level tăng cập nhật chỉ số, cấp kỹ năng mở được và phần thưởng mốc đúng một lần.
- Cấp 1–10 mục tiêu 30–60 phút; 1–30 khoảng 6–10 giờ; 30–60 khoảng 25–40 giờ. Phải xác nhận qua playtest và điều chỉnh XP/quái/nhiệm vụ cùng nhau.

### 9.2. Loại nhiệm vụ

- Chính tuyến: giới thiệu bản đồ, phái, hệ thống và dẫn tới boss.
- Môn phái: học chiêu, mở tuyệt chiêu, thử thách riêng theo lối đánh.
- Phụ tuyến: săn tinh anh, tìm vật phẩm, khám phá khu vực.
- Ngày: 3 mục tiêu ngắn để khuyến khích quay lại, không bắt người chơi làm hàng giờ.
- Tuần: một phụ bản/boss bang hoặc chuỗi dài hơn.
- Bang: hoàn thành theo đóng góp chung, tránh bắt buộc online cùng lúc cho mọi việc.

### 9.3. Định dạng nhiệm vụ

Mỗi nhiệm vụ có ID ổn định, điều kiện nhận, bước mục tiêu, NPC giao/trả, phần thưởng, điều kiện lặp, khóa mở tính năng và văn bản hướng dẫn.

Các mục tiêu hỗ trợ: `talk`, `kill`, `collect`, `reach_area`, `equip_item`, `enhance_item`, `learn_skill`, `clear_dungeon`, `join_guild`.

- Thu thập có thể dùng quest item riêng không chiếm túi; phải phân biệt rõ với đồ thường.
- Mục tiêu dùng sự kiện server; client không gửi số quái đã giết để tự tăng.
- Phần thưởng có `claimId`/khóa duy nhất, không nhận lại khi spam request.
- Mục tiêu được chia sẻ trong party chỉ khi cấu hình cho phép và nhân vật đủ điều kiện.
- Đồ nhiệm vụ cần mặc/cường hóa phải được phát sẵn hoặc bảo đảm nhận được; không tạo điểm kẹt tiến trình.
- Tuyến cấp 1–30 dự kiến 20–30 nhiệm vụ; V1 khoảng 50–70, ưu tiên chất lượng và nhịp chơi hơn số lượng.

### 9.4. Nhiệm vụ ngày/tuần và thời gian

- Mốc reset mặc định 05:00 giờ `Asia/Ho_Chi_Minh`; chỉ dùng làm ngày logic phần thưởng.
- Lưu timestamp UTC; server tính `rewardDay`/`rewardWeek` theo timezone cấu hình, không theo máy người chơi.
- UI hiển thị thời gian theo timezone người chơi và đồng hồ đếm ngược.
- Reset không xóa lịch sử giao dịch; quota mới được tính bằng period key.
- Test qua ranh giới ngày/tuần, mất kết nối và nhiều server instance; không phát thưởng lại do restart.

## 10. Trang bị, rớt đồ và túi đồ

### 10.1. Ô trang bị

1. Vũ khí.
2. Áo.
3. Mũ.
4. Găng.
5. Giày.
6. Đai.
7. Nhẫn.
8. Hộ phù.

Mỗi slot một món; chưa có hai nhẫn, vũ khí phụ, socket ngọc hoặc bộ thời trang ảnh hưởng chỉ số trong MVP.

### 10.2. Phẩm chất

| Phẩm chất | Màu tham khảo | Thuộc tính phụ | Có từ |
| --- | --- | --- | --- |
| Thường | Xám/trắng | 0 | MVP 1 |
| Tốt | Xanh lá | 1 | MVP 1 |
| Hiếm | Xanh lam | 2 | MVP 1 |
| Cực phẩm | Tím | 3 | MVP 1 |
| Truyền thuyết | Cam | 3 + hiệu ứng riêng được kiểm soát | V1 |

- Màu đi kèm nhãn/icon, không chỉ dựa vào màu để phân biệt.
- Trang bị có yêu cầu cấp, slot, nhóm vũ khí/phái nếu cần, chỉ số chính, chỉ số phụ và cấp cường hóa.
- Phẩm chất không tự động thắng mọi món cấp cao hơn; tooltip so sánh chỉ số thực.
- Thuộc tính phụ chọn từ pool hợp lệ theo slot/phái, không roll chỉ số vô dụng ngoài pool.
- `templateId` định nghĩa loại đồ; `itemInstanceId` xác định món cụ thể, roll và lịch sử của nó.
- Cấp đồ chia theo mốc 1, 10, 20, 30, 40, 50, 60 để giới hạn số asset và nội dung ban đầu.

### 10.3. Quy tắc loot

Roll tại server khi quái chết. Các bảng dưới là độc lập: bạc/XP có thể luôn có, nguyên liệu và trang bị có lần roll riêng.

| Nguồn | Trang bị | Nguyên liệu | Lưu ý |
| --- | --- | --- | --- |
| Quái thường | 12% rớt 1 món | 20% rớt 1 stack nhỏ | Món rớt theo vùng/cấp |
| Tinh anh | 70% rớt 1 món | 100% rớt nguyên liệu | Hạn chế farm cùng một spawn quá hiệu quả |
| Boss phụ bản | 100% rớt ít nhất 1 món/nhân vật đủ điều kiện | 100% | Thưởng clear có claim riêng |
| Boss thế giới | Cá nhân theo điều kiện tham gia | Theo quota | Không dùng loot chung tranh nhặt |

Trọng số phẩm chất khi đã roll được trang bị:

| Nguồn | Thường | Tốt | Hiếm | Cực phẩm |
| --- | --- | --- | --- | --- |
| Quái thường | 65% | 28% | 6,5% | 0,5% |
| Tinh anh | 20% | 45% | 30% | 5% |
| Boss MVP | 0% | 30% | 55% | 15% |

- Mỗi hàng phẩm chất tổng 100%; đây là xác suất có điều kiện, không cộng với tỷ lệ rớt trang bị.
- Quái thường có xác suất rớt Cực phẩm thực tế `12% × 0,5% = 0,06%` mỗi kill trước modifier.
- V1 thêm bảng Truyền thuyết riêng ở nội dung cuối; không tự nhét thêm phần trăm làm hàng vượt 100%.
- Có token boss để đổi một món Hiếm cố định sau nhiều lượt, giảm tình trạng chơi mãi không có tiến triển.
- Đồ rớt, người được quyền nhận, số lượng và kết quả RNG được lưu đủ để điều tra giao dịch, không gửi seed RNG cho client.

### 10.4. Nhặt đồ

- Loot cá nhân trong MVP và V1: mỗi người chỉ nhặt phần được cấp; party không tranh phát cuối.
- Túi đồ dưới đất hiện icon, phẩm chất, nhãn ngắn; server xác nhận khoảng cách nhặt tối đa thử 1,5 tile.
- Nhấn F ưu tiên NPC/đồ theo mục tiêu gần và ngữ cảnh; có nút nhặt tất cả trong phạm vi.
- Bạc vào ví trực tiếp; đồ và nguyên liệu cần nhặt để giữ cảm giác săn đồ.
- Loot ngoài thế giới có thời hạn thử 120 giây; UI thông báo, không mất vô lý khi đang đọc tooltip.
- Thưởng chính boss/phụ bản là pending reward bền vững. Nếu túi đầy hoặc disconnect, nhận vào hộp nhận thưởng sau; không áp dụng hộp thưởng tự động cho mọi món quái thường.
- Retry pickup cùng `dropId` không tạo hai món; chuyển từ drop sang inventory là thao tác atomic/idempotent.
- MVP không cho vứt đồ để người khác nhặt; chỉ bán NPC hoặc hủy có xác nhận theo phẩm chất.

### 10.5. Túi, kho và stack

- Túi ban đầu 40 ô; stack nguyên liệu/bình tối đa 999 hoặc giá trị riêng theo template.
- Trang bị không stack; mỗi instance chiếm 1 ô.
- Bộ lọc: trang bị, nguyên liệu, tiêu hao, nhiệm vụ; sắp xếp là thao tác server xác nhận.
- Kho cá nhân MVP 2 có 60 ô/nhân vật; không cần kho chung tài khoản ngay.
- Không dùng client index đơn thuần để định danh món; mọi thao tác gửi ID ổn định và version khi cần.
- Túi đầy: nhặt bị từ chối có lý do, không biến mất drop trước khi thêm đồ thành công.
- Mặc đồ kiểm tra slot, cấp, phái, quyền sở hữu; đổi món trả đồ cũ về slot/túi theo thao tác atomic.
- Nếu cần một ô túi cho đổi đồ và không có, UI/server trả lỗi rõ hoặc swap vào đúng ô món mới; chọn một chính sách thống nhất.

### 10.6. Nội dung đồ ban đầu

- MVP 1 tối thiểu 32 template trang bị: 8 slot × 4 mốc cấp, bổ sung template vũ khí theo 3 phái.
- Bộ template mẫu gồm slot cơ bản; vũ khí mốc cấp có 3 biến thể phái, vì vậy tổng thực tế cao hơn 32.
- 3 loại bình HP, 3 loại bình MP, 2–3 loại đá cường hóa và vài vật phẩm nhiệm vụ/token.
- V1 thêm cấp 40–60, vũ khí hai phái mới, một số bộ 2/4 món có bonus rõ.
- Có bảng ngân sách chỉ số theo cấp/phẩm chất/slot, tránh nhập tay tùy hứng từng món.

## 11. Cường hóa và hướng nâng cấp

### 11.1. Quy trình

1. Tới thợ rèn hoặc mở giao diện khi ở khu vực hợp lệ.
2. Chọn trang bị đang sở hữu; hiển thị cấp hiện tại, cấp tiếp theo và phần chỉ số tăng.
3. Hiển thị bạc, nguyên liệu, tỷ lệ thành công, bảo hiểm đang có và điều kiện cấp.
4. Xác nhận một lần hoặc dùng nút lặp số lần giới hạn ở V1.
5. Server khóa món/nguồn lực, kiểm tra số dư, roll kết quả và commit giao dịch.
6. UI nhận kết quả có `requestId`, cập nhật đúng item; retry không roll lại.

### 11.2. Bảng khởi đầu

| Cấp đích | Tỷ lệ thành công cơ bản | Đá tiêu hao/lần | Bạc cơ sở/lần | Bảo hiểm thành công |
| --- | --- | --- | --- | --- |
| +1 đến +3 | 100% | 1 | 100 × cấp đích | Không cần |
| +4 đến +6 | 80% | 2 | 250 × cấp đích | Sau 2 lần thất bại liên tiếp, lần kế chắc chắn |
| +7 đến +8 | 60% | 3 | 500 × cấp đích | Sau 3 lần thất bại liên tiếp |
| +9 đến +10 | 40% | 4 | 1.000 × cấp đích | Sau 4 lần thất bại liên tiếp |
| +11 đến +12, V1 | 25% | 6 | 1.800 × cấp đích | Sau 6 lần thất bại liên tiếp |
| +13 đến +15, V1 | 15% | 8 | 3.000 × cấp đích | Sau 8 lần thất bại liên tiếp |

- Chi phí bạc thực = bạc cơ sở × hệ số cấp đồ; thử `1 + 0,02 × (itemLevel - 1)` và làm tròn.
- Đá sơ cấp dùng đồ cấp 1–30; trung/cao cấp dùng các tier sau, có cách kiếm phù hợp.
- Thất bại mất nguyên liệu và bạc đã thông báo; **không vỡ đồ, không tụt cấp** trong V1.
- Bộ đếm bảo hiểm lưu theo item và cấp đích; chỉ reset khi nâng thành công hoặc chuyển hợp lệ sang mục tiêu khác.
- Khi số lần thất bại liên tiếp đạt ngưỡng bảng, lần kế tiếp có tỷ lệ 100%; không cần trả thêm phí để kích hoạt bảo hiểm.
- Không mua tỷ lệ hoặc vật phẩm bảo vệ bằng tiền thật trong phạm vi hiện tại.
- Cấp cường hóa tối đa có thể thấp hơn trần hệ thống với đồ tân thủ; thể hiện trong template.

### 11.3. Chỉ số từ cường hóa

```text
Chỉ số chính sau cường hóa = Chỉ số chính gốc × (1 + 0,04 × cấp cường hóa)
```

- +10 tăng 40% chỉ số chính của món, +15 tăng 60%; không tăng mọi chỉ số nhân vật 40%/60%.
- Không nhân phần trăm lên thuộc tính phụ rồi tiếp tục nhân lại lên tổng stat.
- Vũ khí tăng công lực; áo tăng HP/phòng ngự theo nhóm chỉ số chính khai báo.
- Hiệu ứng ngoại hình thử +5 sáng nhẹ, +10 viền riêng, +15 hào quang nhỏ; có nút giảm hiệu ứng.

### 11.4. Tránh buộc người chơi nâng lại từ đầu

- V1 hỗ trợ kế thừa cường hóa giữa món cùng slot và tier cấp hợp lệ.
- Quy tắc ban đầu: chuyển mức `max(0, cấp cũ - 2)`, tiêu hao bạc và vật liệu chuyển; món nguồn trở về +0, không sao chép cường hóa.
- Đồ đích phải +0, thuộc quyền sở hữu, tier chênh tối đa 1; UI cho xem kết quả cả hai món trước xác nhận.
- Kế thừa là một giao dịch khóa cả hai item và ví; không copy bộ đếm pity từ món cũ.
- MVP 1 chưa có kế thừa: nhiệm vụ cung cấp đá đủ để thử, không ép nâng sâu đồ cấp thấp.

## 12. Phụ bản và hoạt động PvE

### 12.1. Các phụ bản

| Tên | Cấp | Quy mô | Thời lượng mục tiêu | Điểm khác biệt | Mở ở |
| --- | --- | --- | --- | --- | --- |
| Trúc Lâm Thí Luyện | 8+ | Solo | 5–8 phút | Quái theo đợt, Lang Vương, học né | MVP 1 |
| Cổ Mộ Bí Ẩn | 18+ | Solo | 10–15 phút | Phòng nối nhau, bẫy đất, Thủ Vệ | MVP 1 |
| Hắc Phong Sơn Trại | 25+ | 2–4 người | 12–18 phút | Quái hỗ trợ, chia mục tiêu, boss riêng Sơn Trại Đại Đầu Lĩnh | MVP 2 |
| Hàn Băng Động | 30+ | 2–4 người | 15–20 phút | Đóng băng và phá trụ để mở cửa | MVP 2 |
| Xích Diệm Địa Cung | 45+ | 2–4 người | 15–25 phút | Vùng nhiệt luân phiên, thời điểm an toàn | V1 |
| Thiên Cơ Bí Cảnh | 55+ | 2–4 người | 20–25 phút | Cơ chế tương tác, nhiều phase boss | V1 |
| Võ Lâm Thử Thách | 60 | 1–4 người | 15–25 phút | Đợt quái tuần, modifier công bố, bảng xếp hạng PvE | V1, hoạt động tuần |

Hàn Băng Động mở ở MVP 2 với cap 30 nên người chơi cấp 30 vẫn vào được. Khi cap tăng, đây là phụ bản đầu của chương tiếp theo, không tự tăng cấp quái theo người chơi mạnh nhất.

### 12.2. Dạng chơi

- Dọn quái tới boss: cấu trúc cơ bản, map tuyến tính ngắn.
- Sinh tồn theo đợt: tăng nhóm quái, nghỉ ngắn giữa đợt.
- Hộ tống NPC: mở sau MVP 2 nếu AI hộ tống đủ ổn; không bắt buộc V1.
- Boss cơ chế: né đòn, phá vật thể, chuyển mục tiêu, bảo vệ người mang dấu ấn.
- Thử thách tuần: nội dung có modifier cố định theo tuần, tránh random bất lợi không báo trước.

### 12.3. Điều kiện vào và phần thưởng

- Kiểm tra cấp, nhiệm vụ mở khóa, party và trạng thái chiến đấu.
- Hiển thị cấp/sức mạnh khuyến nghị; chỉ cấp/nhiệm vụ là hard gate ban đầu.
- Solo/party instance có quyền riêng; không teleport vào instance chỉ vì đoán được ID.
- Thử 3 lượt thưởng chính/ngày cho từng phụ bản; có thể vào lại hỗ trợ bạn với quà thấp hoặc không quà chính, UI nêu rõ.
- Quota chỉ trừ khi nhận thưởng hoàn thành, không trừ chỉ vì bị disconnect lúc vào.
- Chỉ một run đủ quyền claim có thể dùng một lượt quota; locking ngăn hai instance cùng nhận vượt hạn mức.
- Thưởng phụ bản gồm XP, bạc, đá, token và đồ; quest clear nhận riêng nhưng không phát lại khi claim bị retry.
- Normal có trước; Hard cho một số phụ bản ở V1, cần khác ít nhất một cơ chế/phần thưởng, không chỉ đổi HP.

### 12.4. Vòng đời instance

```text
Created → WaitingForPlayers → Running → BossDefeated → RewardClaimable → Closed
                              ↘ Failed / Abandoned → Closed
```

- Leader chọn phụ bản, cả đội xác nhận sẵn sàng, server tạo run.
- Người đủ điều kiện vào chung map và cùng phiên bản nội dung.
- Chưa cho người lạ vào giữa boss; reconnect đúng thành viên được phép.
- Có thời hạn run, thử 30 phút/solo và 45 phút/party; hiển thị trước khi bắt đầu.
- Đội chết hết: được reset encounter tối đa số lần cấu hình; không reset quà đã phát.
- Người disconnect có slot giữ trong 60 giây; chính sách chi tiết ở phần 19.
- Kết thúc giải phóng entity và timer; trạng thái reward bền vững vẫn giữ.
- MVP không hứa khôi phục mọi trạng thái boss sau server crash: run chưa hoàn tất được hủy, không trừ lượt thưởng; run đã hoàn tất phục hồi quyền nhận thưởng từ DB.

## 13. Tổ đội và chơi cùng người khác

### 13.1. Tổ đội 4 người

- Mời bằng tên/nhân vật đang thấy, người nhận xác nhận; không tự ép vào đội.
- Leader đổi mục tiêu, chọn phụ bản, kick theo quy tắc và chuyển trưởng đội.
- Hiển thị HP, phái, cấp, vị trí map/channel và trạng thái kết nối.
- Không cho một nhân vật có hai party; thao tác mời/gia nhập có TTL và kiểm tra lại tại thời điểm chấp nhận.
- Có ready check trước phụ bản; thành viên mới phải xác nhận riêng.
- Leader disconnect: chuyển tạm cho người online theo quy tắc ổn định; không làm mất run.
- Kick không được tước thưởng đã kiếm của thành viên đủ điều kiện; khóa kick khi đang đánh boss hoặc dùng cơ chế xác nhận phù hợp.

### 13.2. Chia XP và loot

- Loot luôn cá nhân, không có need/greed trong V1.
- XP party chỉ chia cho người còn sống/đủ điều kiện và trong phạm vi tham gia; không chia cho người đứng ở thị trấn.
- Thử tổng XP `XP gốc × (1 + 0,25 × (N - 1))`, sau đó chia đều cho `N` thành viên hợp lệ, áp dụng chênh lệch cấp từng người.
- Boss/phụ bản có thưởng định nghĩa riêng theo nhân vật và quota, không lấy bảng chia quái thường để suy ra.
- Không thưởng hai lần vì nhận sự kiện kill rồi nhận sự kiện clear; hai reward source tách ID.

### 13.3. Chat và xã hội

- MVP 1: chat gần và hệ thống.
- MVP 2: chat party, danh sách bạn cơ bản, lời mời tổ đội.
- V1: chat bang, kênh tìm đội; chat toàn server chỉ mở khi có kiểm soát spam.
- Có mute/block/report; giới hạn tần suất và độ dài, escape nội dung trước hiển thị.
- Chưa có gửi tiền, đồ hay link tùy ý qua chat.
- Chat riêng và nội dung bang không được broadcast cho mọi client của map.

## 14. Bang hội

### 14.1. Thành lập và gia nhập

- Nhân vật cấp 20+ có thể tạo bang, phí thử 20.000 bạc; điều chỉnh sau đo kinh tế.
- Tên bang 3–20 ký tự, kiểm tra trùng và nội dung; mô tả/tuyên ngôn có giới hạn.
- Một nhân vật chỉ thuộc một bang, tài khoản nhiều nhân vật được lưu rõ để xử lý hạn mức sự kiện.
- Bang ban đầu tối đa 30 thành viên; nâng dần 40/50 theo cấp bang.
- Tìm bang theo tên, trạng thái tuyển, cấp và hoạt động; gửi đơn hoặc nhận lời mời.
- Có chế độ duyệt đơn hoặc mở; quyền tuyển người được kiểm tra server.
- Rời bang có cooldown gia nhập lại thử 24 giờ; không mất đồ cá nhân.

### 14.2. Vai trò và quyền

| Vai trò | Quyền chính |
| --- | --- |
| Bang chủ | Cấu hình, bổ nhiệm, chuyển chủ, giải tán theo quy trình |
| Phó bang | Duyệt đơn, quản lý thành viên cấp thấp hơn, tổ chức hoạt động |
| Trưởng lão | Duyệt đơn, cập nhật thông báo nếu được cấp |
| Thành viên | Chat, đóng góp, tham gia hoạt động, nhận thưởng đủ điều kiện |

- Không cho sửa quyền vượt cấp vai trò của mình.
- Chuyển bang chủ cần xác nhận và log; chỉ một chủ ở mọi thời điểm.
- Giải tán cần xác nhận mạnh và thời gian chờ có thể hủy; không xóa lịch sử đóng góp/phần thưởng.
- Bang chủ vắng dài ngày: V1 chỉ hỗ trợ quy trình hỗ trợ/admin có kiểm toán, chưa tự chuyển quyền theo logic mơ hồ.

### 14.3. Đóng góp và phát triển bang

- Đóng góp bạc/nguyên liệu theo giới hạn ngày; server trừ vật phẩm/ví và cộng đóng góp cùng một giao dịch.
- Đóng góp tạo XP bang và điểm công trạng của thành viên; không tạo thêm bạc mới để rút.
- Cấp bang mở số người, nhiệm vụ và cửa hàng token.
- Buff bang ban đầu nhỏ, chủ yếu tiện ích/PvE; tránh nhân vật không có bang không thể chơi solo.
- Kho bang chứa tài nguyên nâng bang, chưa có kho tự do nạp/rút trang bị hoặc tiền.
- Có lịch sử ai đóng góp, bổ nhiệm, duyệt đơn, kick và kích hoạt hoạt động.

### 14.4. Hoạt động bang

- Nhiệm vụ tuần chung: diệt số quái/tinh anh, hoàn thành phụ bản, quyên góp giới hạn.
- Boss bang: phiên instance cho tối đa 12 người trong cùng bang, mở cuối giai đoạn V1 sau test party 4 người.
- Boss bang có telegraph đơn giản và đồ cá nhân; không dùng ngân quỹ chia tiền thủ công.
- Quyền nhận thưởng xét membership tại lúc đăng ký và đóng góp, có chặn đổi bang để nhận nhiều lần/tuần.
- Nếu test 12 người chưa đạt hiệu năng, ưu tiên triển khai boss bang theo nhiều đội 4 người cộng tiến độ chung; phải ghi rõ mô hình phát hành thực tế.
- Không gọi bang hội hoàn tất nếu chỉ có danh sách thành viên mà không có hoạt động/đóng góp hoạt động được.

## 15. Tiền tệ và kinh tế

### 15.1. Tiền tệ V1

| Loại | Nguồn | Cách dùng | Có chuyển người chơi không |
| --- | --- | --- | --- |
| Bạc | Quái, nhiệm vụ, bán đồ, phụ bản | Bình, học chiêu, cường hóa, tạo/đóng góp bang | Không |
| Điểm võ học | Lên cấp | Nâng bậc chiêu | Không |
| Token phụ bản | Hoàn thành boss hợp lệ | Đổi trang bị bảo đảm | Không |
| Công trạng bang | Đóng góp và hoạt động | Cửa hàng bang giới hạn | Không |

- MVP 1 chỉ cần bạc, võ học, token của 2 phụ bản; công trạng khi có bang.
- Không tạo nhiều loại tiền không có mục đích; không có kim nguyên bảo/nạp tiền trong phạm vi này.
- Số dư dùng integer, có trần và kiểm tra overflow; không dùng float cho số tiền.

### 15.2. Thiết kế nguồn và nơi tiêu

- Nguồn bạc: quái/nhiệm vụ là nền, boss/ngày là phần thưởng có giới hạn.
- Nơi tiêu: bình, nâng chiêu, cường hóa, phí bang, reset kỹ năng.
- Bán đồ NPC không được lời hơn mua vật phẩm tương đương; kiểm tra vòng lặp mua → bán và đổi token → bán.
- Không tạo nghèo đến mức không có cách hồi phục/đánh quái; có bình tutorial và hồi HP/MP tại thị trấn.
- Theo dõi bạc phát ra/tiêu đi theo ngày và mốc cấp, số đá kiếm/tiêu, số lượt nâng thành công.
- Đặt mục tiêu: +3 dễ thử ở đầu game, +6 có mục tiêu vài phiên, +10 có thể săn được trong tiến trình MVP. Điều chỉnh nguồn trước khi làm tỷ lệ quá thấp.

### 15.3. Phần thưởng quay lại

- Nhiệm vụ ngày/tuần có giới hạn thời gian làm hợp lý, không là con đường XP bắt buộc duy nhất.
- Chưa cần chuỗi điểm danh phạt mất ngày; ưu tiên thưởng hoạt động thực tế.
- Người nghỉ vài ngày vẫn có đường tiến triển bằng cốt truyện và phụ bản; không buộc làm tất cả checklist mỗi ngày.

## 16. UI/UX và khả năng tiếp cận

### 16.1. Màn hình cần làm

- Trang vào game: đăng nhập/đăng ký, tình trạng server và chọn cấu hình đồ họa.
- Chọn/tạo nhân vật: tên, cấp, phái, ngoại hình và lần online gần nhất.
- HUD trong game: HP/MP/nộ, level/XP, mục tiêu, hotbar, bình, minimap, quest tracker, chat.
- Túi + bảng nhân vật: xem, so sánh, mặc, dùng, bán/hủy.
- Võ công: chiêu đã học/chưa mở, bậc, điểm và mô tả thực tế.
- Môn phái: vai trò, preview đơn giản, xác nhận gia nhập.
- Cường hóa: item hiện tại, kết quả dự kiến, chi phí/tỷ lệ/bảo hiểm.
- Phụ bản: điều kiện, thưởng, lượt còn lại, party và ready check.
- Tổ đội: mời, quản lý, HP và status.
- Bang: danh sách, quyền, thông báo, đơn gia nhập, đóng góp, hoạt động.
- Cài đặt: âm lượng, scale UI, phím tắt, giảm hiệu ứng, kết nối và đăng xuất.
- Hộp nhận thưởng: pending reward từ boss/phụ bản, nguồn/thời hạn nếu có.

### 16.2. Bố cục desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Nhân vật: HP / MP / Nộ     Mục tiêu              Minimap      │
│ Party                                              Nhiệm vụ  │
│                                                              │
│                  THẾ GIỚI GAME 2D                             │
│             quái / nhân vật / đồ / telegraph                  │
│                                                              │
│ Chat                                             Thông báo   │
│          XP ─────── Hotbar 1–6 ─────── Bình Q/E                │
│ Túi  Nhân vật  Võ công  Phụ bản  Bang  Cài đặt                  │
└──────────────────────────────────────────────────────────────┘
```

- Giao diện mục tiêu 1280×720 trở lên; 1024×768 là mức dự phòng cần kiểm tra.
- Panel không che hoàn toàn nhân vật khi chiến đấu; các hành động quan trọng vẫn nhìn rõ.
- Mở tối đa một nhóm panel lớn, có điều hướng trở lại; không chồng hàng loạt modal.
- Tooltip trang bị có số tăng/giảm và yêu cầu chưa đáp ứng; không bắt đọc toàn bảng chỉ số mỗi lần.
- Giao dịch đang chờ có trạng thái chờ, không giả báo thành công trước response server.
- Lỗi có mã ổn định và lời giải thích tiếng Việt: túi đầy, ngoài tầm, thiếu MP, không đủ bạc, cooldown, hết lượt.
- Mạng chậm có chỉ báo, khi mất kết nối khóa giao dịch mới và hiện tiến trình reconnect.

### 16.3. Hiển thị đơn giản nhưng rõ

- Hiệu ứng kỹ năng khác nhau bằng hình và nhịp, không chỉ màu.
- Damage number có gộp/giới hạn, tránh hàng trăm số đè lên nhau.
- Thanh HP quái hiển thị khi chọn, bị đánh hoặc trong phạm vi gần.
- Vật phẩm hiếm có dấu hiệu dễ thấy, vẫn lọc được hiệu ứng và tên.
- Hỗ trợ tắt rung màn hình, giảm nhấp nháy, tăng chữ, mute từng nhóm âm thanh.
- Focus bàn phím cho menu/form; vùng game có thể lấy lại focus rõ ràng.
- Mobile/touch là giai đoạn sau V1: joystick, nút lớn và layout riêng; không hứa chơi mobile tốt chỉ vì trang web responsive.

## 17. Đồ họa 2D, hoạt ảnh và âm thanh

### 17.1. Chuẩn hình ảnh

- Chọn một phong cách nhất quán: pixel art hoặc sprite vẽ phẳng; prototype ưu tiên pixel art đơn giản.
- Nhân vật tham khảo 48×64 pixel, tile 32×32; giữ tỷ lệ chuẩn giữa nhân vật/quái/kiến trúc.
- Dùng 4 hướng: lên, xuống, trái, phải; trái/phải có thể flip nếu vũ khí/sprite phù hợp.
- Render 30–60 FPS; animation chỉ 6–10 FPS đã đủ. Logic game không phụ thuộc FPS render.
- Depth sort theo chân nhân vật/tọa độ y để đứng trước/sau cây, NPC và người khác đúng.
- Collision body nhỏ hơn sprite; chân không bị dính tường chỉ vì tóc/vũ khí chạm hình.

### 17.2. Bộ animation tối thiểu

| Trạng thái | Frame/hướng khuyến nghị | Ghi chú |
| --- | --- | --- |
| Idle | 1–2 | Có thể ảnh tĩnh |
| Walk | 4 | Chu kỳ rõ, không cần mượt |
| Attack | 3–4 | Cùng cue thi triển, damage do server quyết định |
| Cast | 2–3 | Có thể dùng chung Attack ban đầu |
| Hurt | 1 | Flash/đổi màu nhẹ |
| Dead | 1–2 | Có thể dùng một sprite ngã chung |

- Với 4 hướng và bộ cơ bản, mỗi nhân vật cần khoảng 40–64 frame trước tối ưu dùng chung/flip.
- Prototype có thể dùng shape/placeholder; phải đủ phân biệt người, quái, boss, loot và vùng nguy hiểm.
- Không trì hoãn combat vì chờ sprite đẹp; thay asset thông qua ID/atlas ổn định.
- Ngoại hình vũ khí theo phái bằng lớp overlay/hiệu ứng trước; chưa làm sprite riêng cho mọi món áo.

### 17.3. Ngân sách asset

- MVP 1: 3 kiểu nhân vật/phái, 12 quái có thể chia sẻ 6–8 sprite, 3 boss, 8–12 NPC dùng lại sprite, khoảng 50 icon.
- Một tileset thị trấn và 3 biến thể bãi quái; 2 bộ nền phụ bản có thể tái dùng.
- V1 bổ sung phái, vùng, boss; lập bảng asset với nguồn, license/quyền sử dụng, kích thước, atlas và người chịu trách nhiệm.
- Không dùng asset placeholder chưa được phép trong bản công khai; có danh sách thay thế trước phát hành.
- Atlas chia theo common/map/monster/UI, không một ảnh cực lớn tải toàn game.

### 17.4. Âm thanh

- Nhạc thị trấn, ngoài trời, phụ bản, boss; loop ngắn và chuyển fade.
- Âm đánh, trúng đòn, cast, nhặt đồ, lên cấp, cường hóa, chết và UI.
- Có âm lượng nhạc/hiệu ứng riêng, default vừa phải.
- Browser chỉ bắt đầu audio sau thao tác người dùng; mất focus có tùy chọn mute/giảm.
- MVP không cần lồng tiếng; lời thoại bằng text.

## 18. Kiến trúc kỹ thuật đề xuất

### 18.1. Stack chốt cho giai đoạn đầu

| Thành phần | Lựa chọn | Lý do |
| --- | --- | --- |
| Package manager | pnpm 10, workspace | Một repo, chia package rõ, lockfile dùng chung |
| Runtime | Node.js 24 LTS | Backend TypeScript và toolchain web thống nhất |
| Client | TypeScript + Vite + Phaser 3 | Tilemap, sprite, camera, input, scene và hiệu ứng 2D |
| UI ngoài canvas | React + CSS + Zustand | Panel/form/túi/bang dễ tổ chức |
| Backend HTTP | Fastify + TypeScript | API/auth/admin/health, validation |
| Realtime | WebSocket qua plugin của Fastify | Một đường kết nối, giao thức có version |
| Validation | Zod | Validate dữ liệu nội dung và message tại biên |
| Database | PostgreSQL 17 | Giao dịch item, ví, nhiệm vụ, bang và lịch sử |
| ORM/migration | Drizzle + migration SQL có version | Kiểm soát khóa, constraint, transaction và schema |
| Kiểm thử | Vitest, Playwright | Unit/simulation/integration/browser |
| Triển khai | Một app server + PostgreSQL + reverse proxy | Dễ vận hành trước khi mở rộng |
| Redis | Chỉ bổ sung khi thật sự cần nhiều process | Chưa là dependency bắt buộc MVP |

Version patch chính xác được pin trong `packageManager`, cấu hình runtime và lockfile khi khởi tạo; không dùng dependency `latest` không khóa cho bản build tái lập.

### 18.2. Luồng dữ liệu

```text
Browser
  React UI ── HTTP API ── Fastify ── PostgreSQL
  Phaser   ── WebSocket ── Room/Simulation
                             │
                             ├─ Combat, AI, movement, cooldown
                             ├─ Reward/Inventory services ── PostgreSQL
                             └─ Persistence queue/outbox
```

- Một process có nhiều room/instance trước; mỗi room chỉ có một chủ simulation.
- Server giữ state chuyển động/AI theo tick trong bộ nhớ.
- DB lưu tiến trình và giao dịch quan trọng; không ghi toàn bộ entity mỗi tick.
- Trình duyệt gửi ý định. Server tính kết quả rồi phát snapshot/event có thứ tự.
- HTTP dùng cho đăng nhập, danh sách nhân vật, cấu hình/các thao tác ngoài phiên; WS cho hành động trong phiên chơi.
- Quy tắc gameplay nằm trong package simulation không phụ thuộc Phaser để test và chạy server.
- Client có prediction chuyển động, nhưng không quyết định kết quả combat, RNG hay quyền sở hữu.

### 18.3. Cấu trúc repo dự kiến

```text
volam/
├─ PLAN.md
├─ README.md
├─ package.json
├─ pnpm-workspace.yaml
├─ pnpm-lock.yaml
├─ .env.example
├─ apps/
│  ├─ web/
│  │  ├─ src/game/{scenes,entities,input,render,net}/
│  │  ├─ src/ui/{panels,hud,forms}/
│  │  ├─ src/state/
│  │  └─ public/assets/
│  └─ server/
│     ├─ src/http/{auth,characters,health}/
│     ├─ src/realtime/{sessions,rooms,handlers}/
│     ├─ src/services/{inventory,rewards,quests,guilds}/
│     └─ src/jobs/
├─ packages/
│  ├─ protocol/          # message schemas, DTO, lỗi, protocol version
│  ├─ simulation/        # movement/combat/AI/stats thuần TypeScript
│  ├─ content/           # JSON, schema, validator và cấu hình gameplay
│  └─ database/          # Drizzle schema, migration, repository helpers
├─ tools/               # seed, content check, load test, asset pipeline
├─ tests/{integration,e2e,load}/
├─ infra/               # compose local, reverse proxy, deploy mẫu
└─ docs/{architecture,content,operations,decisions}/
```

- Không chuyển một field domain qua nhiều lớp chỉ để tạo abstraction; bắt đầu modular monolith.
- Phaser cập nhật render mỗi frame; React chỉ nhận state UI/event, không render lại toàn app mỗi tick.
- Mặc định UI stats cập nhật 5–10 Hz hoặc khi có thay đổi quan trọng; thông báo giao dịch cập nhật ngay.
- Có adapter preview local cho P1/P2; mọi code nhận thưởng online phải đi qua server services từ P3.

### 18.4. Workflow local cần triển khai

Các lệnh sau là mục tiêu của các script sẽ viết ở P0/P3, **chưa tồn tại và chưa được chạy trong repository hiện tại**:

```bash
pnpm install --frozen-lockfile
pnpm dev:db
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

- `dev:db` khởi động PostgreSQL local qua Compose nếu Docker khả dụng; có hướng dẫn kết nối PostgreSQL sẵn có nếu không có Docker.
- `dev` khởi động web/server, health check rõ; seed chỉ chạy dev/test, idempotent và không xóa dữ liệu của người dùng.
- Khi chưa có lockfile ở lần khởi tạo P0, tạo bằng lần cài đầu; từ đó CI và setup dùng frozen lockfile.
- `.env.example` chỉ có tên biến và giá trị development không nhạy cảm; không commit secret.
- Mỗi cloud task dùng checkout đã có trong môi trường cô lập; không tự tạo Git worktree khi người dùng chưa yêu cầu.

## 19. Networking, đồng bộ và persistence

### 19.1. Nhịp server và client

- Simulation server: 20 tick/giây, delta cố định 50 ms.
- Snapshot world: 10 lần/giây, gửi delta sau bản đầy đủ; event quan trọng gửi ngay trong thứ tự giao thức.
- Input di chuyển: client gửi tối đa 20 lần/giây, có số thứ tự, trạng thái hướng và tick/client time để chẩn đoán.
- Rendering: 30/60 FPS theo thiết bị, không thay đổi tốc độ logic.
- Client nội suy nhân vật khác với buffer thử 100–150 ms.
- Client dự đoán di chuyển nhân vật mình, nhận server ack thì reconcile; correction lớn có log/debug overlay.
- Đồng hồ dùng server time ước lượng, không tin đồng hồ hệ thống client để kiểm tra cooldown.
- WS có transport order, nhưng reconnect có thể thiếu event; luôn có snapshot phiên bản và event sequence để resync.

### 19.2. Quyền quyết định

| Client gửi | Server xác thực và quyết định |
| --- | --- |
| Hướng di chuyển, input sequence | Vị trí, tốc độ, collision, map hợp lệ |
| `castSkill(skillId, target/position)` | Đã học, còn sống, MP/nộ, cooldown, tầm, LOS, hit |
| `pickup(dropId)` | Drop tồn tại, ownership, khoảng cách, túi còn chỗ |
| `equip(itemId)` | Item thuộc nhân vật, slot/cấp/phái, stat tổng |
| `enhance(itemId)` | Chi phí, pity, RNG, transaction |
| `claimQuest(questId)` | Mục tiêu thật, điều kiện, đã nhận hay chưa |
| `joinDungeon(dungeonId)` | Unlock, party, quota, quyền instance |
| `guildAction(...)` | Membership, role, resource, rate limit |

Client không gửi số XP cuối, lượng sát thương tự tính, tier món vừa roll, số bạc sau giao dịch hoặc kết quả cường hóa để server tin.

### 19.3. Interest management và phân vùng

- Chia map theo ô spatial hash; chỉ gửi entity trong phạm vi camera mở rộng hoặc liên quan trực tiếp.
- Mục tiêu bắt đầu: tối đa 50 người và 100 quái đang hoạt động/channel; tổng quái idle có thể lớn hơn nhưng tick nhẹ.
- Projectile/hiệu ứng có trần theo room; despawn đúng hạn và object pooling ở client.
- Party status có kênh dữ liệu riêng; không cần gửi toàn bộ map thành viên ở xa.
- Instance tách state; sự kiện map A không tới client map B.
- Khi cần nhiều process: room owner + directory/routing, handoff map có token/quyền và persistence; chưa dùng Redis Pub/Sub thay thế mọi authority.

### 19.4. Lưu dữ liệu

- Item, ví, mua/bán, cường hóa, phần thưởng và membership: ghi transaction trước xác nhận thành công.
- XP/nhiệm vụ từ kill và loot gắn với `rewardEventId`; batch ngắn tối đa khoảng 1 giây khi tải cao, commit trước phát trạng thái phần thưởng chính thức.
- Không công bố loot như đã sở hữu nếu record bền vững chưa commit.
- Vị trí và trạng thái không kinh tế: checkpoint mỗi 10–15 giây, khi đổi map và logout; kiểm tra lại vị trí khi login.
- Không cho cộng XP/tiền lại vì replay event từ queue: unique constraint + transaction.
- Dùng outbox cho giao dịch cần gửi event sau commit; resync từ DB nếu client không nhận được WS ack.
- Crash có thể mất vài giây vị trí/HP checkpoint, nhưng giao dịch đã xác nhận phải tồn tại; ghi rõ mức bảo đảm cho người vận hành.
- Shutdown có drain: ngừng nhận run/giao dịch mới, commit công việc đang chạy, lưu checkpoint và đóng kết nối có lý do.

### 19.5. Mất kết nối và đăng nhập nhiều nơi

- Heartbeat và TTL; thử ping 10 giây, xác định mất kết nối sau khoảng 30 giây không phản hồi.
- Reconnect có exponential backoff và jitter; không spam login/server khi lỗi toàn hệ thống.
- Ngoài instance: giữ entity tối đa 30 giây, vẫn có thể bị đánh; rồi chuyển trạng thái offline an toàn theo rule, không dùng disconnect làm kỹ năng né.
- Trong instance: giữ slot tối đa 60 giây; entity dừng input mới và vẫn chịu cơ chế. Reconnect nhận snapshot hiện tại, không rewind boss.
- Sau grace period, nhân vật rời encounter; không bắt người còn lại chờ vô hạn.
- Một character chỉ có một phiên gameplay active; đăng nhập mới thu hồi phiên cũ qua session ownership/epoch.
- Pending transaction có `requestId`; reconnect hỏi trạng thái hoặc nhận snapshot, không tạo thao tác kinh tế mới để đoán kết quả.
- Token resume có TTL, ràng buộc session và character; không chứa quyền thay đổi nhân vật tùy ý.

## 20. Mô hình dữ liệu

### 20.1. Bảng chính

| Bảng | Trường/quan hệ chính | Constraint quan trọng |
| --- | --- | --- |
| `accounts` | id, username/email, passwordHash, status, createdAt | Tên đăng nhập normalized duy nhất; không lưu mật khẩu rõ |
| `auth_sessions` | accountId, tokenHash, expiresAt, revokedAt | Token hash duy nhất, thu hồi được |
| `characters` | accountId, name, sectId, level, xp, skillPoints, mapId, position, version | Tên normalized duy nhất; cấp/XP hợp lệ |
| `character_skills` | characterId, skillId, rank, unlockedAt | Unique character+skill; rank trong giới hạn |
| `wallets` | characterId, silver, version | Unique character; số dư không âm |
| `wallet_ledger` | txId, characterId, delta, source, balanceAfter, createdAt | Ghi bất biến, unique txId hoặc txId+line |
| `item_instances` | id, ownerId, templateId, rolls, enhanceLevel, pityCount, bindState, version | Không có hai chủ; dữ liệu instance có schema/version |
| `inventory_slots` | ownerId, container, slot, itemInstanceId hoặc stackTemplateId, quantity, version | Unique owner+container+slot; unique itemInstanceId; chỉ một loại nội dung/ô |
| `ground_drops` | dropId, rewardEventId, ownerId, roomId, itemPayload, expiresAt, pickedAt | Unique dropId; chỉ chuyển một lần sang item/stack |
| `pending_rewards` | rewardId, characterId, sourceId, payload, claimedAt | Unique nguồn/người nhận; claim một lần |
| `character_quests` | characterId, questId, periodKey, status, progress, claimedAt | Unique character+quest+periodKey |
| `reward_claims` | scopeType, scopeId, source, runId, periodKey, requestId | Scope không null; unique nguồn/lượt/scope; quota khóa trong transaction |
| `dungeon_runs` | runId, dungeonId, roomId, contentVersion, state, start/end | Run ID duy nhất, trạng thái chuyển hợp lệ |
| `dungeon_run_members` | runId, characterId, joinAt, eligibility, result | Unique run+character |
| `parties` / `party_members` | leaderId, memberId, status, room preference | Một character thuộc tối đa một party active |
| `guilds` | name, leaderId, level, xp, funds, status | Tên normalized duy nhất, funds không âm |
| `guild_members` | guildId, characterId, role, contribution, joinedAt | Unique character; một leader theo constraint/service |
| `guild_applications` | guildId, characterId, state, expiresAt | Chặn đơn active trùng |
| `guild_logs` | guildId, actorId, action, target, createdAt | Append-only qua service |
| `social_links` | ownerId, targetId, type, state | Friend/block uniqueness và không tự thêm mình |
| `economic_transactions` | requestId, actorId, type, result, createdAt | Unique actor+requestId; kết quả retry ổn định |
| `outbox_events` | eventId, aggregateId, type, payload, deliveredAt | Replay idempotent, phát sau commit |
| `moderation_reports` | reporterId, targetId, reason, context, status | Rate limit, không public nội dung riêng |

Party membership là dữ liệu active có thể lưu DB trong MVP. Room state, AI, projectile, threat và cooldown live nằm trong process; chỉ checkpoint phần cần khôi phục. Template content không cần một bảng riêng cho từng quái/chiêu ngay từ đầu.

- `inventory_slots` quản lý chung túi, ô mặc và kho. Một ô chứa một item instance với quantity = 1, hoặc một stack template với quantity > 0; CHECK constraint ngăn đồng thời hai loại. Không tách slot trang bị và slot stack thành hai bảng độc lập rồi để chúng cùng chiếm một ô.
- Quota có scope rõ là `character` hoặc `account`. Tách bảng bộ đếm `reward_quotas(scopeType, scopeId, source, periodKey, usedCount)` nếu cần; khóa record quota trước claim, không dựa vào đếm log ngoài transaction.
- Giới hạn 3 nhân vật/tài khoản được kiểm tra dưới khóa account hoặc cơ chế tương đương để hai request tạo đồng thời không vượt hạn mức.

### 20.2. Invariant bắt buộc

- Một trang bị có đúng một vị trí: túi, mặc, kho hoặc trạng thái hủy/bán; không tồn tại cùng lúc ở hai container.
- Stack không âm và không vượt giới hạn; ví không âm.
- Không thể chi bạc/đá hai lần trong hai request đồng thời khi số dư chỉ đủ một lần.
- Món bán/hủy không còn được mặc hoặc nâng cấp.
- Nhận thưởng hoặc lên mốc cấp không chạy lại vì reconnect/restart.
- Đổi phái/cấp/rank chỉ qua service xác thực, không cập nhật từ DTO tùy ý.
- Permission bang kiểm tra cùng phiên giao dịch hoặc version membership, tránh quyền bị thu hồi nhưng request vẫn thực hiện.
- Map transfer chỉ có một phiên authority active; không nhân đôi nhân vật ở hai room.

### 20.3. Transaction mẫu: cường hóa

```text
Nhận requestId + characterId + itemId
→ tìm giao dịch đã xử lý: nếu có, trả kết quả cũ
→ begin transaction
→ khóa item, ví, stack nguyên liệu theo thứ tự cố định
→ kiểm tra ownership, version, cấp, số dư, max enhance
→ tính tỷ lệ + pity, RNG server
→ trừ bạc/đá, cập nhật item/pity
→ ghi ledger, economic_transaction, outbox
→ commit
→ gửi kết quả và stat mới
```

- Unique key xử lý race của cùng requestId; deadlock retry giới hạn, không tạo RNG mới cho giao dịch đã commit.
- Request cùng ID nhưng payload khác phải bị từ chối, không xem là thao tác mới.
- Nếu response bị mất sau commit, retry trả đúng kết quả cũ.
- Không giữ transaction DB mở trong lúc chờ client xác nhận/animation.

### 20.4. Migration và cập nhật nội dung

- Mọi thay đổi schema có migration version và thử trên DB test trước.
- Nội dung có `contentVersion`; run đã bắt đầu gắn với phiên bản đó.
- ID template/skill/quest ổn định; không tái dùng ID món đã xóa cho món khác.
- Đổi công thức roll không tự reroll item người chơi đã sở hữu.
- Không xóa reference DB bằng việc xóa file JSON; deprecate và có migration/compensation khi cần.
- Backup trước cập nhật rủi ro; rollback app chỉ an toàn khi migration tương thích hoặc có kế hoạch forward fix.

## 21. Nội dung dạng dữ liệu và công cụ hỗ trợ

### 21.1. Các bộ cấu hình

```text
packages/content/data/
  classes.json        # phái, vai trò, hệ số stat, skill unlock
  skills.json         # phạm vi, cooldown, cost, effect, rank
  monsters.json       # stat, AI, skill, XP, loot table
  bosses.json         # phase, telegraph, encounter rules
  items.json          # template, slot, tier, stat budget, restriction
  affix-pools.json     # chỉ số phụ hợp lệ và trọng số
  loot-tables.json    # nguồn loot, roll độc lập, trọng số phẩm chất
  enhancement.json   # tỷ lệ, cost, pity, trần cấp
  quests.json        # điều kiện, mục tiêu, reward, unlock
  dungeons.json      # run, party size, quota, reward, spawn
  maps/              # tilemap, collision, spawn, portal
  economy.json       # giá NPC, token exchange, nguồn/chi phí
  guilds.json        # cấp, quota, cửa hàng, hoạt động
```

### 21.2. Ví dụ định nghĩa kỹ năng

Đây là schema định hướng, không phải file runtime đã triển khai:

```json
{
  "id": "kim_phong_pha_giap",
  "sectId": "kim_phong",
  "name": "Phá Giáp Trảm",
  "unlockLevel": 5,
  "maxRank": 5,
  "targeting": { "type": "cone", "rangeTiles": 2, "angleDegrees": 70 },
  "castTimeMs": 200,
  "cooldownMs": 6000,
  "mpCost": 12,
  "damage": { "attackScaleByRank": [1.4, 1.5, 1.6, 1.7, 1.8] },
  "effects": [{ "type": "defense_down", "percent": 10, "durationMs": 4000 }],
  "animationId": "sword_slash",
  "iconId": "skill_sword_break"
}
```

### 21.3. Validator nội dung

- Mọi ID unique; mọi reference tới map/item/skill/loot/quest tồn tại.
- Phần trăm trong khoảng cho phép; bảng phẩm chất chuẩn hóa đúng 100%.
- Range, cooldown, HP, cost và quantity không âm; tránh NaN/Infinity.
- Quest dependency không có vòng lặp, không khóa tính năng cần để hoàn thành chính nó.
- Portal có destination và điểm xuất hiện hợp lệ; spawn không trong collision.
- Boss phase reachable, có timeout và clear condition.
- Tier item có ngân sách và affix pool hợp lệ cho slot/phái.
- Mỗi map/skill có asset hoặc fallback phát hành được.
- Chạy validator trong CI trước build; dữ liệu sai làm build thất bại có thông báo ID cụ thể.

### 21.4. Công cụ dev/admin

- Overlay dev: tọa độ, collision, tick, latency, entity count, input ack, hitbox.
- Seed nhân vật test theo cấp/phái/bộ đồ để test boss, chỉ có ở dev/test.
- Trình xem item/skill/loot table tối thiểu bằng script hoặc trang dev.
- Admin V1: tìm character, xem ledger, ban/mute, hỗ trợ phục hồi có lý do và audit.
- Grant item/currency phải là service ghi ledger với người thực hiện/lý do; không có endpoint công khai đổi level/tiền.
- Chưa xây visual editor toàn diện; JSON/schema và Tiled đủ cho giai đoạn đầu.

## 22. Giao thức HTTP và WebSocket

### 22.1. HTTP API dự kiến

| API | Chức năng |
| --- | --- |
| `POST /api/auth/register` | Tạo tài khoản, kiểm tra tên/mật khẩu |
| `POST /api/auth/login` | Tạo phiên, rate limit đăng nhập |
| `POST /api/auth/logout` | Thu hồi phiên |
| `GET /api/me` | Thông tin tài khoản hiện tại, không trả dữ liệu nhạy cảm |
| `GET /api/characters` | Danh sách nhân vật của tài khoản |
| `POST /api/characters` | Tạo nhân vật theo quota |
| `POST /api/characters/:id/play` | Cấp ticket một lần/TTL ngắn cho WS |
| `GET /api/content/manifest` | Version/assets/public content cần client |
| `GET /api/health/live` | Process còn hoạt động |
| `GET /api/health/ready` | DB/kênh simulation và dependency bắt buộc sẵn sàng |
| `GET /api/admin/...` | Chỉ admin xác thực, RBAC, audit |

Thao tác item/quest/guild trong phiên gameplay dùng WS command để không có hai đường write thiếu nhất quán. Nếu sau này thêm HTTP cho cùng hành động, gọi chung service và cùng idempotency/locking.

### 22.2. Envelope WS

```json
{
  "protocolVersion": 1,
  "type": "inventory.enhance",
  "requestId": "client-generated-unique-id",
  "payload": { "itemId": "owned-item-instance-id", "expectedVersion": 3 }
}
```

- `requestId` bắt buộc cho giao dịch/command cần retry; movement dùng sequence nhỏ riêng, không ghi mọi input vào DB.
- Session identity do kết nối đã xác thực xác định; không tin `accountId`/`characterId` tự khai trong payload.
- Response có requestId, result/error code, serverTime và version state khi cần.
- Server event có sequence, room/session epoch, type và payload; snapshot có tick/version rõ.
- Packet sai schema, quá lớn hoặc sai protocol bị từ chối; giới hạn thử 16 KB cho command, cấu hình riêng snapshot/chunk.

### 22.3. Nhóm command/event

- Session: `session.hello`, `session.resume`, `session.resync`, `session.closed`.
- World: `world.input`, `world.snapshot`, `world.entitySpawn`, `world.entityDespawn`, `world.transfer`.
- Combat: `combat.cast`, `combat.result`, `combat.status`, `combat.death`.
- Inventory: `loot.pickup`, `inventory.equip`, `inventory.use`, `inventory.sell`, `inventory.enhance`.
- Progress: `quest.accept`, `quest.claim`, `skill.upgrade`, `sect.join`, `character.levelUp`.
- Party: `party.invite`, `party.accept`, `party.leave`, `party.ready`, `party.updated`.
- Dungeon: `dungeon.enter`, `dungeon.state`, `dungeon.claim`, `reward.pending`.
- Guild: `guild.create`, `guild.apply`, `guild.manage`, `guild.contribute`, `guild.updated`.
- Chat: `chat.send`, `chat.message`, `chat.rateLimited`.

## 23. Bảo vệ dữ liệu và chống gian lận

### 23.1. Đăng nhập và quyền

- Hash mật khẩu bằng Argon2id, cấu hình dựa trên benchmark server; không ghi mật khẩu vào log.
- Session token ngẫu nhiên, DB lưu hash; cookie `HttpOnly`, `Secure` khi deploy, `SameSite` phù hợp.
- WebSocket kiểm tra Origin, ticket, account/character ownership; tránh token dài hạn trên URL/log.
- CSRF cho API thay đổi state dùng cookie; CORS allowlist rõ theo môi trường.
- Rate limit đăng nhập, tạo nhân vật, chat, giao dịch và command sai; tránh một IP NAT bị chặn quá dễ.
- Reset mật khẩu/email verification mở trước public rộng nếu dùng email; local/closed alpha có thể dùng username không hứa khôi phục email.

### 23.2. Các hành vi server phải chặn

- Teleport/speed hack, đi xuyên tường, cast ngoài tầm hoặc qua tường.
- Spam chiêu vượt cooldown, dùng chiêu chưa học, MP/nộ không đủ.
- Gửi damage/XP/loot tự tạo.
- Nhặt đồ của người khác, đồ hết hạn hoặc nhặt cùng drop hai lần.
- Cường hóa đồ không sở hữu, double spend, replay request.
- Nhận quest/dungeon/world boss reward nhiều lần hoặc vượt quota.
- Vào instance không có quyền, dùng hai phiên để nhân đôi state.
- Kick/đổi quyền/chi quỹ bang ngoài permission.
- XSS trong tên/chat/thông báo, SQL injection, message quá lớn.

### 23.3. Tránh nhầm gian lận với mạng xấu

- Validate input/tốc độ theo server time, cho khoảng dung sai được test với mạng chậm.
- Correction vị trí không tự động ban người chơi.
- Đánh dấu anomaly và lưu chỉ số tổng hợp; chỉ xử lý nghiêm khi có bằng chứng lặp/hành động không hợp lệ rõ.
- Không cần chống chỉnh client bằng obfuscation để bảo đảm kinh tế; client xem được code vẫn không quyết định phần thưởng.

## 24. Triển khai, vận hành và cấu hình

### 24.1. Môi trường

- Local: web dev server, game server, PostgreSQL, dữ liệu seed.
- CI/test: DB riêng, tài khoản giả, content test, không kết nối production.
- Staging: build phát hành, cùng topology production ở quy mô nhỏ.
- Production: static web qua reverse proxy/CDN khi cần, WS/API cùng domain hoặc routing rõ, DB riêng.
- Không phụ thuộc filesystem tạm của container để lưu item/player; dữ liệu bền vững ở PostgreSQL và storage asset.

### 24.2. Biến cấu hình dự kiến

| Biến | Mục đích | Có nhạy cảm không |
| --- | --- | --- |
| `DATABASE_URL` | Kết nối PostgreSQL | Có thể chứa credential, chỉ server |
| `APP_ORIGIN` | Origin web được chấp nhận | Không |
| `PORT` | Cổng HTTP/WS backend | Không |
| `GAME_REGION` | Nhãn vùng server | Không |
| `GAME_TIMEZONE` | Ngày logic phần thưởng, default Asia/Ho_Chi_Minh | Không |
| `CONTENT_VERSION` | Phiên bản nội dung deploy | Không |
| `LOG_LEVEL` | Mức log | Không |
| `VITE_API_BASE_URL` | URL public API | Không, client nhìn được |
| `VITE_WS_BASE_URL` | URL public WS | Không, client nhìn được |

Không đưa DATABASE_URL hoặc secret vào biến `VITE_*`. Nếu triển khai thêm email/storage/telemetry, khai báo biến cần thiết tại giai đoạn đó, kiểm tra binding sẵn có trước yêu cầu credential mới.

### 24.3. CI tối thiểu

1. Cài Node/pnpm đã pin, `pnpm install --frozen-lockfile`.
2. Validate content và reference assets.
3. Lint + typecheck.
4. Unit/simulation tests.
5. Migration lên DB test trống, integration tests transactional.
6. Build web/server.
7. Smoke browser đường chơi chính; lưu artifact và báo số test thực chạy.

Không xem build xanh là bằng chứng gameplay hoạt động; đường functional phải thật sự chạy và có assertion.

### 24.4. Monitoring và log

- Structured log: requestId/sessionId/roomId/runId/transactionId, không token/password/chat riêng tùy tiện.
- Metrics: người online, room, tick time p50/p95/p99, WS latency, DB latency, reconnect, error rate, reward queue.
- Metrics kinh tế: bạc phát/tiêu, loot theo tier, cường hóa thành/thất bại/pity, quota từ chối.
- Metrics gameplay: tutorial hoàn thành, level progression, boss attempt/clear/death, dungeon thời lượng, bỏ run.
- Crash/error tracking có release/content version; sampling để tránh log mỗi tick.
- Admin xem ledger và incident theo ID; không sửa DB trực tiếp thiếu audit.

### 24.5. Backup, restart và sự cố

- Backup DB tự động hàng ngày và trước migration quan trọng; xác minh restore trên môi trường riêng.
- Closed alpha: mục tiêu RPO tối đa 24 giờ cho disaster, RTO vài giờ; công bố rõ trước khi có dữ liệu người thật.
- Trước public rộng, bổ sung WAL/PITR hoặc backup thường hơn để đạt mục tiêu mất dữ liệu thấp hơn; chọn theo hạ tầng thực tế.
- Restart báo trước, drain giao dịch/run và kiểm tra pending reward sau bật lại.
- Sự cố duplication: khóa đường giao dịch lỗi, giữ ledger, phân tích và bồi hoàn có audit; không xóa đồ hàng loạt thiếu xác minh.
- Static asset có cache version/hash; client cũ được yêu cầu reload nếu protocol không tương thích.

## 25. Hiệu năng và giới hạn vận hành

Các số sau là mục tiêu thử nghiệm, chỉ xác nhận sau benchmark trên máy ghi rõ CPU/RAM/khu vực mạng.

| Mục tiêu | Ngưỡng khởi đầu |
| --- | --- |
| FPS desktop tầm trung, 1280×720 | Ổn định 30+, mục tiêu 60 |
| Tick server 20 Hz | p95 dưới 25 ms, p99 dưới 50 ms ở tải mục tiêu |
| Channel công cộng | 50 người, 100 quái active, interest management bật |
| Party instance | 4 người, tối đa khoảng 40 quái active/encounter |
| Boss bang V1 | 12 người nếu benchmark và gameplay đủ ổn |
| Bộ máy alpha tham khảo | 2–4 vCPU, 4–8 GB RAM, DB được đo riêng |
| Số người alpha trên một server | Mục tiêu 100 đồng thời phân nhiều room, phải load test |
| Tải asset lần đầu của khu tân thủ | Mục tiêu dưới 10 MB nén |
| Băng thông WS bình quân/người | Mục tiêu dưới 30 KB/s ở map thông thường; đo burst riêng |
| Response giao dịch ngoài animation | p95 dưới 500 ms tại vùng phục vụ, không tính mạng cực xấu |

- Test 1/10/50 người trong room, rồi 100 tổng server; không suy ra 1.000 người từ benchmark 10 bot.
- Client pool entity/number/particle, hạn chế allocation mỗi frame và texture switch.
- Giảm hiệu ứng trước khi giảm dấu hiệu đòn boss; telegraph là thông tin gameplay thiết yếu.
- Backpressure: giới hạn hàng đợi WS, disconnect/resync client quá chậm; không để memory tăng vô hạn.
- Không catch-up vô hạn nhiều tick khi server quá tải; cảnh báo và policy load shedding/channel cap rõ.
- Soak test ít nhất 2 giờ ở staging, theo dõi memory/timer/entity sau vào/ra phụ bản nhiều lần.

## 26. Kế hoạch kiểm thử

### 26.1. Unit và simulation

- Công thức XP, nhiều level từ một reward, cap và XP dư.
- Stat tổng, cap, thứ tự buff, sát thương, crit và defense.
- Cooldown, MP/nộ, rank, cast khi chết/ngoài tầm/không có LOS.
- Collision, tốc độ chéo, dash, projectile và hình học AOE.
- DOT/HOT/shield expiry, refresh, stack cap và boss CC resistance.
- Loot weight, tier, affix pool và RNG fixture deterministic trong test.
- Cường hóa tỷ lệ/pity/cost, +10/+15 và kế thừa.
- Threat, AI leash, boss phase/timeout và clear condition.
- Content references, quest graph và portal validity.

### 26.2. Integration với PostgreSQL thật

- Cài migration trên DB trống; seed lặp không nhân đôi dữ liệu.
- Hai pickup cùng drop: chỉ một item/stack được tạo.
- Hai enhance request đồng thời khi nguyên liệu đủ một: một thành công giao dịch, một lỗi số dư hợp lệ.
- Retry cùng requestId sau response mất: không trừ/roll lại.
- Mặc/bán/hủy/nâng cùng item không tạo trạng thái kép.
- Hai claim cùng quest/run hoặc qua ranh giới reset không vượt quota.
- Reward commit xong nhưng WS đứt: reconnect vẫn thấy đồ/số dư.
- Cùng character vào hai phiên: chỉ một authority nhận input.
- Bang role đổi đồng thời với kick/đóng góp: quyền/resource nhất quán.
- Run crash trước clear không trừ lượt; clear đã commit phục hồi pending reward.

### 26.3. E2E trình duyệt

1. Đăng ký/login → tạo nhân vật → vào map.
2. Di chuyển không xuyên tường; click mục tiêu, đánh quái, thấy HP giảm và quái chết.
3. Nhận XP, lên cấp, nhặt đồ, mặc và chỉ số thay đổi.
4. Gia nhập phái cấp 5, học/nâng chiêu, cooldown/MP đúng.
5. Cường hóa, số dư/đá/item cập nhật; thiếu nguyên liệu báo lỗi.
6. Vào phụ bản, né telegraph, giết boss, nhận thưởng đúng một lần.
7. Reload/logout/login, dữ liệu còn và vị trí hợp lệ.
8. Hai trình duyệt nhìn thấy nhau; party clear cùng instance và nhận loot riêng.
9. Tạo/gia nhập bang, phân quyền, đóng góp và thưởng hoạt động.
10. Túi đầy, mất mạng, session bị thay thế và server restart không làm sai giao dịch.

### 26.4. Test tải và mạng

- Bot input hành vi thật: di chuyển, đánh, nhặt; không chỉ mở socket idle.
- Ping 50/150/300 ms, jitter, mạng đứt/reconnect và browser tab background.
- WS chạy trên TCP: mô phỏng delay/đứt/stall, không giả định packet UDP mất độc lập.
- Test monster pathfinding dày, AOE nhiều mục tiêu, boss gọi quái, 12 người bang nếu hỗ trợ.
- Soak 2 giờ, room create/destroy, memory/timer không tăng tuyến tính vô hạn.

### 26.5. Playtest và cân bằng

- Ít nhất 5–10 người thử tutorial không được hướng dẫn trực tiếp ở vòng đầu.
- Đo tỷ lệ hoàn thành tutorial, thời gian tìm nút nhặt/mặc/chọn phái, điểm gây bối rối.
- Mỗi phái thử solo cùng nội dung và bộ đồ ngân sách tương đương.
- Tổ đội thử có/không có healer, người yếu/mạnh khác nhau, reconnect khi boss.
- Xem nguồn/chi phí bạc, số lần thất bại trước pity, số lượt có trang bị nâng cấp thực sự.
- Một người đánh giá asset/UI không thay thế playtest chiến đấu; phải ghi issue dựa trên hành vi quan sát.

## 27. Lộ trình triển khai chi tiết

Ước lượng cho một lập trình viên có kinh nghiệm làm toàn thời gian, có asset đơn giản dùng được và hỗ trợ AI. Thời gian làm art/nội dung thủ công, sửa sau playtest và vận hành có thể tăng đáng kể. Lộ trình tính theo gate hoàn thành, không dùng thời gian đã hết để tự đánh dấu tính năng xong.

Mục tiêu tham khảo: prototype 4–6 tuần; MVP online 1 khoảng 10–16 tuần; MVP online 2 khoảng 15–22 tuần; V1 khoảng 24–40 tuần. Có thể làm nhanh hơn với nhóm nhỏ, nhưng không cam kết trước khi có prototype và số liệu thực tế.

### P0 — Khởi tạo và quy ước dự án

**Ước lượng:** 3–5 ngày. **Phụ thuộc:** PLAN được dùng làm định hướng.

- [ ] Tạo pnpm workspace, web/server/packages và TypeScript strict.
- [ ] Pin Node/pnpm/dependency, tạo lockfile, README và `.env.example`.
- [ ] Tạo Vite + Phaser canvas và React shell; kiểm tra focus/input.
- [ ] Khởi tạo Fastify health endpoint và schema protocol.
- [ ] Thiết lập lint/typecheck/Vitest, CI tối thiểu.
- [ ] Viết quy ước ID, đơn vị tile, thời gian ms, direction, tick và error code.
- [ ] Lập danh sách asset placeholder và bản quyền/source.
- [ ] Định nghĩa schema content đầu tiên, validator skeleton.

**Gate hoàn thành:** clean install/build/typecheck chạy được; mở web thấy scene thử; server health trả đúng; README tái lập được trên máy mới.

### P1 — Di chuyển, bản đồ và tương tác 2D

**Ước lượng:** 1–2 tuần. **Phụ thuộc:** P0.

- [ ] Tilemap một khu thử, collision, spawn, camera theo nhân vật.
- [ ] WASD, chuẩn hóa diagonal, idle/walk 4 hướng.
- [ ] Depth sort, sprite scale, world/pixel conversion rõ.
- [ ] NPC, interaction range và panel hội thoại.
- [ ] Đổi scene/map thử, loading và xử lý asset lỗi.
- [ ] HUD HP/MP/XP và hotbar placeholder.
- [ ] Dev overlay collision/tọa độ.

**Gate hoàn thành:** chơi 10 phút không kẹt tường, đi xuyên vật cản hoặc mất focus; thao tác NPC đúng tầm; resize không làm sai tọa độ click.

### P2 — Prototype vòng chiến đấu

**Ước lượng:** 2–3 tuần. **Phụ thuộc:** P1.

- [ ] Simulation thuần cho movement, stats, combat, cooldown và death.
- [ ] Đánh thường và 2 chiêu đầu của một phái thử.
- [ ] 3 loại quái, AI chase/attack/leash/respawn.
- [ ] Boss thử có ít nhất 2 cơ chế telegraph.
- [ ] XP/level cap 10, đồ rớt giả lập local, nhặt/mặc vũ khí và áo.
- [ ] Hiệu ứng hit/cast/damage/loot đủ hiểu, không cần art hoàn thiện.
- [ ] Test math/hitbox/cooldown/AI và playtest vòng 1.

**Gate hoàn thành:** chơi liên tục 15 phút, lên cấp, nhặt/mặc, đánh thắng boss bằng đọc cơ chế; combat có phản hồi rõ. Dữ liệu local dùng thử, không chuyển thành tiến trình online tin cậy.

### P3 — Tài khoản, server authority và lưu tiến trình

**Ước lượng:** 2–3 tuần. **Phụ thuộc:** P2.

- [ ] PostgreSQL/Drizzle schema và migration nền: account, session, character, wallet, item, reward/transaction.
- [ ] Register/login/logout, tạo/chọn nhân vật, WS ticket.
- [ ] Room server 20 Hz, input/snapshot/version/ack, client interpolation/prediction.
- [ ] Đưa movement/combat/AI/RNG lên server authority.
- [ ] Persistence kill reward, checkpoint và reconnect.
- [ ] Một character một active session; map/channel isolation.
- [ ] Test hai browser, restart và response mất sau commit.
- [ ] Tắt hoàn toàn đường cấp XP/item từ local adapter trong online build.

**Gate hoàn thành:** hai người cùng map nhìn nhau; server chặn thao tác sai; nhân vật giữ XP/đồ qua reload/restart; session không nhân đôi state.

### P4 — Loot, inventory, trang bị và cường hóa

**Ước lượng:** 2–3 tuần. **Phụ thuộc:** P3.

- [ ] Đủ 8 equipment slot, túi 40 ô, stack, tooltip so sánh.
- [ ] 4 phẩm chất, affix pool, budget theo cấp và loot cá nhân.
- [ ] Pickup idempotent, sell/use/equip transactions và ledger.
- [ ] Bình HP/MP, cooldown tiêu hao, shop NPC.
- [ ] Cường hóa +0 đến +10, cost, RNG và pity.
- [ ] Pending reward khi túi đầy/disconnect cho boss.
- [ ] Tạo template các mốc 1/10/20/30 và vũ khí 3 phái.
- [ ] Integration double pickup/double spend/equip vs sell.

**Gate hoàn thành:** đủ vòng săn → nhặt → mặc → nâng → mạnh hơn; transaction race/retry không nhân đôi đồ hoặc trừ tài nguyên hai lần.

### P5 — Môn phái, nhiệm vụ và nội dung MVP online 1

**Ước lượng:** 2–3 tuần. **Phụ thuộc:** P4.

- [ ] Ba phái MVP, mỗi phái 6 kỹ năng và toàn bộ lịch mở đến cấp 30.
- [ ] Võ học/rank/reset, nộ và tuyệt chiêu cấp 25.
- [ ] Quest engine, tutorial, khoảng 20–30 nhiệm vụ cấp 1–30.
- [ ] Thanh Khê và 3 bãi quái, 12 quái thường, 3 tinh anh.
- [ ] Hai phụ bản solo và boss vùng đúng bảng nội dung.
- [ ] Quota, reward claim và ngày logic server.
- [ ] Chat gần, block/rate limit và thông báo hệ thống.
- [ ] Functional E2E full vòng chơi, cân bằng lần đầu cho 3 phái.

**Gate hoàn thành — MVP online 1:** tài khoản mới chơi tới cấp 30, học tuyệt chiêu, nhặt/cường hóa đồ, clear hai phụ bản solo và boss vùng, giữ dữ liệu. Chưa có party/bang; nêu rõ khi demo.

### P6 — Tổ đội và phụ bản online chung

**Ước lượng:** 3–4 tuần. **Phụ thuộc:** P5.

- [ ] Party invite/accept/leave/kick/leader/ready check, tối đa 4.
- [ ] Party chat, HUD, chia XP có phạm vi và đóng góp.
- [ ] Instance lifecycle và chuyển room atomic.
- [ ] Hắc Phong Sơn Trại + Hàn Băng Động, mỗi phụ bản có boss riêng.
- [ ] Reconnect/leader offline/full wipe và xử lý quota đồng thời.
- [ ] Kho cá nhân 60 ô, friend list cơ bản.
- [ ] Test 2–4 browser, mạng 150–300 ms và leave/kick trong boss.
- [ ] Load test room 50 người, tối ưu interest management trước alpha nhóm.

**Gate hoàn thành — MVP online 2:** 4 người cùng vượt hai phụ bản tổ đội, mỗi người nhận đúng thưởng; reconnect và leader offline không phá run; phạm vi MVP 2 đầy đủ.

### P7 — Bang hội và hoạt động cộng đồng

**Ước lượng:** 2–4 tuần. **Phụ thuộc:** P6.

- [ ] Guild schema, create/search/apply/accept/leave và role permissions.
- [ ] Guild chat, thông báo, danh sách/trạng thái thành viên.
- [ ] Đóng góp bạc/vật liệu, công trạng, cấp bang và cửa hàng giới hạn.
- [ ] Nhiệm vụ tuần chung, ledger/audit và quota theo tài khoản khi cần.
- [ ] Chuyển bang chủ, cooldown rời/gia nhập và giải tán có thời gian chờ.
- [ ] Boss bang bản đầu dùng các đội 4 người đóng góp tiến độ chung.
- [ ] Test permission race, spam apply/donate, nhiều người cùng đóng góp.

**Gate hoàn thành:** vòng tạo/gia nhập → đóng góp → tham gia hoạt động → nhận thưởng hoạt động chạy thật; role và ngân quỹ không bị lạm dụng bằng command sai.

### P8 — Nội dung V1 cấp 60 và các hệ nâng cấp sau

**Ước lượng:** 4–6 tuần hoặc hơn tùy art/nhiệm vụ. **Phụ thuộc:** P7.

- [ ] Thanh Mộc và Thổ Sơn, 5 phái đầy đủ 8 kỹ năng/phái.
- [ ] Level cap 60, tuyến nhiệm vụ 31–60, Lạc Dương + 3 bãi quái mới.
- [ ] Xích Diệm Địa Cung, Thiên Cơ Bí Cảnh và Võ Lâm Thử Thách tuần.
- [ ] Ba boss thế giới, participation reward và quota không lách channel.
- [ ] Gear tier 40/50/60, Truyền thuyết hạn chế, vài set bonus.
- [ ] Cường hóa +15, kế thừa theo transaction 2 item.
- [ ] Nâng boss bang sang 12 người nếu đạt benchmark; nếu chưa đạt, hoàn thiện mô hình đội 4 người theo tiến độ chung.
- [ ] Daily/weekly/guild UI, token exchange và lịch sự kiện.
- [ ] Playtest sâu về phái hỗ trợ/tank, pacing 30–60 và nguồn/tiêu bạc.

**Gate hoàn thành:** toàn bộ phạm vi V1 ở mục 2 có nội dung và hành vi thật; không chỉ menu placeholder; công bố rõ quy mô boss bang phát hành.

### P9 — Closed alpha, sửa lỗi và chuẩn bị public

**Ước lượng:** 2–4 tuần. **Phụ thuộc:** P8; một phần monitoring/test bắt đầu sớm hơn.

- [ ] Test xuyên suốt toàn bộ luồng tài khoản tới guild/boss endgame.
- [ ] 5–10 người playtest rồi alpha 20–50 người, thu dữ liệu và sửa onboarding.
- [ ] Tải 100 CCU phân room trên cấu hình ghi rõ, soak 2 giờ và network test.
- [ ] Backup/restore, deploy/restart/drain, incident runbook.
- [ ] Admin tối thiểu, report/mute/ban/audit, password recovery nếu mở public email.
- [ ] Hoàn thiện asset được phép dùng, âm thanh, UI tiếng Việt và hỗ trợ lỗi.
- [ ] Kiểm tra chi phí vận hành, mức giới hạn room và chính sách dữ liệu.
- [ ] Chốt README, hướng dẫn chơi, known issues và release notes.

**Gate phát hành V1:** không có lỗi duplication/double spend/quyền nghiêm trọng chưa giải quyết; functional và load gates đạt; backup restore đã thử; có người chịu trách nhiệm vận hành.

### P10 — Mở rộng sau V1, không là điều kiện bàn giao V1

- [ ] Đấu trường 1v1/3v3 với chỉ số/hệ số riêng, xếp hạng mùa.
- [ ] Thử ngũ hành tương khắc đủ 5 phái nếu phù hợp.
- [ ] Chợ/giao dịch có escrow, chống duplication, quota và ledger.
- [ ] Gem/socket, kinh mạch hoặc pet: chọn một hệ mở rộng sau khi đo game hiện tại.
- [ ] Click-to-move, auto tìm NPC và mobile control.
- [ ] Sự kiện mùa, đồ ngoại hình, nội dung mới và cân bằng định kỳ.
- [ ] Multi-process/multi-server chỉ sau khi metrics chứng minh cần.
- [ ] Monetization nếu có: thiết kế riêng, ưu tiên ngoại hình; không tự thêm vào scope hiện tại.

## 28. Backlog ưu tiên và thứ tự phụ thuộc

Các mức ưu tiên bên dưới độc lập với mã giai đoạn P0–P10 ở mục 27.

### 28.1. Ưu tiên 0 — Bắt buộc để game chơi được

- Movement/map/collision/camera.
- Combat/AI/HP/death/XP/level.
- Loot/pickup/inventory/equipment.
- Character/account/save/server authority.
- Sect/skill/ultimate.
- Enhancement/cost/pity.
- Quest/tutorial.
- Solo dungeon/boss/reward claim.

### 28.2. Ưu tiên 1 — Bắt buộc để hoàn thành yêu cầu V1

- Party/instance/reconnect/loot cá nhân.
- Nhiều loại phụ bản, world boss.
- Guild/membership/permissions/contribution/activity.
- Cấp 60, đủ 5 phái, nội dung theo tier.
- UI đầy đủ, moderation tối thiểu, monitoring/backup.

### 28.3. Ưu tiên 2 — Có thể chờ sau V1

- PvP, công thành, giao dịch, chợ.
- Pet/thú cưỡi/kinh mạch/ngọc.
- Mobile/touch, click-to-move, visual editor.
- Những hiệu ứng đẹp hơn chưa ảnh hưởng đọc gameplay.

Phụ thuộc chính:

```text
Foundation → Movement → Combat prototype → Online/save
            → Loot/equipment/enhancement → Sect/quest/solo dungeons
            → Party/instances → Guild → V1 content → Release gates
```

Art, validator, tests, UX và vận hành đi cùng từng mốc, không để toàn bộ tới cuối. Nếu cắt thời gian, giảm số map/asset/nhiệm vụ của bản thử; không cắt authority, transaction và kiểm thử những đường kinh tế đã phát hành.

## 29. Definition of Done

Một tính năng được coi là xong khi:

- [ ] Có hành vi thật theo yêu cầu và các trạng thái thất bại thường gặp.
- [ ] Có UI tiếng Việt, feedback chờ/thành công/lỗi phù hợp.
- [ ] Server xác thực mọi hành động làm thay đổi dữ liệu online.
- [ ] State lưu đúng nếu tính năng cần persistence; reload/reconnect không phá tiến trình.
- [ ] Race/retry được kiểm tra nếu có tiền, đồ, thưởng, quota hoặc quyền.
- [ ] Có test phù hợp với rủi ro, có kết quả thật; không thay test gameplay bằng kiểm tra cú pháp.
- [ ] Không có lỗi console/server nghiêm trọng trong đường thao tác.
- [ ] Nội dung/asset có ID, schema và nguồn sử dụng rõ.
- [ ] Tài liệu vận hành/README/content cập nhật khi ảnh hưởng workflow.
- [ ] Người khác làm lại được đường demo từ trạng thái sạch.

Đối với bản release, còn phải đạt kiểm thử tích hợp/browser/tải theo phạm vi công bố, có backup restore và danh sách giới hạn đã biết.

## 30. Rủi ro chính và cách xử lý

| Rủi ro | Dấu hiệu | Cách xử lý |
| --- | --- | --- |
| Scope phình thành MMO lớn | Thêm hệ mới trước khi vòng chơi đầu hoạt động | Giữ các gate, hoãn PvP/chợ/pet, ưu tiên ít nội dung nhưng hoàn chỉnh |
| Combat không vui | Quái chỉ là cục HP, chiêu không khác nhau | Playtest từ P2, telegraph, cooldown, vị trí và vai trò rõ |
| Mất/nhân đôi đồ | Retry/race/restart cho kết quả khác | Transaction, unique keys, requestId, ledger và test đồng thời |
| Lag ở quái/tổ đội đông | Tick vượt 50 ms, WS queue tăng | Spatial hash, cap room, pathfinding cache, load test trước scale |
| Phái hỗ trợ không solo được | Tốn gấp nhiều lần thời gian cùng cấp | Duy trì skill damage đủ, test chung budget, không gate healer |
| Cường hóa gây bỏ game | Nhiều phiên không tăng sức mạnh | Pity, không vỡ/tụt đồ, token/nguồn đá bảo đảm, kế thừa ở V1 |
| Lạm phát bạc | Nguồn vượt nơi tiêu, mua/bán lặp có lời | Ledger/metrics, kiểm tra loop, điều chỉnh cost/source |
| Content chậm hơn code | Ít map/quest, asset không thống nhất | Dữ liệu có schema, tái dùng tileset/sprite, template quest và ngân sách asset |
| Boss làm khó do mạng | Chết trước khi telegraph hiện đủ lâu | Test RTT, tăng khoảng báo, timing server rõ, nội suy hợp lý |
| Bang bị lạm quyền | Người mới bị kick mất thưởng, quỹ thiếu log | Role server, khóa quyền khi boss, log và eligibility bền vững |
| Chỉ bản local chạy | Backend mãi là mock, client tự cấp đồ | P3 chuyển authority sớm, test online trước thêm nhiều content |
| Ước lượng quá ngắn | Tồn nhiều task chưa test | Rà mỗi gate, đo thực tế, cập nhật lịch và giữ scope bàn giao rõ |

## 31. Chi phí, vai trò và quản lý công việc

### 31.1. Vai trò cần đảm nhiệm

- Lập trình gameplay/client: movement, render, UI và feedback.
- Backend/simulation: authority, room, auth, transaction, persistence.
- Game design/content: phái, quái, boss, quest, loot/economy và playtest.
- Art/audio: asset thống nhất và đủ đọc gameplay.
- QA/vận hành: test chức năng, tải, release, backup và hỗ trợ alpha.

Một người có thể kiêm nhiều vai, nhưng thời gian làm từng vai vẫn phải tính. AI hỗ trợ viết code/content không thay thế playtest và xác minh giao dịch/hiệu năng.

### 31.2. Chi phí cần dự trù

- Domain/TLS qua nhà cung cấp phù hợp, hosting game server, PostgreSQL/storage backup.
- Asset/âm thanh/icon nếu mua, hoặc thời gian làm thủ công.
- Telemetry/email nếu dùng, bandwidth và lưu log có giới hạn.
- Môi trường staging và thời gian hỗ trợ/khôi phục sự cố.
- Không chốt số tiền trước chọn vùng/provider và đo tải; dự trù theo alpha nhỏ trước, scale theo số liệu thật.

### 31.3. Quy tắc cập nhật kế hoạch

- Mỗi milestone tạo issue/task theo mục tiêu có gate, người phụ trách và dependency.
- Thay đổi scope/version ghi vào PLAN và decision log, không chỉ chat.
- Báo riêng: đã code, đã test local, đã test online, đã deploy và đã playtest.
- Nếu feature chưa có backend hoặc chưa có content, không ghi hoàn thành chỉ vì giao diện đã vẽ.
- Sau P2 đánh giá combat; sau P5 đánh giá pacing; sau P6 đánh giá network; sau P8 đánh giá toàn hành trình.

## 32. Checklist nghiệm thu toàn bộ yêu cầu người dùng

- [ ] Chơi được trên web bằng nhân vật 2D chuyển động.
- [ ] Tạo và lưu nhân vật, có cấp độ và chỉ số.
- [ ] Gia nhập môn phái có vai trò và bộ võ công khác nhau.
- [ ] Học, nâng chiêu và mở tuyệt chiêu qua tiến trình.
- [ ] Đánh quái cày cấp, quái sinh lại, có tinh anh và loot.
- [ ] Trang bị rớt xuống, nhặt, so sánh, mặc, quản lý túi/kho.
- [ ] Cường hóa có nguyên liệu, bạc, tỷ lệ và bảo hiểm; server lưu đúng.
- [ ] Boss có cơ chế và phần thưởng, không chỉ HP lớn.
- [ ] Nhiều phụ bản khác nhau, solo và tổ đội, cấp độ/phần thưởng rõ.
- [ ] Tổ đội online, giao tiếp và nhận loot công bằng.
- [ ] Tạo/gia nhập bang, quản lý quyền, đóng góp, hoạt động và thưởng bang.
- [ ] Reload/reconnect/restart không mất giao dịch đã xác nhận hoặc nhân đôi đồ.
- [ ] Hình ảnh/animation đơn giản nhưng đọc được đòn đánh, vị trí và trạng thái.
- [ ] Bản V1 có hướng dẫn chơi, kiểm thử, monitoring, backup và giới hạn vận hành rõ.

## 33. Công việc đầu tiên khi bắt đầu lập trình

1. Triển khai P0: workspace và app có scene Phaser chạy được.
2. Tạo một map nhỏ với NPC, 3 quái và một lối tới boss.
3. Hoàn thiện movement/collision/camera và vòng chiến đấu của một phái.
4. Thử vòng chơi 15 phút, chỉnh cảm giác đánh/di chuyển trước khi nhân nội dung.
5. Đưa gameplay sang server authority và lưu dữ liệu sớm ở P3.
6. Mở rộng theo các gate P4–P9 cho tới đủ các hệ được yêu cầu.

Sản phẩm đầu tiên cần nhìn thấy là một vòng chơi thật: **di chuyển → đánh quái → lên cấp → nhặt/mặc đồ → dùng chiêu → đánh boss**. Từ nền đó mới tăng số phái, bản đồ, phụ bản và bang hội.
