const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/conversations', controller.getConversations);
router.get('/conversations/:matchId/init', controller.getOrCreateConversation);
router.get('/:conversationId/messages', controller.getMessages);
router.post('/:conversationId/messages', controller.sendMessage);
router.post('/:conversationId/clear', controller.clearConversation);
router.post('/:conversationId/detect-red-flags', controller.detectRedFlags);
router.put('/:conversationId/read', controller.markRead);

module.exports = router;
