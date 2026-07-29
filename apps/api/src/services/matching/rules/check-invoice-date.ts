import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

export const checkInvoiceDate = (item: AggregatedMatchItem): MatchReason[] => {
  if (item.poDates.length === 0 || item.invoiceDates.length === 0) return [];
  const earliestPo = Math.min(...item.poDates.map((date) => date.getTime()));
  const invalidDates = item.invoiceDates
    .filter((date) => date.getTime() < earliestPo)
    .map((date) => date.toISOString());
  return invalidDates.length
    ? [reason('invoice_before_po', 'error', { invoiceDates: invalidDates })]
    : [];
};
