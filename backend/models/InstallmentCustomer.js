const mongoose = require('mongoose');

const installmentCustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  nationalId: { type: String, required: true },
  address: { type: String },
  job: { type: String },
  guarantor: { type: String },
  guarantorPhone: { type: String },
  nationalIdImage: { type: String }, // URL/Path to uploaded file
  contractImage: { type: String },   // URL/Path to uploaded file
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InstallmentCustomer', installmentCustomerSchema);
