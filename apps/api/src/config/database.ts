import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGODB_URI)
      .then((connection) => {
        console.info('MongoDB connection established');
        return connection;
      })
      .catch(() => {
        connectionPromise = null;
        throw new Error('Unable to connect to MongoDB');
      });
  }
  try {
    await connectionPromise;
  } catch {
    throw new Error('Unable to connect to MongoDB');
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.info('MongoDB connection closed');
    }
  } finally {
    connectionPromise = null;
  }
};

export const isDatabaseReady = (): boolean => mongoose.connection.readyState === 1;

export const resetDatabaseConnectionCacheForTests = (): void => {
  if (env.NODE_ENV === 'test') connectionPromise = null;
};
