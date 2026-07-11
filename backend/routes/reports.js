const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOilsReport,
  getSparePartsReport,
  getMotorcyclesReport,
  getScootersReport
} = require('../controllers/reportsController');

router.get('/oils', protect, getOilsReport);
router.get('/spare-parts', protect, getSparePartsReport);
router.get('/motorcycles', protect, getMotorcyclesReport);
router.get('/scooters', protect, getScootersReport);

module.exports = router;
