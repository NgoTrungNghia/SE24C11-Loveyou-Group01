const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

// All admin endpoints require authentication and ADMIN role
router.use(authMiddleware, roleMiddleware('ADMIN'));

// GET /api/admin/stats
router.get('/stats', adminController.getStats);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:id
router.get('/users/:id', adminController.getUserById);

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', adminController.toggleBanStatus);

// GET /api/admin/reports
router.get('/reports', adminController.getReports);

// PUT /api/admin/reports/:id/status
router.put('/reports/:id/status', adminController.updateReportStatus);

module.exports = router;
