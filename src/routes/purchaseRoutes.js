const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.createPurchase);
router.get('/user/:userId', purchaseController.getUserPurchases);

module.exports = router;
module.exports = router;
