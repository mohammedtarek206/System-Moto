const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: String,
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String, sparse: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  motoType: String,
  buyPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 5 },
  unit: { type: String, default: 'piece' },
  image: String,
  description: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
