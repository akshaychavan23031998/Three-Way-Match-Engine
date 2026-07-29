import { Router } from 'express';
import { getSummary } from '../controllers/summary.controller.js';
export const summaryRouter = Router();
summaryRouter.get('/:poNumber', getSummary);
