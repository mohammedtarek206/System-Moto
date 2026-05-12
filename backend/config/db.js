const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Auto initialization logic moved to separate file
    const initializeDatabase = require('./initDb');
    await initializeDatabase();
    
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { testConnection };
