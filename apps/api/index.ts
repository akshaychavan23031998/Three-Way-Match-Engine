import express, { type Express } from 'express';
import { app } from './src/app.js';
import { connectDatabase } from './src/config/database.js';

type ConnectDatabase = () => Promise<void>;

const hasPathPrefix = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

const databaseBackedPath = (path: string): boolean =>
  path === '/api/ready' ||
  hasPathPrefix(path, '/api/documents') ||
  hasPathPrefix(path, '/api/matches') ||
  hasPathPrefix(path, '/api/summary') ||
  hasPathPrefix(path, '/api/masters/sku');

export const createServerlessApp = (connect: ConnectDatabase = connectDatabase): Express => {
  const serverlessApp = express();
  serverlessApp.use(async (req, res, next) => {
    if (!databaseBackedPath(req.path)) {
      next();
      return;
    }
    try {
      await connect();
      next();
    } catch {
      res.status(503).json({
        success: false,
        error: {
          code: 'database_unavailable',
          message: 'The database is temporarily unavailable',
          details: null,
        },
      });
    }
  });
  serverlessApp.use(app);
  return serverlessApp;
};

const serverlessApp = createServerlessApp();
export default serverlessApp;
