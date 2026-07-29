import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { isDatabaseReady } from './config/database.js';
import { swaggerSpec } from './config/swagger.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { apiRouter } from './routes/index.js';
import { AppError } from './utils/app-error.js';
import { sendSuccess } from './utils/response.js';

export const allowedCorsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const app = express();
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedCorsOrigins.includes(origin.replace(/\/+$/, ''))) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, 'cors_origin_denied', 'The request origin is not allowed'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'test') app.use(morgan('combined'));
app.get('/api/health', (_req, res) => {
  sendSuccess(res, {
    message: 'Three-Way Match Engine API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/ready', (_req, res) => {
  if (!isDatabaseReady()) {
    res.status(503).json({
      success: false,
      error: {
        code: 'database_unavailable',
        message: 'The database is temporarily unavailable',
        details: null,
      },
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    },
  });
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
if (env.NODE_ENV === 'test') {
  app.get('/api/__test/unexpected-error', requireAuth, () => {
    throw new Error('Sensitive stack marker');
  });
}
app.use('/api', apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
