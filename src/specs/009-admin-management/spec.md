# Feature Specification: Admin Management & Moderation Portal (009)

**Feature Branch**: `009-admin-management`  
**Created**: 2026-08-13 (Updated: 2026-08-18)  
**Status**: Completed / Enhanced  

---

## 1. Overview & Context
Comprehensive administrative portal providing system analytics, user account inspection, real-time ban/unban enforcement with instant session revocation, user violation reports moderation, and citizen identity verification approvals.

---

## 2. Actors & Permissions
- **Admin (`role: ADMIN`)**: Full access to `/admin` routes, user ban controls, report moderation, CCCD verification, and system analytics.
- **User (`role: USER`)**: Restricted from all administrative endpoints.

---

## 3. User Stories & Acceptance Criteria

### User Story 1 — Admin Dashboard & System Overview (Priority: P1)
Admin logs in and accesses `/api/admin/stats` to view total user registrations, active counts, banned accounts, total matches, and pending moderation tickets.

### User Story 2 — User Account List & Details (Priority: P1)
Admin views paginated list of accounts (`GET /api/admin/users`), inspects photos, bio, phone, verified status, and registration date.

### User Story 3 — Real-time Account Ban & Session Revocation (Priority: P1)
Admin bans an abusive user (`PUT /api/admin/users/:userId/ban`). The database status updates to `BANNED`, and the server emits `account_banned` via Socket.io. The client immediately wipes JWT from localStorage and forces redirect to `/login?banned=true`. Middleware denies any subsequent requests with `403 ACCOUNT_BANNED`.

### User Story 4 — User Violation Reports Moderation (Priority: P1)
Admin views all user-submitted violation reports (`GET /api/admin/reports`) with reason, custom notes, reporter and reported user details. Admin can update report status (`PENDING` -> `REVIEWED` -> `RESOLVED`) and ban the offending user directly from the report modal.

### User Story 5 — Citizen Identity Verification Moderation (Priority: P1)
Admin views pending CCCD eKYC submissions (`GET /api/admin/verifications`), compares front/back ID photos with OCR extracted details, and approves (`isCitizenVerified: true`) or rejects with feedback reason.

---

## 4. Requirements

- **FR-009-1**: All `/api/admin/*` endpoints MUST be protected by `authMiddleware` and `roleMiddleware('ADMIN')`.
- **FR-009-2**: Banning a user MUST instantly broadcast `account_banned` via Socket.io to terminate active client sessions.
- **FR-009-3**: System MUST provide report management endpoints (`GET /api/admin/reports`, `PUT /api/admin/reports/:reportId/status`).
- **FR-009-4**: System MUST provide verification endpoints (`GET /api/admin/verifications`, `PUT /api/admin/verifications/:userId/approve`, `PUT /api/admin/verifications/:userId/reject`).
