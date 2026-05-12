const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  type: { type: String, enum: ['in', 'out', 'adjustment', 'return'], required: true },
  quantity: { type: Number, required: true },
  quantityBefore: Number,
  quantityAfter: Number,
  referenceType: { type: String, enum: ['sale', 'purchase', 'manual', 'return'], default: 'manual' },
  referenceId: mongoose.Schema.Types.ObjectId,
  notes: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
