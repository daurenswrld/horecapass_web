'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  FileText,
  LogOut,
  MessageSquare,
  Search,
  User,
  UserSearch,
} from 'lucide-react';
import { Wordmark } from '@/components/brand';
import { Spinner } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isCompany } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Каркас приложения после входа.
 *
 * Разделы те же, что во вкладках мобилки:
 *   соискатель — Jobs / Responses / Chats / Profile
 *   компания   — Vacancies / Selection / Chats / Profile
 *
 * На телефоне это нижняя панель, здесь — боковая колонка: на широком экране
 * нижняя панель оставляет полосу пустоты по бокам и заставляет тянуться курсором
 * вниз. Набор и порядок разделов при этом не меняются, чтобы человек, знакомый
 * с приложением, не искал их заново.
 */

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Search;
}

const APPLICANT_NAV: NavItem[] = [
  { href: '/jobs', label: 'Jobs', Icon: Search },
  { href: '/responses', label: 'Applications', Icon: FileText },
  { href: '/chats', label: 'Chats', Icon: MessageSquare },
  { href: '/profile', label: 'Profile', Icon: User },
];

const COMPANY_NAV: NavItem[] = [
  { href: '/company/vacancies', label: 'Jobs', Icon: Briefcase },
  { href: '/company/selection', label: 'Candidates', Icon: UserSearch },
  { href: '/company/chats', label: 'Chats', Icon: MessageSquare },
  { href: '/company/profile', label: 'Profile', Icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Разделы приложения закрыты для неавторизованных — как и в мобилке,
  // где RootScreen пускает дальше только при валидном токене.
  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <Spinner />
      </div>
    );
  }

  const nav = isCompany(user.role) ? COMPANY_NAV : APPLICANT_NAV;
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.company_name ||
    user.email ||
    'Account';

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <Link href={nav[0].href} className="mb-6 block px-2 rounded focus-ring">
          <Wordmark height={22} />
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                  active
                    ? 'bg-accent-muted text-text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
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
            <p className="truncate text-sm font-medium text-text-primary">{name}</p>
            <p className="truncate text-xs text-text-secondary">
              {isCompany(user.role) ? 'Employer' : 'Candidate'}
            </p>
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

      {/* На узком экране — нижняя панель, как в приложении. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface md:hidden">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium focus-ring',
                active ? 'text-accent' : 'text-text-secondary',
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}

/** Заголовок раздела — единая шапка для всех внутренних страниц. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 px-5 py-4 backdrop-blur md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
