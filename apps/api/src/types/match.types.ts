import type {
  MatchItem,
  MatchReason,
  MatchResponse,
  SkuResolutionMethod,
} from '@three-way-match/shared';

export type { MatchItem, MatchReason, MatchResponse };

export interface ResolvableItem {
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
}

export interface SkuResolution {
  skuMasterId?: string | undefined;
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
  skuName?: string | undefined;
  agreedRate?: number | undefined;
  mrp?: number | undefined;
  priceTolerance?: number | undefined;
  resolutionMethod: SkuResolutionMethod;
}

export interface MatchLine {
  sourceType: 'purchase_order' | 'grn' | 'invoice';
  documentId: string;
  documentNumber: string;
  documentDate: Date;
  lineIndex: number;
  lineNumber?: number | undefined;
  description: string;
  skuErpCode?: string | undefined;
  eanCode?: string | undefined;
  quantity: number;
  acceptedQuantity?: number | undefined;
  rejectedQuantity?: number | undefined;
  unitPrice?: number | undefined;
  mrp?: number | undefined;
  resolution: SkuResolution;
}

export interface AggregatedMatchItem extends Omit<MatchItem, 'status' | 'reasons'> {
  agreedRate?: number | undefined;
  masterMrp?: number | undefined;
  priceTolerance?: number | undefined;
  poDates: Date[];
  invoiceDates: Date[];
  reasons: MatchReason[];
}
