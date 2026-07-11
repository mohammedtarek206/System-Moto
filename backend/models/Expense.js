const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['rent', 'electricity', 'water', 'salaries', 'maintenance', 'purchase', 'transport', 'taxes', 'other'],
    required: true
  },
  categoryAr: String,     // Arabic label stored for quick display
  amount: { type: Number, required: true, min: 0 },
  description: String,
  date: { type: Date, default: Date.now },
  responsible: String,    // الشخص المسؤول
  attachment: String,     // file path for invoice/image
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who created it
  notes: String,
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
