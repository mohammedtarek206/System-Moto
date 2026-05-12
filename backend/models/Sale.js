const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    buyPrice: Number,
    sellPrice: Number,
    total: Number
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'credit'], default: 'cash' },
  status: { type: String, enum: ['completed', 'pending', 'cancelled', 'refunded'], default: 'completed' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
