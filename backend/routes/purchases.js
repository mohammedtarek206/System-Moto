const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase } = require('../controllers/purchasesController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getPurchases);
router.post('/', protect, authorize('admin', 'warehouse'), createPurchase);

module.exports = router;
