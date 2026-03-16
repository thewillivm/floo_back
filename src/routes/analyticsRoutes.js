const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/stats/:creatorId', analyticsController.getCreatorStats);
router.get('/earnings/:creatorId', analyticsController.getEarningsStats);

module.exports = router;
