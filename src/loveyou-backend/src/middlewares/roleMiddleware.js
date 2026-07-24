function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } });
    }
    return next();
  };
}

module.exports = requireRole;
