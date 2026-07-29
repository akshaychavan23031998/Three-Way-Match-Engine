import { z } from 'zod';
export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  poNumber: z.string().min(1),
  invoiceDate: z.string().nullable(),
  items: z.array(z.unknown()),
});
