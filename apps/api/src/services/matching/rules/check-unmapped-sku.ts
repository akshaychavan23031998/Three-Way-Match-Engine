import type { MatchReason } from '@three-way-match/shared';
import type { AggregatedMatchItem } from '../../../types/match.types.js';
import { reason } from './reason.js';

export const checkUnmappedSku = (item: AggregatedMatchItem): MatchReason[] => {
  if (item.resolutionMethod === 'conflict')
    return [reason('sku_mapping_conflict', 'error', { matchKey: item.matchKey })];
  if (item.resolutionMethod === 'unresolved')
    return [reason('unmapped_sku', 'error', { matchKey: item.matchKey })];
  return [];
};
