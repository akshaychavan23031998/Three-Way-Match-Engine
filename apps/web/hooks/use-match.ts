import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MatchHistoryQuery } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';

export const matchKeys = {
  latest: (poNumber: string) => ['match', poNumber] as const,
  history: (poNumber: string, query: MatchHistoryQuery) =>
    ['match-history', poNumber, query] as const,
  audit: (id: string) => ['match-audit', id] as const,
};
export const useMatch = (poNumber: string) =>
  useQuery({
    queryKey: matchKeys.latest(poNumber),
    enabled: Boolean(poNumber),
    queryFn: ({ signal }) => apiClient.getMatch(poNumber, signal),
  });
export const useRecomputeMatch = (poNumber: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.recomputeMatch(poNumber),
    onSuccess: (audit) => {
      client.setQueryData(matchKeys.latest(poNumber), audit);
      void client.invalidateQueries({ queryKey: ['match-history', poNumber] });
      void client.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};
export const useMatchHistory = (poNumber: string, query: MatchHistoryQuery) =>
  useQuery({
    queryKey: matchKeys.history(poNumber, query),
    enabled: Boolean(poNumber),
    queryFn: ({ signal }) => apiClient.getMatchHistory(poNumber, query, signal),
    placeholderData: keepPreviousData,
  });
export const useMatchAudit = (id?: string) =>
  useQuery({
    queryKey: matchKeys.audit(id ?? ''),
    enabled: Boolean(id),
    queryFn: ({ signal }) => apiClient.getMatchAudit(id ?? '', signal),
  });
