import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

export const checkMrp = (item: AggregatedMatchItem): MatchReason[] => {
  const values = [
    ...(item.masterMrp === undefined ? [] : [item.masterMrp]),
    ...item.poMrps,
    ...item.grnMrps,
    ...item.invoiceMrps,
  ];
  if (values.length < 2 || Math.max(...values) - Math.min(...values) <= 0.0100001) return [];
  return [
    reason('mrp_mismatch', 'error', {
      mrpValues: [...new Set(values)].sort((a, b) => a - b),
    }),
  ];
};
