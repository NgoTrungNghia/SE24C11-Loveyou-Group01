const express = require('express');
const router = express.Router();
const controller = require('../controllers/matchingController');
const validate = require('../middlewares/validationMiddleware');
const schemas = require('../validation/matchingSchemas');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/candidates', controller.getCandidates);
router.post('/swipe', validate(schemas.swipeSchema), controller.swipe);
router.get('/matches', controller.getMatches);
router.post('/unmatch', controller.unmatch);

module.exports = router;
