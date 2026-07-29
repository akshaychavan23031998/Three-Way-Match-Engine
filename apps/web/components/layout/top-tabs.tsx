import { Badge } from '@/components/ui/badge';
import { DASHBOARD_TABS } from '@/lib/constants';

export function TopTabs({
  counts = [0, 0, 0, 0],
}: {
  counts?: readonly [number, number, number, number];
}) {
  const anchors = ['documents', 'line-items', 'documents', 'match-summary'] as const;
  return (
    <nav aria-label="Match sections" className="overflow-x-auto rounded-xl border bg-white px-3">
      <div className="flex min-w-max gap-2">
        {DASHBOARD_TABS.map((tab, index) => (
          <a
            className="rounded px-3 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            key={tab}
            href={`#${anchors[index]}`}
          >
            {tab} <Badge>{counts[index]}</Badge>
          </a>
        ))}
      </div>
    </nav>
  );
}
