# Architectural Plan: 012-live-support-chat

## Real-time Support Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as SupportChatModal (Client)
    participant BE as Backend API (/support)
    participant Socket as Socket.io Server
    participant Admin as Admin Dashboard
    participant DB as PostgreSQL (Prisma)

    User->>FE: Gõ tin nhắn hỗ trợ "Tôi cần hỗ trợ nâng cấp VIP"
    FE->>BE: POST /api/support/messages
    BE->>DB: Lưu SupportMessage (isFromAdmin = false)
    BE->>Socket: emit 'new_support_message_to_admin'
    Socket-->>Admin: Hiển thị thông báo tin nhắn hỗ trợ mới
    Admin->>BE: POST /api/admin/support/messages { userId, content }
    BE->>DB: Lưu SupportMessage (isFromAdmin = true)
    BE->>Socket: emit 'new_support_reply_to_user'
    Socket-->>FE: Hiển thị tin nhắn trả lời từ Admin trong khung chat
```

## Component Breakdown

1. **`src/services/supportService.js`**:
   - `getOrCreateSupportConversation(userId)`
   - `sendUserSupportMessage(userId, content)`
   - `sendAdminSupportReply(adminId, userId, content)`
   - `getAllSupportConversations()`
2. **`src/routes/supportRoutes.js` & `src/controllers/supportController.js`**:
   - `GET /api/support/messages`
   - `POST /api/support/messages`
   - `GET /api/admin/support/conversations`
   - `POST /api/admin/support/messages`
3. **Frontend Components**:
   - `src/components/SupportChatModal.jsx`: User chat widget.
   - `src/pages/AdminDashboard.jsx` / `src/components/AdminModal.jsx`: Support conversation manager tab.
