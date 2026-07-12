const Sale = require('../models/Sale');
const Product = require('../models/Product');

// ===================== CREATE SALE =====================
exports.createSale = async (req, res) => {
  try {
    const { customer, items, discount = 0, tax = 0, paymentMethod = 'cash', paidAmount, notes } = req.body;
    
    let totalAmount = 0;
    let totalCost = 0;
    const saleItems = [];
    const saleCategories = new Set();

    // Calculate total and cost, and prepare items
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`المنتج غير موجود: ${item.product}`);
      if (product.quantity < item.quantity) throw new Error(`الكمية غير كافية للمنتج: ${product.name || product.brand || product.sku}`);

      totalAmount += item.sellPrice * item.quantity;
      totalCost += (product.buyPrice || 0) * item.quantity;

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
        quantity: item.quantity,
        sellPrice: item.sellPrice,
        buyPrice: product.buyPrice,
        total: item.sellPrice * item.quantity
      });
    }

    const subtotal = totalAmount;
    const finalTotal = subtotal - Number(discount) + Number(tax);

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
      subtotal,
      total: finalTotal,
      totalAmount: finalTotal,
      totalCost,
      discount: Number(discount),
      tax: Number(tax),
      paidAmount: paidAmount || finalTotal,
      changeAmount: paidAmount ? Math.max(0, paidAmount - finalTotal) : 0,
      paymentMethod,
      notes,
      status: 'completed'
    });

    // Update Stock for all product types
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name phone')
      .populate('user', 'name')
      .populate('items.product', 'name nameAr sku barcode productType brand model');

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
    res.json({ success: true, message: 'تم إلغاء الفاتورة وإرجاع الكميات للمخزن' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
