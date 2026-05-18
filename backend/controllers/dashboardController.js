const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // Today boundaries
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 14-day chart data
    const chartStart = new Date(now);
    chartStart.setDate(now.getDate() - 13);
    chartStart.setHours(0, 0, 0, 0);

    const [
      todaySales,
      monthSales,
      productsCount,
      lowStockProducts,
      recentSales,
      chartData,
      topProductsRaw,
    ] = await Promise.all([
      // Today revenue — use $totalAmount (always saved), fallback to $total
      Sale.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } }, count: { $sum: 1 } } }
      ]),

      // Month revenue
      Sale.aggregate([
        { $match: { createdAt: { $gte: monthStart, $lte: monthEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } }, count: { $sum: 1 } } }
      ]),

      // Total products count
      Product.countDocuments({ isActive: true }),

      // Low stock products
      Product.find({ isActive: true }).select('name nameAr quantity minQuantity sku').lean().then(products =>
        products.filter(p => p.quantity <= (p.minQuantity || 5))
      ),

      // Recent 5 sales
      Sale.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'name')
        .select('invoiceNumber customer total status createdAt')
        .lean(),

      // 14-day chart data
      Sale.aggregate([
        { $match: { createdAt: { $gte: chartStart }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top selling products with $lookup to get real product names
      Sale.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            product_name: { $first: '$items.name' },
            product_name_ar: { $first: '$items.nameAr' },
            sold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' }
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
          $addFields: {
            resolved_name: {
              $cond: {
                if: { $gt: [{ $size: '$productInfo' }, 0] },
                then: { $arrayElemAt: ['$productInfo.name', 0] },
                else: { $ifNull: ['$product_name', 'Unknown'] }
              }
            },
            resolved_name_ar: {
              $cond: {
                if: { $gt: [{ $size: '$productInfo' }, 0] },
                then: { $ifNull: [{ $arrayElemAt: ['$productInfo.nameAr', 0] }, { $arrayElemAt: ['$productInfo.name', 0] }] },
                else: { $ifNull: ['$product_name_ar', 'Unknown'] }
              }
            }
          }
        },
        { $sort: { sold: -1 } },
        { $limit: 5 }
      ]),
    ]);

    // Build 14-day chart with 0 for missing days
    const chartMap = {};
    chartData.forEach(d => { chartMap[d._id] = d.revenue; });
    const chartDataFull = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartDataFull.push({ date: key, revenue: chartMap[key] || 0 });
    }

    res.json({
      success: true,
      data: {
        today: {
          revenue: todaySales[0]?.revenue || 0,
          count: todaySales[0]?.count || 0,
        },
        month: {
          revenue: monthSales[0]?.revenue || 0,
          count: monthSales[0]?.count || 0,
        },
        products: {
          total: productsCount,
          low_stock: lowStockProducts.length,
        },
        chartData: chartDataFull,
        topProducts: topProductsRaw.map(p => ({
          product_name: p.resolved_name || p.product_name || 'Unknown',
          product_name_ar: p.resolved_name_ar || p.product_name_ar || p.resolved_name || 'Unknown',
          sold: p.sold,
          revenue: p.revenue,
        })),
        recentSales: recentSales.map(s => ({
          id: s._id,
          invoice_number: s.invoiceNumber,
          customer_name: s.customer?.name || null,
          total: s.totalAmount || s.total || 0,
          status: s.status,
          date: s.createdAt,
        })),
        lowStockItems: lowStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          name_ar: p.nameAr,
          quantity: p.quantity,
          min_quantity: p.minQuantity,
          sku: p.sku,
        })),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfitReport = async (req, res) => {
  try {
    const { group_by = 'day' } = req.query;
    
    let dateFormat = '%Y-%m-%d';
    if (group_by === 'month') dateFormat = '%Y-%m';
    if (group_by === 'year') dateFormat = '%Y';

    const [report, stockCostRes] = await Promise.all([
      Sale.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            revenue: { $sum: '$total' },
            cost: {
              $sum: {
                $ifNull: [
                  '$totalCost',
                  {
                    $reduce: {
                      input: '$items',
                      initialValue: 0,
                      in: { $add: ['$$value', { $multiply: [{ $ifNull: ['$$this.quantity', 0] }, { $ifNull: ['$$this.buyPrice', 0] }] }] }
                    }
                  }
                ]
              }
            },
            invoices: { $sum: 1 }
          }
        },
        { $project: { 
            period: '$_id', 
            revenue: 1, 
            cost: 1, 
            invoices: 1, 
            profit: { $subtract: ['$revenue', '$cost'] } 
        }},
        { $sort: { period: -1 } },
        { $limit: 30 }
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalStockCost: { $sum: { $multiply: ['$buyPrice', '$quantity'] } } } }
      ])
    ]);

    const totalRevenue = report.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCost = report.reduce((acc, curr) => acc + curr.cost, 0);
    const totalStockCost = stockCostRes[0]?.totalStockCost || 0;

    res.json({
      success: true,
      data: report,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalRevenue - totalCost,
        total_stock_cost: totalStockCost
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
