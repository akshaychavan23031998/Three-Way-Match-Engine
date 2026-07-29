'use client';
import { useEffect, useState } from 'react';
import type { DocumentType, UploadDocumentResponse } from '@three-way-match/shared';
import { useUploadDocument } from '@/hooks/use-documents';
import { ApiError } from '@/lib/api-client';
import { documentLabel, formatFileSize } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { MutationFeedback } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';

const allowedMimes = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
const allowedExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp']);
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const validateUploadFile = (file?: File): string | null => {
  if (!file) return 'Select a document file.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!allowedMimes.has(file.type) || !allowedExtensions.has(extension))
    return 'Use a PDF, PNG, JPG, JPEG, or WEBP file.';
  if (file.size > MAX_UPLOAD_BYTES) return 'The file must be 4 MB or smaller.';
  return null;
};

export function UploadDocumentModal({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded?: (document: UploadDocumentResponse) => void;
}) {
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<UploadDocumentResponse>();
  const [stage, setStage] = useState('Uploading document');
  const mutation = useUploadDocument();
  useEffect(() => {
    if (!mutation.isPending) return;
    setStage('Uploading document');
    const parsing = window.setTimeout(() => setStage('Parsing document'), 700);
    const saving = window.setTimeout(() => setStage('Saving result'), 2200);
    return () => {
      window.clearTimeout(parsing);
      window.clearTimeout(saving);
    };
  }, [mutation.isPending]);
  const close = () => {
    if (mutation.isPending) return;
    setDocumentType('');
    setFile(undefined);
    setError(undefined);
    setResult(undefined);
    mutation.reset();
    onClose();
  };
  const submit = async () => {
    const fileError = validateUploadFile(file);
    if (!documentType) return setError('Select a document type.');
    if (fileError) return setError(fileError);
    if (!file) return;
    setError(undefined);
    try {
      const document = await mutation.mutateAsync({ documentType, file });
      setResult(document);
      onUploaded?.(document);
      setFile(undefined);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The document could not be uploaded.');
    }
  };
  return (
    <Modal open={open} title="Upload document" onClose={close}>
      <div className="space-y-4">
        <div>
          <label htmlFor="document-type" className="text-sm font-medium">
            Document type
          </label>
          <Select
            id="document-type"
            className="mt-1 w-full"
            value={documentType}
            disabled={mutation.isPending}
            onChange={(event) => setDocumentType(event.target.value as DocumentType | '')}
          >
            <option value="">Select type</option>
            {(['purchase_order', 'grn', 'invoice'] as const).map((type) => (
              <option key={type} value={type}>
                {documentLabel(type)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="document-file" className="text-sm font-medium">
            Document file
          </label>
          <input
            id="document-file"
            type="file"
            disabled={mutation.isPending}
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              setFile(event.target.files?.[0]);
              setError(undefined);
              setResult(undefined);
            }}
            className="mt-1 block w-full rounded-lg border p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-emerald-700"
          />
          {file && (
            <p className="mt-2 text-sm text-slate-600">
              {file.name} · {formatFileSize(file.size)}
            </p>
          )}
        </div>
        {mutation.isPending && (
          <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {stage}…
          </p>
        )}
        {error && <MutationFeedback type="error" message={error} />}
        {result && (
          <MutationFeedback
            type="success"
            message={`Upload complete. Match recalculation ${
              result.matchRecalculationStatus === 'failed' ? 'could not complete' : 'completed'
            }.`}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            onClick={close}
            disabled={mutation.isPending}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={mutation.isPending || Boolean(result)}
          >
            {mutation.isPending ? 'Processing…' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
