const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create-payment-link', authMiddleware, controller.createPaymentLink);
router.post('/payos-webhook', controller.handleWebhook);
router.get('/status/:orderCode', authMiddleware, controller.getStatus);
router.post('/toggle-vip-demo', authMiddleware, controller.toggleVipDemo);

module.exports = router;
