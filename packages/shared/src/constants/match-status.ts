export const MATCH_STATUSES = [
  'insufficient_documents',
  'mismatch',
  'partially_matched',
  'matched',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];
