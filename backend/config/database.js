const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!uri) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    if (!dbName) {
      console.error('❌ MONGODB_DB is not set in environment variables');
      process.exit(1);
    }
    
    // Connect to MongoDB with options
    const connectionOptions = {
      dbName: dbName,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(uri, connectionOptions);

    // Mask URI for logging (hide password)
    const maskedUri = uri.replace(/:[^:@]+@/, ':****@');
    console.log(`✅ MongoDB Connected: ${dbName}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   URI: ${maskedUri}`);
    }
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit in development, allow retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing without database connection (development mode)');
    }
  }
};

module.exports = connectDB;

