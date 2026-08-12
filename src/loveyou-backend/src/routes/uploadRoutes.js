const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.post('/avatar', uploadController.uploadAvatar);
router.post('/photos', uploadController.uploadPhotos);

module.exports = router;
