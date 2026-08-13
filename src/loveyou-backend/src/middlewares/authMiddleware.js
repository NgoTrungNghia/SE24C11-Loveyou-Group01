const { verifyAccessToken } = require('../utils/token');
const prisma = require('../utils/prismaClient');

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' } });
  }
  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;

    // Check if user is BANNED in database
    const dbUser = await prisma.user.findUnique({
      where: { userId: payload.userId },
      select: { status: true },
    });

    if (dbUser && dbUser.status === 'BANNED') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Tài khoản của bạn đã bị khóa, vui lòng sử dụng tài khoản khác',
          code: 'ACCOUNT_BANNED',
        },
      });
    }

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token', code: 'UNAUTHORIZED' } });
  }
}

module.exports = authMiddleware;
