'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { SkuMasterInput } from '@three-way-match/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const schema = z.object({
  skuErpCode: z.string().min(1),
  name: z.string().min(1),
  eanCode: z.string().min(1),
  hsnCode: z.string().min(1),
  uom: z.string().min(1),
  agreedRate: z.coerce.number().nonnegative(),
  mrp: z.coerce.number().nonnegative(),
  priceTolerance: z.coerce.number().nonnegative(),
});
export function SkuMasterForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<SkuMasterInput>;
  onSubmit: (values: SkuMasterInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SkuMasterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      skuErpCode: '',
      name: '',
      eanCode: '',
      hsnCode: '',
      uom: 'EA',
      agreedRate: 0,
      mrp: 0,
      priceTolerance: 0,
      ...initial,
    },
  });
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {['skuErpCode', 'name', 'eanCode', 'hsnCode', 'uom'].map((field) => (
        <Input key={field} placeholder={field} {...register(field as keyof SkuMasterInput)} />
      ))}
      {['agreedRate', 'mrp', 'priceTolerance'].map((field) => (
        <Input
          key={field}
          type="number"
          step="any"
          placeholder={field}
          {...register(field as keyof SkuMasterInput)}
        />
      ))}
      <Button disabled={isSubmitting}>Save SKU</Button>
    </form>
  );
}
