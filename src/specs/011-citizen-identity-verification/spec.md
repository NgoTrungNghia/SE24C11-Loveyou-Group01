# Feature Specification: Citizen Identity Verification (eKYC / CCCD Verification)

**Feature Branch**: `011-citizen-identity-verification`  
**Created**: 2026-08-18  
**Status**: Approved / Implemented  

---

## 1. Overview & Context

To combat catfishing, fake accounts, and spam, LoveYou provides a **Căn cước công dân (CCCD) eKYC Identity Verification** feature.
- Users upload front and back photos of their Vietnamese National Citizen ID card.
- Client-side OCR (`Tesseract.js`) and QR scanning (`jsQR`) automatically extract Citizen ID number, Full Name, Date of Birth, Gender, Address, and Issue Date.
- Users submit the extracted information and photos for review.
- System administrators inspect the document photos and OCR details in the Admin Panel to either **Approve** or **Reject** (with explicit reason).
- Verified users receive a prestigious **Verified Badge (Tích xanh xác minh)** on their profile, gaining elevated trust and permission to submit user violation reports.

---

## 2. Actors & Permissions

- **Unverified User (`citizenVerificationStatus: 'NONE' | 'REJECTED'`)**: Can upload photos, run client-side OCR extraction, edit extracted fields, and submit for verification.
- **Pending User (`citizenVerificationStatus: 'PENDING'`)**: Waiting for Admin moderation; cannot resubmit until reviewed.
- **Verified User (`citizenVerificationStatus: 'APPROVED'`, `isCitizenVerified: true`)**: Displays green verified checkmark badge across deck, chat, and profile cards.
- **Admin**: Can view pending verification requests, compare photos with extracted OCR text, and approve or reject submissions.

---

## 3. User Stories & Acceptance Criteria

### User Story 1 — CCCD Upload & Client OCR Extraction (Priority: P1)
As a user, I want to upload front/back photos of my CCCD so that OCR technology can automatically fill in my identity information.

**Acceptance Criteria**:
1. In User Settings modal -> Tab "Xác thực danh tính", user uploads front and back photos of CCCD.
2. `Tesseract.js` automatically performs OCR text extraction on image upload.
3. `jsQR` scans the QR code in the top right corner of the CCCD (if present) to parse official identity string.
4. Extracted fields (Số CCCD, Họ tên, Ngày sinh, Giới tính, Quê quán/Địa chỉ, Ngày cấp) are auto-populated into the form for user review.

### User Story 2 — Submit Verification Application (Priority: P1)
As a user, I want to submit my identity verification application so that administrators can verify my identity.

**Acceptance Criteria**:
1. Clicking "Gửi yêu cầu xác thực" calls `POST /api/users/verify-citizen`.
2. Backend saves citizen info and photos, setting `citizenVerificationStatus = 'PENDING'` and `isCitizenVerified = false`.
3. UI updates to show "Đang chờ quản trị viên duyệt".

### User Story 3 — Admin Review, Approval & Rejection (Priority: P1)
As an administrator, I want to inspect submitted CCCD photos and decide whether to approve or reject the application.

**Acceptance Criteria**:
1. Admin queries `GET /api/admin/verifications` to view all pending/reviewed verification requests.
2. Admin opens detail view comparing the front/back photos with the extracted name, ID number, and date of birth.
3. Clicking "Duyệt hồ sơ" calls `PUT /api/admin/verifications/:userId/approve`, setting `isCitizenVerified = true`, `citizenVerificationStatus = 'APPROVED'`, and emits `citizen_verification_result` socket event.
4. Clicking "Từ chối" requires entering a rejection reason and calls `PUT /api/admin/verifications/:userId/reject`, setting `citizenVerificationStatus = 'REJECTED'` and storing `citizenRejectReason`.

---

## 4. Functional Requirements

- **FR-011-1**: Client-side OCR MUST use `Tesseract.js` worker and `jsQR` for lightweight, real-time image processing.
- **FR-011-2**: Backend MUST store base64/URL photos and citizen fields in `users` table.
- **FR-011-3**: Real-time Socket.io notification `citizen_verification_result` MUST be sent to the user when Admin makes a decision.
- **FR-011-4**: Verified users (`isCitizenVerified: true`) MUST have `VerifiedBadge` rendered next to their name in all views.
