import type { ReactNode } from 'react';
import { IconRail } from './icon-rail';

export function AppShell({ children, section }: { children: ReactNode; section?: string }) {
  return (
    <div className="min-h-screen md:flex">
      <IconRail />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Three-Way Match Engine
            </p>
            <p className="text-sm text-slate-500">{section ?? 'Procurement operations'}</p>
          </div>
          <span className="text-sm font-medium text-slate-600">Administrator</span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
