const paymentService = require('../services/paymentService');
const { success } = require('./baseController');

async function createPaymentLink(req, res, next) {
  try {
    const userId = req.user.userId;
    const { returnUrl, cancelUrl } = req.body || {};
    const result = await paymentService.createVipPaymentLink(userId, returnUrl, cancelUrl, req.body);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function handleWebhook(req, res, next) {
  try {
    const result = await paymentService.processWebhook(req.body);
    
    // Broadcast Socket.io event if upgraded
    if (result.success && result.userId) {
      const io = req.app.get('io');
      if (io) {
        const onlineUsers = req.app.get('onlineUsers');
        const userSockets = onlineUsers?.get(Number(result.userId));
        if (userSockets) {
          userSockets.forEach(socketId => {
            io.to(socketId).emit('vip_upgraded', {
              userId: result.userId,
              isVip: true,
              message: '🎉 Chúc mừng bạn đã nâng cấp thành công Tài khoản VIP LoveYou!',
            });
          });
        }
      }
    }

    return res.status(200).json({ error: 0, message: 'Ok', data: result });
  } catch (err) {
    console.error('[PayOS Webhook Controller Error]:', err);
    return res.status(200).json({ error: -1, message: err.message, data: null });
  }
}

async function getStatus(req, res, next) {
  try {
    const { orderCode } = req.params;
    const statusInfo = await paymentService.getPaymentStatus(orderCode);
    if (!statusInfo) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }
    return success(res, { payment: statusInfo });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createPaymentLink,
  handleWebhook,
  getStatus,
};
