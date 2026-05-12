const express = require('express');
const router = express.Router();
const { getLogs, addLog } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/logs', protect, getLogs);
router.post('/log', protect, addLog);

module.exports = router;
