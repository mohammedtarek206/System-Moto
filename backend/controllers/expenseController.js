const Expense = require('../models/Expense');
const Sale = require('../models/Sale');

const CATEGORY_LABELS = {
  rent: 'إيجار',
  electricity: 'كهرباء',
  water: 'مياه',
  salaries: 'مرتبات',
  maintenance: 'صيانة',
  purchase: 'شراء بضاعة',
  transport: 'نقل',
  taxes: 'ضرائب',
  other: 'أخرى'
};

// ===================== EXPENSES =====================

exports.getExpenses = async (req, res) => {
  try {
    const { from_date, to_date, category, page = 1, limit = 50 } = req.query;
    let query = {};
    
    if (from_date || to_date) {
      query.date = {};
      if (from_date) query.date.$gte = new Date(from_date);
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (category) query.category = category;

    const limitVal = parseInt(limit);
    const skipVal = (parseInt(page) - 1) * limitVal;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('user', 'name')
        .sort({ date: -1 })
        .skip(skipVal)
        .limit(limitVal),
      Expense.countDocuments(query)
    ]);

    res.json({ success: true, data: expenses, total, page: parseInt(page), limit: limitVal });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createExpense = async (req, res) => {
  try {
    const data = { ...req.body };
    data.user = req.user._id;
    data.categoryAr = CATEGORY_LABELS[data.category] || data.category;

    if (req.file) data.attachment = `/uploads/${req.file.filename}`;

    const expense = await Expense.create(data);
    res.status(201).json({ success: true, message: 'تم إضافة المصروف بنجاح', data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateExpense = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.category) data.categoryAr = CATEGORY_LABELS[data.category] || data.category;
    if (req.file) data.attachment = `/uploads/${req.file.filename}`;

    const expense = await Expense.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!expense) return res.status(404).json({ success: false, message: 'المصروف غير موجود' });
    res.json({ success: true, message: 'تم تحديث المصروف', data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'المصروف غير موجود' });
    res.json({ success: true, message: 'تم حذف المصروف بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ===================== CAPITAL SUMMARY =====================

exports.getCapitalSummary = async (req, res) => {
  try {
    const { from_date, to_date, period = 'month' } = req.query;
    
    let dateQuery = {};
    if (from_date || to_date) {
      dateQuery.date = {};
      if (from_date) dateQuery.date.$gte = new Date(from_date);
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        dateQuery.date.$lte = end;
      }
    }

    let saleDateQuery = {};
    if (from_date || to_date) {
      saleDateQuery.createdAt = {};
      if (from_date) saleDateQuery.createdAt.$gte = new Date(from_date);
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        saleDateQuery.createdAt.$lte = end;
      }
    }

    // Date format for grouping
    let dateFormat = '%Y-%m';
    if (period === 'day') dateFormat = '%Y-%m-%d';
    if (period === 'year') dateFormat = '%Y';

    const [
      expensesTotal,
      expensesByCategory,
      salesRevenue,
      salesByCategory,
      monthlyExpenses,
      monthlyRevenue,
    ] = await Promise.all([
      // Total expenses
      Expense.aggregate([
        { $match: dateQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Expenses by category
      Expense.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$category', categoryAr: { $first: '$categoryAr' }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]),

      // Revenue from sales
      Sale.aggregate([
        { $match: { ...saleDateQuery, status: { $ne: 'cancelled' } } },
        { $group: { 
          _id: null, 
          total: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
          cost: { $sum: '$totalCost' }
        }}
      ]),

      // Revenue by sale category
      Sale.aggregate([
        { $match: { ...saleDateQuery, status: { $ne: 'cancelled' } } },
        { $group: { 
          _id: '$saleCategory',
          total: { $sum: { $ifNull: ['$totalAmount', '$total'] } }
        }},
        { $sort: { total: -1 } }
      ]),

      // Monthly expenses chart
      Expense.aggregate([
        { $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          total: { $sum: '$amount' }
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ]),

      // Monthly revenue chart
      Sale.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
          profit: { $sum: { $subtract: [{ $ifNull: ['$totalAmount', '$total'] }, '$totalCost'] } }
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ]),
    ]);

    const totalExpenses = expensesTotal[0]?.total || 0;
    const totalRevenue = salesRevenue[0]?.total || 0;
    const totalCost = salesRevenue[0]?.cost || 0;
    const netProfit = totalRevenue - totalCost - totalExpenses;
    const grossProfit = totalRevenue - totalCost;

    // Merge monthly data
    const monthlyMap = {};
    monthlyRevenue.forEach(m => {
      monthlyMap[m._id] = { period: m._id, revenue: m.total, profit: m.profit, expenses: 0 };
    });
    monthlyExpenses.forEach(m => {
      if (monthlyMap[m._id]) monthlyMap[m._id].expenses = m.total;
      else monthlyMap[m._id] = { period: m._id, revenue: 0, profit: 0, expenses: m.total };
    });

    const monthlyData = Object.values(monthlyMap).sort((a, b) => a.period.localeCompare(b.period));

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        totalCost,
        grossProfit,
        netProfit,
        currentCapital: totalRevenue - totalExpenses,
        cashFlow: totalRevenue - totalExpenses - totalCost,
        expensesByCategory,
        salesByCategory,
        monthlyData,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
