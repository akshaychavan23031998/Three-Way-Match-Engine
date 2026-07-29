import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRouter } from './auth.routes.js';
import { documentRouter } from './document.routes.js';
import { matchRouter } from './match.routes.js';
import { skuMasterRouter } from './sku-master.routes.js';
import { summaryRouter } from './summary.routes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/documents', requireAuth, documentRouter);
apiRouter.use('/match', requireAuth, matchRouter);
apiRouter.use('/summary', requireAuth, summaryRouter);
apiRouter.use('/masters/sku', requireAuth, skuMasterRouter);
