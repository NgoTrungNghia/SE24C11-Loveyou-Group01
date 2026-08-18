# Quickstart & Verification: 012-live-support-chat

## Testing Live Support Chat

1. **Người dùng mở chat hỗ trợ**:
   - Đăng nhập tài khoản thường.
   - Nhấp vào icon **Hỗ trợ** (Support) ở Sidebar bên trái.
   - Giao diện `SupportChatModal` hiển thị.
   - Nhập tin nhắn và bấm gửi.
2. **Admin tiếp nhận và trả lời**:
   - Đăng nhập tài khoản `admin@loveyou.com`.
   - Vào mục **Hỗ trợ khách hàng** trong Admin Dashboard.
   - Chọn cuộc trò chuyện của người dùng vừa nhắn.
   - Nhập câu trả lời và bấm Gửi.
3. **Xác minh thời gian thực**:
   - Phía người dùng nhận được tin nhắn trả lời ngay lập tức qua Socket.io mà không cần F5 tải lại trang.
