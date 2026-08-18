# Work Breakdown Structure: 010-vip-subscription-payos

- [x] **Task 10.1: Database Schema & Migration**
  - Add `Payment` model and `isVip`, `vipUntil` to `User` in `prisma/schema.prisma`.
  - Execute `npx prisma db push` or migration.
- [x] **Task 10.2: PayOS SDK Integration & Backend Service**
  - Install `@payos/node`.
  - Implement `createPaymentLink`, `handleWebhook`, and `getPaymentStatus` in `src/services/paymentService.js`.
  - Setup routes in `src/routes/paymentRoutes.js` and controller in `src/controllers/paymentController.js`.
- [x] **Task 10.3: Who Liked Me VIP Gating**
  - Update `getWhoLikedMe` in `src/services/matchingService.js` to return masked counts for non-VIP and full objects for VIP.
- [x] **Task 10.4: Frontend VIP UI & Checkout Flow**
  - Implement `VipModal.jsx` with pricing options and checkout triggers.
  - Implement iframe breakout and query parameter handler in `Dashboard.jsx`.
  - Add VIP glowing effects and badges across profile cards.
