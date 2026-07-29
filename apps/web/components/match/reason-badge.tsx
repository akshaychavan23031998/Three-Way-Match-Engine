import { Badge } from '@/components/ui/badge';
export function ReasonBadge({ reason }: { reason: string }) {
  return <Badge className="bg-red-50 text-red-700">{reason}</Badge>;
}
