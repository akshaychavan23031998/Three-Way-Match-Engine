import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccessResponse, SkuMaster, SkuMasterInput } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';
export const useSkuMasters = () =>
  useQuery({
    queryKey: ['sku-masters'],
    queryFn: async () =>
      (await apiClient.get<ApiSuccessResponse<SkuMaster[]>>('/masters/sku')).data.data,
  });
export const useCreateSkuMaster = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: SkuMasterInput) =>
      (await apiClient.post<ApiSuccessResponse<SkuMaster>>('/masters/sku', input)).data.data,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['sku-masters'] }),
  });
};
export const useUpdateSkuMaster = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<SkuMasterInput> }) =>
      (await apiClient.patch<ApiSuccessResponse<SkuMaster>>(`/masters/sku/${id}`, input)).data.data,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['sku-masters'] }),
  });
};
export const useDeleteSkuMaster = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/masters/sku/${id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['sku-masters'] }),
  });
};
