import type { TableHTMLAttributes } from 'react';
export function Table(props: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  );
}
