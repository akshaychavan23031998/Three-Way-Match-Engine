import type { MatchStatus } from '@three-way-match/shared';
export const determineStatus = (hasDocuments: boolean): MatchStatus =>
  hasDocuments ? 'partially_matched' : 'insufficient_documents';
