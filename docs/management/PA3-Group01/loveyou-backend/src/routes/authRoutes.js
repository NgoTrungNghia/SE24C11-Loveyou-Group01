const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const validate = require('../middlewares/validationMiddleware');
const schemas = require('../validation/authSchemas');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/signup', validate(schemas.signupSchema), controller.signup);
router.post('/login', validate(schemas.loginSchema), controller.login);
router.post('/logout', authMiddleware, controller.logout);
router.post('/forgot-password', validate(schemas.forgotPasswordSchema), controller.forgotPassword);
router.post('/verify-otp', validate(schemas.verifyOtpSchema), controller.verifyOtp);
router.post('/reset-password', validate(schemas.resetPasswordSchema), controller.resetPassword);

module.exports = router;
