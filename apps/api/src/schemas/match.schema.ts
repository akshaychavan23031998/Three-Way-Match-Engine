import { z } from 'zod';

const poNumber = z.string().trim().min(1).max(100);
export const matchPoNumberParamSchema = z.object({ poNumber }).strict();
export const matchAuditIdParamSchema = z
  .object({ id: z.string().regex(/^[a-f\d]{24}$/i) })
  .strict();
const positiveInteger = z.coerce.number().int().positive();
export const matchHistoryQuerySchema = z
  .object({
    page: positiveInteger.default(1),
    limit: positiveInteger.max(100).default(20),
  })
  .strict();
export type MatchPoNumberParams = z.infer<typeof matchPoNumberParamSchema>;
export type MatchAuditIdParams = z.infer<typeof matchAuditIdParamSchema>;
