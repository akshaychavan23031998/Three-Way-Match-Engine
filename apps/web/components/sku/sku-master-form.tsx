'use client';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CreateSkuMasterInput } from '@three-way-match/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MutationFeedback } from '@/components/ui/feedback';

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null ? undefined : Number(value)),
  z.number().finite().nonnegative().optional(),
);
export const skuMasterFormSchema = z.object({
  skuErpCode: z.string().trim().min(1, 'ERP code is required'),
  name: z.string().trim().min(1, 'Name is required'),
  eanCode: z.string().trim().optional(),
  hsnCode: z.string().trim().optional(),
  uom: z.string().trim().optional(),
  agreedRate: optionalNumber,
  mrp: optionalNumber,
  priceTolerance: z.preprocess(
    (value) => (value === '' || value === null ? undefined : Number(value)),
    z.number().finite().min(0).max(1).optional(),
  ),
});
type Values = z.infer<typeof skuMasterFormSchema>;
const fields = [
  ['skuErpCode', 'ERP code', true],
  ['name', 'Name', true],
  ['eanCode', 'EAN code', false],
  ['hsnCode', 'HSN code', false],
  ['uom', 'UOM', false],
] as const;

export function SkuMasterForm({
  initial,
  onSubmit,
  error,
  submitLabel = 'Save SKU',
}: {
  initial?: Partial<CreateSkuMasterInput>;
  onSubmit: (values: CreateSkuMasterInput) => Promise<void>;
  error?: string | undefined;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<Values>({
    resolver: zodResolver(skuMasterFormSchema),
    values: {
      skuErpCode: initial?.skuErpCode ?? '',
      name: initial?.name ?? '',
      eanCode: initial?.eanCode ?? '',
      hsnCode: initial?.hsnCode ?? '',
      uom: initial?.uom ?? '',
      agreedRate: initial?.agreedRate,
      mrp: initial?.mrp,
      priceTolerance: initial?.priceTolerance ?? 0.05,
    },
  });
  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          skuErpCode: values.skuErpCode,
          name: values.name,
          ...(values.eanCode ? { eanCode: values.eanCode } : {}),
          ...(values.hsnCode ? { hsnCode: values.hsnCode } : {}),
          ...(values.uom ? { uom: values.uom } : {}),
          ...(values.agreedRate !== undefined ? { agreedRate: values.agreedRate } : {}),
          ...(values.mrp !== undefined ? { mrp: values.mrp } : {}),
          ...(values.priceTolerance !== undefined ? { priceTolerance: values.priceTolerance } : {}),
        });
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([field, label, required]) => (
          <div key={field}>
            <label htmlFor={field} className="text-sm font-medium">
              {label}
              {required ? ' *' : ''}
            </label>
            <Input
              id={field}
              className="mt-1"
              {...register(field)}
              aria-invalid={Boolean(errors[field])}
            />
            {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>}
          </div>
        ))}
        {(['agreedRate', 'mrp', 'priceTolerance'] as const).map((field) => (
          <div key={field}>
            <label htmlFor={field} className="text-sm font-medium">
              {field === 'agreedRate' ? 'Agreed rate' : field === 'mrp' ? 'MRP' : 'Price tolerance'}
            </label>
            <Input
              id={field}
              className="mt-1"
              type="number"
              min="0"
              max={field === 'priceTolerance' ? '1' : undefined}
              step="any"
              {...register(field)}
              aria-invalid={Boolean(errors[field])}
            />
            {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>}
          </div>
        ))}
      </div>
      {error && <MutationFeedback type="error" message={error} />}
      <div className="flex justify-end gap-2">
        <Link
          href="/masters"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Cancel
        </Link>
        <Button disabled={isSubmitting}>{isSubmitting ? 'Saving…' : submitLabel}</Button>
      </div>
    </form>
  );
}
