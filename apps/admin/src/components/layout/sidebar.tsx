'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Inbox,
  Search,
  MessageSquare,
  UserCheck,
  UserX,
  LayoutList,
  Settings,
} from 'lucide-react';
import { APPLICATIONS_SIDEBAR, APPLICATIONS_ALL_SLUG } from '@avitus/shared-types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

const statusIcons = {
  barchasi: LayoutList,
  yangi: Inbox,
  'korib-chiqilmoqda': Search,
  suhbat: MessageSquare,
  'qabul-qilindi': UserCheck,
  'rad-etildi': UserX,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const isMenuActive = (slug: string) => {
    const href = `/applications/${slug}`;
    if (slug === APPLICATIONS_ALL_SLUG) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card">
      <div className="shrink-0 border-b p-6">
        <h1 className="text-lg font-bold text-primary">Avitus Anketa</h1>
        <p className="text-sm text-muted-foreground">HR Admin Panel</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/dashboard')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Settings className="h-4 w-4" />
          Sozlamalar
        </Link>

        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Arizalar
          </p>
          <div className="space-y-1">
            {APPLICATIONS_SIDEBAR.map((item) => {
              const href = `/applications/${item.slug}`;
              const Icon = statusIcons[item.slug as keyof typeof statusIcons];
              const isActive = isMenuActive(item.slug);

              return (
                <Link
                  key={item.slug}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t bg-card p-4">
        <p className="mb-2 text-sm font-medium">{admin?.username}</p>
        <p className="mb-3 text-xs text-muted-foreground">{admin?.role}</p>
        <Button variant="outline" size="sm" className="w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </aside>
  );
}
