import { z } from 'zod';
const required = z.string().trim().min(1);
const optional = z.preprocess(
  (v) => (v === null || v === '' ? undefined : v),
  z.string().trim().min(1).optional(),
);
const num = (positive = false) =>
  z.preprocess(
    (v) => (typeof v === 'string' && /^-?\d+(?:\.\d+)?$/.test(v.trim()) ? Number(v) : v),
    positive ? z.number().finite().positive() : z.number().finite().nonnegative(),
  );
const optionalNum = z.preprocess((v) => (v === null || v === '' ? undefined : v), num().optional());
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
    invoicedQuantity: num(true),
    unitPrice: num(),
    mrp: optionalNum,
    lineTotal: optionalNum,
  })
  .strict();
export const invoiceSchema = z
  .object({
    invoiceNumber: required,
    invoiceDate: date,
    poNumber: required,
    supplierName: optional,
    supplierCode: optional,
    currency: optional,
    items: z.array(item).min(1),
    subtotal: optionalNum,
    taxAmount: optionalNum,
    totalAmount: optionalNum,
  })
  .strict();
