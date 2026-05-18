const mongoose = require('mongoose');

const installmentContractSchema = new mongoose.Schema({
  contractNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentCustomer', required: true },
  motorcycleBrand: { type: String, required: true },
  motorcycleModel: { type: String, required: true },
  cashPrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  monthsCount: { type: Number, required: true },
  monthlyInstallment: { type: Number, required: true },
  interestRate: { type: Number, default: 0 }, // Interest rate percentage
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'overdue'], default: 'active' },
  installments: [{
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'overdue', 'upcoming'], default: 'upcoming' },
    paymentDate: { type: Date },
    paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'], default: 'cash' },
    notes: { type: String }
  }],
  activityLogs: [{
    action: { type: String, required: true }, // e.g. 'إنشاء العقد', 'تحصيل قسط', 'أرشفة العقد'
    user: { type: String }, // User's name
    date: { type: Date, default: Date.now },
    details: { type: String }
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InstallmentContract', installmentContractSchema);
