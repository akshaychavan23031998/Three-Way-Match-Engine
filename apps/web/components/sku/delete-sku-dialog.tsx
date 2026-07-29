import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
export function DeleteSkuDialog({ open, onConfirm }: { open: boolean; onConfirm: () => void }) {
  return (
    <Modal open={open} title="Delete SKU">
      <p className="mb-4 text-sm text-slate-600">This action cannot be undone.</p>
      <Button className="bg-red-600" onClick={onConfirm}>
        Delete
      </Button>
    </Modal>
  );
}
