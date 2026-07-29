import type { MatchReasonCode } from '../constants/match-reasons.js';
import type { MatchStatus } from '../constants/match-status.js';

export interface MatchReason {
  code: MatchReasonCode;
  message: string;
  severity: 'warning' | 'error';
}

export interface MatchItem {
  matchKey: string;
  description: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  invoicedQuantity: number;
  pendingDelivery: number;
  reasons: MatchReason[];
}

export interface MatchResponse {
  poNumber: string;
  status: MatchStatus;
  reasons: MatchReason[];
  items: MatchItem[];
}

export interface SummaryResponse {
  poNumber: string;
  status: MatchStatus;
  documentCounts: { purchaseOrders: number; grns: number; invoices: number };
  totals: {
    orderedQuantity: number;
    receivedQuantity: number;
    invoicedQuantity: number;
    pendingDelivery: number;
  };
}
