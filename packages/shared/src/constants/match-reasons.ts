export const MATCH_REASON_CODES = [
  'grn_qty_exceeds_po_qty',
  'invoice_qty_exceeds_grn_qty',
  'invoice_qty_exceeds_po_qty',
  'invoice_date_after_po_date',
  'duplicate_po',
  'duplicate_document',
  'item_missing_in_po',
  'price_mismatch',
  'mrp_mismatch',
  'unmapped_master_sku',
] as const;
export type MatchReasonCode = (typeof MATCH_REASON_CODES)[number];
