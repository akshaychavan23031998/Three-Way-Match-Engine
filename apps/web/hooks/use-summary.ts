import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, SummaryResponse } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';
export const useSummary = (poNumber: string) =>
  useQuery({
    queryKey: ['summary', poNumber],
    enabled: Boolean(poNumber),
    queryFn: async () =>
      (
        await apiClient.get<ApiSuccessResponse<SummaryResponse>>(
          `/summary/${encodeURIComponent(poNumber)}`,
        )
      ).data.data,
  });
