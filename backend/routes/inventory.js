const express = require('express');
const router = express.Router();
const { getLogs, addLog } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/logs', protect, authorize('admin'), getLogs);
router.post('/log', protect, authorize('admin'), addLog);

module.exports = router;
