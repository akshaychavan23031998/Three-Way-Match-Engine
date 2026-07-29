'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SkuMasterForm } from '@/components/sku/sku-master-form';
import { Card } from '@/components/ui/card';
import { InlineError, SkeletonRows } from '@/components/ui/feedback';
import { useSkuMaster, useUpdateSkuMaster } from '@/hooks/use-sku-masters';
import { ApiError } from '@/lib/api-client';

export default function EditSkuPage() {
  const { id } = useParams<{ id: string }>();
  const record = useSkuMaster(id);
  const mutation = useUpdateSkuMaster();
  const router = useRouter();
  const [error, setError] = useState<string>();
  return (
    <AppShell section="Edit SKU">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Edit SKU Master record</h1>
        <Card className="mt-5">
          {record.isLoading ? (
            <SkeletonRows />
          ) : record.isError ? (
            <InlineError message={record.error.message} onRetry={() => void record.refetch()} />
          ) : record.data ? (
            <SkuMasterForm
              initial={record.data}
              error={error}
              onSubmit={async (input) => {
                setError(undefined);
                try {
                  await mutation.mutateAsync({ id, input });
                  router.push('/masters');
                } catch (caught) {
                  setError(
                    caught instanceof ApiError ? caught.message : 'The SKU could not be updated.',
                  );
                }
              }}
            />
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
