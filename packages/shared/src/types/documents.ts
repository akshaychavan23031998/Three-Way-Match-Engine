import type { DocumentType } from '../constants/document-types.js';

export interface DocumentCommon {
  id: string;
  documentType: DocumentType;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  processingStatus: 'completed';
  parseProvider: 'gemini';
  parseModel: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  lineNumber?: number | undefined;
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
  description: string;
  hsnCode?: string | undefined;
  uom?: string | undefined;
  quantity: number;
  unitPrice: number;
  mrp?: number | undefined;
  lineTotal?: number | undefined;
}
export interface GrnItem {
  lineNumber?: number | undefined;
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
  description: string;
  hsnCode?: string | undefined;
  uom?: string | undefined;
  receivedQuantity: number;
  acceptedQuantity?: number | undefined;
  rejectedQuantity?: number | undefined;
  mrp?: number | undefined;
}
export interface InvoiceItem {
  lineNumber?: number | undefined;
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
  description: string;
  hsnCode?: string | undefined;
  uom?: string | undefined;
  invoicedQuantity: number;
  unitPrice: number;
  mrp?: number | undefined;
  lineTotal?: number | undefined;
}
export interface ParsedPurchaseOrder {
  poNumber: string;
  poDate: Date;
  supplierName?: string | undefined;
  supplierCode?: string | undefined;
  currency?: string | undefined;
  items: PurchaseOrderItem[];
  subtotal?: number | undefined;
  taxAmount?: number | undefined;
  totalAmount?: number | undefined;
}
export interface ParsedGrn {
  grnNumber: string;
  grnDate: Date;
  poNumber: string;
  supplierName?: string | undefined;
  supplierCode?: string | undefined;
  items: GrnItem[];
}
export interface ParsedInvoice {
  invoiceNumber: string;
  invoiceDate: Date;
  poNumber: string;
  supplierName?: string | undefined;
  supplierCode?: string | undefined;
  currency?: string | undefined;
  items: InvoiceItem[];
  subtotal?: number | undefined;
  taxAmount?: number | undefined;
  totalAmount?: number | undefined;
}
export type PurchaseOrder = DocumentCommon &
  Omit<ParsedPurchaseOrder, 'poDate'> & {
    documentType: 'purchase_order';
    poDate: string;
  };
export type Grn = DocumentCommon &
  Omit<ParsedGrn, 'grnDate'> & {
    documentType: 'grn';
    grnDate: string;
  };
export type Invoice = DocumentCommon &
  Omit<ParsedInvoice, 'invoiceDate'> & {
    documentType: 'invoice';
    invoiceDate: string;
  };
export type ParsedDocument = ParsedPurchaseOrder | ParsedGrn | ParsedInvoice;
export type MatchRecalculationStatus = 'completed' | 'failed';
export type UploadDocumentResponse = (PurchaseOrder | Grn | Invoice) & {
  matchRecalculationStatus?: MatchRecalculationStatus | undefined;
};
export type DocumentSummary = UploadDocumentResponse;
export interface DocumentListQuery {
  page: number;
  limit: number;
  documentType?: DocumentType | undefined;
  search?: string | undefined;
  sortBy: 'createdAt' | 'updatedAt' | 'originalFileName' | 'documentDate';
  sortOrder: 'asc' | 'desc';
}
export interface FileMetadata {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
}
export type { DocumentType };
