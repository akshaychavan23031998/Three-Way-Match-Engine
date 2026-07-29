import type { DocumentType, UploadDocumentResponse } from '@three-way-match/shared';
import { env } from '../../config/env.js';
import {
  createGrn,
  createInvoice,
  createPurchaseOrder,
} from '../../repositories/document.repository.js';
import { grnSchema } from '../../schemas/grn.schema.js';
import { invoiceSchema } from '../../schemas/invoice.schema.js';
import { purchaseOrderSchema } from '../../schemas/purchase-order.schema.js';
import { AppError } from '../../utils/app-error.js';
import { normalizeCode } from '../../utils/normalize-code.js';
import { parseDocument } from '../gemini/gemini.service.js';
import { computeMatchForPoNumber } from '../matching/compute-match.service.js';
import { serializeDocument } from './document.service.js';
import { deleteStoredFile, fileExists } from './file-storage.service.js';

export interface UploadInput {
  documentType: DocumentType;
  file: Express.Multer.File;
  uploadedBy: string;
}
const parseFailed = () =>
  new AppError(422, 'document_parse_failed', 'The uploaded document could not be parsed');
export const processDocumentUpload = async (
  input: UploadInput,
): Promise<UploadDocumentResponse> => {
  let persisted = false;
  try {
    if (!(await fileExists(input.file.filename)))
      throw new AppError(400, 'file_required', 'A document file is required');
    const raw = await parseDocument(input.documentType, input.file.filename, input.file.mimetype);
    const metadata = {
      documentType: input.documentType,
      originalFileName: input.file.originalname,
      storedFileName: input.file.filename,
      mimeType: input.file.mimetype,
      fileSize: input.file.size,
      filePath: input.file.path,
      uploadStatus: 'uploaded' as const,
      processingStatus: 'completed' as const,
      parseProvider: 'gemini' as const,
      parseModel: env.GEMINI_MODEL,
      parseWarnings: [],
      rawParsedData: raw,
      uploadedBy: input.uploadedBy,
    };
    let record;
    let poNumber: string;
    if (input.documentType === 'purchase_order') {
      const result = purchaseOrderSchema.safeParse(raw);
      if (!result.success) throw parseFailed();
      record = await createPurchaseOrder({
        ...metadata,
        ...result.data,
        normalizedPoNumber: normalizeCode(result.data.poNumber),
      });
      poNumber = result.data.poNumber;
    } else if (input.documentType === 'grn') {
      const result = grnSchema.safeParse(raw);
      if (!result.success) throw parseFailed();
      record = await createGrn({
        ...metadata,
        ...result.data,
        normalizedGrnNumber: normalizeCode(result.data.grnNumber),
        normalizedPoNumber: normalizeCode(result.data.poNumber),
      });
      poNumber = result.data.poNumber;
    } else {
      const result = invoiceSchema.safeParse(raw);
      if (!result.success) throw parseFailed();
      record = await createInvoice({
        ...metadata,
        ...result.data,
        normalizedInvoiceNumber: normalizeCode(result.data.invoiceNumber),
        normalizedPoNumber: normalizeCode(result.data.poNumber),
      });
      poNumber = result.data.poNumber;
    }
    persisted = true;
    let matchRecalculationStatus: 'completed' | 'failed' = 'completed';
    try {
      await computeMatchForPoNumber(poNumber, {
        trigger: 'document_upload',
        triggeredBy: input.uploadedBy,
        persistAudit: true,
      });
    } catch {
      matchRecalculationStatus = 'failed';
      console.error('Match recomputation failed after a successful document upload');
    }
    return { ...serializeDocument(record), matchRecalculationStatus };
  } catch (error: unknown) {
    if (!persisted) await deleteStoredFile(input.file.filename);
    throw error;
  }
};
