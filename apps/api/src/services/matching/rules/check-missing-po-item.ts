import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

export interface DocumentPresence {
  hasGrns: boolean;
  hasInvoices: boolean;
}

export const checkMissingDocumentItems = (
  item: AggregatedMatchItem,
  presence: DocumentPresence,
): MatchReason[] => {
  const result: MatchReason[] = [];
  if (item.orderedQuantity === 0 && (item.receivedQuantity > 0 || item.invoicedQuantity > 0))
    result.push(reason('missing_po_item', 'error', { matchKey: item.matchKey }));
  if (item.orderedQuantity > 0 && item.receivedQuantity === 0)
    result.push(
      reason('missing_grn_item', presence.hasGrns ? 'error' : 'warning', {
        matchKey: item.matchKey,
      }),
    );
  if (item.orderedQuantity > 0 && item.invoicedQuantity === 0)
    result.push(
      reason('missing_invoice_item', presence.hasInvoices ? 'error' : 'warning', {
        matchKey: item.matchKey,
      }),
    );
  return result;
};

export const checkMissingPoItem = checkMissingDocumentItems;
