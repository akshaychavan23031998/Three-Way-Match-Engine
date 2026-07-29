import { z } from 'zod';

const requiredString = z.string().trim().min(1);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);
const optionalNonNegativeNumber = z.number().finite().nonnegative().optional();
const editableFields = {
  skuErpCode: requiredString,
  name: requiredString,
  eanCode: optionalString,
  hsnCode: optionalString,
  uom: optionalString,
  agreedRate: optionalNonNegativeNumber,
  mrp: optionalNonNegativeNumber,
  priceTolerance: z.number().finite().min(0).max(1).optional(),
};

export const createSkuMasterSchema = z
  .object(editableFields)
  .strict()
  .transform((value) => ({
    ...value,
    priceTolerance: value.priceTolerance ?? 0.05,
  }));

export const updateSkuMasterSchema = z
  .object({
    ...editableFields,
    skuErpCode: requiredString.optional(),
    name: requiredString.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one editable field is required',
  });

export const skuMasterIdParamSchema = z
  .object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'A valid MongoDB ObjectId is required'),
  })
  .strict();

const positiveInteger = z.coerce.number().int().positive();

export const skuMasterListQuerySchema = z
  .object({
    page: positiveInteger.default(1),
    limit: positiveInteger.max(100).default(20),
    search: optionalString,
    sortBy: z.enum(['createdAt', 'updatedAt', 'skuErpCode', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export type CreateSkuMasterBody = z.infer<typeof createSkuMasterSchema>;
export type UpdateSkuMasterBody = z.infer<typeof updateSkuMasterSchema>;
export type SkuMasterIdParams = z.infer<typeof skuMasterIdParamSchema>;
export type SkuMasterListQueryParams = z.infer<typeof skuMasterListQuerySchema>;
