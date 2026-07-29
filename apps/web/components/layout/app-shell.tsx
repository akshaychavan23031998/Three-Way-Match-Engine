import type { ReactNode } from 'react';
import { IconRail } from './icon-rail';
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <IconRail />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
