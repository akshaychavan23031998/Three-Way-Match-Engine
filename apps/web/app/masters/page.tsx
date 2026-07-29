'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { SkuMaster, SkuMasterListQuery } from '@three-way-match/shared';
import { AppShell } from '@/components/layout/app-shell';
import { DeleteSkuDialog } from '@/components/sku/delete-sku-dialog';
import { SkuMasterTable } from '@/components/sku/sku-master-table';
import { Card } from '@/components/ui/card';
import { EmptyState, InlineError, SkeletonRows } from '@/components/ui/feedback';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { useSkuMasters } from '@/hooks/use-sku-masters';

export default function MastersPage() {
  const [query, setQuery] = useState<SkuMasterListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<SkuMaster>();
  const records = useSkuMasters(query);
  return (
    <AppShell section="SKU Master">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">SKU Master catalogue</h1>
            <p className="text-sm text-slate-500">Manage deterministic ERP and EAN mappings.</p>
          </div>
          <Link
            href="/masters/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2"
          >
            <Plus className="mr-2 inline size-4" />
            Add SKU
          </Link>
        </div>
        <Card>
          <form
            className="grid gap-3 border-b pb-4 md:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery((value) => ({ ...value, search: search.trim() || undefined, page: 1 }));
            }}
          >
            <label className="text-sm font-medium">
              Search
              <Input
                className="mt-1"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ERP, EAN, HSN, or name"
              />
            </label>
            <label className="text-sm font-medium">
              Sort field
              <Select
                className="mt-1 w-full"
                value={query.sortBy}
                onChange={(event) =>
                  setQuery((value) => ({
                    ...value,
                    sortBy: event.target.value as SkuMasterListQuery['sortBy'],
                    page: 1,
                  }))
                }
              >
                <option value="updatedAt">Updated</option>
                <option value="createdAt">Created</option>
                <option value="skuErpCode">ERP code</option>
                <option value="name">Name</option>
              </Select>
            </label>
            <label className="text-sm font-medium">
              Sort order
              <Select
                className="mt-1 w-full"
                value={query.sortOrder}
                onChange={(event) =>
                  setQuery((value) => ({
                    ...value,
                    sortOrder: event.target.value as 'asc' | 'desc',
                    page: 1,
                  }))
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </label>
          </form>
          {records.isLoading ? (
            <SkeletonRows />
          ) : records.isError ? (
            <div className="py-4">
              <InlineError message={records.error.message} onRetry={() => void records.refetch()} />
            </div>
          ) : !records.data?.data.length ? (
            <EmptyState
              title="No SKU records"
              description="Add a SKU mapping or adjust the current search."
            />
          ) : (
            <SkuMasterTable rows={records.data.data} onDelete={setDeleting} />
          )}
          {records.data && (
            <Pagination
              page={query.page}
              totalPages={records.data.meta.totalPages}
              onPageChange={(page) => setQuery((value) => ({ ...value, page }))}
            />
          )}
        </Card>
      </div>
      <DeleteSkuDialog
        {...(deleting ? { record: deleting } : {})}
        onClose={() => setDeleting(undefined)}
      />
    </AppShell>
  );
}
