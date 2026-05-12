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
        quantity: item.quantity,
        sellPrice: item.sellPrice,
        buyPrice: product.buyPrice
      });
    }

    const finalTotal = totalAmount - discount + tax;

    // Create Sale
    const sale = await Sale.create({
      invoiceNumber: `INV-${Date.now()}`,
      customer: customer || null,
      user: req.user._id,
      items: saleItems,
      totalAmount: finalTotal,
      totalCost: totalCost,
      discount,
      tax,
      paidAmount: paidAmount || finalTotal,
      paymentMethod,
      notes,
      status: 'completed'
    });

    // Update Stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }

    res.status(201).json({ success: true, message: 'تم إتمام البيع بنجاح', data: sale });
  } catch (err) { 
    console.error('Sale Error:', err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getSales = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let query = {};
    if (from_date || to_date) {
      query.createdAt = {};
      if (from_date) query.createdAt.$gte = new Date(from_date);
      if (to_date) query.createdAt.$lte = new Date(to_date);
    }
    const sales = await Sale.find(query)
      .populate('customer')
      .populate({ path: 'user', select: 'name' })
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
