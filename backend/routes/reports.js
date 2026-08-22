const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAdvancedReport } = require('../controllers/reportsController');

router.get('/advanced', protect, authorize('admin'), getAdvancedReport);

module.exports = router;
