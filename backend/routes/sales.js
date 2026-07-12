const express = require('express');
const router = express.Router();
const { 
  createSale, 
  getSales, 
  getSale, 
  cancelSale,
  migrateOldSales
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.post('/migrate-history', protect, migrateOldSales);
router.get('/:id', protect, getSale);
router.put('/:id/cancel', protect, cancelSale);

module.exports = router;
