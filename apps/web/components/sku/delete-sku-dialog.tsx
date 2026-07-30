'use client';
import type { SkuMaster } from '@three-way-match/shared';
import { useDeleteSkuMaster } from '@/hooks/use-sku-masters';
import { Button } from '@/components/ui/button';
import { MutationFeedback } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/modal';

export function DeleteSkuDialog({ record, onClose }: { record?: SkuMaster; onClose: () => void }) {
  const mutation = useDeleteSkuMaster();
  const confirm = async () => {
    if (!record) return;
    try {
      await mutation.mutateAsync(record.id);
      onClose();
    } catch {
      // The mutation error is displayed without closing the dialog.
    }
  };
  return (
    <Modal open={Boolean(record)} title="Delete SKU" {...(!mutation.isPending ? { onClose } : {})}>
      <p className="text-sm text-slate-600">
        Permanently delete <strong>{record?.name}</strong> with ERP code{' '}
        <strong className="font-mono">{record?.skuErpCode}</strong>?
      </p>
      {mutation.isError && (
        <div className="mt-4">
          <MutationFeedback type="error" message={mutation.error.message} />
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          className="bg-red-700 hover:bg-red-800"
          onClick={() => void confirm()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Deleting…' : 'Delete SKU'}
        </Button>
      </div>
    </Modal>
  );
}
