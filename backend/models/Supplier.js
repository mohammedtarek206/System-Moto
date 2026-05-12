const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: String,
  phone: String,
  email: String,
  address: String,
  balance: { type: Number, default: 0 },
  whatsapp: String,
  notes: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
