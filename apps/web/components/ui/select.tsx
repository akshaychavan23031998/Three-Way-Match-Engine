import type { SelectHTMLAttributes } from 'react';
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="rounded-lg border bg-white px-3 py-2 text-sm" {...props} />;
}
