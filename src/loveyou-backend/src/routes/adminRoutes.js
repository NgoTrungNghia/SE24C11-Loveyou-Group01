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

// GET /api/admin/config/api-key  — Lấy Gemini API key (masked, chỉ admin)
router.get('/config/api-key', adminController.getApiKey);

// PUT /api/admin/config/api-key  — Cập nhật Gemini API key
router.put('/config/api-key', adminController.setApiKey);

// GET /api/admin/citizen-verifications — Danh sách yêu cầu xác thực CCCD
router.get('/citizen-verifications', adminController.getCitizenVerifications);

// PUT /api/admin/citizen-verifications/:userId/approve — Duyệt xác thực CCCD
router.put('/citizen-verifications/:userId/approve', adminController.approveCitizenVerification);

// PUT /api/admin/citizen-verifications/:userId/reject — Từ chối xác thực CCCD
router.put('/citizen-verifications/:userId/reject', adminController.rejectCitizenVerification);

module.exports = router;
