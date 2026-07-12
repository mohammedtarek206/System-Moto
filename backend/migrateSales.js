require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const Product = require('./models/Product');

const migrate = async () => {
  try {
    console.log('⏳ Connecting to Database...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Fetching all sales...');
    const sales = await Sale.find({});
    console.log(`Found ${sales.length} total sales records.`);

    let migratedCount = 0;

    for (const sale of sales) {
      let needsUpdate = false;
      
      for (const item of sale.items) {
        // Check if the item is missing historical snapshot fields
        if (!item.productType || !item.name) {
          needsUpdate = true;
          
          if (item.product) {
            const product = await Product.findById(item.product);
            if (product) {
              item.name = product.name || product.brand || product.sku || 'منتج غير معروف';
              item.nameAr = product.nameAr || product.name || item.name;
              item.productType = product.productType || 'spare_parts';
              item.category = product.category || '';
              item.brand = product.brand || '';
              item.model = product.model || '';
              item.barcode = product.barcode || '';
              item.sku = product.sku || '';
              if (!item.buyPrice) item.buyPrice = product.buyPrice || 0;
            } else {
              // Product was deleted from inventory, but sale remains
              item.name = 'منتج محذوف';
              item.nameAr = 'منتج محذوف';
              item.productType = 'other';
              if (!item.buyPrice) item.buyPrice = 0;
            }
          }
        }
      }

      if (needsUpdate) {
        // Recalculate total cost to ensure profit calculations are accurate
        const newTotalCost = sale.items.reduce((acc, it) => acc + ((it.buyPrice || 0) * (it.quantity || 1)), 0);
        sale.totalCost = newTotalCost;
        
        // Save the updated sale record back to the database
        await sale.save();
        migratedCount++;
        process.stdout.write(`\r✅ Migrated ${migratedCount} old sales...`);
      }
    }

    console.log('\n🎉 Migration Complete!');
    console.log(`✅ Total Sales Updated: ${migratedCount} out of ${sales.length}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration Failed:', err);
    process.exit(1);
  }
};

migrate();
