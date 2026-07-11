const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['spare_parts_sales', 'oil_sales', 'motorcycle_sales', 'scooter_sales', 'other'],
    default: 'other'
  },
  categoryAr: String,
  amount: { type: Number, required: true, min: 0 },
  description: String,
  date: { type: Date, default: Date.now },
  responsible: String,
  attachment: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' }, // linked sale if applicable
  notes: String,
}, { timestamps: true });

revenueSchema.index({ date: -1 });
revenueSchema.index({ category: 1 });

module.exports = mongoose.model('Revenue', revenueSchema);
