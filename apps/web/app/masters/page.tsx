'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { SkuMasterTable } from '@/components/sku/sku-master-table';
import { useSkuMasters } from '@/hooks/use-sku-masters';
export default function MastersPage() {
  const query = useSkuMasters();
  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">SKU Master</h1>
        <Link href="/masters/new">
          <Button>Add SKU</Button>
        </Link>
      </div>
      <Card className="mt-6">
        {query.isLoading ? <Spinner /> : <SkuMasterTable rows={query.data ?? []} />}
      </Card>
    </main>
  );
}
