import {
  documentListQuerySchema,
  type DocumentIdParams,
  type UploadDocumentBody,
} from '../schemas/document.schema.js';
import {
  deleteDocument as deleteService,
  getDocumentById,
  listDocuments as listService,
} from '../services/documents/document.service.js';
import { processDocumentUpload } from '../services/documents/document-upload.service.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const uploadDocument = asyncHandler<Record<string, never>, unknown, UploadDocumentBody>(
  async (req, res) => {
    if (!req.file) throw new AppError(400, 'file_required', 'A document file is required');
    if (!req.user) throw new AppError(401, 'unauthorized', 'A valid bearer token is required');
    sendCreated(
      res,
      await processDocumentUpload({
        documentType: req.body.documentType,
        file: req.file,
        uploadedBy: req.user.email,
      }),
    );
  },
);
export const listDocuments = asyncHandler(async (req, res) => {
  const result = await listService(documentListQuerySchema.parse(req.query));
  sendSuccess(res, result.data, result.meta);
});
export const getDocument = asyncHandler<DocumentIdParams>(async (req, res) => {
  sendSuccess(res, await getDocumentById(req.params.id));
});
export const deleteDocument = asyncHandler<DocumentIdParams>(async (req, res) => {
  if (!req.user) throw new AppError(401, 'unauthorized', 'A valid bearer token is required');
  sendSuccess(res, await deleteService(req.params.id, req.user.email));
});
