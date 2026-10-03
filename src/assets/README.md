# Hình 2D đơn giản, nhẹ

Theo yêu cầu người dùng: hình phẳng, ít màu, ít chi tiết và nhẹ trên điện thoại.

`simple-atlas.webp` là ảnh duy nhất game cần tải: **19.044 byte**, 384 × 384 px, nền trong suốt, tối đa 64 màu. Atlas 4 × 4 chứa 16 ô 96 × 96 px. Mỗi sprite nằm trọn trong ô, có khoảng trống xung quanh; tọa độ ở `src/art.ts`.

| Hàng | Nội dung từ trái sang phải                                              |
| ---- | ----------------------------------------------------------------------- |
| 1    | Kiếm khách Kim Phong, hỏa pháp Xích Diệm, thủy pháp Huyền Thủy, sơn tặc |
| 2    | Sói, Lang Vương, bọ, u binh                                             |
| 3    | Người dẫn đường, thợ rèn, cổng phụ bản, boss cổ mộ                      |
| 4    | Kiếm, lửa, băng và túi loot                                             |

Ảnh được tạo riêng bằng công cụ tạo ảnh OpenAI ngày 02/10/2026 theo mô tả cartoon 2D đơn giản: mặt tròn, mắt chấm, áo trơn, vũ khí ít nét, không họa tiết cầu kỳ. PNG gốc được đóng lại thành các ô đều nhau, thu nhỏ, giới hạn bảng màu và xuất WebP lossless. Không tải asset bên thứ ba.

Nền Rừng Trúc, phụ bản, cây và đá dùng hình học Canvas trong `src/map-art.ts`, không có file ảnh nền/cảnh vật. Nền được vẽ một lần trên canvas 950 × 600 và tái sử dụng; nền phụ bản chỉ tạo khi người chơi vào đó. Vật cản được vẽ theo cùng dữ liệu collider của gameplay. Minimap dùng chung nền đã lưu.

Game vẽ tối đa 30 FPS; mô phỏng/input vẫn theo vòng cập nhật hiện có. Minimap cập nhật khoảng 5 lần/giây. Kỹ năng dùng vòng tròn/cung đơn giản, không tạo gradient toàn màn hình; UI không cần backdrop blur.

Ngân sách cho atlas: dưới 32 KB. Nếu mở rộng nội dung, ưu tiên dùng lại sprite/đổi màu và giữ ít chi tiết. Ảnh đại diện tiếp tục dùng atlas; nhân vật trong sân đấu dùng các bộ phận vẽ trên Canvas trong `src/combat-art.ts`: tay/chân, áo, đầu và vũ khí được đặt theo pha bước, hướng nhìn và động tác đánh/thi triển/lướt. Pha bước tính từ quãng đường thật trong `src/combat.ts`, nên đứng sát vật cản không chạy tại chỗ. Có hướng mặt trước, bên và lưng, không cần tải atlas animation mới.

Hiệu ứng dùng hình học Canvas: vệt chém, đạn theo ngũ hành, vòng phép, mảnh va chạm, hồi phục và khiên. Đạn có thời gian bay và xử lý sát thương khi tới; đồ rơi có bật/nảy, màu phẩm chất, cột sáng cho đồ hiếm và bay về người nhặt. Mỗi sân đấu giữ tối đa 72 hiệu ứng, 60 chữ nổi, 16 xác quái và 24 vật phẩm bay; đồ rơi vượt 120 được thu hồi an toàn vào hành trang/đồ chờ. Trang bị trên đất được lưu, không tự mất vì hết hạn.

Bộ ảnh chi tiết trước đây (khoảng 2,06 MB) được thay thế; có thể khôi phục từ commit `c2e3511` trong lịch sử Git. Asset mới giảm dữ liệu ảnh tải khoảng **99,1%**. URL ảnh vẫn được Vite xử lý cho đường dẫn GitHub Pages `/volam/`.
