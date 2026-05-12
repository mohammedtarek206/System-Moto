const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleAr: String,
  message: { type: String, required: true },
  messageAr: String,
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  isRead: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
