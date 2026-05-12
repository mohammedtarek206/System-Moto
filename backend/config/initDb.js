const User = require('../models/User');
const Category = require('../models/Category');
const Settings = require('../models/Settings');

const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing MongoDB collections...');

    // Default Admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'مدير النظام',
        email: 'admin@motoparts.com',
        password: 'Admin@123', // Will be hashed by pre-save hook
        role: 'admin',
        phone: '01000000000'
      });
      console.log('✅ Default admin created: admin@motoparts.com / Admin@123');
    }

    // Default Settings
    const settingsExist = await Settings.findOne();
    if (!settingsExist) {
      await Settings.create({});
    }

    // Default Categories
    const categoriesExist = await Category.findOne();
    if (!categoriesExist) {
      const categories = [
        { name: 'Engine Parts', nameAr: 'قطع المحرك', icon: '⚙️', color: '#ef4444' },
        { name: 'Brakes', nameAr: 'الفرامل', icon: '🔴', color: '#f97316' },
        { name: 'Electrical', nameAr: 'الكهرباء', icon: '⚡', color: '#eab308' },
        { name: 'Body Parts', nameAr: 'قطع الهيكل', icon: '🏍️', color: '#3b82f6' },
        { name: 'Filters', nameAr: 'الفلاتر', icon: '🔧', color: '#8b5cf6' },
        { name: 'Tires & Wheels', nameAr: 'الإطارات والعجلات', icon: '🔵', color: '#06b6d4' },
      ];
      await Category.insertMany(categories);
    }

    console.log('✅ Database initialization completed');
  } catch (err) {
    console.error('❌ Initialization error:', err.message);
  }
};

module.exports = initializeDatabase;
