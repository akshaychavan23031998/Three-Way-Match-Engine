'use client';
import { Eye, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { DocumentListQuery, DocumentSummary, DocumentType } from '@three-way-match/shared';
import { AppShell } from '@/components/layout/app-shell';
import { DocumentDetailsPanel } from '@/components/documents/document-details-panel';
import { UploadDocumentModal } from '@/components/documents/upload-document-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, InlineError, MutationFeedback, SkeletonRows } from '@/components/ui/feedback';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { useDeleteDocument, useDocuments } from '@/hooks/use-documents';
import { documentLabel, formatDate, formatDateTime } from '@/lib/formatters';

const numberOf = (document: DocumentSummary) =>
  document.documentType === 'purchase_order'
    ? document.poNumber
    : document.documentType === 'grn'
      ? document.grnNumber
      : document.invoiceNumber;
const dateOf = (document: DocumentSummary) =>
  document.documentType === 'purchase_order'
    ? document.poDate
    : document.documentType === 'grn'
      ? document.grnDate
      : document.invoiceDate;
export default function DocumentsPage() {
  const [query, setQuery] = useState<DocumentListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<DocumentSummary>();
  const [deleting, setDeleting] = useState<DocumentSummary>();
  const [feedback, setFeedback] = useState<string>();
  const documents = useDocuments(query);
  const deletion = useDeleteDocument();
  const remove = async () => {
    if (!deleting) return;
    try {
      const result = await deletion.mutateAsync({ id: deleting.id, poNumber: deleting.poNumber });
      setFeedback(
        result.matchRecalculationStatus === 'completed'
          ? 'Document deleted successfully. Match results were refreshed.'
          : 'Document deleted successfully, but match refresh failed. Recompute it manually.',
      );
      setDeleting(undefined);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Document deletion failed.');
    }
  };
  return (
    <AppShell section="Documents">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-sm text-slate-500">
              Review uploaded purchase orders, GRNs, and invoices.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 inline size-4" /> Upload document
          </Button>
        </div>
        {feedback && (
          <MutationFeedback
            type={feedback.includes('successfully') ? 'success' : 'error'}
            message={feedback}
          />
        )}
        <Card>
          <form
            className="grid gap-3 border-b pb-4 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery((value) => ({ ...value, search: search.trim() || undefined, page: 1 }));
            }}
          >
            <label className="text-sm font-medium">
              Search
              <Input
                className="mt-1"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Number, PO, supplier, filename"
              />
            </label>
            <label className="text-sm font-medium">
              Document type
              <Select
                className="mt-1 w-full"
                value={query.documentType ?? ''}
                onChange={(event) =>
                  setQuery((value) => ({
                    ...value,
                    documentType: (event.target.value || undefined) as DocumentType | undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All types</option>
                <option value="purchase_order">Purchase Order</option>
                <option value="grn">GRN</option>
                <option value="invoice">Invoice</option>
              </Select>
            </label>
            <label className="text-sm font-medium">
              Sort field
              <Select
                className="mt-1 w-full"
                value={query.sortBy}
                onChange={(event) =>
                  setQuery((value) => ({
                    ...value,
                    sortBy: event.target.value as DocumentListQuery['sortBy'],
                  }))
                }
              >
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
                <option value="originalFileName">Filename</option>
                <option value="documentDate">Document date</option>
              </Select>
            </label>
            <div className="flex items-end gap-2">
              <label className="flex-1 text-sm font-medium">
                Order
                <Select
                  className="mt-1 w-full"
                  value={query.sortOrder}
                  onChange={(event) =>
                    setQuery((value) => ({
                      ...value,
                      sortOrder: event.target.value as 'asc' | 'desc',
                    }))
                  }
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </Select>
              </label>
              <Button type="submit">Search</Button>
            </div>
          </form>
          {documents.isLoading ? (
            <SkeletonRows />
          ) : documents.isError ? (
            <div className="py-4">
              <InlineError
                message={documents.error.message}
                onRetry={() => void documents.refetch()}
              />
            </div>
          ) : !documents.data?.data.length ? (
            <EmptyState
              title="No documents found"
              description="Upload a document or change the current filters."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  {[
                    'Type',
                    'Document Number',
                    'PO Number',
                    'Supplier',
                    'Original Filename',
                    'Document Date',
                    'Processing',
                    'Uploaded By',
                    'Created',
                    'Actions',
                  ].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-3 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.data.data.map((document) => (
                  <tr key={document.id} className="border-t">
                    <td className="px-3 py-3">{documentLabel(document.documentType)}</td>
                    <td className="font-mono">{numberOf(document)}</td>
                    <td className="font-mono">{document.poNumber}</td>
                    <td>{document.supplierName ?? '—'}</td>
                    <td className="max-w-52 truncate" title={document.originalFileName}>
                      {document.originalFileName}
                    </td>
                    <td className="whitespace-nowrap">{formatDate(dateOf(document))}</td>
                    <td>Completed</td>
                    <td>{document.uploadedBy}</td>
                    <td className="whitespace-nowrap">{formatDateTime(document.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          aria-label={`View ${numberOf(document)}`}
                          onClick={() => setViewing(document)}
                          className="text-emerald-700"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          aria-label={`Delete ${numberOf(document)}`}
                          onClick={() => setDeleting(document)}
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
          )}
          {documents.data && (
            <Pagination
              page={query.page}
              totalPages={documents.data.meta.totalPages}
              onPageChange={(page) => setQuery((value) => ({ ...value, page }))}
            />
          )}
        </Card>
      </div>
      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <Modal open={Boolean(viewing)} title="Document details" onClose={() => setViewing(undefined)}>
        {viewing && <DocumentDetailsPanel document={viewing} />}
      </Modal>
      <Modal
        open={Boolean(deleting)}
        title="Delete document"
        onClose={() => setDeleting(undefined)}
      >
        <p className="text-sm text-slate-600">
          Delete {deleting ? numberOf(deleting) : 'this document'}? Its uploaded file will also be
          removed.
        </p>
        {feedback && !feedback.includes('successfully') && (
          <div className="mt-3">
            <MutationFeedback type="error" message={feedback} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            className="bg-white text-slate-700 ring-1 ring-slate-300"
            onClick={() => setDeleting(undefined)}
            disabled={deletion.isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-800"
            onClick={() => void remove()}
            disabled={deletion.isPending}
          >
            {deletion.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
