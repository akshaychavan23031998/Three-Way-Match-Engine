import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import type { SkuMaster } from '@three-way-match/shared';
import { formatDateTime, formatMoney, formatPercentage } from '@/lib/formatters';
import { Table } from '@/components/ui/table';

export function SkuMasterTable({
  rows,
  onDelete,
}: {
  rows: SkuMaster[];
  onDelete: (record: SkuMaster) => void;
}) {
  return (
    <Table>
      <thead>
        <tr>
          {[
            'ERP Code',
            'EAN Code',
            'Name',
            'HSN',
            'UOM',
            'Agreed Rate',
            'MRP',
            'Price Tolerance',
            'Updated',
            'Actions',
          ].map((heading) => (
            <th key={heading} className="whitespace-nowrap px-3 py-3">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr className="border-t" key={row.id}>
            <td className="px-3 py-3 font-mono">{row.skuErpCode}</td>
            <td className="font-mono">{row.eanCode ?? '—'}</td>
            <td className="min-w-64">{row.name}</td>
            <td className="font-mono">{row.hsnCode ?? '—'}</td>
            <td>{row.uom ?? '—'}</td>
            <td>{formatMoney(row.agreedRate)}</td>
            <td>{formatMoney(row.mrp)}</td>
            <td>{formatPercentage(row.priceTolerance)}</td>
            <td className="whitespace-nowrap">{formatDateTime(row.updatedAt)}</td>
            <td>
              <div className="flex gap-3">
                <Link
                  aria-label={`Edit ${row.name}`}
                  href={`/masters/${row.id}/edit`}
                  className="text-emerald-700"
                >
                  <Pencil className="size-4" />
                </Link>
                <button
                  aria-label={`Delete ${row.name}`}
                  onClick={() => onDelete(row)}
                  className="text-red-700"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
