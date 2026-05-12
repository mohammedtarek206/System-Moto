const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const Product = require('../models/Product');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateSettings = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.logo = `/uploads/${req.file.filename}`;
    const settings = await Settings.findOneAndUpdate({}, data, { new: true, upsert: true });
    res.json({ success: true, message: 'تم حفظ الإعدادات', data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ user: req.user.id }, { user: null }]
    }).sort({ createdAt: -1 }).limit(50);
    
    const unreadCount = await Notification.countDocuments({
      $or: [{ user: req.user.id }, { user: null }],
      isRead: false
    });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'تم تحديث حالة الإشعار' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ user: req.user.id }, { user: null }] },
      { isRead: true }
    );
    res.json({ success: true, message: 'تم تحديد الكل كمقروء' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.checkLowStock = async () => {
  try {
    const products = await Product.find({ isActive: true });
    const lowItems = products.filter(p => p.quantity <= p.minQuantity);
    
    for (const item of lowItems) {
      const existing = await Notification.findOne({
        title: { $regex: item.name },
        createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
      });

      if (!existing) {
        await Notification.create({
          title: `Low Stock: ${item.name}`,
          titleAr: `نقص مخزون: ${item.nameAr || item.name}`,
          message: `Product ${item.name} has only ${item.quantity} units left.`,
          messageAr: `المنتج ${item.nameAr || item.name} متبقي منه ${item.quantity} قطع فقط.`,
          type: 'warning'
        });
      }
    }
  } catch (err) { console.error('Low stock check error:', err.message); }
};
