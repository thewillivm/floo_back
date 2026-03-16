const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');

// POST /api/withdrawals/request
router.post('/request', withdrawalController.requestWithdrawal);

module.exports = router;
