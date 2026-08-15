const express = require('express');
const router = express.Router();
const controller = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/create', controller.createGame);
router.get('/:sessionId', controller.getGame);
router.post('/:sessionId/answer', controller.submitAnswer);
router.get('/:sessionId/result', controller.getResult);

module.exports = router;
