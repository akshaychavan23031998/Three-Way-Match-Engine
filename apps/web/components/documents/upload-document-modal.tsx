import { Modal } from '@/components/ui/modal';
export function UploadDocumentModal({ open }: { open: boolean }) {
  return (
    <Modal open={open} title="Upload document">
      <p className="text-sm text-slate-500">Upload workflow foundation is ready.</p>
    </Modal>
  );
}
