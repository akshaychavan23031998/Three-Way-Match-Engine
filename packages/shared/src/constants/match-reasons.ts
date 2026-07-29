export const MATCH_REASON_CODES = [
  'unmapped_sku',
  'sku_mapping_conflict',
  'missing_po_item',
  'missing_grn_item',
  'missing_invoice_item',
  'grn_quantity_mismatch',
  'invoice_quantity_mismatch',
  'price_mismatch',
  'mrp_mismatch',
  'invoice_before_po',
  'duplicate_purchase_order',
  'duplicate_grn',
  'duplicate_invoice',
] as const;
export type MatchReasonCode = (typeof MATCH_REASON_CODES)[number];

export const MATCH_REASON_MESSAGES: Record<MatchReasonCode, string> = {
  unmapped_sku: 'The line item could not be resolved through SKU Master',
  sku_mapping_conflict: 'ERP and EAN codes resolve to different SKU Master records',
  missing_po_item: 'The received or invoiced item is missing from the purchase order',
  missing_grn_item: 'The purchase order item is missing from goods receipts',
  missing_invoice_item: 'The purchase order item is missing from invoices',
  grn_quantity_mismatch: 'Received or accepted quantity differs from the ordered quantity',
  invoice_quantity_mismatch: 'Invoiced quantity differs from ordered or accepted quantity',
  price_mismatch: 'Invoice unit price differs from the agreed PO price',
  mrp_mismatch: 'MRP values differ across the matched documents or SKU Master',
  invoice_before_po: 'Invoice date is before the purchase order date',
  duplicate_purchase_order: 'Multiple purchase orders share the same PO number',
  duplicate_grn: 'Multiple GRNs share the same GRN number',
  duplicate_invoice: 'Multiple invoices share the same invoice number',
};
