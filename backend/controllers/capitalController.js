const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Revenue = require('../models/Revenue');
const InstallmentContract = require('../models/InstallmentContract');
const Settings = require('../models/Settings');

const PRODUCT_TYPE_AR = {
    motorcycles: 'موتسيكلات',
    scooters: 'سكوترات',
    oils: 'زيوت',
    spare_parts: 'قطع غيار',
    batteries: 'بطاريات',
    tires: 'إطارات',
    accessories: 'إكسسوارات',
    extras: 'كماليات',
    other: 'أخرى',
};

// ========================================================
// Helper: build date query for a given field
// ========================================================
function buildDateQuery(field, from_date, to_date) {
    if (!from_date && !to_date) return {};
    const q = {};
    q[field] = {};
    if (from_date) q[field].$gte = new Date(from_date);
    if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        q[field].$lte = end;
    }
    return q;
}

// ========================================================
// GET /api/capital2/full-summary
// Main comprehensive capital data
// ========================================================
exports.getFullCapitalSummary = async (req, res) => {
    try {
        const { from_date, to_date } = req.query;

        const expDateQ = buildDateQuery('date', from_date, to_date);
        const saleDateQ = buildDateQuery('createdAt', from_date, to_date);
        const purDateQ = buildDateQuery('createdAt', from_date, to_date);
        const revDateQ = buildDateQuery('date', from_date, to_date);

        // ── 1. Inventory value by product type (at purchase price) ──
        const inventoryByType = await Product.aggregate([
            { $match: { isActive: true, quantity: { $gt: 0 } } },
            {
                $group: {
                    _id: '$productType',
                    totalValue: { $sum: { $multiply: ['$buyPrice', '$quantity'] } },
                    totalQty: { $sum: '$quantity' },
                    count: { $sum: 1 },
                }
            },
            { $sort: { totalValue: -1 } },
        ]);

        const totalInventoryValue = inventoryByType.reduce((s, t) => s + (t.totalValue || 0), 0);

        // ── 2. Sales ──
        const [salesAgg, salesByCategory, monthlySales] = await Promise.all([
            Sale.aggregate([
                { $match: { ...saleDateQ, status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
                        totalCost: { $sum: { $ifNull: ['$totalCost', 0] } },
                        totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
                        count: { $sum: 1 },
                    }
                },
            ]),
            Sale.aggregate([
                { $match: { ...saleDateQ, status: { $ne: 'cancelled' } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.productType',
                        revenue: { $sum: '$items.total' },
                        cost: { $sum: { $multiply: ['$items.buyPrice', '$items.quantity'] } },
                        qty: { $sum: '$items.quantity' },
                    }
                },
                { $sort: { revenue: -1 } },
            ]),
            Sale.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
                        cost: { $sum: { $ifNull: ['$totalCost', 0] } },
                        count: { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
                { $limit: 24 },
            ]),
        ]);

        const totalRevenue = salesAgg[0]?.totalRevenue || 0;
        const totalCost = salesAgg[0]?.totalCost || 0;
        const grossProfit = totalRevenue - totalCost;

        // ── 3. Expenses ──
        const [expensesAgg, expensesByCategory, monthlyExpenses] = await Promise.all([
            Expense.aggregate([
                { $match: expDateQ },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Expense.aggregate([
                { $match: expDateQ },
                { $group: { _id: '$category', categoryAr: { $first: '$categoryAr' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } },
            ]),
            Expense.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                        total: { $sum: '$amount' },
                    }
                },
                { $sort: { _id: 1 } },
                { $limit: 24 },
            ]),
        ]);

        const totalExpenses = expensesAgg[0]?.total || 0;

        // ── 4. Purchases (supplier debts) ──
        const purchasesAgg = await Purchase.aggregate([
            { $match: purDateQ },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$paidAmount' },
                    count: { $sum: 1 },
                }
            },
        ]);
        const totalPurchases = purchasesAgg[0]?.totalAmount || 0;
        const totalPurchasesPaid = purchasesAgg[0]?.totalPaid || 0;
        const totalSupplierDebt = totalPurchases - totalPurchasesPaid;

        // ── 5. Customers receivables ──
        const customersAgg = await Customer.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: { $abs: '$balance' } },  // negative balance = they owe us
                    debtors: {
                        $sum: { $cond: [{ $lt: ['$balance', 0] }, 1, 0] },
                    },
                    totalDebt: {
                        $sum: { $cond: [{ $lt: ['$balance', 0] }, { $abs: '$balance' }, 0] },
                    },
                }
            },
            { $limit: 1 },
        ]);
        const customerReceivables = customersAgg[0]?.totalDebt || 0;
        const customerDebtorCount = customersAgg[0]?.debtors || 0;

        // Total collected from sales (paid amounts)
        const totalCollected = salesAgg[0]?.totalPaid || 0;

        // ── 6. Suppliers payables ──
        const suppliersAgg = await Supplier.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: { $abs: '$balance' } },
                    count: { $sum: 1 },
                    totalDebt: {
                        $sum: { $cond: [{ $lt: ['$balance', 0] }, { $abs: '$balance' }, 0] },
                    },
                }
            },
            { $limit: 1 },
        ]);
        const supplierPayables = suppliersAgg[0]?.totalDebt || 0;
        const supplierCount = suppliersAgg[0]?.count || 0;

        // ── 7. Installment contracts ──
        const installmentAgg = await InstallmentContract.aggregate([
            { $match: { status: { $in: ['active', 'overdue'] } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$remainingAmount' },
                    count: { $sum: 1 },
                }
            },
        ]);
        const installmentReceivables = installmentAgg[0]?.total || 0;

        // ── 8. Revenues (manual revenues) ──
        const revenueAgg = await Revenue.aggregate([
            { $match: revDateQ },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);
        const extraRevenue = revenueAgg[0]?.total || 0;

        // ── 9. Net Profit ──
        const netProfit = grossProfit - totalExpenses;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
        const currentCapital = totalRevenue + extraRevenue + totalInventoryValue + customerReceivables
            - totalExpenses - supplierPayables;
        const cashBalance = totalRevenue + extraRevenue - totalExpenses;

        // ── 10. Monthly combined chart data ──
        const monthlyMap = {};
        monthlySales.forEach(m => {
            monthlyMap[m._id] = { period: m._id, revenue: m.revenue, cost: m.cost, profit: m.revenue - m.cost, expenses: 0, salesCount: m.count };
        });
        monthlyExpenses.forEach(m => {
            if (monthlyMap[m._id]) monthlyMap[m._id].expenses = m.total;
            else monthlyMap[m._id] = { period: m._id, revenue: 0, cost: 0, profit: 0, expenses: m.total, salesCount: 0 };
        });
        const monthlyData = Object.values(monthlyMap).sort((a, b) => a.period.localeCompare(b.period));

        // ── 11. Best/Worst month ──
        let bestMonth = null, worstMonth = null;
        if (monthlyData.length > 0) {
            bestMonth = monthlyData.reduce((a, b) => a.profit > b.profit ? a : b);
            worstMonth = monthlyData.reduce((a, b) => a.profit < b.profit ? a : b);
        }

        // ── 12. Monthly averages ──
        const avgMonthlyProfit = monthlyData.length ? (monthlyData.reduce((s, m) => s + m.profit, 0) / monthlyData.length) : 0;
        const avgMonthlyRevenue = monthlyData.length ? (monthlyData.reduce((s, m) => s + m.revenue, 0) / monthlyData.length) : 0;
        const avgMonthlyExpense = monthlyData.length ? (monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length) : 0;

        // ── 13. Sales by category enriched ──
        const salesByCategoryEnriched = salesByCategory.map(s => ({
            ...s,
            nameAr: PRODUCT_TYPE_AR[s._id] || s._id,
            profit: (s.revenue || 0) - (s.cost || 0),
            margin: s.revenue > 0 ? (((s.revenue - s.cost) / s.revenue) * 100).toFixed(1) : '0',
        }));

        // Best/worst product type
        const bestCategory = salesByCategoryEnriched.length ? salesByCategoryEnriched.reduce((a, b) => a.profit > b.profit ? a : b) : null;
        const worstCategory = salesByCategoryEnriched.length ? salesByCategoryEnriched.reduce((a, b) => a.profit < b.profit ? a : b) : null;

        // ── 14. Top products by profit ──
        const topProducts = await Sale.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    nameAr: { $first: '$items.nameAr' },
                    type: { $first: '$items.productType' },
                    revenue: { $sum: '$items.total' },
                    cost: { $sum: { $multiply: ['$items.buyPrice', '$items.quantity'] } },
                    qty: { $sum: '$items.quantity' },
                }
            },
            { $addFields: { profit: { $subtract: ['$revenue', '$cost'] } } },
            { $sort: { profit: -1 } },
            { $limit: 10 },
        ]);

        // ── 15. Inventory enriched ──
        const inventoryEnriched = inventoryByType.map(t => ({
            ...t,
            nameAr: PRODUCT_TYPE_AR[t._id] || t._id,
            percentage: totalInventoryValue > 0 ? ((t.totalValue / totalInventoryValue) * 100).toFixed(1) : '0',
        }));

        // ── 16. Cash flow (latest 200 transactions) ──
        const [recentSales, recentExpenses, recentRevenues, recentPurchases] = await Promise.all([
            Sale.find({ ...saleDateQ, status: { $ne: 'cancelled' } })
                .populate('user', 'name')
                .populate('customer', 'name')
                .sort({ createdAt: -1 })
                .limit(100)
                .lean(),
            Expense.find(expDateQ)
                .populate('user', 'name')
                .sort({ date: -1 })
                .limit(100)
                .lean(),
            Revenue.find(revDateQ)
                .populate('user', 'name')
                .sort({ date: -1 })
                .limit(50)
                .lean(),
            Purchase.find(purDateQ)
                .populate('user', 'name')
                .populate('supplier', 'name')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
        ]);

        // Build unified cash-flow array
        const cashFlowItems = [
            ...recentSales.map(s => ({
                date: s.createdAt,
                type: 'sale',
                typeAr: 'مبيعات',
                description: `فاتورة ${s.invoiceNumber}${s.customer?.name ? ` - ${s.customer.name}` : ''}`,
                income: s.totalAmount || s.total || 0,
                expense: 0,
                user: s.user?.name || '-',
            })),
            ...recentExpenses.map(e => ({
                date: e.date,
                type: 'expense',
                typeAr: 'مصروف',
                description: e.description || e.categoryAr || e.category,
                income: 0,
                expense: e.amount || 0,
                user: e.user?.name || '-',
            })),
            ...recentRevenues.map(r => ({
                date: r.date,
                type: 'revenue',
                typeAr: 'إيراد',
                description: r.description || r.categoryAr || r.category,
                income: r.amount || 0,
                expense: 0,
                user: r.user?.name || '-',
            })),
            ...recentPurchases.map(p => ({
                date: p.createdAt,
                type: 'purchase',
                typeAr: 'مشتريات',
                description: `فاتورة شراء ${p.invoiceNumber}${p.supplier?.name ? ` - ${p.supplier.name}` : ''}`,
                income: 0,
                expense: p.totalAmount || 0,
                user: p.user?.name || '-',
            })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 200);

        // Add running balance
        let runningBalance = currentCapital;
        const cashFlow = cashFlowItems.map(item => {
            const balance = runningBalance;
            runningBalance += item.expense - item.income;
            return { ...item, balance };
        });

        // ── 17. Alerts ──
        const settings = await Settings.findOne().lean();
        const alerts = [];
        const LOW_CAPITAL_THRESHOLD = settings?.lowCapitalThreshold || 10000;

        if (currentCapital < LOW_CAPITAL_THRESHOLD)
            alerts.push({ level: 'danger', msg: `رأس المال منخفض جداً (${currentCapital.toLocaleString('ar-EG')} ج)` });
        if (cashBalance < 5000)
            alerts.push({ level: 'warning', msg: 'السيولة النقدية منخفضة' });
        if (totalExpenses > totalRevenue)
            alerts.push({ level: 'danger', msg: 'المصروفات تجاوزت الإيرادات!' });
        if (netProfit < 0)
            alerts.push({ level: 'danger', msg: 'الشركة تعاني من خسائر صافية' });
        if (customerReceivables > totalRevenue * 0.3)
            alerts.push({ level: 'warning', msg: `مستحقات العملاء مرتفعة (${customerReceivables.toLocaleString('ar-EG')} ج)` });
        if (supplierPayables > totalPurchases * 0.5)
            alerts.push({ level: 'warning', msg: `مستحقات الموردين مرتفعة (${supplierPayables.toLocaleString('ar-EG')} ج)` });
        if (totalInventoryValue < 5000)
            alerts.push({ level: 'warning', msg: 'قيمة المخزون منخفضة جداً' });

        // ── Response ──
        res.json({
            success: true,
            data: {
                // Capital overview
                capital: {
                    current: currentCapital,
                    initialCapital: 0,  // can be set in settings
                    cashBalance,
                    inventoryValue: totalInventoryValue,
                    customerReceivables,
                    supplierPayables,
                    installmentReceivables,
                    netWorth: currentCapital,
                },

                // Inventory breakdown
                inventory: {
                    byType: inventoryEnriched,
                    total: totalInventoryValue,
                },

                // Sales / Revenue
                sales: {
                    totalRevenue,
                    totalCost,
                    grossProfit,
                    netProfit,
                    profitMargin: parseFloat(profitMargin),
                    totalCollected,
                    count: salesAgg[0]?.count || 0,
                    byCategory: salesByCategoryEnriched,
                    bestCategory,
                    worstCategory,
                },

                // Expenses
                expenses: {
                    total: totalExpenses,
                    byCategory: expensesByCategory,
                    count: expensesAgg[0]?.count || 0,
                },

                // Extra revenue
                extraRevenue: {
                    total: extraRevenue,
                    count: revenueAgg[0]?.count || 0,
                },

                // Purchases
                purchases: {
                    total: totalPurchases,
                    paid: totalPurchasesPaid,
                    remaining: totalSupplierDebt,
                    count: purchasesAgg[0]?.count || 0,
                },

                // Customers
                customers: {
                    receivables: customerReceivables,
                    installmentReceivables,
                    debtorCount: customerDebtorCount,
                    totalRevenue,        // total billed
                    totalCollected,      // total paid by customers
                    totalRemaining: totalRevenue - totalCollected,
                },

                // Suppliers  
                suppliers: {
                    payables: supplierPayables,
                    totalPurchased: totalPurchases,
                    totalPaid: totalPurchasesPaid,
                    remaining: totalSupplierDebt,
                    count: supplierCount,
                },

                // Charts & analytics
                monthlyData,
                topProducts: topProducts.slice(0, 10),
                worstProducts: [...topProducts].sort((a, b) => a.profit - b.profit).slice(0, 5),

                // Averages
                averages: {
                    monthlyProfit: avgMonthlyProfit,
                    monthlyRevenue: avgMonthlyRevenue,
                    monthlyExpense: avgMonthlyExpense,
                    dailyRevenue: avgMonthlyRevenue / 30,
                    dailyExpense: avgMonthlyExpense / 30,
                },

                // Best/worst periods
                bestMonth,
                worstMonth,

                // Cash flow
                cashFlow,

                // Alerts
                alerts,
            },
        });
    } catch (err) {
        console.error('Capital summary error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
