const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    const user = await User.create({ name, email, password, role, phone });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح', token, user: { id: user._id.toString(), name: user.name, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    user.lastLogin = Date.now();
    await user.save();
    const token = generateToken(user._id);
    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', token, user: { id: user._id.toString(), name: user.name, role: user.role, email: user.email } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const data = { name, email, phone };
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, data, { new: true }).select('-password');
    res.json({ success: true, message: 'تم تحديث الملف الشخصي', data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'كلمة المرور القديمة غير صحيحة' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, message: 'تم تحديث بيانات المستخدم', data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
