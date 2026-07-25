const jwt = require('jsonwebtoken');
const config = require('../config');

function createAccessToken(payload) {
  const secret = config.JWT_SECRET || 'dev-secret';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  return token;
}

function verifyAccessToken(token) {
  const secret = config.JWT_SECRET || 'dev-secret';
  return jwt.verify(token, secret);
}

module.exports = { createAccessToken, verifyAccessToken };
