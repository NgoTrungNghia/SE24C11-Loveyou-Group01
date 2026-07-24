const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const validate = require('../middlewares/validationMiddleware');
const schemas = require('../validation/authSchemas');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/signup', validate(schemas.signupSchema), controller.signup);
router.post('/login', validate(schemas.loginSchema), controller.login);
router.post('/logout', authMiddleware, controller.logout);
router.post('/password-reset/request', validate(schemas.passwordResetRequestSchema), controller.passwordResetRequest);
router.post('/password-reset/confirm', validate(schemas.passwordResetConfirmSchema), controller.passwordResetConfirm);

module.exports = router;
