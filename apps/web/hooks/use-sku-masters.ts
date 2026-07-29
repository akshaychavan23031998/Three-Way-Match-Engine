import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSkuMasterInput,
  SkuMasterListQuery,
  UpdateSkuMasterInput,
} from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';

export const skuKeys = {
  all: ['sku-masters'] as const,
  list: (query: SkuMasterListQuery) => ['sku-masters', query] as const,
  detail: (id: string) => ['sku-master', id] as const,
};
export const useSkuMasters = (query: SkuMasterListQuery) =>
  useQuery({
    queryKey: skuKeys.list(query),
    queryFn: ({ signal }) => apiClient.listSkuMasters(query, signal),
    placeholderData: keepPreviousData,
  });
export const useSkuMaster = (id?: string) =>
  useQuery({
    queryKey: skuKeys.detail(id ?? ''),
    queryFn: ({ signal }) => apiClient.getSkuMaster(id ?? '', signal),
    enabled: Boolean(id),
  });
export const useCreateSkuMaster = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSkuMasterInput) => apiClient.createSkuMaster(input),
    onSuccess: () => void client.invalidateQueries({ queryKey: skuKeys.all }),
  });
};
export const useUpdateSkuMaster = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSkuMasterInput }) =>
      apiClient.updateSkuMaster(id, input),
    onSuccess: (record) => {
      client.setQueryData(skuKeys.detail(record.id), record);
      void client.invalidateQueries({ queryKey: skuKeys.all });
    },
  });
};
export const useDeleteSkuMaster = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteSkuMaster(id),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: skuKeys.detail(id) });
      void client.invalidateQueries({ queryKey: skuKeys.all });
    },
  });
};
