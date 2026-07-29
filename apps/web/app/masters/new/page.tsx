'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SkuMasterForm } from '@/components/sku/sku-master-form';
import { Card } from '@/components/ui/card';
import { useCreateSkuMaster } from '@/hooks/use-sku-masters';
import { ApiError } from '@/lib/api-client';

export default function NewSkuPage() {
  const mutation = useCreateSkuMaster();
  const router = useRouter();
  const [error, setError] = useState<string>();
  return (
    <AppShell section="Create SKU">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Create SKU Master record</h1>
        <p className="mt-1 text-sm text-slate-500">
          Codes remain strings and are normalized by the API.
        </p>
        <Card className="mt-5">
          <SkuMasterForm
            error={error}
            submitLabel="Create SKU"
            onSubmit={async (values) => {
              setError(undefined);
              try {
                await mutation.mutateAsync(values);
                router.push('/masters');
              } catch (caught) {
                setError(
                  caught instanceof ApiError ? caught.message : 'The SKU could not be created.',
                );
              }
            }}
          />
        </Card>
      </div>
    </AppShell>
  );
}
