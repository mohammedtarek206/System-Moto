const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAdvancedReport } = require('../controllers/reportsController');

router.get('/advanced', protect, getAdvancedReport);

module.exports = router;
