const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [salesCount, todaySales, productsCount, customersCount] = await Promise.all([
      Sale.countDocuments(),
      Sale.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Product.countDocuments(),
      Customer.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalSales: salesCount,
        todayRevenue: todaySales[0]?.total || 0,
        totalProducts: productsCount,
        totalCustomers: customersCount
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

    const report = await Sale.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: '$totalCost' },
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
    ]);

    const totalRevenue = report.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCost = report.reduce((acc, curr) => acc + curr.cost, 0);

    res.json({
      success: true,
      data: report,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
