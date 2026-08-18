# Architectural Plan: 011-citizen-identity-verification

## Architecture Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant OCR as Tesseract.js & jsQR (Client)
    participant FE as Frontend (UserSettingsModal)
    participant BE as Backend API (/users & /admin)
    participant Admin as Quản trị viên (AdminModal)
    participant DB as PostgreSQL (Prisma)

    User->>FE: Tải ảnh mặt trước & mặt sau CCCD
    FE->>OCR: Chạy OCR nhận diện chữ & quét mã QR
    OCR-->>FE: Trích xuất số CCCD, Họ tên, Ngày sinh, v.v.
    User->>FE: Kiểm tra & bấm "Gửi yêu cầu xác thực"
    FE->>BE: POST /api/users/verify-citizen (payload + photos)
    BE->>DB: Cập nhật citizenVerificationStatus = 'PENDING'
    Admin->>BE: GET /api/admin/verifications
    BE-->>Admin: Danh sách hồ sơ CCCD đang chờ duyệt
    Admin->>BE: PUT /api/admin/verifications/:userId/approve
    BE->>DB: citizenVerificationStatus = 'APPROVED', isCitizenVerified = true
    BE->>FE: Socket.io emit 'citizen_verification_result'
    FE-->>User: Hiển thị Toast chúc mừng & cấp Tích Xanh VerifiedBadge
```

## Component Breakdown

1. **Client-side OCR (`src/components/UserSettingsModal.jsx`)**:
   - Canvas-based image loading, preprocessing, Tesseract worker recognition, and jsQR code matrix decoding.
2. **Backend Controllers & Services**:
   - `src/controllers/userController.js`: `verifyCitizen` handler.
   - `src/services/userService.js`: Updates user verification details in DB.
   - `src/controllers/adminController.js`: `getVerificationRequests`, `approveVerification`, `rejectVerification`.
   - `src/services/adminService.js`: Admin decision logic and socket event dispatch.
3. **UI Badges (`src/components/VerifiedBadge.jsx`)**:
   - Reusable green verified checkmark icon.
