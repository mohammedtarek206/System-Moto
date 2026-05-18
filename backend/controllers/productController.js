const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, moto_type, low_stock, page = 1, limit } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { nameAr: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { barcode: new RegExp(search, 'i') }
      ];
    }
    if (moto_type) query.motoType = moto_type;
    
    // Low stock filter
    if (low_stock === 'true') {
      const products = await Product.find(query).populate('category');
      const filtered = products.filter(p => p.quantity <= p.minQuantity);
      return res.json({ success: true, data: filtered, total: filtered.length, page: 1, limit: filtered.length });
    }

    const limitVal = limit ? parseInt(limit) : 10000;
    const skipVal = limit ? (parseInt(page) - 1) * limitVal : 0;

    const products = await Product.find(query)
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(limitVal)
      .skip(skipVal);
      
    const total = await Product.countDocuments(query);
    res.json({ success: true, data: products, total, page: parseInt(page), limit: limitVal });
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

    // Remove empty category to avoid cast errors
    if (!data.category || data.category === '') delete data.category;

    // Auto-generate SKU and Barcode FIRST (before any checks)
    if (!data.sku || data.sku.trim() === '') {
      data.sku = 'SKU-' + Date.now() + Math.floor(Math.random() * 1000);
    }
    if (!data.barcode || data.barcode.trim() === '') {
      let code;
      let exists = true;
      while (exists) {
        // Generate a random 10-digit number starting with a non-zero digit
        code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const duplicate = await Product.findOne({ barcode: code });
        if (!duplicate) exists = false;
      }
      data.barcode = code;
    }

    // Check if product already exists by barcode or sku or name
    let existingProduct = null;
    existingProduct = await Product.findOne({ barcode: data.barcode });
    if (!existingProduct) existingProduct = await Product.findOne({ sku: data.sku });
    if (!existingProduct && data.name) existingProduct = await Product.findOne({ name: data.name });

    if (existingProduct) {
      // Product exists — increment quantity only
      const addedQty = Number(data.quantity) || 0;
      existingProduct.quantity = (existingProduct.quantity || 0) + addedQty;
      if (data.sellPrice && Number(data.sellPrice) > 0) existingProduct.sellPrice = Number(data.sellPrice);
      if (data.buyPrice && Number(data.buyPrice) > 0) existingProduct.buyPrice = Number(data.buyPrice);
      await existingProduct.save();
      return res.status(200).json({ success: true, message: 'المنتج موجود مسبقاً، تم تحديث الكمية بنجاح', data: existingProduct });
    }

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({ success: false, message: 'اسم المنتج مطلوب' });
    }

    const product = await Product.create(data);
    res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode });
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, data: product });
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
