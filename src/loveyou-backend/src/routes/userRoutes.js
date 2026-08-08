const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const validate = require('../middlewares/validationMiddleware');
const schemas = require('../validation/profileSchemas');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/me', controller.getProfile);
router.put('/me', validate(schemas.updateProfileSchema), controller.updateProfile);

module.exports = router;
