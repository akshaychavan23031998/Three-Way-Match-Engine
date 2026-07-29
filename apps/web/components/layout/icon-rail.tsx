'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, FileText, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/masters', label: 'SKU Master', icon: Boxes },
] as const;
export function IconRail() {
  const pathname = usePathname();
  const auth = useAuth();
  return (
    <aside className="border-b bg-slate-950 text-slate-300 md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-3 md:block md:p-4">
        <Link href="/dashboard" className="font-semibold text-white">
          <span className="text-emerald-400">3WM</span>
          <span className="ml-2 md:inline">Operations</span>
        </Link>
        <nav aria-label="Primary" className="flex gap-1 md:mt-8 md:block md:space-y-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  active ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={auth.logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
