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

// رابط طوارئ لإعادة تعيين الباسورد - امسحه بعد الاستخدام
router.get('/force-reset-admin', async (req, res) => {
  try {
    const User = require('../models/User');
    await User.deleteMany({ email: 'admin@motoparts.com' });
    const admin = new User({
      name: 'مدير النظام',
      email: 'admin@motoparts.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    });
    await admin.save();
    res.send('✅ Admin password has been forced to: Admin@123');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
