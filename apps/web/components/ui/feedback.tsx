import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './button';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center py-14 text-center">
      <Inbox className="mb-3 size-8 text-slate-400" aria-hidden />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" aria-hidden /> Something went wrong
      </div>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <Button type="button" className="mt-3 bg-red-700 hover:bg-red-800" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-label="Loading" role="status" className="space-y-3 py-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}
export function MutationFeedback({
  type,
  message,
}: {
  type: 'success' | 'error';
  message: string;
}) {
  return (
    <p
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-lg p-3 text-sm ${
        type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {message}
    </p>
  );
}
