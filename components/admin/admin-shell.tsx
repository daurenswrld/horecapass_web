'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Bot,
  Briefcase,
  ClipboardList,
  Gauge,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  Users,
  UserCog,
} from 'lucide-react';
import { Wordmark } from '@/components/brand';
import { Spinner } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ToastProvider } from '@/components/ui/toast';
import { adminApi, LEVEL_LABEL, type StaffMe } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Каркас админ-панели для сотрудников.
 *
 * Пускает только роль ADMIN и только если сервер подтвердил доступ
 * (/api/admin/me/). Уровень доступа сотрудника лежит в контексте: разделы,
 * которые ему не положены, не показываются в меню, а кнопки действий,
 * которые он не может выполнить, скрыты. Сервер проверяет права сам: это
 * только чтобы человек не нажимал на то, что заведомо откажет.
 */

const StaffContext = React.createContext<StaffMe | null>(null);

export function useStaff(): StaffMe {
  const v = React.useContext(StaffContext);
  if (!v) throw new Error('useStaff was called outside AdminShell');
  return v;
}

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Gauge;
  needs?: 'manage_staff';
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', Icon: Gauge },
  { href: '/admin/funnels', label: 'Funnels', Icon: Activity },
  { href: '/admin/feed', label: 'Daily feed', Icon: ClipboardList },
  { href: '/admin/vacancies', label: 'Vacancies', Icon: Briefcase },
  { href: '/admin/people', label: 'People', Icon: Users },
  { href: '/admin/knowledge', label: 'Assistant', Icon: Bot },
  { href: '/admin/tickets', label: 'Support', Icon: LifeBuoy },
  { href: '/admin/managers', label: 'Managers', Icon: UserCog, needs: 'manage_staff' },
  { href: '/admin/audit', label: 'Audit log', Icon: ShieldCheck, needs: 'manage_staff' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [staff, setStaff] = React.useState<StaffMe | null>(null);
  const [denied, setDenied] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  React.useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    adminApi
      .me()
      .then(setStaff)
      .catch(() => setDenied(true));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (user.role !== 'ADMIN' || denied) {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-heading">No access</h1>
          <p className="mt-2 text-text-secondary">
            This area is for HorecaPass staff. If you should have access, ask a colleague with full access to add you.
          </p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-full bg-accent-strong px-5 font-semibold text-on-accent focus-ring dark:bg-accent">
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <Spinner />
      </div>
    );
  }

  const items = NAV.filter((n) => !n.needs || staff.can[n.needs]);
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');

  return (
    <StaffContext.Provider value={staff}>
      <ToastProvider>
        <div className="flex min-h-[100dvh]">
          <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
            <Link href="/admin" className="mb-1 block rounded px-2 focus-ring">
              <Wordmark height={22} />
            </Link>
            <p className="mb-5 px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">Admin panel</p>

            <nav className="flex-1 space-y-1" aria-label="Admin sections">
              {items.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'nav-item flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                      active ? 'bg-accent-muted text-text-primary' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                    )}
                  >
                    <Icon size={18} className={active ? 'text-accent' : undefined} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-3 border-t border-line pt-3">
              <div className="px-3">
                <p className="truncate text-sm font-medium text-text-primary">{staff.name}</p>
                <p className="truncate text-xs text-text-secondary">{LEVEL_LABEL[staff.level]}</p>
              </div>
              <div className="flex items-center justify-between px-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="rounded p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-danger focus-ring"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            {/* На узком экране — полоса разделов сверху: боковой колонке там нет места. */}
            <nav
              aria-label="Admin sections"
              className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden"
            >
              {items.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium focus-ring',
                    isActive(href) ? 'bg-accent-strong text-on-accent dark:bg-accent' : 'text-text-secondary',
                  )}
                >
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={signOut}
                className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-sm text-text-secondary focus-ring"
              >
                Sign out
              </button>
            </nav>
            {children}
          </main>
        </div>
      </ToastProvider>
    </StaffContext.Provider>
  );
}
