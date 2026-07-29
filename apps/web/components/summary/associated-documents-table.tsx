import type { MatchDocumentReference } from '@three-way-match/shared';
import { documentLabel, formatDateTime } from '@/lib/formatters';
import { Table } from '@/components/ui/table';

export function AssociatedDocumentsTable({ documents }: { documents: MatchDocumentReference[] }) {
  if (!documents.length) return <p className="text-sm text-slate-500">No associated documents.</p>;
  return (
    <Table>
      <thead>
        <tr>
          <th className="px-3 py-2">Type</th>
          <th>Number</th>
          <th>Added</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id} className="border-t">
            <td className="px-3 py-2">{documentLabel(document.documentType)}</td>
            <td className="font-mono">{document.documentNumber}</td>
            <td>{formatDateTime(document.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
