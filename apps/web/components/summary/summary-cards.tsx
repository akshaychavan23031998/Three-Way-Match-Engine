import type { SummaryRow } from '@three-way-match/shared';
import { Card } from '@/components/ui/card';

export function SummaryCards({ rows }: { rows: SummaryRow[] }) {
  const values = [
    ['Visible POs', rows.length],
    ['Matched', rows.filter(({ status }) => status === 'matched').length],
    ['Mismatched', rows.filter(({ status }) => status === 'mismatched').length],
    [
      'Partial / pending',
      rows.filter(({ status }) => status === 'partially_matched' || status === 'pending').length,
    ],
  ] as const;
  return (
    <section aria-label="Visible-page metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {values.map(([label, value]) => (
        <Card key={label} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          <p className="text-xs text-slate-400">Current page</p>
        </Card>
      ))}
    </section>
  );
}
