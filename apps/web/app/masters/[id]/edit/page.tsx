'use client';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { SkuMasterForm } from '@/components/sku/sku-master-form';
import { useUpdateSkuMaster } from '@/hooks/use-sku-masters';
export default function EditSkuPage() {
  const { id } = useParams<{ id: string }>();
  const mutation = useUpdateSkuMaster();
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Edit SKU</h1>
      <Card className="mt-6">
        <SkuMasterForm
          onSubmit={async (input) => {
            await mutation.mutateAsync({ id, input });
            router.push('/masters');
          }}
        />
      </Card>
    </main>
  );
}
