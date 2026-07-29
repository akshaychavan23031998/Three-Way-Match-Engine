import type { MatchReason, MatchStatus } from '@three-way-match/shared';

export interface MatchStatusContext {
  hasPo: boolean;
  hasGrn: boolean;
  hasInvoice: boolean;
  reasons: MatchReason[];
}

export const determineStatus = ({
  hasPo,
  hasGrn,
  hasInvoice,
  reasons,
}: MatchStatusContext): MatchStatus => {
  if (reasons.some(({ severity }) => severity === 'error')) return 'mismatched';
  if (!hasPo) return 'pending';
  if (!hasGrn && !hasInvoice) return 'pending';
  if (hasGrn && hasInvoice && reasons.length === 0) return 'matched';
  return 'partially_matched';
};
