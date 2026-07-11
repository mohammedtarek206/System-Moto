const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String }, // Optional - removed required
  nameAr: String,
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String, sparse: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  
  // Product type classification
  productType: {
    type: String,
    enum: ['spare_parts', 'oils', 'motorcycles', 'scooters', 'batteries', 'tires', 'accessories', 'extras', 'other'],
    default: 'spare_parts'
  },

  // Motorcycle / Scooter specific fields
  brand: String,          // الماركة
  model: String,          // الموديل
  year: Number,           // سنة الصنع
  color: String,          // اللون
  engineCC: Number,       // السعة بالسي سي
  chassisNo: String,      // رقم الشاسيه
  engineNo: String,       // رقم الموتور
  condition: { type: String, enum: ['new', 'used'], default: 'new' }, // الحالة

  motoType: String,       // backward compatibility
  buyPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 5 },
  unit: { type: String, default: 'piece' },
  
  // Images - support multiple
  image: String,          // primary image (backward compat)
  images: [String],       // additional images

  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  purchaseDate: Date,
  description: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes for faster search
productSchema.index({ name: 'text', nameAr: 'text', brand: 'text', model: 'text' });
productSchema.index({ productType: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });

module.exports = mongoose.model('Product', productSchema);
