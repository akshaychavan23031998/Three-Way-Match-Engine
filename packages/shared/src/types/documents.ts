import type { DocumentType } from '../constants/document-types.js';

export interface FileMetadata {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface DocumentItem {
  itemCode: string;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
  mrp: number | null;
  skuMaster: string | null;
}

export interface BaseDocument {
  id: string;
  poNumber: string;
  normalizedPoNumber: string;
  items: DocumentItem[];
  rawParsed: unknown;
  file: FileMetadata;
  duplicateFlags: string[];
}

export interface PurchaseOrder extends BaseDocument {
  documentType: 'po';
  poDate: string | null;
  vendorName: string | null;
}

export interface Grn extends BaseDocument {
  documentType: 'grn';
  grnNumber: string;
  grnDate: string | null;
}

export interface Invoice extends BaseDocument {
  documentType: 'invoice';
  invoiceNumber: string;
  invoiceDate: string | null;
}

export type ParsedDocument = PurchaseOrder | Grn | Invoice;
export type { DocumentType };
