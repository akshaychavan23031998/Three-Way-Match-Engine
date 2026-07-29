export const DOCUMENT_TYPES = ['po', 'grn', 'invoice'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
