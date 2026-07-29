'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, Upload } from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { MatchStatus, SummaryListQuery } from '@three-way-match/shared';
import { AppShell } from '@/components/layout/app-shell';
import { UploadDocumentModal } from '@/components/documents/upload-document-modal';
import { SummaryCards } from '@/components/summary/summary-cards';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, InlineError, SkeletonRows } from '@/components/ui/feedback';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table } from '@/components/ui/table';
import { useSummary } from '@/hooks/use-summary';
import { formatDate, formatDateTime, formatMoney } from '@/lib/formatters';

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status = (params.get('status') || undefined) as MatchStatus | undefined;
  const sortBy = (params.get('sortBy') as SummaryListQuery['sortBy'] | null) ?? 'updatedAt';
  const sortOrder = (params.get('sortOrder') as SummaryListQuery['sortOrder'] | null) ?? 'desc';
  const update = (values: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`/dashboard?${next.toString()}`);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (params.get('search') ?? ''))
        update({ search: search.trim() || undefined, page: 1 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]); // URL params are intentionally reconciled after the debounce.
  const queryInput = useMemo<SummaryListQuery>(
    () => ({
      page,
      limit: 20,
      ...(status ? { status } : {}),
      ...(params.get('search') ? { search: params.get('search') ?? undefined } : {}),
      sortBy,
      sortOrder,
    }),
    [page, params, sortBy, sortOrder, status],
  );
  const query = useSummary(queryInput);
  const rows = query.data?.data ?? [];
  return (
    <AppShell section="Dashboard">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Purchase order summary</h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor document coverage and the latest computed match.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className="mr-2 inline size-4" /> Refresh
            </Button>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 inline size-4" /> Upload document
            </Button>
          </div>
        </div>
        <SummaryCards rows={rows} />
        <Card>
          <div className="grid gap-3 border-b pb-4 md:grid-cols-4">
            <label className="text-sm font-medium">
              Search
              <Input
                className="mt-1"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="PO number or supplier"
              />
            </label>
            <label className="text-sm font-medium">
              Status
              <Select
                className="mt-1 w-full"
                value={status ?? ''}
                onChange={(event) => update({ status: event.target.value || undefined, page: 1 })}
              >
                <option value="">All statuses</option>
                <option value="matched">Matched</option>
                <option value="partially_matched">Partially matched</option>
                <option value="mismatched">Mismatched</option>
                <option value="pending">Pending</option>
              </Select>
            </label>
            <label className="text-sm font-medium">
              Sort field
              <Select
                className="mt-1 w-full"
                value={sortBy}
                onChange={(event) => update({ sortBy: event.target.value, page: 1 })}
              >
                <option value="updatedAt">Updated</option>
                <option value="poNumber">PO number</option>
                <option value="status">Status</option>
                <option value="invoiceAmount">Invoice amount</option>
                <option value="amountDifference">Difference</option>
              </Select>
            </label>
            <label className="text-sm font-medium">
              Sort order
              <Select
                className="mt-1 w-full"
                value={sortOrder}
                onChange={(event) => update({ sortOrder: event.target.value, page: 1 })}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </label>
          </div>
          {query.isLoading ? (
            <SkeletonRows />
          ) : query.isError ? (
            <div className="py-4">
              <InlineError message={query.error.message} onRetry={() => void query.refetch()} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No purchase orders found"
              description="Adjust the filters or upload a procurement document."
            />
          ) : (
            <Table>
              <thead>
                <tr className="border-b text-xs uppercase text-slate-500">
                  {[
                    'PO Number',
                    'Supplier',
                    'PO Date',
                    'Status',
                    'PO',
                    'GRN',
                    'Invoice',
                    'PO Amount',
                    'Invoice Amount',
                    'Difference',
                    'Mismatches',
                    'Warnings',
                    'Last Computed',
                    'Action',
                  ].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-3 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.poNumber} className="border-b hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-3 font-mono font-semibold">
                      {row.poNumber}
                    </td>
                    <td className="px-3 py-3">{row.supplierName ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(row.poDate)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-3">{row.purchaseOrderCount}</td>
                    <td className="px-3 py-3">{row.grnCount}</td>
                    <td className="px-3 py-3">{row.invoiceCount}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatMoney(row.poAmount)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatMoney(row.invoiceAmount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatMoney(row.amountDifference)}
                    </td>
                    <td className="px-3 py-3 text-red-700">{row.mismatchCount}</td>
                    <td className="px-3 py-3 text-amber-700">{row.warningCount}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDateTime(row.lastComputedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        className="font-semibold text-emerald-700 hover:underline focus-visible:ring-2"
                        href={`/dashboard/${encodeURIComponent(row.poNumber)}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {query.data && (
            <Pagination
              page={page}
              totalPages={query.data.meta.totalPages}
              onPageChange={(value) => update({ page: value })}
            />
          )}
        </Card>
      </div>
      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </AppShell>
  );
}
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading dashboard…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
