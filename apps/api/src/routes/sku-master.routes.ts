import { Router } from 'express';
import * as controller from '../controllers/sku-master.controller.js';
export const skuMasterRouter = Router();
skuMasterRouter.post('/', controller.createSku);
skuMasterRouter.get('/', controller.listSkus);
skuMasterRouter.get('/:id', controller.getSku);
skuMasterRouter.patch('/:id', controller.updateSku);
skuMasterRouter.delete('/:id', controller.deleteSku);
