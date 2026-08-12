const express = require('express');
const router = express.Router();
const aiMatchingController = require('../controllers/aiMatchingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/ai-candidates', aiMatchingController.getAICandidates);
router.get('/preferences', aiMatchingController.getPreferences);
router.put('/preferences', aiMatchingController.updatePreferences);

module.exports = router;
