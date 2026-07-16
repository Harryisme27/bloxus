Thư mục này dùng để chứa ảnh thật (ảnh vật phẩm, ảnh game, ảnh proof giao dịch...)
nếu bạn muốn thay ảnh CSS giả lập bằng ảnh thật.

Hiện tại (bản demo) KHÔNG cần bỏ ảnh vào đây. Toàn bộ ảnh vật phẩm/game đang được
vẽ bằng CSS (gradient theo màu accentColor của từng game + chữ cái đầu tên vật
phẩm) trong các component như GameCard.tsx và ProductCard.tsx. Cách này giúp demo
chạy mượt mà không cần chuẩn bị ảnh.

Nếu muốn dùng ảnh thật:
1. Bỏ file ảnh vào đây, ví dụ: public/images/adopt-me-cover.jpg
2. Trong file src/data/games.ts hoặc src/data/items.ts, sửa trường bannerUrl /
   iconUrl / imageUrl thành "/images/ten-file-anh.jpg"
3. Component sẽ tự động hiển thị ảnh thật thay vì placeholder CSS.
