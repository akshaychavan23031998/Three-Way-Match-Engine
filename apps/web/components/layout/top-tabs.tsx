import { Badge } from '@/components/ui/badge';
import { DASHBOARD_TABS } from '@/lib/constants';
export function TopTabs() {
  return (
    <nav className="flex gap-6 border-b px-6">
      {DASHBOARD_TABS.map((tab, index) => (
        <button
          className={`py-4 text-sm font-medium ${index === 0 ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500'}`}
          key={tab}
        >
          {tab} <Badge>0</Badge>
        </button>
      ))}
    </nav>
  );
}
