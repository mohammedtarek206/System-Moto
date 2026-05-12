const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, getUsers, updateUser, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', protect, authorize('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
