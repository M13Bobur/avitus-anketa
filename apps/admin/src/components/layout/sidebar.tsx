'use client';

import { useState } from 'react';
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
  KeyRound,
  User,
} from 'lucide-react';
import { APPLICATIONS_SIDEBAR, APPLICATIONS_ALL_SLUG } from '@avitus/shared-types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { AccountSettingsModal } from '@/components/auth/account-settings-modal';
import { ThemeToggle } from '@/components/theme/theme-toggle';

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
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const isMenuActive = (slug: string) => {
    const href = `/applications/${slug}`;
    if (slug === APPLICATIONS_ALL_SLUG) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card">
        <div className="shrink-0 border-b bg-gradient-to-br from-primary/5 to-transparent p-6 dark:from-primary/10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-primary">Avitus Anketa</h1>
              <p className="text-sm text-muted-foreground">HR Admin Panel</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              pathname.startsWith('/dashboard')
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="pt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Arizalar
            </p>
            <div className="space-y-0.5">
              {APPLICATIONS_SIDEBAR.map((item) => {
                const href = `/applications/${item.slug}`;
                const Icon = statusIcons[item.slug as keyof typeof statusIcons];
                const isActive = isMenuActive(item.slug);

                return (
                  <Link
                    key={item.slug}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
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

        <div className="mt-auto shrink-0 space-y-3 border-t bg-muted/20 p-4">
          <div className="flex items-center gap-2.5 rounded-xl border bg-background p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{admin?.username}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {admin?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAccountModalOpen(true)}
              title="Login va parolni o'zgartirish"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-muted-foreground/20 hover:bg-destructive/5 hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Chiqish
          </Button>
        </div>
      </aside>

      <AccountSettingsModal
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
        username={admin?.username}
      />
    </>
  );
}
