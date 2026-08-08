# BÁO CÁO KÊ KHAI SỬ DỤNG AI (AI USAGE REPORT) - PA4

- **Dự án:** Ứng dụng Hẹn hò LoveYou
- **Sinh viên thực hiện:** Nguyễn Minh Hoàng
- **Nhánh Git:** `Hoang---Tan`

---

## 1. Mục Đích & Phạm Vi Áp Dụng (Objectives & Scope)

Báo cáo này tuân thủ **Quy định Sử dụng Trí tuệ Nhân tạo (AI Usage Guidelines)** của Khoa Công nghệ Thông tin - Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM.  

Tất cả việc sử dụng các công cụ AI trong giai đoạn **PA4 (Project Activity 4)** được kê khai minh bạch, minh chứng học thuật rõ ràng, đảm bảo sinh viên hiểu rõ 100% mã nguồn và kiến trúc hệ thống đã triển khai.

---

## 2. Nguyên Tắc Cốt Lõi (Core Principles Checklist)

| Nguyên tắc | Mô tả tuân thủ | Trạng thái |
| :--- | :--- | :---: |
| **Transparency (Minh bạch)** | Kê khai đầy đủ công cụ AI, mốc thời gian, prompt và các phần code/tài liệu được hỗ trợ. | **ĐÃ TUÂN THỦ** |
| **Understanding (Thấu hiểu)** | Sinh viên trực tiếp kiểm thử, hiểu rõ và có khả năng giải trình 100% logic mã nguồn. | **ĐÃ TUÂN THỦ** |
| **No Blind Copying (Không sao chép mù)** | Không copy nguyên bản code AI; tất cả logic được tùy chỉnh theo đúng thiết kế của dự án. | **ĐÃ TUÂN THỦ** |
| **Academic Integrity (Liêm chính)** | Kiểm chứng dữ liệu thực tế bằng unit test, lệnh `npm run dev`, `npx prisma db push` và kiểm tra DB. | **ĐÃ TUÂN THỦ** |

---

## 3. Kê Khai Chi Tiết Sử Dụng AI (AI Usage Notes)

### 3.1. Thông Tin Công Cụ (Tool Information)
- **Tên công cụ AI:** Gemini Antigravity Agent (Google DeepMind).
- **Nền tảng & Phiên bản:** Antigravity IDE / VS Code Agent Environment.
- **Thời gian truy cập:** Ngày 07 - 08 tháng 08 năm 2026.

---

### 3.2. Bảng Tóm Tắt Nhiệm Vụ & Nhật Ký Prompt (Prompt Log & Tasks)

#### Task 1: Thiết lập Wizard Hồ sơ người dùng 3 Bước (Feature 003 - Onboarding Profile Wizard)
- **Mục đích sử dụng AI:** Gợi ý cấu trúc nén ảnh trực tiếp trên trình duyệt bằng HTML5 Canvas và xây dựng Form 3 bước chuẩn Tinder.
- **Prompt chính:**  
  > *"ngay chỗ thêm ảnh tôi muốn các cái ô chứa ảnh khi tôi click vô ô chứa ảnh đều có thể thêm trực tiếp ảnh vô từ máy... sửa thành tối đa 4 tấm ảnh cho cân đối (1 hàng 2 ảnh, tổng 2 hàng)... thêm ràng buộc ngày sinh không thuộc tương lai và từ 18 đến 100 tuổi."*
