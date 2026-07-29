import type { MatchReason } from '@three-way-match/shared';
import { reason } from './reason.js';

export interface NumberedDocument {
  id: string;
  number: string;
  normalizedNumber: string;
}

export const checkDuplicatePo = (documents: NumberedDocument[]): MatchReason[] =>
  documents.length > 1
    ? [
        reason('duplicate_purchase_order', 'error', {
          count: documents.length,
          documentIds: documents.map(({ id }) => id).sort(),
        }),
      ]
    : [];
