import mongoose from 'mongoose';
import dns from 'dns';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (uri) {
    if (uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('[Database] Could not override DNS servers:', dnsErr.message);
      }
    }
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`[Database] Error connecting to provided MONGODB_URI: ${err.message}`);
      if (isProduction) {
        throw new Error('Production database connection failed. Aborting startup.');
      }
      console.log('[Database] Falling back to MongoDB Memory Server for local development...');
    }
  }

  if (isProduction) {
    throw new Error('MONGODB_URI must be set in production mode. In-memory database is disabled.');
  }

  // Local development / testing fallback with mongodb-memory-server
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] In-Memory MongoDB Started for Development at ${memUri}`);
    return conn;
  } catch (memErr) {
    console.error(`[Database] Failed to start in-memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
