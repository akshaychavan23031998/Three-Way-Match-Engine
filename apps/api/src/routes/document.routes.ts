import { Router, type RequestHandler } from 'express';
import * as controller from '../controllers/document.controller.js';
import { uploadDocument as uploadFile } from '../middleware/upload.middleware.js';
import { validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  documentIdParamSchema,
  documentListQuerySchema,
  uploadDocumentSchema,
} from '../schemas/document.schema.js';
import { deleteStoredFile } from '../services/documents/file-storage.service.js';
import { AppError } from '../utils/app-error.js';

const validateUpload: RequestHandler = (req, _res, next) => {
  const result = uploadDocumentSchema.safeParse(req.body);
  if (!result.success) {
    void (req.file ? deleteStoredFile(req.file.filename) : Promise.resolve())
      .catch(() => undefined)
      .then(() =>
        next(
          new AppError(
            400,
            'validation_error',
            'Request validation failed',
            result.error.flatten(),
          ),
        ),
      );
    return;
  }
  req.body = result.data;
  next();
};
export const documentRouter = Router();
documentRouter.post('/upload', uploadFile, validateUpload, controller.uploadDocument);
documentRouter.get('/', validateQuery(documentListQuerySchema), controller.listDocuments);
documentRouter.get(
  '/:id',
  validateParams(documentIdParamSchema, 'invalid_resource_id'),
  controller.getDocument,
);
documentRouter.delete(
  '/:id',
  validateParams(documentIdParamSchema, 'invalid_resource_id'),
  controller.deleteDocument,
);
