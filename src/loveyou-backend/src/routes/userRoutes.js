const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const validate = require('../middlewares/validationMiddleware');
const schemas = require('../validation/profileSchemas');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/me', controller.getProfile);
router.put('/me', validate(schemas.updateProfileSchema), controller.updateProfile);
router.post('/block', controller.blockUser);
router.get('/blocked', controller.getBlockedUsers);
router.post('/unblock', controller.unblockUser);
router.post('/report', controller.reportUser);

module.exports = router;
