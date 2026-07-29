import type { MatchReason } from '@three-way-match/shared';
import { reasonCodeLabel } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

export function ReasonBadge({ reason }: { reason: MatchReason }) {
  return (
    <span title={reason.message}>
      <Badge
        className={
          reason.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
        }
      >
        {reason.severity === 'error' ? 'Error' : 'Warning'}: {reasonCodeLabel(reason.code)}
      </Badge>
    </span>
  );
}
