import { z } from 'zod';
export const skuMasterSchema = z.object({
  skuErpCode: z.string().min(1),
  name: z.string().min(1),
  eanCode: z.string().min(1),
  hsnCode: z.string().min(1),
  uom: z.string().min(1),
  agreedRate: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  priceTolerance: z.number().nonnegative(),
});
