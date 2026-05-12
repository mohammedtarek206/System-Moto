const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, moto_type, low_stock, page = 1, limit = 10 } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }, { barcode: new RegExp(search, 'i') }];
    if (moto_type) query.motoType = moto_type;
    
    // Low stock filter
    if (low_stock === 'true') {
      const products = await Product.find(query).populate('category');
      const filtered = products.filter(p => p.quantity <= p.minQuantity);
      return res.json({ success: true, data: filtered, total: filtered.length, page: 1, limit: filtered.length });
    }

    const products = await Product.find(query)
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Product.countDocuments(query);
    res.json({ success: true, data: products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const product = await Product.create(data);
    res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح', data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, message: 'تم تحديث المنتج', data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'تم إضافة التصنيف', data: category });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'تم تحديث التصنيف', data: category });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    const filtered = products.filter(p => p.quantity <= p.minQuantity);
    res.json({ success: true, data: filtered });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
