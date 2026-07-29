import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, MatchResponse } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';
export const useMatch = (poNumber: string) =>
  useQuery({
    queryKey: ['match', poNumber],
    enabled: Boolean(poNumber),
    queryFn: async () =>
      (
        await apiClient.get<ApiSuccessResponse<MatchResponse>>(
          `/match/${encodeURIComponent(poNumber)}`,
        )
      ).data.data,
  });
