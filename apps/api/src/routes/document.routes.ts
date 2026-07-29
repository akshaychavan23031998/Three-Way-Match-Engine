import { Router } from 'express';
import * as controller from '../controllers/document.controller.js';
import { uploadDocument } from '../middleware/upload.middleware.js';
export const documentRouter = Router();
documentRouter.post('/upload', uploadDocument, controller.upload);
documentRouter.get('/', controller.list);
documentRouter.get('/:id', controller.getById);
documentRouter.get('/:id/file', controller.getFile);
