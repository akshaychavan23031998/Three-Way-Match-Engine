'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { SkuMasterForm } from '@/components/sku/sku-master-form';
import { useCreateSkuMaster } from '@/hooks/use-sku-masters';
export default function NewSkuPage() {
  const mutation = useCreateSkuMaster();
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Create SKU</h1>
      <Card className="mt-6">
        <SkuMasterForm
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
            router.push('/masters');
          }}
        />
      </Card>
    </main>
  );
}
