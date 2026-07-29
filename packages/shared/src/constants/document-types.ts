export const DOCUMENT_TYPES = ['purchase_order', 'grn', 'invoice'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
