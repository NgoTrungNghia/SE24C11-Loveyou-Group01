# Architectural Plan: 010-vip-subscription-payos

## Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as Frontend (VipModal / Dashboard)
    participant BE as Backend API (/payment)
    participant PayOS as PayOS Payment Gateway
    participant DB as PostgreSQL (Prisma)

    User->>FE: Bấm "Nâng cấp VIP ngay" (99,000 VND)
    FE->>BE: POST /api/payment/create-payment-link
    BE->>DB: Tạo bản ghi Payment (status = PENDING, orderCode)
    BE->>PayOS: payos.createPaymentLink({ orderCode, amount, returnUrl, cancelUrl })
    PayOS-->>BE: Trả về checkoutUrl
    BE-->>FE: { checkoutUrl }
    FE->>PayOS: Redirect sang trang thanh toán VietQR
    User->>PayOS: Quét mã QR bằng App Ngân Hàng để chuyển khoản
    PayOS->>BE: POST /api/payment/webhook (Signature verified)
    BE->>DB: Cập nhật Payment.status = PAID, User.isVip = true
    BE->>FE: WebSocket emit 'vip_upgraded'
    PayOS->>FE: Redirect về returnUrl?payment=success
    FE->>FE: Iframe breakout & hiển thị Toast thông báo thành công
```

## Component Breakdown

1. **`src/services/paymentService.js`**:
   - `createPaymentLink(userId, returnUrl, cancelUrl)`: Generates orderCode, stores in DB, requests PayOS checkout URL.
   - `handleWebhook(webhookData)`: Verifies checksum, updates payment status, upgrades user to VIP, emits socket notification.
   - `getPaymentStatus(orderCode)`: Queries PayOS / DB for order settlement status.
2. **`src/controllers/paymentController.js` & `src/routes/paymentRoutes.js`**:
   - `POST /api/payment/create-payment-link`
   - `POST /api/payment/webhook`
   - `GET /api/payment/status/:orderCode`
3. **Frontend Components**:
   - `src/components/VipModal.jsx`: Modal displaying VIP package benefits and handling checkout trigger.
   - `src/pages/Dashboard.jsx`: Handles `returnUrl?payment=success`, iframe breakout, and realtime `vip_upgraded` socket listener.
