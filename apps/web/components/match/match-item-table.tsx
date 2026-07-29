import type { MatchItem } from '@three-way-match/shared';
import { formatMoney, formatPercentage, formatQuantity } from '@/lib/formatters';
import { EmptyState } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table } from '@/components/ui/table';
import { ReasonBadge } from './reason-badge';

const list = (values: number[], money = false) =>
  values.length
    ? values.map((value) => (money ? formatMoney(value) : formatQuantity(value))).join(', ')
    : '—';
export function MatchItemTable({ items }: { items: MatchItem[] }) {
  if (!items.length)
    return (
      <EmptyState title="No line items" description="No associated document lines were found." />
    );
  return (
    <Table>
      <thead>
        <tr className="border-b text-xs uppercase text-slate-500">
          {[
            'SKU',
            'ERP Code',
            'EAN Code',
            'Ordered',
            'Received',
            'Accepted',
            'Rejected',
            'Invoiced',
            'PO Prices',
            'Invoice Prices',
            'Agreed Rate',
            'Tolerance',
            'Master MRP',
            'PO MRP',
            'GRN MRP',
            'Invoice MRP',
            'Status',
            'Reasons',
          ].map((heading) => (
            <th key={heading} className="whitespace-nowrap px-3 py-3">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.matchKey}
            className={`border-b align-top ${item.status === 'mismatched' ? 'bg-red-50/60' : ''}`}
          >
            <td className="min-w-44 px-3 py-3">
              <p className="font-medium">{item.skuName ?? item.description ?? 'Unmapped item'}</p>
              <p className="text-xs text-slate-500">{item.resolutionMethod}</p>
            </td>
            <td className="whitespace-nowrap px-3 py-3 font-mono">{item.skuErpCode ?? '—'}</td>
            <td className="whitespace-nowrap px-3 py-3 font-mono">{item.eanCode ?? '—'}</td>
            {[
              item.orderedQuantity,
              item.receivedQuantity,
              item.acceptedQuantity,
              item.rejectedQuantity,
              item.invoicedQuantity,
            ].map((value, index) => (
              <td key={index} className="px-3 py-3">
                {formatQuantity(value)}
              </td>
            ))}
            <td className="whitespace-nowrap px-3 py-3">{list(item.poPrices, true)}</td>
            <td className="whitespace-nowrap px-3 py-3">{list(item.invoicePrices, true)}</td>
            <td className="px-3 py-3">{formatMoney(item.agreedRate)}</td>
            <td className="px-3 py-3">{formatPercentage(item.priceTolerance)}</td>
            <td className="px-3 py-3">{formatMoney(item.masterMrp)}</td>
            <td className="px-3 py-3">{list(item.poMrps, true)}</td>
            <td className="px-3 py-3">{list(item.grnMrps, true)}</td>
            <td className="px-3 py-3">{list(item.invoiceMrps, true)}</td>
            <td className="px-3 py-3">
              <StatusBadge status={item.status} />
            </td>
            <td className="min-w-64 px-3 py-3">
              <div className="flex flex-wrap gap-1">
                {item.reasons.length
                  ? item.reasons.map((reason, index) => (
                      <ReasonBadge key={`${reason.code}-${index}`} reason={reason} />
                    ))
                  : '—'}
              </div>
              {item.reasons.map((reason, index) => (
                <details key={`${reason.code}-detail-${index}`} className="mt-2 text-xs">
                  <summary className="cursor-pointer text-slate-600">{reason.message}</summary>
                  <dl className="mt-1 text-slate-500">
                    {Object.entries(reason.details).map(([key, value]) => (
                      <div key={key}>
                        <dt className="inline font-medium">{key}: </dt>
                        <dd className="inline">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
