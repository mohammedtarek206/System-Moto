const InstallmentCustomer = require('../models/InstallmentCustomer');
const InstallmentContract = require('../models/InstallmentContract');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ==========================================
// 1. Dashboard Stats
// ==========================================
exports.getInstallmentStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Get all contracts
    const contracts = await InstallmentContract.find().populate('customer');

    let totalContracts = contracts.length;
    let totalRemaining = 0;
    let paidToday = 0;
    let overdueCount = 0;
    let totalProfits = 0; // Cumulative interest profits
    let paidInstallmentsCount = 0;

    const recentPayments = [];

    contracts.forEach(contract => {
      // Remaining amount is the sum of unpaid installments
      let contractRemaining = 0;
      
      contract.installments.forEach(inst => {
        if (inst.status !== 'paid') {
          contractRemaining += inst.amount;
          
          // Check if overdue
          if (new Date(inst.dueDate) < new Date() && inst.status !== 'paid') {
            overdueCount++;
          }
        } else {
          paidInstallmentsCount++;
          // Check if paid today
          if (inst.paymentDate && inst.paymentDate >= todayStart && inst.paymentDate <= todayEnd) {
            paidToday += inst.amount;
          }
          
          // Add to recent payments list
          recentPayments.push({
            contractId: contract._id,
            contractNumber: contract.contractNumber,
            customerName: contract.customer?.name || 'عميل غير معروف',
            amount: inst.amount,
            installmentNumber: inst.installmentNumber,
            paymentDate: inst.paymentDate,
            paymentMethod: inst.paymentMethod
          });
        }
      });

      totalRemaining += contractRemaining;

      // Profit from this contract = (monthlyInstallment * monthsCount) - (cashPrice - downPayment)
      const interestProfit = (contract.monthlyInstallment * contract.monthsCount) - (contract.cashPrice - contract.downPayment);
      totalProfits += Math.max(0, interestProfit);
    });

    // Sort recent payments by date descending and limit to 5
    recentPayments.sort((a, b) => b.paymentDate - a.paymentDate);
    const topRecentPayments = recentPayments.slice(0, 5);

    const customersCount = await InstallmentCustomer.countDocuments({ isActive: true });

    // Build 12-month chart data of collections
    const collectionsByMonth = {};
    const chartMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
      chartMonths.push(key);
      collectionsByMonth[key] = 0;
    }

    contracts.forEach(contract => {
      contract.installments.forEach(inst => {
        if (inst.status === 'paid' && inst.paymentDate) {
          const key = new Date(inst.paymentDate).toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
          if (collectionsByMonth[key] !== undefined) {
            collectionsByMonth[key] += inst.amount;
          }
        }
      });
    });

    const chartData = chartMonths.map(month => ({
      name: month,
      collections: collectionsByMonth[month] || 0
    }));

    res.json({
      success: true,
      data: {
        totalContracts,
        totalRemaining,
        paidToday,
        overdueCount,
        customersCount,
        totalProfits,
        recentPayments: topRecentPayments,
        chartData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 2. Customers Management
// ==========================================
exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { nationalId: new RegExp(search, 'i') }
      ];
    }

    const customers = await InstallmentCustomer.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await InstallmentCustomer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    
    // Get contracts for this customer
    const contracts = await InstallmentContract.find({ customer: customer._id });

    res.json({ success: true, data: { customer, contracts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle files if uploaded
    if (req.files) {
      if (req.files.nationalIdImage) {
        data.nationalIdImage = `/uploads/${req.files.nationalIdImage[0].filename}`;
      }
      if (req.files.contractImage) {
        data.contractImage = `/uploads/${req.files.contractImage[0].filename}`;
      }
    }

    const customer = await InstallmentCustomer.create(data);
    res.status(201).json({ success: true, message: 'تم إضافة عميل التقسيط بنجاح', data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const data = { ...req.body };
    
    if (req.files) {
      if (req.files.nationalIdImage) {
        data.nationalIdImage = `/uploads/${req.files.nationalIdImage[0].filename}`;
      }
      if (req.files.contractImage) {
        data.contractImage = `/uploads/${req.files.contractImage[0].filename}`;
      }
    }

    const customer = await InstallmentCustomer.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: 'العميل غير موجود' });

    res.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح', data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 3. Contracts Management
// ==========================================
exports.getContracts = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status) query.status = status;

    let customerIds = [];
    if (search) {
      const matchedCustomers = await InstallmentCustomer.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') }
        ]
      }).select('_id');
      customerIds = matchedCustomers.map(c => c._id);
      
      query.$or = [
        { contractNumber: new RegExp(search, 'i') },
        { customer: { $in: customerIds } }
      ];
    }

    const contracts = await InstallmentContract.find(query)
      .populate('customer')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getContract = async (req, res) => {
  try {
    const contract = await InstallmentContract.findById(req.params.id)
      .populate('customer')
      .populate('user', 'name');

    if (!contract) return res.status(404).json({ success: false, message: 'العقد غير موجود' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createContract = async (req, res) => {
  try {
    const {
      customerId,
      motorcycleBrand,
      motorcycleModel,
      cashPrice,
      downPayment,
      monthsCount,
      interestRate = 0,
      startDate
    } = req.body;

    const parsedCashPrice = Number(cashPrice);
    const parsedDownPayment = Number(downPayment);
    const parsedMonthsCount = Number(monthsCount);
    const parsedInterestRate = Number(interestRate);

    const principal = parsedCashPrice - parsedDownPayment;
    const interestAmount = principal * (parsedInterestRate / 100);
    const totalRemainingAmount = principal + interestAmount;
    const monthlyInstallment = Math.round(totalRemainingAmount / parsedMonthsCount);

    const dateStart = new Date(startDate);
    const dateEnd = new Date(startDate);
    dateEnd.setMonth(dateEnd.getMonth() + parsedMonthsCount);

    // Generate monthly installments schedule
    const installments = [];
    for (let i = 1; i <= parsedMonthsCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installments.push({
        installmentNumber: i,
        dueDate,
        amount: monthlyInstallment,
        status: 'upcoming',
        notes: ''
      });
    }

    const contractNumber = `CNT-${Date.now()}`;
    const activityLogs = [{
      action: 'إنشاء العقد',
      user: req.user?.name || 'مدير النظام',
      date: new Date(),
      details: `تم إنشاء عقد التقسيط رقم ${contractNumber} بقيمة إجمالية متبقية ${totalRemainingAmount} جنيه على ${parsedMonthsCount} شهر.`
    }];

    const contract = await InstallmentContract.create({
      contractNumber,
      customer: customerId,
      motorcycleBrand,
      motorcycleModel,
      cashPrice: parsedCashPrice,
      downPayment: parsedDownPayment,
      remainingAmount: totalRemainingAmount,
      monthsCount: parsedMonthsCount,
      monthlyInstallment,
      interestRate: parsedInterestRate,
      startDate: dateStart,
      endDate: dateEnd,
      status: 'active',
      installments,
      activityLogs,
      user: req.user._id
    });

    res.status(201).json({ success: true, message: 'تم إنشاء عقد التقسيط وجدول الأقساط بنجاح', data: contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 4. Collection / Paying Installments
// ==========================================
exports.payInstallment = async (req, res) => {
  try {
    const { contractId, installmentNumber, paymentMethod = 'cash', notes } = req.body;

    const contract = await InstallmentContract.findById(contractId).populate('customer');
    if (!contract) return res.status(404).json({ success: false, message: 'العقد غير موجود' });

    // Find target installment
    const installment = contract.installments.find(inst => inst.installmentNumber === Number(installmentNumber));
    if (!installment) return res.status(404).json({ success: false, message: 'القسط غير موجود' });

    if (installment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'هذا القسط مدفوع بالفعل' });
    }

    // Mark as paid
    installment.status = 'paid';
    installment.paymentDate = new Date();
    installment.paymentMethod = paymentMethod;
    installment.notes = notes || 'تم تحصيل القسط بنجاح';

    // Recalculate remaining amount
    let totalRemaining = 0;
    contract.installments.forEach(inst => {
      if (inst.status !== 'paid') totalRemaining += inst.amount;
    });
    contract.remainingAmount = totalRemaining;

    // Check if contract is fully paid (all installments are paid)
    const allPaid = contract.installments.every(inst => inst.status === 'paid');
    if (allPaid) {
      contract.status = 'completed';
    }

    // Log Activity
    contract.activityLogs.push({
      action: 'تحصيل قسط',
      user: req.user?.name || 'مدير التحصيل',
      date: new Date(),
      details: `تم تحصيل القسط رقم ${installmentNumber} بقيمة ${installment.amount} جنيه نقداً/بطاقة، المتبقي الكلي بالعقد: ${totalRemaining} جنيه.`
    });

    await contract.save();

    // Trigger health notifications update asynchronously
    res.json({
      success: true,
      message: 'تم تحصيل ودفع القسط بنجاح',
      data: contract
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 5. Deleting Contracts (Admin Only)
// ==========================================
exports.deleteContract = async (req, res) => {
  try {
    const contract = await InstallmentContract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'العقد غير موجود' });

    await InstallmentContract.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف العقد وجدول الأقساط نهائياً من النظام' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 6. Installment Reports
// ==========================================
exports.getInstallmentReports = async (req, res) => {
  try {
    const { reportType } = req.query;
    let data = [];

    const contracts = await InstallmentContract.find().populate('customer');

    if (reportType === 'overdue') {
      // Overdue Installments
      contracts.forEach(contract => {
        contract.installments.forEach(inst => {
          if (inst.status !== 'paid' && new Date(inst.dueDate) < new Date()) {
            data.push({
              contractNumber: contract.contractNumber,
              customerName: contract.customer?.name,
              customerPhone: contract.customer?.phone,
              installmentNumber: inst.installmentNumber,
              amount: inst.amount,
              dueDate: inst.dueDate,
              delayDays: Math.floor((new Date() - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24))
            });
          }
        });
      });
    } else if (reportType === 'collection') {
      // Daily Collections report
      contracts.forEach(contract => {
        contract.installments.forEach(inst => {
          if (inst.status === 'paid' && inst.paymentDate) {
            data.push({
              contractNumber: contract.contractNumber,
              customerName: contract.customer?.name,
              amount: inst.amount,
              installmentNumber: inst.installmentNumber,
              paymentDate: inst.paymentDate,
              paymentMethod: inst.paymentMethod
            });
          }
        });
      });
    } else if (reportType === 'active') {
      // Active Contracts
      data = contracts.filter(c => c.status === 'active');
    } else if (reportType === 'completed') {
      // Completed Contracts
      data = contracts.filter(c => c.status === 'completed');
    } else {
      // Default: All Contracts summary
      data = contracts;
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 7. Background Checker for Overdue Installments
// ==========================================
exports.checkOverdueInstallments = async () => {
  try {
    const now = new Date();
    const contracts = await InstallmentContract.find({ status: 'active' }).populate('customer');

    for (const contract of contracts) {
      let isOverdue = false;
      let overdueList = [];

      contract.installments.forEach(inst => {
        if (inst.status !== 'paid' && new Date(inst.dueDate) < now) {
          inst.status = 'overdue';
          isOverdue = true;
          overdueList.push(inst.installmentNumber);
        }
      });

      if (isOverdue) {
        contract.status = 'overdue';
        await contract.save();

        // Create alert notification
        const existingNotif = await Notification.findOne({
          title: { $regex: contract.contractNumber },
          createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
        });

        if (!existingNotif) {
          await Notification.create({
            title: `Installment Overdue: ${contract.contractNumber}`,
            titleAr: `تأخر سداد قسط: ${contract.contractNumber}`,
            message: `Customer ${contract.customer?.name} has overdue installments: ${overdueList.join(', ')}`,
            messageAr: `العميل ${contract.customer?.name} متأخر في سداد الأقساط رقم: ${overdueList.join(', ')}`,
            type: 'warning'
          });
        }
      }
    }
  } catch (err) {
    console.error('Overdue checking failed:', err.message);
  }
};