- **Nội dung AI tạo ra:** Đoạn mã mẫu sử dụng `canvas.toDataURL('image/jpeg', 0.7)` để nén ảnh xuống 600px và logic tính tuổi.
- **Phần sinh viên tự thực hiện & Kiểm thử:**
  - Tùy chỉnh CSS `photo-slot-card` khớp với Design System trong [index.css](file:///c:/Users/Admin/OneDrive%20-%20VNU-HCMUS/Desktop/SE24C11-Loveyou-Group01/src/loveyou-frontend/src/index.css).
  - Tích hợp Zod Schema kiểm tra độ tuổi 18–100 tại Backend [profileSchemas.js](file:///c:/Users/Admin/OneDrive%20-%20VNU-HCMUS/Desktop/SE24C11-Loveyou-Group01/src/loveyou-backend/src/validation/profileSchemas.js).

---

#### Task 2: Giao diện Quẹt Thẻ Hẹn Hò & Quản lý Match (Feature 004 - Matching & Swiping Deck)
- **Mục đích sử dụng AI:** Hỗ trợ viết logic gợi ý người dùng (Candidate Pool), hiệu ứng hover phóng to 2 nút Tinder và modal xem chi tiết hồ sơ đối phương.
- **Prompt chính:**  
  > *"giới hạn bot mặc định ở giao diện match xuống 5, còn những tài khoản đã tạo hồ sơ vẫn có thể gặp nhau... thêm chức năng hủy match... khi đã hủy match rồi thì trên database cx phải xóa việc tôi và họ đã match nhau."*
- **Nội dung AI tạo ra:** Cấu hình 5 Bot candidate mẫu, hàm `unmatchUser` xóa bản ghi `Match` và `Swipe` trong PostgreSQL.
- **Phần sinh viên tự thực hiện & Kiểm thử:**
  - Viết lại hàm `handleSwipe` và `handleUnmatch` trong [Dashboard.jsx](file:///c:/Users/Admin/OneDrive%20-%20VNU-HCMUS/Desktop/SE24C11-Loveyou-Group01/src/loveyou-frontend/src/pages/Dashboard.jsx).
  - Chạy `npx prisma studio` để xác nhận xóa bản ghi thành công trong PostgreSQL Database.

---

#### Task 3: Tinh chỉnh Giao diện Đăng nhập Tối giản (Minimalist Auth Forms)
- **Mục đích sử dụng AI:** Loại bỏ các icon không cần thiết ở ô nhập liệu giao diện Đăng nhập / Đăng ký.
- **Prompt chính:**  
  > *"ở giao diện đăng nhập xóa các icon ổ khóa, hình con người..."*
- **Nội dung AI tạo ra:** Loại bỏ các prop `icon` trong các trang `Login.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`.
- **Phần sinh viên tự thực hiện & Kiểm thử:**
  - Kiểm tra căn chỉnh layout và padding chuẩn `padding: 0 1rem` trong CSS.

---

#### Task 4: Xây dựng Sơ đồ Kiến trúc C4 Level 3 Frontend
- **Mục đích sử dụng AI:** Gợi ý cú pháp Mermaid C4Component cho mô hình thành phần Frontend SPA.
- **Nội dung AI tạo ra:** Cấu trúc Mermaid C4Component thể hiện luồng dữ liệu từ React Router -> AuthContext -> Axios API -> Express Backend.
- **Phần sinh viên tự thực hiện & Kiểm thử:**
  - Biên tập hoàn chỉnh file [FrontendComponentC4.md](file:///c:/Users/Admin/OneDrive%20-%20VNU-HCMUS/Desktop/SE24C11-Loveyou-Group01/docs/management/PA4/FrontendComponentC4.md).

---

## 4. Kết Quả Kiểm Thử & Xác Nhận (Validation Results)

| Hạng mục kiểm thử | Phương pháp kiểm thử | Kết quả |
| :--- | :--- | :---: |
| **Nén ảnh & Tải ảnh** | Tải ảnh 10MB từ máy tính ➔ Kiểm tra chuỗi Canvas Base64. | **Thành công (~60KB/ảnh)** |
| **Độ tuổi Ngày sinh** | Thử chọn ngày tương lai & năm sinh 2010 (dưới 18 tuổi). | **Báo lỗi chính xác** |
| **Hủy Ghép đôi (Unmatch)** | Bấm Hủy Match ➔ Mở Prisma Studio kiểm tra bảng `Match` & `Swipe`. | **Xóa sạch bản ghi 100%** |
| **Git Push** | Đẩy mã nguồn lên nhánh `Hoang---Tan`. | **Commit thành công** |

---

## 5. Cam Kết Liêm Chính Học Thuật (Declaration)

> **Cam kết:** *"Tôi xin cam đoan toàn bộ nội dung mã nguồn và báo cáo trong giai đoạn PA4 đã được tôi kiểm tra, thử nghiệm và thấu hiểu hoàn toàn. Việc sử dụng công cụ AI trợ giúp chỉ dừng lại ở mức gợi ý cấu trúc mã và tối ưu hóa giao diện, không thay thế quá trình học tập và tư duy độc lập của bản thân."*
