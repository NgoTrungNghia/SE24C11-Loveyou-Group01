const { PayOS } = require('@payos/node');
const prisma = require('../utils/prismaClient');
const config = require('../config');

const clientId = process.env.PAYOS_CLIENT_ID || config.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY || config.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || config.PAYOS_CHECKSUM_KEY;

const payOS = new PayOS({ clientId, apiKey, checksumKey });

const VIP_PRICE = 3000; // 3,000 VND

/**
 * Generate a unique numeric orderCode for PayOS (integer max 9007199254740991)
 */
function generateOrderCode() {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.floor(Math.random() * 900 + 100).toString();
  return Number(timestamp + random);
}

/**
 * Create a Payment Link via PayOS (supports VIP, Skins, Items, Coins, Boosts)
 */
async function createVipPaymentLink(userId, returnUrl, cancelUrl, options = {}) {
  const orderCode = generateOrderCode();
  const type = options.type || 'VIP';
  const itemId = options.itemId || null;
  const amount = options.amount || VIP_PRICE;
  const metadata = options.metadata ? (typeof options.metadata === 'string' ? options.metadata : JSON.stringify(options.metadata)) : null;

  const rawDesc = options.description || (type === 'VIP' ? 'Nang cap VIP LoveYou' : `Mua ${type} ${itemId || ''}`);
  const description = rawDesc.slice(0, 25);
  const defaultReturn = returnUrl || 'http://localhost:5173/dashboard?payment=success';
  const defaultCancel = cancelUrl || 'http://localhost:5173/dashboard?payment=cancel';

  const body = {
    orderCode,
    amount,
    description,
    returnUrl: defaultReturn,
    cancelUrl: defaultCancel,
  };

  let paymentLinkRes;
  if (typeof payOS.createPaymentLink === 'function') {
    paymentLinkRes = await payOS.createPaymentLink(body);
  } else if (payOS.paymentRequests && typeof payOS.paymentRequests.create === 'function') {
    paymentLinkRes = await payOS.paymentRequests.create(body);
  } else {
    throw new Error('PayOS payment creation method not available');
  }

  // Save payment in Database
  await prisma.payment.create({
    data: {
      orderCode: BigInt(orderCode),
      userId: Number(userId),
      type,
      itemId,
      amount,
      status: 'PENDING',
      payosLink: paymentLinkRes.checkoutUrl,
      description,
      metadata,
    },
  });

  return {
    orderCode,
    checkoutUrl: paymentLinkRes.checkoutUrl,
    amount,
    type,
    itemId,
    qrCode: paymentLinkRes.qrCode || null,
  };
}

/**
 * Verify and process PayOS Webhook notification
 */
async function processWebhook(webhookBody) {
  try {
    let verifiedData;
    try {
      if (payOS.webhooks && typeof payOS.webhooks.verify === 'function') {
        verifiedData = await payOS.webhooks.verify(webhookBody);
      } else if (typeof payOS.verifyPaymentWebhookData === 'function') {
        verifiedData = payOS.verifyPaymentWebhookData(webhookBody);
      } else if (typeof payOS.verifyWebhookData === 'function') {
        verifiedData = payOS.verifyWebhookData(webhookBody);
      } else {
        verifiedData = webhookBody.data || webhookBody;
      }
    } catch (verifyErr) {
      console.warn('[PayOS Signature Warning]:', verifyErr.message);
      verifiedData = webhookBody.data || webhookBody;
    }

    if (!verifiedData) {
      throw new Error('Invalid PayOS webhook signature or payload');
    }

    const orderCode = verifiedData.orderCode || webhookBody?.data?.orderCode;
    const code = verifiedData.code || webhookBody?.code || webhookBody?.data?.code;

    if (!orderCode) {
      throw new Error('Missing orderCode in webhook payload');
    }

    // "00" indicates success in PayOS
    if (code === '00' || webhookBody.code === '00' || webhookBody.success === true) {
      const payment = await prisma.payment.findFirst({
        where: { orderCode: BigInt(orderCode) },
      });

      if (payment) {
        // Update payment status to PAID
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID' },
        });

        let updatedUser = null;
        if (payment.type === 'VIP') {
          // Upgrade User to VIP!
          updatedUser = await prisma.user.update({
            where: { userId: payment.userId },
            data: {
              isVip: true,
              vipUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year VIP
            },
          });
        }

        return {
          success: true,
          userId: payment.userId,
          orderCode: Number(orderCode),
          type: payment.type,
          itemId: payment.itemId,
          user: updatedUser,
        };
      }
    }

    return { success: false, orderCode: Number(orderCode) };
  } catch (err) {
    console.error('[PayOS Webhook Error]:', err.message);
    throw err;
  }
}

/**
 * Check Payment Order Status & activate VIP if paid
 */
async function getPaymentStatus(orderCode) {
  const payment = await prisma.payment.findFirst({
    where: { orderCode: BigInt(orderCode) },
    include: {
      user: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          isVip: true,
        },
      },
    },
  });

  if (!payment) return null;

  // Check PayOS status online if pending
  if (payment.status === 'PENDING') {
    try {
      const payosInfo = await payOS.getPaymentLinkInformation(Number(orderCode));
      if (payosInfo && payosInfo.status === 'PAID') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID' },
        });
        await prisma.user.update({
          where: { userId: payment.userId },
          data: { isVip: true, vipUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        });
        payment.status = 'PAID';
        if (payment.user) payment.user.isVip = true;
      }
    } catch { /* ignore PayOS check errors */ }
  }

  return {
    orderCode: Number(payment.orderCode),
    amount: payment.amount,
    status: payment.status,
    userId: payment.userId,
    isVip: payment.user?.isVip || false,
    createdAt: payment.createdAt,
  };
}

/**
 * Manual/Direct test upgrade for demo purposes
 */
async function setVipStatus(userId, isVip = true) {
  const user = await prisma.user.update({
    where: { userId: Number(userId) },
    data: {
      isVip: Boolean(isVip),
      vipUntil: isVip ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
    },
  });
  return user;
}

module.exports = {
  createVipPaymentLink,
  processWebhook,
  getPaymentStatus,
  setVipStatus,
};
