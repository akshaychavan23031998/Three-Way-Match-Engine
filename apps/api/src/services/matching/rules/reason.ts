import {
  MATCH_REASON_MESSAGES,
  type MatchReason,
  type MatchReasonCode,
  type MatchReasonSeverity,
} from '@three-way-match/shared';

export const reason = (
  code: MatchReasonCode,
  severity: MatchReasonSeverity,
  details: Record<string, unknown> = {},
): MatchReason => ({ code, message: MATCH_REASON_MESSAGES[code], severity, details });
