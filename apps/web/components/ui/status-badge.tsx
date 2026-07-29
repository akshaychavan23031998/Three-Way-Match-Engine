import type { MatchStatus } from '@three-way-match/shared';
import { matchStatusLabel } from '@/lib/formatters';
import { Badge } from './badge';

const styles: Record<MatchStatus, string> = {
  matched: 'bg-emerald-100 text-emerald-800',
  partially_matched: 'bg-amber-100 text-amber-800',
  mismatched: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-700',
};
export function StatusBadge({ status }: { status: MatchStatus }) {
  return <Badge className={styles[status]}>{matchStatusLabel(status)}</Badge>;
}
