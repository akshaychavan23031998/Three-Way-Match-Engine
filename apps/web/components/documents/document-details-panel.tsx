import type { DocumentSummary } from '@three-way-match/shared';
import {
  documentLabel,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatMoney,
  formatQuantity,
} from '@/lib/formatters';
import { Table } from '@/components/ui/table';

export function DocumentDetailsPanel({ document }: { document: DocumentSummary }) {
  const number =
    document.documentType === 'purchase_order'
      ? document.poNumber
      : document.documentType === 'grn'
        ? document.grnNumber
        : document.invoiceNumber;
  const date =
    document.documentType === 'purchase_order'
      ? document.poDate
      : document.documentType === 'grn'
        ? document.grnDate
        : document.invoiceDate;
  return (
    <div className="space-y-5">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {[
          ['Type', documentLabel(document.documentType)],
          ['Document number', number],
          ['PO number', document.poNumber],
          ['Document date', formatDate(date)],
          ['Supplier', document.supplierName ?? '—'],
          ['Original filename', document.originalFileName],
          ['File size', formatFileSize(document.fileSize)],
          ['Processing', 'Completed'],
          ['Uploaded by', document.uploadedBy],
          ['Created', formatDateTime(document.createdAt)],
        ].map(([term, value]) => (
          <div key={term}>
            <dt className="text-xs uppercase text-slate-500">{term}</dt>
            <dd className="mt-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-2 font-semibold">Line items</h3>
        <Table>
          <thead>
            <tr>
              {['Line', 'Description', 'ERP', 'EAN', 'Quantity', 'Price', 'MRP'].map((heading) => (
                <th key={heading} className="px-3 py-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, index) => {
              const quantity =
                'quantity' in item
                  ? item.quantity
                  : 'receivedQuantity' in item
                    ? item.receivedQuantity
                    : item.invoicedQuantity;
              const price = 'unitPrice' in item ? item.unitPrice : undefined;
              return (
                <tr key={index} className="border-t">
                  <td className="px-3 py-2">{item.lineNumber ?? index + 1}</td>
                  <td>{item.description}</td>
                  <td className="font-mono">{item.skuErpCode ?? '—'}</td>
                  <td className="font-mono">{item.eanCode ?? '—'}</td>
                  <td>{formatQuantity(quantity)}</td>
                  <td>{formatMoney(price)}</td>
                  <td>{formatMoney(item.mrp)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
