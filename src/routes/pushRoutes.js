const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');

router.post('/subscribe', pushController.subscribe);
router.post('/unsubscribe', pushController.unsubscribe);

module.exports = router;
