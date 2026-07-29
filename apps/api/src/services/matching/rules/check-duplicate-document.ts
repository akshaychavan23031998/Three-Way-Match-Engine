import type { MatchReason } from '@three-way-match/shared';
import type { NumberedDocument } from './check-duplicate-po.js';
import { reason } from './reason.js';

export const checkDuplicateDocument = (
  documents: NumberedDocument[],
  type: 'grn' | 'invoice',
): MatchReason[] => {
  const groups = new Map<string, NumberedDocument[]>();
  for (const document of documents)
    groups.set(document.normalizedNumber, [
      ...(groups.get(document.normalizedNumber) ?? []),
      document,
    ]);
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, values]) =>
      reason(type === 'grn' ? 'duplicate_grn' : 'duplicate_invoice', 'error', {
        documentNumber: values[0]?.number ?? '',
        count: values.length,
        documentIds: values.map(({ id }) => id).sort(),
      }),
    );
};
