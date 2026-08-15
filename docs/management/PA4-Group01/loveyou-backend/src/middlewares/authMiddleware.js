const { verifyAccessToken } = require('../utils/token');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' } });
  }
  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token', code: 'UNAUTHORIZED' } });
  }
}

module.exports = authMiddleware;
