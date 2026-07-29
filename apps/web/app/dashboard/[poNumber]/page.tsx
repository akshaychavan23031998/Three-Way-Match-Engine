'use client';
import { useParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { MatchAudit } from '@three-way-match/shared';
import { AppShell } from '@/components/layout/app-shell';
import { TopTabs } from '@/components/layout/top-tabs';
import { MatchItemTable } from '@/components/match/match-item-table';
import { MatchStatusBanner } from '@/components/match/match-status-banner';
import { ReasonBadge } from '@/components/match/reason-badge';
import { AssociatedDocumentsTable } from '@/components/summary/associated-documents-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineError, MutationFeedback, SkeletonRows } from '@/components/ui/feedback';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table } from '@/components/ui/table';
import { useMatch, useMatchAudit, useMatchHistory, useRecomputeMatch } from '@/hooks/use-match';
import { formatDateTime, formatMoney, formatQuantity } from '@/lib/formatters';

const totalCards = (audit: MatchAudit) =>
  [
    ['Ordered', formatQuantity(audit.totals.orderedQuantity)],
    ['Received', formatQuantity(audit.totals.receivedQuantity)],
    ['Accepted', formatQuantity(audit.totals.acceptedQuantity)],
    ['Rejected', formatQuantity(audit.totals.rejectedQuantity)],
    ['Invoiced', formatQuantity(audit.totals.invoicedQuantity)],
    ['PO amount', formatMoney(audit.totals.poAmount)],
    ['Invoice amount', formatMoney(audit.totals.invoiceAmount)],
    ['Difference', formatMoney(audit.totals.amountDifference)],
    ['Matched items', String(audit.totals.matchedItemCount)],
    ['Mismatched items', String(audit.totals.mismatchedItemCount)],
  ] as const;

export default function MatchPage() {
  const { poNumber: encoded } = useParams<{ poNumber: string }>();
  const poNumber = decodeURIComponent(encoded);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedAuditId, setSelectedAuditId] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const latest = useMatch(poNumber);
  const history = useMatchHistory(poNumber, { page: historyPage, limit: 10 });
  const historical = useMatchAudit(selectedAuditId);
  const recompute = useRecomputeMatch(poNumber);
  const audit = selectedAuditId ? historical.data : latest.data;
  const refresh = async () => {
    setFeedback(undefined);
    try {
      await recompute.mutateAsync();
      setSelectedAuditId(undefined);
      setFeedback('Match recomputed successfully.');
    } catch {
      setFeedback('Recomputation failed. The current snapshot is still available.');
    }
  };
  return (
    <AppShell section={`PO ${poNumber}`}>
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Purchase order</p>
            <h1 className="font-mono text-2xl font-bold">{poNumber}</h1>
          </div>
          <div className="flex gap-2">
            {selectedAuditId && (
              <Button
                className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                onClick={() => setSelectedAuditId(undefined)}
              >
                Return to latest
              </Button>
            )}
            <Button
              onClick={() => void refresh()}
              disabled={recompute.isPending || Boolean(selectedAuditId)}
            >
              <RefreshCw className="mr-2 inline size-4" />
              {recompute.isPending ? 'Recomputing…' : 'Recompute'}
            </Button>
          </div>
        </div>
        {feedback && (
          <MutationFeedback
            type={feedback.startsWith('Match recomputed') ? 'success' : 'error'}
            message={feedback}
          />
        )}
        {latest.isLoading || (selectedAuditId && historical.isLoading) ? (
          <SkeletonRows />
        ) : latest.isError || historical.isError ? (
          <InlineError
            message={(latest.error ?? historical.error)?.message ?? 'Unable to load match'}
            onRetry={() => void latest.refetch()}
          />
        ) : audit ? (
          <>
            <MatchStatusBanner audit={audit} historical={Boolean(selectedAuditId)} />
            <TopTabs
              counts={[
                audit.documentReferences.filter(
                  ({ documentType }) => documentType === 'purchase_order',
                ).length,
                audit.documentReferences.filter(({ documentType }) => documentType === 'invoice')
                  .length,
                audit.documentReferences.filter(({ documentType }) => documentType === 'grn')
                  .length,
                audit.reasons.length,
              ]}
            />
            <section
              id="match-summary"
              className="grid scroll-mt-4 gap-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              {totalCards(audit).map(([label, value]) => (
                <Card key={label} className="p-4">
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold">{value}</p>
                </Card>
              ))}
            </section>
            <div className="grid gap-5 xl:grid-cols-2">
              <Card id="documents" className="scroll-mt-4">
                <h2 className="mb-3 font-semibold">Associated documents</h2>
                <AssociatedDocumentsTable documents={audit.documentReferences} />
              </Card>
              <Card>
                <h2 className="mb-3 font-semibold">Overall reasons</h2>
                {audit.reasons.length ? (
                  <div className="space-y-3">
                    {audit.reasons.map((reason, index) => (
                      <div key={`${reason.code}-${index}`}>
                        <ReasonBadge reason={reason} />
                        <p className="mt-1 text-sm text-slate-600">{reason.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-700">No overall mismatch reasons.</p>
                )}
              </Card>
            </div>
            <Card id="line-items" className="scroll-mt-4 p-0">
              <div className="p-5">
                <h2 className="font-semibold">Line-item match</h2>
                <p className="text-sm text-slate-500">
                  Authoritative quantities, prices, MRP checks, and reasons.
                </p>
              </div>
              <MatchItemTable items={audit.items} />
            </Card>
          </>
        ) : null}
        <Card>
          <h2 className="font-semibold">Match history</h2>
          <p className="mb-3 text-sm text-slate-500">
            Select a persisted audit without replacing the latest snapshot.
          </p>
          {history.isLoading ? (
            <SkeletonRows rows={3} />
          ) : history.isError ? (
            <InlineError message={history.error.message} onRetry={() => void history.refetch()} />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    {[
                      'Computed',
                      'Status',
                      'Trigger',
                      'Triggered by',
                      'Mismatches',
                      'Warnings',
                      'Audit ID',
                      'Action',
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-2">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.data?.data.map((entry) => (
                    <tr key={entry.id} className="border-t">
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatDateTime(entry.computedAt)}
                      </td>
                      <td>
                        <StatusBadge status={entry.status} />
                      </td>
                      <td>{entry.trigger.replaceAll('_', ' ')}</td>
                      <td>{entry.triggeredBy}</td>
                      <td>{entry.reasons.filter(({ severity }) => severity === 'error').length}</td>
                      <td>
                        {entry.reasons.filter(({ severity }) => severity === 'warning').length}
                      </td>
                      <td className="max-w-40 truncate font-mono text-xs" title={entry.id}>
                        {entry.id}
                      </td>
                      <td>
                        <button
                          className="font-semibold text-emerald-700 hover:underline"
                          onClick={() => setSelectedAuditId(entry.id)}
                        >
                          View snapshot
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {history.data && (
                <Pagination
                  page={historyPage}
                  totalPages={history.data.meta.totalPages}
                  onPageChange={setHistoryPage}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
