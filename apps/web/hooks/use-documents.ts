import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, ParsedDocument } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';
export const useDocuments = (filters: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['documents', filters],
    queryFn: async () =>
      (await apiClient.get<ApiSuccessResponse<ParsedDocument[]>>('/documents', { params: filters }))
        .data.data,
  });
