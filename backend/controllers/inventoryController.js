const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');

exports.getLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addLog = async (req, res) => {
  try {
    const { product, type, quantity, note } = req.body;
    
    // Get product info for the log
    const productInfo = await Product.findById(product);
    if (!productInfo) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });

    const log = await InventoryLog.create({
      product,
      productName: productInfo.name,
      type,
      quantity,
      note,
      user: req.user._id
    });

    // Update product quantity
    const qtyChange = type === 'in' ? quantity : -quantity;
    await Product.findByIdAndUpdate(product, { $inc: { quantity: qtyChange } });

    res.status(201).json({ success: true, message: 'تم تحديث المخزن بنجاح', data: log });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
