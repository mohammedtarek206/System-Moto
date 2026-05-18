const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    sku: String,
    barcode: String,
    buyPrice: { type: Number, required: true },
    sellPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'paid' },
  notes: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
