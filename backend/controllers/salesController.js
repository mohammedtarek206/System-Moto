const Sale = require('../models/Sale');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// ===================== CREATE SALE =====================
exports.createSale = async (req, res) => {
  try {
    const { customer, items, discount = 0, tax = 0, paymentMethod = 'cash', paidAmount, notes } = req.body;

    let subtotalBeforeDiscount = 0;  // مجموع الأسطر قبل أي خصم
    let totalItemDiscounts = 0;       // مجموع خصومات البنود
    let totalCost = 0;
    const saleItems = [];
    const saleCategories = new Set();

    // Calculate total and cost, and prepare items
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`المنتج غير موجود: ${item.product}`);
      if (product.quantity < item.quantity) throw new Error(`الكمية غير كافية للمنتج: ${product.name || product.brand || product.sku}`);

      const quantity = Number(item.quantity) || 0;
      const sellPrice = Number(item.sellPrice) || 0;      // السعر الفعلي المستخدم (كاشير أو أساسي)
      const itemDiscount = Math.max(0, Number(item.itemDiscount) || 0);  // خصم البند
      const lineSubtotal = sellPrice * quantity;           // إجمالي البند قبل الخصم
      const lineTotal = Math.max(0, lineSubtotal - itemDiscount); // إجمالي البند بعد الخصم

      subtotalBeforeDiscount += lineSubtotal;
      totalItemDiscounts += itemDiscount;
      totalCost += (product.buyPrice || 0) * quantity;

      const pt = product.productType || 'spare_parts';
      saleCategories.add(pt);

      saleItems.push({
        product: item.product,
        name: product.name || product.brand || product.sku,
        nameAr: product.nameAr || product.name || product.brand,
        productType: pt,
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        barcode: product.barcode || '',
        sku: product.sku || '',
        quantity,
        sellPrice,                           // السعر الفعلي المستخدم
        originalPrice: product.sellPrice,    // السعر الأساسي للمنتج
        cashierPrice: product.cashierPrice || null, // سعر الكاشير (إن وُجد)
        buyPrice: product.buyPrice,
        itemDiscount,
        total: lineTotal                     // إجمالي البند بعد الخصم
      });
    }

    // الإجمالي قبل خصم الفاتورة = مجموع البنود بعد خصوماتها
    const subtotalAfterItemDiscounts = subtotalBeforeDiscount - totalItemDiscounts;
    const invoiceDiscount = Math.max(0, Number(discount));
    const taxAmount = Math.max(0, Number(tax));
    const finalTotal = Math.max(0, subtotalAfterItemDiscounts - invoiceDiscount + taxAmount);

    // Determine sale category
    const cats = [...saleCategories];
    const saleCategory = cats.length === 1 ?
      (cats[0] === 'oils' ? 'oils' :
        cats[0] === 'motorcycles' ? 'motorcycles' :
          cats[0] === 'scooters' ? 'scooters' :
            cats[0] === 'spare_parts' ? 'spare_parts' : 'other')
      : 'mixed';

    const sale = await Sale.create({
      invoiceNumber: `INV-${Date.now()}`,
      customer: customer || null,
      user: req.user._id,
      items: saleItems,
      saleCategory,
      subtotal: subtotalBeforeDiscount,   // إجمالي قبل أي خصم
      discount: invoiceDiscount,           // خصم الفاتورة الكلي
      tax: taxAmount,
      total: finalTotal,
      totalAmount: finalTotal,
      totalCost,
      paidAmount: paidAmount ? Number(paidAmount) : finalTotal,
      changeAmount: paidAmount ? Math.max(0, Number(paidAmount) - finalTotal) : 0,
      paymentMethod,
      notes,
      status: 'completed'
    });

    // Update Stock for all product types
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -Number(item.quantity) } });
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name phone')
      .populate('user', 'name')
      .populate('items.product', 'name nameAr sku barcode productType brand model');

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'إنشاء فاتورة',
      details: { invoiceNumber: sale.invoiceNumber, total: sale.total, discount: invoiceDiscount }
    });

    res.status(201).json({ success: true, message: 'تم إتمام البيع بنجاح', data: populatedSale });
  } catch (err) {
    console.error('Sale Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== GET SALES (with advanced filters) =====================
exports.getSales = async (req, res) => {
  try {
    const {
      from_date, to_date, search,
      customer_id, user_id, payment_method, status,
      product_type, sale_category,
      min_price, max_price,
      invoice_number, customer_name, customer_phone,
      has_discount,
      sort_by = 'newest',
      page = 1, limit = 50
    } = req.query;

    let query = {};

    // Date filters
    if (from_date || to_date) {
      query.createdAt = {};
      if (from_date) query.createdAt.$gte = new Date(from_date);
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (req.user.role === 'cashier') {
      query.user = req.user._id;
    }

    // Status and payment
    if (status) query.status = status;
    if (payment_method) query.paymentMethod = payment_method;
    if (sale_category) query.saleCategory = sale_category;
    if (customer_id) query.customer = customer_id;
    if (user_id) query.user = user_id;

    // Price range
    if (min_price || max_price) {
      query.totalAmount = {};
      if (min_price) query.totalAmount.$gte = Number(min_price);
      if (max_price) query.totalAmount.$lte = Number(max_price);
    }

    // Invoice number filter
    if (invoice_number) query.invoiceNumber = new RegExp(invoice_number, 'i');

    // Discount filter
    if (has_discount === 'true') {
      query.$or = [{ discount: { $gt: 0 } }, { 'items.itemDiscount': { $gt: 0 } }];
    } else if (has_discount === 'false') {
      query.discount = { $eq: 0 };
    }

    // Product type filter (in items)
    if (product_type) {
      query['items.productType'] = product_type;
    }

    // Search by invoice number, customer name, phone, or product
    if (search) {
      const matchingProducts = await Product.find({
        $or: [
          { barcode: new RegExp(search, 'i') },
          { sku: new RegExp(search, 'i') },
          { name: new RegExp(search, 'i') },
          { brand: new RegExp(search, 'i') },
          { model: new RegExp(search, 'i') },
        ]
      }).select('_id');

      const Customer = require('../models/Customer');
      const matchingCustomers = await Customer.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') },
        ]
      }).select('_id');

      const productIds = matchingProducts.map(p => p._id);
      const customerIds = matchingCustomers.map(c => c._id);

      query.$or = [
        { invoiceNumber: new RegExp(search, 'i') },
        { 'items.product': { $in: productIds } },
        { customer: { $in: customerIds } },
      ];
    }

    // Customer name filter
    if (customer_name && !search) {
      const Customer = require('../models/Customer');
      const customers = await Customer.find({ name: new RegExp(customer_name, 'i') }).select('_id');
      query.customer = { $in: customers.map(c => c._id) };
    }

    // Customer phone filter
    if (customer_phone && !search) {
      const Customer = require('../models/Customer');
      const customers = await Customer.find({ phone: new RegExp(customer_phone, 'i') }).select('_id');
      query.customer = { $in: customers.map(c => c._id) };
    }

    // Cashier (employee) name filter
    const cashier = req.query.cashier;
    if (cashier && !search) {
      const User = require('../models/User');
      const matchingUsers = await User.find({ name: new RegExp(cashier, 'i') }).select('_id');
      query.user = { $in: matchingUsers.map(u => u._id) };
    }

    // Sort
    let sortObj = { createdAt: -1 };
    if (sort_by === 'oldest') sortObj = { createdAt: 1 };
    else if (sort_by === 'highest_price') sortObj = { totalAmount: -1 };
    else if (sort_by === 'lowest_price') sortObj = { totalAmount: 1 };

    const limitVal = parseInt(limit);
    const skipVal = (parseInt(page) - 1) * limitVal;

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('customer', 'name phone')
        .populate({ path: 'user', select: 'name' })
        .populate('items.product', 'name nameAr sku barcode productType brand model')
        .sort(sortObj)
        .skip(skipVal)
        .limit(limitVal),
      Sale.countDocuments(query)
    ]);

    res.json({ success: true, data: sales, total, page: parseInt(page), limit: limitVal });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== GET SINGLE SALE =====================
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('user', 'name')
      .populate('items.product');
    if (!sale) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    res.json({ success: true, data: sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== CANCEL SALE =====================
exports.cancelSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    if (sale.status === 'cancelled') return res.status(400).json({ success: false, message: 'الفاتورة ملغاة بالفعل' });

    // Restore stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }

    sale.status = 'cancelled';
    await sale.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'إلغاء فاتورة',
      details: { invoiceNumber: sale.invoiceNumber }
    });

    res.json({ success: true, message: 'تم إلغاء الفاتورة وإرجاع الكميات للمخزن' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== MIGRATE OLD SALES =====================
exports.migrateOldSales = async (req, res) => {
  try {
    const sales = await Sale.find({});
    let migratedCount = 0;

    for (const sale of sales) {
      let needsUpdate = false;

      for (const item of sale.items) {
        // If old data missing crucial snapshot fields like productType or name
        if (!item.productType || !item.name) {
          needsUpdate = true;

          if (item.product) {
            const product = await Product.findById(item.product);
            if (product) {
              item.name = product.name || product.brand || product.sku || 'منتج غير معروف';
              item.nameAr = product.nameAr || product.name || item.name;
              item.productType = product.productType || 'spare_parts';
              item.category = product.category || '';
              item.brand = product.brand || '';
              item.model = product.model || '';
              item.barcode = product.barcode || '';
              item.sku = product.sku || '';
              // Also ensure buyPrice is stored for accurate historical profit
              if (!item.buyPrice) item.buyPrice = product.buyPrice || 0;
              // Ensure originalPrice is set for old records
              if (!item.originalPrice) item.originalPrice = product.sellPrice || item.sellPrice || 0;
              // Ensure itemDiscount defaults to 0 for old records
              if (item.itemDiscount === undefined || item.itemDiscount === null) item.itemDiscount = 0;
              // Recalculate total if missing
              if (!item.total) item.total = (item.sellPrice || 0) * (item.quantity || 1);
            } else {
              // Product was deleted, fallback to minimal defaults
              item.name = 'منتج محذوف';
              item.nameAr = 'منتج محذوف';
              item.productType = 'other';
              if (!item.buyPrice) item.buyPrice = 0;
              if (item.itemDiscount === undefined || item.itemDiscount === null) item.itemDiscount = 0;
              if (!item.total) item.total = (item.sellPrice || 0) * (item.quantity || 1);
            }
          }
        } else {
          // For records that have name/productType but may be missing new fields
          if (item.itemDiscount === undefined || item.itemDiscount === null) {
            item.itemDiscount = 0;
            needsUpdate = true;
          }
          if (!item.total) {
            item.total = (item.sellPrice || 0) * (item.quantity || 1);
            needsUpdate = true;
          }
          if (!item.originalPrice) {
            item.originalPrice = item.sellPrice || 0;
            needsUpdate = true;
          }
        }
      }

      // Recalculate subtotal if it's missing
      if (!sale.subtotal && needsUpdate) {
        sale.subtotal = sale.items.reduce((acc, it) => acc + ((it.sellPrice || 0) * (it.quantity || 1)), 0);
      }

      if (needsUpdate) {
        // Recalculate totalCost just in case it was missing
        const newTotalCost = sale.items.reduce((acc, it) => acc + ((it.buyPrice || 0) * (it.quantity || 1)), 0);
        sale.totalCost = newTotalCost;
        await sale.save();
        migratedCount++;
      }
    }

    res.json({
      success: true,
      message: 'تم ترحيل وتحديث بيانات المبيعات القديمة بنجاح',
      migratedCount,
      totalSales: sales.length
    });
  } catch (err) {
    console.error('Migration Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
