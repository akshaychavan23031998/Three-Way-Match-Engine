import type { MatchReasonCode } from '../constants/match-reasons.js';
import type { MatchStatus } from '../constants/match-status.js';

export type MatchReasonSeverity = 'warning' | 'error';
export type MatchTrigger = 'document_upload' | 'manual_recompute' | 'api_request';
export type SkuResolutionMethod = 'erp' | 'ean' | 'unresolved' | 'conflict';

export interface MatchReason {
  code: MatchReasonCode;
  message: string;
  severity: MatchReasonSeverity;
  details: Record<string, unknown>;
}

export interface MatchSourceReference {
  documentId: string;
  documentType: 'purchase_order' | 'grn' | 'invoice';
  documentNumber: string;
  lineIndex: number;
  lineNumber?: number | undefined;
}

export interface MatchItem {
  matchKey: string;
  status: MatchStatus;
  skuMasterId?: string | undefined;
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
  skuName?: string | undefined;
  description?: string | undefined;
  resolutionMethod: SkuResolutionMethod;
  sourceReferences: MatchSourceReference[];
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  invoicedQuantity: number;
  pendingDelivery: number;
  poPrices: number[];
  invoicePrices: number[];
  poMrps: number[];
  grnMrps: number[];
  invoiceMrps: number[];
  reasons: MatchReason[];
}

export interface MatchTotals {
  poItemCount: number;
  grnItemCount: number;
  invoiceItemCount: number;
  matchedItemCount: number;
  mismatchedItemCount: number;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  invoicedQuantity: number;
  poAmount: number;
  invoiceAmount: number;
  amountDifference: number;
}

export interface MatchDocumentReference {
  id: string;
  documentType: 'purchase_order' | 'grn' | 'invoice';
  documentNumber: string;
  createdAt: string;
}

export interface MatchAudit {
  id: string;
  poNumber: string;
  status: MatchStatus;
  reasons: MatchReason[];
  items: MatchItem[];
  documentReferences: MatchDocumentReference[];
  totals: MatchTotals;
  computedAt: string;
  computationVersion: '1.0';
  trigger: MatchTrigger;
  triggeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchResponse = MatchAudit;

export interface MatchHistoryQuery {
  page: number;
  limit: number;
}

export interface SummaryRow {
  poNumber: string;
  latestMatchAuditId?: string | undefined;
  status: MatchStatus;
  purchaseOrderCount: number;
  grnCount: number;
  invoiceCount: number;
  supplierName?: string | undefined;
  poDate?: string | undefined;
  latestDocumentDate?: string | undefined;
  poAmount: number;
  invoiceAmount: number;
  amountDifference: number;
  mismatchCount: number;
  warningCount: number;
  lastComputedAt?: string | undefined;
  updatedAt: string;
}

export interface SummaryListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  status?: MatchStatus | undefined;
  sortBy: 'updatedAt' | 'poNumber' | 'status' | 'invoiceAmount' | 'amountDifference';
  sortOrder: 'asc' | 'desc';
}

/** @deprecated Use SummaryRow with a paginated API response. */
export type SummaryResponse = SummaryRow;
