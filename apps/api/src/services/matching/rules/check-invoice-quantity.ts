import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

const EPSILON = 0.0001;
export const checkInvoiceQuantity = (item: AggregatedMatchItem): MatchReason[] => {
  if (item.invoicedQuantity === 0 || item.orderedQuantity === 0) return [];
  const overOrdered = item.invoicedQuantity - item.orderedQuantity > EPSILON;
  const overAccepted =
    item.receivedQuantity > 0 && item.invoicedQuantity - item.acceptedQuantity > EPSILON;
  const under =
    item.invoicedQuantity + EPSILON <
    (item.receivedQuantity > 0 ? item.acceptedQuantity : item.orderedQuantity);
  if (!overOrdered && !overAccepted && !under) return [];
  return [
    reason('invoice_quantity_mismatch', overOrdered || overAccepted ? 'error' : 'warning', {
      orderedQuantity: item.orderedQuantity,
      acceptedQuantity: item.acceptedQuantity,
      invoicedQuantity: item.invoicedQuantity,
      overOrdered,
      overAccepted,
      underInvoiced: under,
    }),
  ];
};
