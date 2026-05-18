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

    // Auto-migrate products with unreadable/alphanumeric/dense barcodes to clean 10-digit numeric barcodes!
    const Product = require('../models/Product');
    const productsToUpdate = await Product.find({
      $or: [
        { barcode: { $regex: /[a-zA-Z]/ } }, // Contains letters (like old 'BC-')
        { barcode: { $regex: /^.{11,}$/ } }, // Extremely long/dense unreadable ones (like 15-digit timestamps)
        { barcode: { $regex: /^.{1,9}$/ } },  // Too short barcodes
        { barcode: { $exists: false } },
        { barcode: '' }
      ]
    });

    if (productsToUpdate.length > 0) {
      console.log(`🔧 Migrating ${productsToUpdate.length} products to clean 10-digit barcodes for perfect scanner readability...`);
      let index = 0;
      for (const p of productsToUpdate) {
        index++;
        const stamp = (Date.now() + index).toString().slice(-7);
        const rand = Math.floor(100 + Math.random() * 900).toString();
        p.barcode = `${stamp}${rand}`;
        await p.save();
      }
      console.log('✅ Product barcode migration completed successfully.');
    }

    // Smart Categories Seeding
    const defaultCategories = [
      { name: 'Engine Parts', nameAr: 'قطع المحرك', icon: '⚙️', color: '#ef4444' },
      { name: 'Brakes', nameAr: 'الفرامل', icon: '🔴', color: '#f97316' },
      { name: 'Electrical', nameAr: 'الكهرباء', icon: '⚡', color: '#eab308' },
      { name: 'Body Parts', nameAr: 'قطع الهيكل', icon: '🏍️', color: '#3b82f6' },
      { name: 'Filters', nameAr: 'الفلاتر', icon: '🔧', color: '#8b5cf6' },
      { name: 'Tires & Wheels', nameAr: 'الإطارات والعجلات', icon: '🔵', color: '#06b6d4' },
      { name: 'Oils & Lubricants', nameAr: 'الزيوت والشحوم', icon: '🛢️', color: '#10b981' },
      { name: 'Helmets & Safety', nameAr: 'الخوذه والامان', icon: '🪖', color: '#6b7280' },
      { name: 'Accessories & Extras', nameAr: 'كماليات واكسسوارات', icon: '✨', color: '#ec4899' }
    ];

    for (const cat of defaultCategories) {
      const exists = await Category.findOne({ nameAr: cat.nameAr });
      if (!exists) {
        await Category.create(cat);
        console.log(`➕ Added missing category: ${cat.nameAr}`);
      }
    }

    console.log('✅ Database initialization completed');
  } catch (err) {
    console.error('❌ Initialization error:', err.message);
  }
};

module.exports = initializeDatabase;
