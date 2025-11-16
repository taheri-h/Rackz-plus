const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    // Connect to MongoDB
    await mongoose.connect(uri, {
      dbName: dbName,
    });

    console.log(`✅ MongoDB Connected: ${dbName} on ${uri}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

