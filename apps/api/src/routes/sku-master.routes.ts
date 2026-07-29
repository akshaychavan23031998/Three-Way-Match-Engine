import { Router } from 'express';
import * as controller from '../controllers/sku-master.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  createSkuMasterSchema,
  skuMasterIdParamSchema,
  skuMasterListQuerySchema,
  updateSkuMasterSchema,
} from '../schemas/sku-master.schema.js';

export const skuMasterRouter = Router();
skuMasterRouter.post('/', validateBody(createSkuMasterSchema), controller.createSkuMaster);
skuMasterRouter.get('/', validateQuery(skuMasterListQuerySchema), controller.listSkuMasters);
skuMasterRouter.get(
  '/:id',
  validateParams(skuMasterIdParamSchema, 'invalid_resource_id'),
  controller.getSkuMaster,
);
skuMasterRouter.patch(
  '/:id',
  validateParams(skuMasterIdParamSchema, 'invalid_resource_id'),
  validateBody(updateSkuMasterSchema),
  controller.updateSkuMaster,
);
skuMasterRouter.delete(
  '/:id',
  validateParams(skuMasterIdParamSchema, 'invalid_resource_id'),
  controller.deleteSkuMaster,
);
