import { z } from 'zod';

const required = z.string().trim().min(1);
const optional = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);
const number = (positive = false) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : value,
    positive ? z.number().finite().positive() : z.number().finite().nonnegative(),
  );
const optionalNumber = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  number().optional(),
);
const date = z
  .string()
  .trim()
  .datetime({ offset: true })
  .or(z.string().trim().date())
  .transform((v) => new Date(v));
const item = z
  .object({
    lineNumber: z.number().int().positive().optional(),
    skuErpCode: optional,
    eanCode: optional,
    description: required,
    hsnCode: optional,
    uom: optional,
    quantity: number(true),
    unitPrice: number(),
    mrp: optionalNumber,
    lineTotal: optionalNumber,
  })
  .strict();
export const purchaseOrderSchema = z
  .object({
    poNumber: required,
    poDate: date,
    supplierName: optional,
    supplierCode: optional,
    currency: optional,
    items: z.array(item).min(1),
    subtotal: optionalNumber,
    taxAmount: optionalNumber,
    totalAmount: optionalNumber,
  })
  .strict();
