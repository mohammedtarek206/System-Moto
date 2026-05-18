require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { testConnection } = require('./config/db');
const initializeDatabase = require('./config/initDb');
const { checkLowStock } = require('./controllers/settingsController');
const { checkOverdueInstallments } = require('./controllers/installmentController');

const app = express();

// Security & Performance Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));

// CORS - السماح لكل الروابط للعمل على Vercel بسهولة
app.use(cors({
  origin: true, // يسمح لأي رابط بالوصول (Vercel, Localhost, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/installments', require('./routes/installments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Moto Parts API is running 🏍️', version: '1.0.0', time: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'خطأ في الخادم' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await initializeDatabase();
    // Check low stock every hour (only run timers if not in serverless Vercel function)
    if (!process.env.VERCEL) {
      setInterval(checkLowStock, 60 * 60 * 1000);
      setInterval(checkOverdueInstallments, 60 * 60 * 1000);
      checkLowStock(); // run on startup
      checkOverdueInstallments(); // run on startup
    } else {
      checkLowStock().catch(e => console.error('Low stock check error:', e));
      checkOverdueInstallments().catch(e => console.error('Overdue installments check error:', e));
    }
    app.listen(PORT, () => {
      console.log(`\n🏍️  Moto Parts Server running on port ${PORT}`);
      console.log(`📡  API: http://localhost:${PORT}/api`);
      console.log(`📁  Uploads: http://localhost:${PORT}/uploads`);
      console.log(`\n👤  Default Admin: admin@motoparts.com / Admin@123\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// Start server if not running as a Vercel Serverless Function
if (!process.env.VERCEL) {
  startServer();
} else {
  // On Vercel, connect to DB immediately in background
  testConnection().catch(e => console.error('Vercel DB connection error:', e));
}

module.exports = app;
