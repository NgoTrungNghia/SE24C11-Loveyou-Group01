# Feature Specification: VIP Subscription & PayOS Payment Gateway

**Feature Branch**: `010-vip-subscription-payos`  
**Created**: 2026-08-18  
**Status**: Approved / Implemented  

---

## 1. Overview & Context

LoveYou is a freemium dating platform where standard users have basic discovery and messaging capabilities. The **VIP Subscription** feature allows users to purchase VIP status via online banking QR code (VietQR) powered by the **PayOS Payment Gateway**. 

When upgraded to VIP:
- Users unlock the **"Ai đã thích tôi" (Who Liked Me)** tab with unblurred photos and full profile access.
- Profile cards on the dating swipe deck receive a gold glowing frame (**VIP Card Glow**) and a **👑 VIP Badge**.
- Users stand out with elevated discovery priority and enhanced visual prestige.

---

## 2. Actors & Permissions

- **Standard User (`isVip: false`)**: Can browse candidates, view blurred count of likes received in the "Ai đã thích tôi" tab, and initiate VIP upgrade checkout.
- **VIP User (`isVip: true`)**: Can view full profile details and unblurred photos of all users who liked them, enjoy VIP badge across chat and profile views.
- **PayOS Gateway (External Service)**: Generates secure checkout links and sends asynchronous Webhooks upon payment settlement.

---

## 3. User Stories & Acceptance Criteria

### User Story 1 — VIP Modal & Package Selection (Priority: P1)
As a standard user, I want to view the benefits of VIP membership in a modal and click to upgrade so that I can unlock premium features.

**Acceptance Criteria**:
1. Clicking the floating VIP button or the "Ai đã thích tôi" upgrade prompt opens `VipModal`.
2. The modal displays package benefits: Xem ai đã thích bạn, Huy hiệu VIP độc quyền, Nổi bật trên Deck tìm kiếm.
3. Clicking "Nâng cấp VIP ngay" calls `POST /api/payment/create-payment-link`.

### User Story 2 — VietQR Checkout & PayOS Redirect (Priority: P1)
As a user, I want to be redirected to a secure PayOS checkout page with a VietQR code so that I can transfer money using my banking app.

**Acceptance Criteria**:
1. Server generates an order code, amount (e.g. 99,000 VND), and requests a payment URL from PayOS SDK.
2. The user is redirected to PayOS checkout page displaying a standard VietQR NAPAS code.
3. If user cancels, PayOS redirects to `returnUrl?payment=cancel` and shows a cancellation toast.
4. If payment is successful, PayOS redirects to `returnUrl?payment=success` with Iframe breakout protection.

### User Story 3 — Webhook Processing & Auto-activation (Priority: P1)
As a system, I want to automatically activate VIP status when PayOS confirms the payment transaction so that the user immediately receives their benefits.

**Acceptance Criteria**:
1. PayOS sends a secure Webhook `POST /api/payment/webhook`.
2. Backend verifies the PayOS signature using `PAYOS_CHECKSUM_KEY`.
3. If valid and code is `00`, updates `Payment.status = 'PAID'` and sets `User.isVip = true`, extending `User.vipUntil` by 30 days.
4. Server emits `socket.emit('vip_upgraded', { isVip: true })` in real-time.

### User Story 4 — Unlocking "Who Liked Me" for VIPs (Priority: P2)
As a VIP user, I want to view all people who liked me without blur so that I can match with them instantly.

**Acceptance Criteria**:
1. `GET /api/matching/who-liked-me` checks `currentUser.isVip`.
2. If `isVip === false`, returns `{ isVip: false, totalCount: N, candidates: [] }`.
3. If `isVip === true`, returns `{ isVip: true, totalCount: N, candidates: [full_profile_objects] }`.

---

## 4. Functional Requirements

- **FR-010-1**: System MUST integrate PayOS Node.js SDK (`@payos/node`) using `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, and `PAYOS_CHECKSUM_KEY`.
- **FR-010-2**: System MUST generate unique integer `orderCode` for each payment transaction and store in `payments` table.
- **FR-010-3**: Webhook endpoint MUST verify transaction checksum before modifying user VIP status.
- **FR-010-4**: Frontend MUST implement Iframe Breakout to prevent the app from being trapped in PayOS payment iframes.
- **FR-010-5**: API `/matching/who-liked-me` MUST restrict candidate object details to VIP users only.
