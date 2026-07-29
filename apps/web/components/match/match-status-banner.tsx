import type { MatchAudit } from '@three-way-match/shared';
import { formatDateTime } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/status-badge';

export function MatchStatusBanner({
  audit,
  historical = false,
}: {
  audit: MatchAudit;
  historical?: boolean;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
      <div>
        <div className="flex items-center gap-2">
          <StatusBadge status={audit.status} />
          {historical && (
            <span className="text-sm font-semibold text-indigo-700">Historical snapshot</span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Computed {formatDateTime(audit.computedAt)} · Version {audit.computationVersion} ·{' '}
          {audit.trigger.replaceAll('_', ' ')}
        </p>
      </div>
      <p className="text-sm text-slate-500">Triggered by {audit.triggeredBy}</p>
    </section>
  );
}
