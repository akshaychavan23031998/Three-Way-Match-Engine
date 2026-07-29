export const MATCH_STATUSES = ['matched', 'partially_matched', 'mismatched', 'pending'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];
