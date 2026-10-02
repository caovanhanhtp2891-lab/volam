# Bộ ảnh kiếm hiệp 2D

Tạo riêng cho **Giang Hồ Dị Truyện** bằng công cụ tạo ảnh OpenAI ngày 02/10/2026. Các ảnh dùng phong cách kiếm hiệp chibi vẽ tay, góc nhìn từ trên xuống. Không tải asset bên thứ ba.

| File | Nội dung | Cách sử dụng |
| --- | --- | --- |
| `wuxia-atlas.webp` | 3 nhân vật/phái; sơn tặc, sói, Lang Vương, bọ, u binh; người dẫn đường, thợ rèn, cổng phụ bản, boss cổ mộ; 3 icon chiêu và túi loot | 16 vùng ảnh; tọa độ chuẩn hóa được khai báo trong `src/art.ts` |
| `scenery-atlas.webp` | Đá rêu, bụi trúc, cây đào và cổng gỗ | Atlas 2 × 2; đá và trúc thể hiện các vật cản hiện có, đào/cổng dự trữ cho map tiếp theo |
| `thanh-khe.webp` | Bản đồ rừng trúc với đường đất, làng, hồ và hoa đào | Lớp nền thế giới và nền minimap; khung thế giới 1900 × 1200 |

Ảnh PNG gốc được xuất từ công cụ tạo ảnh, sau đó mã hóa WebP (quality 86–88) để giảm dữ liệu tải trên mobile. Atlas nhân vật/cảnh vật giữ nền trong suốt. Nạp qua URL của Vite để có tên file theo nội dung và hoạt động ở đường dẫn GitHub Pages `/volam/`.

Nhân vật hiện dùng sprite tĩnh kết hợp nhún/đảo hướng; chưa phải spritesheet đi bộ 4 hướng. Collider vẫn do gameplay định nghĩa, không được suy ra từ từng pixel của nền minh họa. Canvas giữ hình vẽ đơn giản làm phương án dự phòng khi ảnh chưa tải xong.

## Mô tả tạo ảnh

- Nhân vật: chibi kiếm khách áo trắng/vàng, hỏa pháp áo đỏ, thủy pháp áo xanh; quái, boss và NPC cùng ánh sáng/phong cách; các đối tượng tách biệt trên nền trong suốt, không chữ hay UI.
- Cảnh vật: đá xám phủ rêu, bụi trúc xanh, đào hồng và cổng làng có đèn lồng; các đối tượng riêng trên nền trong suốt.
- Bản đồ: làng rừng trúc sáng ban mai, lối đất giao nhau, đá rêu, hàng rào, nhà gỗ, hồ và cầu; vùng giữa dành cho di chuyển; không chứa nhân vật, quái hay giao diện.
