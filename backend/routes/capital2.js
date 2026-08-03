const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFullCapitalSummary } = require('../controllers/capitalController');

// Full capital summary endpoint
router.get('/full-summary', protect, getFullCapitalSummary);

module.exports = router;
