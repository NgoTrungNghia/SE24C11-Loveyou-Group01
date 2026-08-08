const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { success } = require('../controllers/baseController');

// GET /api/admin/stats — ADMIN only
router.get('/stats', authMiddleware, roleMiddleware('ADMIN'), (req, res) => {
  return success(res, {
    message: 'Admin stats endpoint',
    requestedBy: req.user,
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      note: 'Stub — replace with real DB queries',
    },
  });
});

module.exports = router;
