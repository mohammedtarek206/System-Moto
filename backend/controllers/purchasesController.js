const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const InventoryLog = require('../models/InventoryLog');

exports.getPurchases = async (req, res) => {
  try {
    const { search = '' } = req.query;
    let query = {};
    
    if (search) {
      query = { invoiceNumber: { $regex: search, $options: 'i' } };
    }

    const purchases = await Purchase.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name phone address')
      .populate('user', 'name');

    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      invoiceNumber,
      items,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      notes = ''
    } = req.body;

    if (!supplierId || !invoiceNumber || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'بيانات الفاتورة غير مكتملة' });
    }

    // Check duplicate invoice number
    const existing = await Purchase.findOne({ invoiceNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'رقم الفاتورة مسجل مسبقاً' });
    }

    // Fetch supplier
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    }

    let subtotal = 0;
    const purchaseItems = [];

    // Process each item
    for (const item of items) {
      let product = null;

      // Try searching by SKU or barcode first
      if (item.sku || item.barcode) {
        product = await Product.findOne({
          $or: [
            ...(item.sku ? [{ sku: item.sku }] : []),
            ...(item.barcode ? [{ barcode: item.barcode }] : [])
          ],
          isActive: true
        });
      }

      // If not found, try searching by Arabic or English name
      if (!product && item.name) {
        product = await Product.findOne({
          $or: [
            { name: item.name },
            { nameAr: item.name }
          ],
          isActive: true
        });
      }

      const itemQty = Number(item.quantity || 1);
      const buyP = Number(item.buyPrice || 0);
      const sellP = Number(item.sellPrice || buyP * 1.25);
      const itemTotal = buyP * itemQty;
      subtotal += itemTotal;

      let quantityBefore = 0;
      let quantityAfter = itemQty;

      if (product) {
        // Product exists -> smart increment quantity & update buyPrice + sellPrice
        quantityBefore = product.quantity || 0;
        product.quantity = quantityBefore + itemQty;
        product.buyPrice = buyP;
        product.sellPrice = sellP;
        quantityAfter = product.quantity;
        await product.save();
      } else {
        // Product doesn't exist -> create new product
        let barcodeVal = item.barcode;
        if (!barcodeVal || barcodeVal.trim() === '') {
          let code;
          let exists = true;
          while (exists) {
            code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const duplicate = await Product.findOne({ barcode: code });
            if (!duplicate) exists = false;
          }
          barcodeVal = code;
        }

        product = new Product({
          name: item.name || 'منتج جديد',
          nameAr: item.nameAr || item.name || 'منتج جديد',
          sku: item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          barcode: barcodeVal,
          buyPrice: buyP,
          sellPrice: sellP,
          quantity: itemQty,
          isActive: true
        });
        await product.save();
      }

      purchaseItems.push({
        product: product._id,
        name: product.nameAr || product.name,
        sku: product.sku,
        barcode: product.barcode,
        buyPrice: buyP,
        sellPrice: sellP,
        quantity: itemQty,
        total: itemTotal
      });

      // Log inventory movement
      const log = new InventoryLog({
        product: product._id,
        productName: product.nameAr || product.name,
        type: 'in',
        quantity: itemQty,
        quantityBefore,
        quantityAfter,
        referenceType: 'purchase',
        notes: `شراء بموجب الفاتورة رقم ${invoiceNumber}`,
        user: req.user?.id
      });
      await log.save();
    }

    const totalAmount = subtotal - Number(discount) + Number(tax);
    let paymentStatus = 'paid';
    if (paidAmount === 0) {
      paymentStatus = 'unpaid';
    } else if (paidAmount < totalAmount) {
      paymentStatus = 'partial';
    }

    // Update supplier balance (unpaid amount increases balance)
    const unpaidAmount = totalAmount - Number(paidAmount);
    if (unpaidAmount > 0) {
      supplier.balance = (supplier.balance || 0) + unpaidAmount;
      await supplier.save();
    }

    // Create Purchase
    const purchase = new Purchase({
      supplier: supplierId,
      invoiceNumber,
      items: purchaseItems,
      subtotal,
      discount,
      tax,
      totalAmount,
      paidAmount,
      paymentStatus,
      notes,
      user: req.user?.id
    });

    await purchase.save();

    res.json({
      success: true,
      message: 'تم تسجيل فاتورة الشراء وتحديث المخزون بنجاح',
      data: purchase
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
