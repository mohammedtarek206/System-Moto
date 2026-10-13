const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.getAdvancedReport = async (req, res) => {
  try {
    const {
      type, // 'oils', 'spare_parts', 'motorcycles', 'scooters', 'batteries', 'tires', 'accessories', 'extras', 'all'
      from_date, to_date,
      search,
      invoice_number,
      category, brand,
      customer_name, user_name, payment_method,
      min_price, max_price, min_profit, max_profit,
      has_discount
    } = req.query;

    let matchStage = { status: { $ne: 'cancelled' } };

    if (from_date || to_date) {
      matchStage.createdAt = {};
      if (from_date) matchStage.createdAt.$gte = new Date(from_date);
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    if (has_discount === 'true') {
      matchStage.$or = [{ discount: { $gt: 0 } }, { 'items.itemDiscount': { $gt: 0 } }];
    } else if (has_discount === 'false') {
      matchStage.discount = 0;
    }

    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customerObj' } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userObj' } },
      { $unwind: { path: '$customerObj', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$userObj', preserveNullAndEmptyArrays: true } },
      // Keep invoice-level discount info before unwinding items
      {
        $addFields: {
          invoiceDiscount: { $ifNull: ['$discount', 0] },
          invoiceSubtotal: { $ifNull: ['$subtotal', 0] },
          invoiceFinalTotal: { $ifNull: ['$total', { $ifNull: ['$totalAmount', 0] }] }
        }
      },
      { $unwind: '$items' }
    ];

    let itemMatch = {};
    if (type && type !== 'all') {
      itemMatch['items.productType'] = type;
    }

    if (search) {
      const s = new RegExp(search, 'i');
      itemMatch.$or = [
        { 'items.name': s },
        { 'items.nameAr': s },
        { 'items.barcode': s },
        { 'items.sku': s },
        { 'customerObj.name': s },
        { 'customerObj.phone': s },
        { invoiceNumber: s }
      ];
    }

    if (invoice_number) itemMatch.invoiceNumber = new RegExp(invoice_number, 'i');
    if (category) itemMatch['items.category'] = new RegExp(category, 'i');
    if (brand) itemMatch['items.brand'] = new RegExp(brand, 'i');
    if (customer_name) itemMatch['customerObj.name'] = new RegExp(customer_name, 'i');
    if (user_name) itemMatch['userObj.name'] = new RegExp(user_name, 'i');
    if (payment_method) itemMatch.paymentMethod = payment_method;

    if (Object.keys(itemMatch).length > 0) {
      pipeline.push({ $match: itemMatch });
    }

    // Add calculated fields including discount-aware calculations
    // Using $convert to prevent 500 errors if legacy data has missing/string values
    pipeline.push({
      $addFields: {
        safeTotal: { $convert: { input: '$items.total', to: 'double', onError: 0, onNull: 0 } },
        safeBuyPrice: { $convert: { input: '$items.buyPrice', to: 'double', onError: 0, onNull: 0 } },
        safeQuantity: { $convert: { input: '$items.quantity', to: 'double', onError: 0, onNull: 0 } },
        safeSellPrice: { $convert: { input: '$items.sellPrice', to: 'double', onError: 0, onNull: 0 } },
        safeItemDiscount: { $convert: { input: '$items.itemDiscount', to: 'double', onError: 0, onNull: 0 } },
        dateString: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
      }
    });

    // Calculate line total and profit
    // safeTotal is already after item discount, or fallback to sellPrice * qty
    pipeline.push({
      $addFields: {
        effectiveLineTotal: {
          $cond: [
            { $gt: ['$safeTotal', 0] },
            '$safeTotal', // If total stored (new records with item discount), use it
            {
              $subtract: [
                { $multiply: ['$safeSellPrice', '$safeQuantity'] },
                '$safeItemDiscount'
              ]
            }
          ]
        }
      }
    });

    pipeline.push({
      $addFields: {
        itemProfit: {
          $subtract: [
            '$effectiveLineTotal',
            { $multiply: ['$safeBuyPrice', '$safeQuantity'] }
          ]
        }
      }
    });

    let priceProfitMatch = {};
    if (min_price) priceProfitMatch.effectiveLineTotal = { ...priceProfitMatch.effectiveLineTotal, $gte: Number(min_price) };
    if (max_price) priceProfitMatch.effectiveLineTotal = { ...priceProfitMatch.effectiveLineTotal, $lte: Number(max_price) };
    if (min_profit) priceProfitMatch.itemProfit = { ...priceProfitMatch.itemProfit, $gte: Number(min_profit) };
    if (max_profit) priceProfitMatch.itemProfit = { ...priceProfitMatch.itemProfit, $lte: Number(max_profit) };

    if (Object.keys(priceProfitMatch).length > 0) {
      pipeline.push({ $match: priceProfitMatch });
    }

    // Facet for items, summary, and charts
    pipeline.push({
      $facet: {
        items: [
          { $sort: { createdAt: -1 } },
          {
            $project: {
              invoiceNumber: 1,
              createdAt: 1,
              paymentMethod: 1,
              status: 1,
              customerName: { $ifNull: ['$customerObj.name', 'عميل نقدي'] },
              customerPhone: { $ifNull: ['$customerObj.phone', '-'] },
              customerAddress: { $ifNull: ['$customerObj.address', '-'] },
              userName: { $ifNull: ['$userObj.name', '-'] },
              productName: { $ifNull: ['$items.nameAr', '$items.name'] },
              productType: '$items.productType',
              category: '$items.category',
              brand: '$items.brand',
              model: '$items.model',
              barcode: '$items.barcode',
              sku: '$items.sku',
              quantity: '$safeQuantity',
              buyPrice: '$safeBuyPrice',
              sellPrice: '$safeSellPrice',
              originalPrice: { $ifNull: ['$items.originalPrice', '$safeSellPrice'] },
              cashierPrice: { $ifNull: ['$items.cashierPrice', null] },
              itemDiscount: '$safeItemDiscount',
              totalSale: '$effectiveLineTotal',
              totalProfit: '$itemProfit',
              invoiceDiscount: 1,
              invoiceSubtotal: 1,
              invoiceFinalTotal: 1
            }
          }
        ],
        summary: [
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: '$safeQuantity' },
              totalRevenueBeforeDiscount: { $sum: { $multiply: ['$safeSellPrice', '$safeQuantity'] } },
              totalItemDiscounts: { $sum: '$safeItemDiscount' },
              totalRevenue: { $sum: '$effectiveLineTotal' },
              totalCost: { $sum: { $multiply: ['$safeBuyPrice', '$safeQuantity'] } },
              totalProfit: { $sum: '$itemProfit' },
              invoicesSet: { $addToSet: '$invoiceNumber' },
            }
          },
          {
            $project: {
              totalQuantity: 1,
              totalRevenueBeforeDiscount: 1,
              totalItemDiscounts: 1,
              totalRevenue: 1,
              totalCost: 1,
              totalProfit: 1,
              totalInvoices: { $size: '$invoicesSet' },
              avgSellPrice: { $cond: [{ $eq: ['$totalQuantity', 0] }, 0, { $divide: ['$totalRevenue', '$totalQuantity'] }] }
            }
          }
        ],
        // Invoice-level discount summary
        invoiceSummary: [
          {
            $group: {
              _id: '$invoiceNumber',
              invoiceDiscount: { $first: '$invoiceDiscount' }
            }
          },
          {
            $group: {
              _id: null,
              totalInvoiceDiscounts: { $sum: '$invoiceDiscount' }
            }
          }
        ],
        byProduct: [
          {
            $group: {
              _id: { $ifNull: ['$items.nameAr', '$items.name'] },
              sold: { $sum: '$safeQuantity' },
              revenue: { $sum: '$effectiveLineTotal' },
              profit: { $sum: '$itemProfit' }
            }
          },
          { $sort: { sold: -1 } }
        ],
        byBrand: [
          { $match: { 'items.brand': { $ne: null, $ne: '' } } },
          {
            $group: {
              _id: '$items.brand',
              sold: { $sum: '$safeQuantity' },
              revenue: { $sum: '$effectiveLineTotal' }
            }
          },
          { $sort: { sold: -1 } }
        ],
        byCategory: [
          { $match: { 'items.category': { $ne: null, $ne: '' } } },
          {
            $group: {
              _id: '$items.category',
              sold: { $sum: '$safeQuantity' },
              revenue: { $sum: '$effectiveLineTotal' }
            }
          },
          { $sort: { sold: -1 } }
        ],
        byDate: [
          {
            $group: {
              _id: '$dateString',
              revenue: { $sum: '$effectiveLineTotal' },
              profit: { $sum: '$itemProfit' }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    });

    const result = await Sale.aggregate(pipeline);
    const data = result[0];

    const summary = data.summary[0] || {
      totalQuantity: 0,
      totalRevenueBeforeDiscount: 0,
      totalItemDiscounts: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalInvoices: 0,
      avgSellPrice: 0
    };

    const totalInvoiceDiscounts = (data.invoiceSummary[0] || {}).totalInvoiceDiscounts || 0;
    summary.totalInvoiceDiscounts = totalInvoiceDiscounts;
    summary.totalDiscounts = (summary.totalItemDiscounts || 0) + totalInvoiceDiscounts;
    summary.netRevenue = summary.totalRevenue - totalInvoiceDiscounts;

    const bestProduct = data.byProduct[0] || null;
    const worstProduct = data.byProduct.length > 1 ? data.byProduct[data.byProduct.length - 1] : null;
    const bestBrand = data.byBrand[0] || null;
    const bestCategory = data.byCategory[0] || null;

    res.json({
      success: true,
      data: {
        items: data.items,
        summary: {
          ...summary,
          bestProduct,
          worstProduct,
          bestBrand,
          bestCategory
        },
        charts: {
          byDate: data.byDate,
          byProduct: data.byProduct.slice(0, 10), // top 10
          byBrand: data.byBrand.slice(0, 10),
          byCategory: data.byCategory.slice(0, 10)
        }
      }
    });
  } catch (err) {
    console.error('Advanced Report Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
