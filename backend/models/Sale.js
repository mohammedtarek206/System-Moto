const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Sale category for reports
  saleCategory: {
    type: String,
    enum: ['spare_parts', 'oils', 'motorcycles', 'scooters', 'mixed', 'other'],
    default: 'mixed'
  },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    nameAr: String,
    productType: String,   // spare_parts, oils, motorcycles, scooters, etc.
    brand: String,
    model: String,
    quantity: Number,
    buyPrice: Number,
    sellPrice: Number,
    total: Number
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },         // final total after discount/tax
  totalAmount: { type: Number, default: 0 },   // alias used in controller
  totalCost: { type: Number, default: 0 },     // cost of goods sold
  paidAmount: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'credit'], default: 'cash' },
  status: { type: String, enum: ['completed', 'pending', 'cancelled', 'refunded'], default: 'completed' },
  notes: String
}, { timestamps: true });

// Indexes for faster filtering
saleSchema.index({ createdAt: -1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ user: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentMethod: 1 });
saleSchema.index({ saleCategory: 1 });

module.exports = mongoose.model('Sale', saleSchema);
