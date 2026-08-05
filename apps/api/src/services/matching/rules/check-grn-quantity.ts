import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

const EPSILON = 0.0001;
export const checkGrnQuantity = (item: AggregatedMatchItem): MatchReason[] => {
  if (item.orderedQuantity === 0 || item.receivedQuantity === 0) return [];
  const comparisonQuantity = item.acceptedQuantity;
  if (Math.abs(item.orderedQuantity - comparisonQuantity) <= EPSILON) return [];
  const exceedsOrder = comparisonQuantity - item.orderedQuantity > EPSILON;
  return [
    reason('grn_quantity_mismatch', exceedsOrder ? 'error' : 'warning', {
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      acceptedQuantity: item.acceptedQuantity,
      rejectedQuantity: item.rejectedQuantity,
      pendingDelivery: item.pendingDelivery,
      exceedsOrder,
    }),
  ];
};
