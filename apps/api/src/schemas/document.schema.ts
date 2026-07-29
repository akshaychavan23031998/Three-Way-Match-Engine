import { z } from 'zod';
export const documentTypeSchema = z.enum(['purchase_order', 'grn', 'invoice']);
export const uploadDocumentSchema = z.object({ documentType: documentTypeSchema }).strict();
export const documentIdParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).strict();
const positiveInt = z.coerce.number().int().positive();
export const documentListQuerySchema = z
  .object({
    page: positiveInt.default(1),
    limit: positiveInt.max(100).default(20),
    documentType: documentTypeSchema.optional(),
    search: z.string().trim().min(1).optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'originalFileName', 'documentDate'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();
export type UploadDocumentBody = z.infer<typeof uploadDocumentSchema>;
export type DocumentIdParams = z.infer<typeof documentIdParamSchema>;
export type DocumentListQueryParams = z.infer<typeof documentListQuerySchema>;
