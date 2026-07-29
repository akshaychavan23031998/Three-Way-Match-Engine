import { z } from 'zod';
export const grnSchema = z.object({
  grnNumber: z.string().min(1),
  poNumber: z.string().min(1),
  grnDate: z.string().nullable(),
  items: z.array(z.unknown()),
});
