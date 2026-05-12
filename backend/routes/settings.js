const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getNotifications, markNotificationRead, markAllRead } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), upload.single('logo'), updateSettings);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllRead);

module.exports = router;
