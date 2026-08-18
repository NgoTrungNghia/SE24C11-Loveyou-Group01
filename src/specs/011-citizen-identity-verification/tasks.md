# Work Breakdown Structure: 011-citizen-identity-verification

- [x] **Task 11.1: Database Schema for Citizen Verification**
  - Add citizen fields (`isCitizenVerified`, `citizenIdNumber`, `citizenVerificationStatus`, etc.) to `User` model in `schema.prisma`.
- [x] **Task 11.2: Client-side OCR Pipeline**
  - Install `tesseract.js` and `jsqr`.
  - Implement image upload handler, canvas preprocessing, OCR recognition worker, and QR parser in `UserSettingsModal.jsx`.
- [x] **Task 11.3: Backend Submission API**
  - Create `POST /api/users/verify-citizen` in `userRoutes.js` and `userService.js`.
- [x] **Task 11.4: Admin Verification Moderation Portal**
  - Implement `GET /api/admin/verifications`, `PUT /api/admin/verifications/:userId/approve`, `PUT /api/admin/verifications/:userId/reject` in `adminService.js`.
  - Add CCCD inspection tab in `AdminModal.jsx` / `AdminDashboard.jsx`.
  - Dispatch real-time Socket event `citizen_verification_result`.
- [x] **Task 11.5: UI Verified Badge Component**
  - Create `VerifiedBadge.jsx` and embed across Dashboard, Chat, and Profile views.
