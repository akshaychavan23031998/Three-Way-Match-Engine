import { Router } from 'express';
import * as controller from '../controllers/match.controller.js';
import { validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  matchAuditIdParamSchema,
  matchHistoryQuerySchema,
  matchPoNumberParamSchema,
} from '../schemas/match.schema.js';

export const matchRouter = Router();
matchRouter.get(
  '/audits/:id',
  validateParams(matchAuditIdParamSchema, 'invalid_resource_id'),
  controller.getMatchAudit,
);
matchRouter.get(
  '/:poNumber/history',
  validateParams(matchPoNumberParamSchema, 'invalid_po_number'),
  validateQuery(matchHistoryQuerySchema),
  controller.getMatchHistory,
);
matchRouter.post(
  '/:poNumber/recompute',
  validateParams(matchPoNumberParamSchema, 'invalid_po_number'),
  controller.recomputeMatch,
);
matchRouter.get(
  '/:poNumber',
  validateParams(matchPoNumberParamSchema, 'invalid_po_number'),
  controller.getMatch,
);
