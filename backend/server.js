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

// CORS - Allow all origins for Vercel / Localhost
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =================== API Routes ===================
const routeModules = [
  ['/auth', require('./routes/auth')],
  ['/products', require('./routes/products')],
  ['/sales', require('./routes/sales')],
  ['/purchases', require('./routes/purchases')],
  ['/contacts', require('./routes/contacts')],
  ['/inventory', require('./routes/inventory')],
  ['/dashboard', require('./routes/dashboard')],
  ['/settings', require('./routes/settings')],
  ['/installments', require('./routes/installments')],
  ['/capital', require('./routes/capital')],       // دورة رأس المال
  ['/capital2', require('./routes/capital2')],    // رأس المال الشامل
  ['/reports', require('./routes/reports')],       // تقارير متقدمة
];

// Mount each router on both /api/* and /* for backwards and direct compatibility
routeModules.forEach(([routePath, handler]) => {
  app.use(`/api${routePath}`, handler);
  app.use(routePath, handler);
});

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ success: true, message: 'Moto Parts API is running 🏍️', version: '2.0.0', time: new Date() });
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
    if (!process.env.VERCEL) {
      setInterval(checkLowStock, 60 * 60 * 1000);
      setInterval(checkOverdueInstallments, 60 * 60 * 1000);
      checkLowStock();
      checkOverdueInstallments();
    } else {
      checkLowStock().catch(e => console.error('Low stock check error:', e));
      checkOverdueInstallments().catch(e => console.error('Overdue installments check error:', e));
    }
    app.listen(PORT, () => {
      console.log(`\n🏍️  Moto Parts Server v2.0 running on port ${PORT}`);
      console.log(`📡  API: http://localhost:${PORT}/api`);
      console.log(`📁  Uploads: http://localhost:${PORT}/uploads`);
      console.log(`\n👤  Default Admin: admin@motoparts.com / Admin@123\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    if (!process.env.VERCEL) process.exit(1);
  }
};

if (!process.env.VERCEL) {
  startServer();
} else {
  testConnection().catch(e => console.error('Vercel DB connection error:', e));
}

module.exports = app;
