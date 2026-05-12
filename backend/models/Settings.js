const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'Moto Parts Shop' },
  shopNameAr: { type: String, default: 'محل قطع غيار موتسيكلات' },
  shopAddress: String,
  shopPhone: String,
  shopEmail: String,
  logo: String,
  currency: { type: String, default: 'EGP' },
  currencySymbol: { type: String, default: 'ج.م' },
  taxRate: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  language: { type: String, enum: ['ar', 'en'], default: 'ar' },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  invoiceFooter: String
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
