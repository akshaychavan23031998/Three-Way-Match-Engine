import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentListQuery, DocumentType } from '@three-way-match/shared';
import { apiClient } from '@/lib/api-client';

export const documentKeys = {
  all: ['documents'] as const,
  list: (query: DocumentListQuery) => ['documents', query] as const,
  detail: (id: string) => ['document', id] as const,
};
export const useDocuments = (query: DocumentListQuery) =>
  useQuery({
    queryKey: documentKeys.list(query),
    queryFn: ({ signal }) => apiClient.listDocuments(query, signal),
    placeholderData: keepPreviousData,
  });
export const useDocument = (id?: string) =>
  useQuery({
    queryKey: documentKeys.detail(id ?? ''),
    queryFn: ({ signal }) => apiClient.getDocument(id ?? '', signal),
    enabled: Boolean(id),
  });
export const useUploadDocument = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: DocumentType; file: File }) => {
      const form = new FormData();
      form.append('documentType', documentType);
      form.append('file', file);
      return apiClient.uploadDocument(form);
    },
    onSuccess: (document) => {
      void client.invalidateQueries({ queryKey: documentKeys.all });
      void client.invalidateQueries({ queryKey: ['summary'] });
      const poNumber = 'poNumber' in document ? document.poNumber : undefined;
      if (poNumber) void client.invalidateQueries({ queryKey: ['match', poNumber] });
    },
  });
};
export const useDeleteDocument = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; poNumber?: string }) => apiClient.deleteDocument(id),
    onSuccess: (_data, variables) => {
      void client.invalidateQueries({ queryKey: documentKeys.all });
      void client.removeQueries({ queryKey: documentKeys.detail(variables.id) });
      void client.invalidateQueries({ queryKey: ['summary'] });
      if (variables.poNumber)
        void client.invalidateQueries({ queryKey: ['match', variables.poNumber] });
    },
  });
};
