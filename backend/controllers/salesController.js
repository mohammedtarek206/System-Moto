const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.createSale = async (req, res) => {
  try {
    const { customer, items, discount = 0, tax = 0, paymentMethod = 'cash', paidAmount, notes } = req.body;
    
    let totalAmount = 0;
    let totalCost = 0;
    const saleItems = [];

    // Calculate total and cost, and prepare items
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`المنتج غير موجود: ${item.product}`);
      if (product.quantity < item.quantity) throw new Error(`الكمية غير كافية للمنتج: ${product.name}`);

      totalAmount += item.sellPrice * item.quantity;
      totalCost += (product.buyPrice || 0) * item.quantity;
      
      saleItems.push({
        product: item.product,
        name: product.name,
        nameAr: product.nameAr || product.name,
        quantity: item.quantity,
        sellPrice: item.sellPrice,
        buyPrice: product.buyPrice,
        total: item.sellPrice * item.quantity
      });
    }

    const subtotal = totalAmount;
    const finalTotal = subtotal - Number(discount) + Number(tax);

    // Create Sale — save to both total and totalAmount for compatibility
    const sale = await Sale.create({
      invoiceNumber: `INV-${Date.now()}`,
      customer: customer || null,
      user: req.user._id,
      items: saleItems,
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

    // Update Stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }

    // Populate for response
    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name phone')
      .populate('user', 'name')
      .populate('items.product', 'name nameAr sku barcode');

    res.status(201).json({ success: true, message: 'تم إتمام البيع بنجاح', data: populatedSale });
  } catch (err) { 
    console.error('Sale Error:', err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getSales = async (req, res) => {
  try {
    const { from_date, to_date, search } = req.query;
    let query = {};
    if (from_date || to_date) {
      query.createdAt = {};
      if (from_date) query.createdAt.$gte = new Date(from_date);
      if (to_date) query.createdAt.$lte = new Date(to_date);
    }
    
    // Search by invoice number or by product barcode
    if (search) {
      const isInvoiceNumber = search.toLowerCase().startsWith('inv-') || search.length > 5; // heuristic
      
      // Attempt to find products by barcode or sku or name
      const matchingProducts = await Product.find({
        $or: [
          { barcode: new RegExp(search, 'i') },
          { sku: new RegExp(search, 'i') },
          { name: new RegExp(search, 'i') }
        ]
      }).select('_id');
      
      const productIds = matchingProducts.map(p => p._id);

      query.$or = [
        { invoiceNumber: new RegExp(search, 'i') },
        { 'items.product': { $in: productIds } }
      ];
    }

    const sales = await Sale.find(query)
      .populate('customer')
      .populate({ path: 'user', select: 'name' })
      .populate('items.product', 'name nameAr sku barcode')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: sales });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

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
