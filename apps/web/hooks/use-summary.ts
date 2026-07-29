import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SummaryListQuery } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';

export const summaryKey = (query: SummaryListQuery) => ['summary', query] as const;
export const useSummary = (query: SummaryListQuery) =>
  useQuery({
    queryKey: summaryKey(query),
    queryFn: ({ signal }) => apiClient.listSummary(query, signal),
    placeholderData: keepPreviousData,
  });
