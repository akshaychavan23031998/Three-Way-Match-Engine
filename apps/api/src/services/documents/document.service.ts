import type {
  DeleteDocumentResponse,
  DocumentListQuery,
  DocumentSummary,
  PaginationMeta,
  UploadDocumentResponse,
} from '@three-way-match/shared';
import {
  countDocuments,
  deleteDocumentById,
  findDocumentById,
  listDocuments as listRecords,
  type DocumentRecord,
} from '../../repositories/document.repository.js';
import { AppError } from '../../utils/app-error.js';
import { computeMatchForPoNumber } from '../matching/compute-match.service.js';
import { deleteStoredFile } from './file-storage.service.js';

export const serializeDocument = (record: DocumentRecord): UploadDocumentResponse => {
  const common = {
    id: record._id.toString(),
    documentType: record.documentType,
    originalFileName: record.originalFileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    processingStatus: 'completed' as const,
    parseProvider: 'gemini' as const,
    parseModel: record.parseModel,
    uploadedBy: record.uploadedBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
  if (record.documentType === 'purchase_order' && 'poDate' in record)
    return {
      ...common,
      documentType: 'purchase_order',
      poNumber: record.poNumber,
      poDate: record.poDate.toISOString(),
      items: record.items,
      ...(record.supplierName ? { supplierName: record.supplierName } : {}),
      ...(record.supplierCode ? { supplierCode: record.supplierCode } : {}),
      ...(record.currency ? { currency: record.currency } : {}),
      ...(record.subtotal !== undefined ? { subtotal: record.subtotal } : {}),
      ...(record.taxAmount !== undefined ? { taxAmount: record.taxAmount } : {}),
      ...(record.totalAmount !== undefined ? { totalAmount: record.totalAmount } : {}),
    };
  if (record.documentType === 'grn' && 'grnDate' in record)
    return {
      ...common,
      documentType: 'grn',
      grnNumber: record.grnNumber,
      grnDate: record.grnDate.toISOString(),
      poNumber: record.poNumber,
      items: record.items,
      ...(record.supplierName ? { supplierName: record.supplierName } : {}),
      ...(record.supplierCode ? { supplierCode: record.supplierCode } : {}),
    };
  if (record.documentType === 'invoice' && 'invoiceDate' in record)
    return {
      ...common,
      documentType: 'invoice',
      invoiceNumber: record.invoiceNumber,
      invoiceDate: record.invoiceDate.toISOString(),
      poNumber: record.poNumber,
      items: record.items,
      ...(record.supplierName ? { supplierName: record.supplierName } : {}),
      ...(record.supplierCode ? { supplierCode: record.supplierCode } : {}),
      ...(record.currency ? { currency: record.currency } : {}),
      ...(record.subtotal !== undefined ? { subtotal: record.subtotal } : {}),
      ...(record.taxAmount !== undefined ? { taxAmount: record.taxAmount } : {}),
      ...(record.totalAmount !== undefined ? { totalAmount: record.totalAmount } : {}),
    };
  throw new Error('Unknown document record');
};
const notFound = () => new AppError(404, 'document_not_found', 'Document was not found');
export const getDocumentById = async (id: string): Promise<UploadDocumentResponse> => {
  const found = await findDocumentById(id);
  if (!found) throw notFound();
  return serializeDocument(found.document);
};
export const listDocuments = async (
  query: DocumentListQuery,
): Promise<{ data: DocumentSummary[]; meta: PaginationMeta }> => {
  const [records, total] = await Promise.all([listRecords(query), countDocuments(query)]);
  return {
    data: records.map(serializeDocument),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total ? Math.ceil(total / query.limit) : 0,
    },
  };
};
export const deleteDocument = async (
  id: string,
  triggeredBy: string,
): Promise<DeleteDocumentResponse> => {
  const found = await findDocumentById(id);
  if (!found) throw notFound();
  const poNumber = found.document.poNumber;
  await deleteDocumentById(found);
  await deleteStoredFile(found.document.storedFileName);
  try {
    await computeMatchForPoNumber(poNumber, {
      trigger: 'document_delete',
      triggeredBy,
      persistAudit: true,
    });
    return { matchRecalculationStatus: 'completed' };
  } catch {
    console.error('Match recomputation failed after a successful document deletion');
    return { matchRecalculationStatus: 'failed' };
  }
};
