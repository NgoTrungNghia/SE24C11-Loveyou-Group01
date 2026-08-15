const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const supportController = require('../controllers/supportController');

// All support endpoints require authentication
router.use(authMiddleware);

// ── USER ROUTES ──
// GET /api/support/my-conversation
router.get('/my-conversation', supportController.getMyConversation);

// POST /api/support/send
router.post('/send', supportController.sendUserMessage);

// ── ADMIN ROUTES (Requires ADMIN role) ──
// GET /api/support/admin/conversations
router.get('/admin/conversations', roleMiddleware('ADMIN'), supportController.getAdminConversations);

// GET /api/support/admin/conversations/:conversationId/messages
router.get('/admin/conversations/:conversationId/messages', roleMiddleware('ADMIN'), supportController.getAdminConversationMessages);

// GET /api/support/admin/conversations/user/:userId
router.get('/admin/conversations/user/:userId', roleMiddleware('ADMIN'), supportController.getAdminConversationByUserId);

// POST /api/support/admin/conversations/:conversationId/send
router.post('/admin/conversations/:conversationId/send', roleMiddleware('ADMIN'), supportController.sendAdminMessage);

// PATCH /api/support/admin/conversations/:conversationId/read
router.patch('/admin/conversations/:conversationId/read', roleMiddleware('ADMIN'), supportController.markAdminRead);

module.exports = router;
