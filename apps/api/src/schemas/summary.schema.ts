import { z } from 'zod';

const positiveInteger = z.coerce.number().int().positive();
export const summaryListQuerySchema = z
  .object({
    page: positiveInteger.default(1),
    limit: positiveInteger.max(100).default(20),
    search: z.string().trim().min(1).optional(),
    status: z.enum(['matched', 'partially_matched', 'mismatched', 'pending']).optional(),
    sortBy: z
      .enum(['updatedAt', 'poNumber', 'status', 'invoiceAmount', 'amountDifference'])
      .default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();
