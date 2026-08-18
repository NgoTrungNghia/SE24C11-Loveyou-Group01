# Quickstart & Verification: 010-vip-subscription-payos

## Testing VIP Payment Flow

1. **Khởi chạy hệ thống**:
   ```bash
   cd src/loveyou-backend && npm run dev
   cd src/loveyou-frontend && npm run dev
   ```
2. **Thao tác thanh toán**:
   - Đăng nhập tài khoản tiêu chuẩn.
   - Bấm vào nút nổi VIP hình vương miện ở góc phải hoặc tab "Ai đã thích tôi".
   - Bấm nút "Nâng cấp VIP ngay (99.000đ)".
   - Hệ thống chuyển hướng sang cổng PayOS Test Sandbox.
   - Quét mã hoặc bấm nút thanh toán mô phỏng thành công trên PayOS.
   - Hệ thống chuyển hướng về `http://localhost:5173/dashboard?payment=success`.
3. **Xác minh quyền VIP**:
   - Thẻ của người dùng trên Deck và Header hiển thị huy hiệu `👑 VIP`.
   - Vào tab "Ai đã thích tôi" hiển thị đầy đủ avatar rõ nét và tên người đã like.
