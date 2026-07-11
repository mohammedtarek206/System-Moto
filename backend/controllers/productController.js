const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// ===================== PRODUCTS =====================

exports.getProducts = async (req, res) => {
  try {
    const { 
      category, search, moto_type, low_stock, 
      product_type, brand, model, condition,
      page = 1, limit 
    } = req.query;

    let query = {};
    if (category) query.category = category;
    if (moto_type) query.motoType = moto_type;
    if (product_type) query.productType = product_type;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (condition) query.condition = condition;

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { nameAr: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { barcode: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { chassisNo: new RegExp(search, 'i') },
        { engineNo: new RegExp(search, 'i') },
      ];
    }

    // Low stock filter
    if (low_stock === 'true') {
      const products = await Product.find(query).populate('category').populate('supplier', 'name');
      const filtered = products.filter(p => p.quantity <= (p.minQuantity || 5));
      return res.json({ success: true, data: filtered, total: filtered.length, page: 1, limit: filtered.length });
    }

    const limitVal = limit ? parseInt(limit) : 10000;
    const skipVal = limit ? (parseInt(page) - 1) * limitVal : 0;

    const products = await Product.find(query)
      .populate('category')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 })
      .limit(limitVal)
      .skip(skipVal);
      
    const total = await Product.countDocuments(query);
    res.json({ success: true, data: products, total, page: parseInt(page), limit: limitVal });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').populate('supplier', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
      data.image = data.images[0];
    } else if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
      data.images = [data.image];
    }

    // Remove empty category to avoid cast errors
    if (!data.category || data.category === '') delete data.category;
    if (!data.supplier || data.supplier === '') delete data.supplier;

    // Auto-generate SKU and Barcode FIRST (before any checks)
    if (!data.sku || data.sku.trim() === '') {
      const prefix = data.productType === 'motorcycles' ? 'MOTO' : 
                     data.productType === 'scooters' ? 'SCT' :
                     data.productType === 'oils' ? 'OIL' : 'SKU';
      data.sku = `${prefix}-${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    if (!data.barcode || data.barcode.trim() === '') {
      let code;
      let exists = true;
      while (exists) {
        code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const duplicate = await Product.findOne({ barcode: code });
        if (!duplicate) exists = false;
      }
      data.barcode = code;
    }

    // Parse numeric/boolean fields from form-data strings
    ['buyPrice', 'sellPrice', 'quantity', 'minQuantity', 'year', 'engineCC'].forEach(f => {
      if (data[f] !== undefined && data[f] !== '') data[f] = Number(data[f]);
    });

    // Parse images array if sent as JSON string
    if (typeof data.images === 'string') {
      try { data.images = JSON.parse(data.images); } catch { data.images = [data.images]; }
    }

    // Check for existing product by barcode or sku or name (only if name provided)
    let existingProduct = await Product.findOne({ barcode: data.barcode });
    if (!existingProduct && data.sku) existingProduct = await Product.findOne({ sku: data.sku });
    if (!existingProduct && data.name) existingProduct = await Product.findOne({ name: data.name });

    if (existingProduct) {
      const addedQty = Number(data.quantity) || 0;
      existingProduct.quantity = (existingProduct.quantity || 0) + addedQty;
      if (data.sellPrice && Number(data.sellPrice) > 0) existingProduct.sellPrice = Number(data.sellPrice);
      if (data.buyPrice && Number(data.buyPrice) > 0) existingProduct.buyPrice = Number(data.buyPrice);
      await existingProduct.save();
      return res.status(200).json({ success: true, message: 'المنتج موجود مسبقاً، تم تحديث الكمية بنجاح', data: existingProduct });
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
    const cleanBarcode = barcode.trim();
    
    const product = await Product.findOne({
      $or: [
        { barcode: { $regex: new RegExp(`^${cleanBarcode}$`, 'i') } },
        { sku: { $regex: new RegExp(`^${cleanBarcode}$`, 'i') } }
      ]
    }).populate('category');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود في قاعدة البيانات بهذا الباركود أو الرمز (SKU)' });
    }
    
    res.json({ success: true, data: product });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
      data.image = data.images[0];
    } else if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    if (!data.category || data.category === '') delete data.category;
    if (!data.supplier || data.supplier === '') delete data.supplier;

    ['buyPrice', 'sellPrice', 'quantity', 'minQuantity', 'year', 'engineCC'].forEach(f => {
      if (data[f] !== undefined && data[f] !== '') data[f] = Number(data[f]);
    });

    if (typeof data.images === 'string') {
      try { data.images = JSON.parse(data.images); } catch { data.images = [data.images]; }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('category').populate('supplier', 'name');
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

// ===================== CATEGORIES =====================

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
    const products = await Product.find({ isActive: true }).populate('category');
    const filtered = products.filter(p => p.quantity <= (p.minQuantity || 5));
    res.json({ success: true, data: filtered });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== INVENTORY STATS =====================

exports.getInventoryStats = async (req, res) => {
  try {
    const allProducts = await Product.find({ isActive: true }).populate('category').lean();
    
    const lowStock = allProducts.filter(p => p.quantity > 0 && p.quantity <= (p.minQuantity || 5));
    const outOfStock = allProducts.filter(p => p.quantity <= 0);
    
    // Stagnant: products not sold in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const Sale = require('../models/Sale');
    const recentSales = await Sale.find({ 
      createdAt: { $gte: thirtyDaysAgo },
      status: { $ne: 'cancelled' }
    }).select('items.product').lean();
    
    const soldProductIds = new Set();
    recentSales.forEach(s => s.items.forEach(i => soldProductIds.add(String(i.product))));
    
    const stagnant = allProducts.filter(p => 
      p.quantity > 0 && !soldProductIds.has(String(p._id))
    );

    // Total inventory value
    const totalValue = allProducts.reduce((acc, p) => acc + (p.buyPrice * p.quantity), 0);
    const totalSellValue = allProducts.reduce((acc, p) => acc + (p.sellPrice * p.quantity), 0);

    res.json({ 
      success: true, 
      data: {
        total: allProducts.length,
        lowStock,
        outOfStock,
        stagnant,
        totalValue,
        totalSellValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        stagnantCount: stagnant.length,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
