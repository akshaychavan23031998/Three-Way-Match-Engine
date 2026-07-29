import { z } from 'zod';
export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1),
  poDate: z.string().nullable(),
  vendorName: z.string().nullable(),
  items: z.array(z.unknown()),
});
