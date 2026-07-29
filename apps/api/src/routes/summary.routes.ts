import { Router } from 'express';
import { getSummary } from '../controllers/summary.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { summaryListQuerySchema } from '../schemas/summary.schema.js';

export const summaryRouter = Router();
summaryRouter.get('/', validateQuery(summaryListQuerySchema), getSummary);
