const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// ===================== OILS REPORT =====================
exports.getOilsReport = async (req, res) => {
  try {
    const { from_date, to_date, period = 'month' } = req.query;
    let dateQuery = { status: { $ne: 'cancelled' } };
    if (from_date || to_date) {
      dateQuery.createdAt = {};
      if (from_date) dateQuery.createdAt.$gte = new Date(from_date);
      if (to_date) { 
        const end = new Date(to_date); end.setHours(23,59,59,999);
        dateQuery.createdAt.$lte = end; 
      }
    }

    const [oilSales, oilStock] = await Promise.all([
      // Oil sales aggregation per product
      Sale.aggregate([
        { $match: dateQuery },
        { $unwind: '$items' },
        { $match: { 'items.productType': 'oils' } },
        {
          $group: {
            _id: '$items.product',
            productName: { $first: '$items.name' },
            productNameAr: { $first: '$items.nameAr' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
            totalCost: { $sum: { $multiply: ['$items.buyPrice', '$items.quantity'] } },
            lastSaleDate: { $max: '$createdAt' },
            avgSellPrice: { $avg: '$items.sellPrice' },
            customerIds: { $addToSet: '$customer' },
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerIds',
            foreignField: '_id',
            as: 'customers'
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]),

      // Oil products in stock
      Product.find({ productType: 'oils', isActive: true })
        .select('name nameAr quantity barcode sku')
        .lean()
    ]);

    // Map stock data
    const stockMap = {};
    oilStock.forEach(p => { stockMap[String(p._id)] = p; });

    const report = oilSales.map(item => {
      const stock = stockMap[String(item._id)];
      const profit = item.totalRevenue - item.totalCost;
      return {
        id: item._id,
        name: item.productInfo[0]?.name || item.productName,
        nameAr: item.productInfo[0]?.nameAr || item.productNameAr,
        totalSold: item.totalSold,
        totalRevenue: item.totalRevenue,
        totalProfit: profit,
        avgSellPrice: Math.round(item.avgSellPrice * 100) / 100,
        currentStock: stock?.quantity || 0,
        lastSaleDate: item.lastSaleDate,
        topCustomer: item.customers.length > 0 ? item.customers[0]?.name : null,
        customerCount: item.customerIds.length,
      };
    });

    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== SPARE PARTS REPORT =====================
exports.getSparePartsReport = async (req, res) => {
  try {
    const { from_date, to_date, search, sort_by = 'revenue' } = req.query;
    let dateQuery = { status: { $ne: 'cancelled' } };
    if (from_date || to_date) {
      dateQuery.createdAt = {};
      if (from_date) dateQuery.createdAt.$gte = new Date(from_date);
      if (to_date) { 
        const end = new Date(to_date); end.setHours(23,59,59,999);
        dateQuery.createdAt.$lte = end; 
      }
    }

    const sortField = sort_by === 'quantity' ? 'totalSold' : 
                      sort_by === 'profit' ? 'totalProfit' : 'totalRevenue';

    const [partsSales, partsStock] = await Promise.all([
      Sale.aggregate([
        { $match: dateQuery },
        { $unwind: '$items' },
        { $match: { 'items.productType': { $in: ['spare_parts', 'batteries', 'tires', 'accessories', 'extras'] } } },
        {
          $group: {
            _id: '$items.product',
            productName: { $first: '$items.name' },
            productNameAr: { $first: '$items.nameAr' },
            saleCount: { $sum: 1 },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
            totalCost: { $sum: { $multiply: ['$items.buyPrice', '$items.quantity'] } },
            lastSaleDate: { $max: '$createdAt' },
            avgSellPrice: { $avg: '$items.sellPrice' },
            customerIds: { $addToSet: '$customer' },
          }
        },
        {
          $addFields: { totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] } }
        },
        { $sort: { [sortField]: -1 } }
      ]),
      Product.find({ 
        productType: { $in: ['spare_parts', 'batteries', 'tires', 'accessories', 'extras'] }, 
        isActive: true 
      }).select('name nameAr quantity barcode sku').lean()
    ]);

    const stockMap = {};
    partsStock.forEach(p => { stockMap[String(p._id)] = p; });

    let report = partsSales.map(item => {
      const stock = stockMap[String(item._id)];
      return {
        id: item._id,
        name: item.productName,
        nameAr: item.productNameAr,
        saleCount: item.saleCount,
        totalSold: item.totalSold,
        totalRevenue: item.totalRevenue,
        totalProfit: item.totalProfit,
        avgSellPrice: Math.round(item.avgSellPrice * 100) / 100,
        currentStock: stock?.quantity || 0,
        lastSaleDate: item.lastSaleDate,
        customerCount: item.customerIds.length,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      report = report.filter(r => 
        (r.name || '').toLowerCase().includes(s) || 
        (r.nameAr || '').includes(s)
      );
    }

    res.json({ success: true, data: report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== MOTORCYCLES REPORT =====================
exports.getMotorcyclesReport = async (req, res) => {
  try {
    const { from_date, to_date, period = 'month' } = req.query;
    let dateQuery = { status: { $ne: 'cancelled' } };
    if (from_date || to_date) {
      dateQuery.createdAt = {};
      if (from_date) dateQuery.createdAt.$gte = new Date(from_date);
      if (to_date) { 
        const end = new Date(to_date); end.setHours(23,59,59,999);
        dateQuery.createdAt.$lte = end; 
      }
    }

    const [motoSales, motoStock] = await Promise.all([
      Sale.aggregate([
        { $match: dateQuery },
        { $unwind: '$items' },
        { $match: { 'items.productType': 'motorcycles' } },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            brand: { $first: '$items.brand' },
            model: { $first: '$items.model' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
            totalCost: { $sum: { $multiply: ['$items.buyPrice', '$items.quantity'] } },
            lastSaleDate: { $max: '$createdAt' },
            avgSellPrice: { $avg: '$items.sellPrice' },
          }
        },
        { $addFields: { totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] } } },
        { $sort: { totalSold: -1 } }
      ]),

      // Sales by brand
      Sale.aggregate([
        { $match: dateQuery },
        { $unwind: '$items' },
        { $match: { 'items.productType': 'motorcycles' } },
        {
          $group: {
            _id: '$items.brand',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
          }
        },
        { $sort: { totalSold: -1 } }
      ]),
    ]);

    // Overall summary
    const totalSold = motoSales.reduce((a, b) => a + b.totalSold, 0);
    const totalRevenue = motoSales.reduce((a, b) => a + b.totalRevenue, 0);
    const totalProfit = motoSales.reduce((a, b) => a + b.totalProfit, 0);
    const topBrand = motoStock[0]?._id || null;
    const bestModel = motoSales[0] ? { brand: motoSales[0].brand, model: motoSales[0].model, sold: motoSales[0].totalSold } : null;
    const worstModel = motoSales.length > 1 ? { 
      brand: motoSales[motoSales.length-1].brand, 
      model: motoSales[motoSales.length-1].model, 
      sold: motoSales[motoSales.length-1].totalSold 
    } : null;

    // Current stock count
    const stockCount = await Product.countDocuments({ productType: 'motorcycles', isActive: true, quantity: { $gt: 0 } });

    res.json({
      success: true,
      data: {
        summary: { totalSold, totalRevenue, totalProfit, stockCount },
        topBrand,
        bestModel,
        worstModel,
        byModel: motoSales,
        byBrand: motoStock,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== SCOOTERS REPORT =====================
exports.getScootersReport = async (req, res) => {
  try {
    const { from_date, to_date, search, sort_by = 'sold' } = req.query;
    let dateQuery = { status: { $ne: 'cancelled' } };
    if (from_date || to_date) {
      dateQuery.createdAt = {};
      if (from_date) dateQuery.createdAt.$gte = new Date(from_date);
      if (to_date) { 
        const end = new Date(to_date); end.setHours(23,59,59,999);
        dateQuery.createdAt.$lte = end; 
      }
    }

    const [scooterSales, byBrand] = await Promise.all([
      Sale.aggregate([
        { $match: dateQuery },
        { $unwind: '$items' },
        { $match: { 'items.productType': 'scooters' } },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            brand: { $first: '$items.brand' },
            model: { $first: '$items.model' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
            totalCost: { $sum: { $multiply: ['$items.buyPrice', '$items.quantity'] } },
            lastSaleDate: { $max: '$createdAt' },
            avgSellPrice: { $avg: '$items.sellPrice' },
          }
        },
        { $addFields: { totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] } } },
        { $sort: { totalSold: -1 } }
      ]),
      Sale.aggregate([
        { $match: dateQuery },
        { $unwind: '$items' },
        { $match: { 'items.productType': 'scooters' } },
        {
          $group: {
            _id: '$items.brand',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
          }
        },
        { $sort: { totalSold: -1 } }
      ])
    ]);

    const totalSold = scooterSales.reduce((a, b) => a + b.totalSold, 0);
    const totalRevenue = scooterSales.reduce((a, b) => a + b.totalRevenue, 0);
    const totalProfit = scooterSales.reduce((a, b) => a + b.totalProfit, 0);
    const avgSellPrice = scooterSales.length ? totalRevenue / totalSold : 0;

    const stockCount = await Product.countDocuments({ productType: 'scooters', isActive: true, quantity: { $gt: 0 } });

    let byModel = scooterSales;
    if (search) {
      const s = search.toLowerCase();
      byModel = byModel.filter(r => 
        (r.name || '').toLowerCase().includes(s) || 
        (r.brand || '').toLowerCase().includes(s) ||
        (r.model || '').toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: {
        summary: { totalSold, totalRevenue, totalProfit, avgSellPrice, stockCount },
        topBrand: byBrand[0]?._id || null,
        bestModel: scooterSales[0] || null,
        worstModel: scooterSales.length > 1 ? scooterSales[scooterSales.length-1] : null,
        byModel,
        byBrand,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
