import { Boxes, FileSearch, Settings } from 'lucide-react';
export function IconRail() {
  return (
    <aside className="flex w-16 flex-col items-center gap-6 border-r bg-slate-900 py-6 text-slate-300">
      <Boxes />
      <FileSearch className="text-emerald-400" />
      <Settings />
    </aside>
  );
}
