# Quickstart & Verification: 011-citizen-identity-verification

## Testing Identity Verification Flow

1. **Người dùng tải ảnh & chạy OCR**:
   - Đăng nhập tài khoản thường.
   - Mở Cài đặt tài khoản (icon bánh răng) -> Tab **Xác thực danh tính**.
   - Tải lên ảnh CCCD mặt trước và mặt sau.
   - `Tesseract.js` chạy nhận diện và tự điền thông tin vào các trường (Số CCCD, Họ tên, Ngày sinh, Địa chỉ).
   - Bấm **Gửi yêu cầu xác thực**.
2. **Quản trị viên xét duyệt**:
   - Đăng nhập tài khoản `admin@loveyou.com` / `123456`.
   - Vào mục **Duyệt Căn cước công dân (CCCD)**.
   - Nhấp vào hồ sơ chờ duyệt, đối chiếu ảnh chụp và thông tin OCR.
   - Bấm **Duyệt hồ sơ** (hoặc Từ chối).
3. **Xác minh kết quả**:
   - Tài khoản người dùng nhận được thông báo Toast chúc mừng qua Socket.io.
   - Thẻ hồ sơ của người dùng hiển thị tích xanh `VerifiedBadge`.
