'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, CheckCheck, FileText, Info, UserRoundPlus } from 'lucide-react';
import { PageHeader, useUnread } from '@/components/shell/app-shell';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button, Card } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { isCompany } from '@/lib/api/auth';
import { notificationsApi, type AppNotification } from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Уведомления. Клик открывает то, о чём оно: новый отклик ведёт работодателя
 * в Candidates, смена этапа — кандидата в его отклики.
 */

const ICON: Record<string, typeof Bell> = {
  APPLICATION_RECEIVED: UserRoundPlus,
  STATUS_CHANGED: FileText,
  MEETING_SCHEDULED: CalendarClock,
  SYSTEM: Info,
};

function ago(d: Date): string {
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { setUnread } = useUnread();
  const [items, setItems] = React.useState<AppNotification[] | null>(null);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    notificationsApi
      .list()
      .then((list) => {
        setItems(list);
        setUnread(list.filter((n) => !n.isRead).length);
        setError(false);
      })
      .catch(() => setError(true));
  }, [setUnread]);

  React.useEffect(load, [load]);

  const unread = items?.filter((n) => !n.isRead).length ?? 0;

  const destination = (n: AppNotification): string | null => {
    if (n.type === 'APPLICATION_RECEIVED') return '/company/selection';
    if (n.type === 'STATUS_CHANGED') return user && isCompany(user.role) ? '/company/selection' : '/responses';
    return null;
  };

  const open = async (n: AppNotification) => {
    if (!n.isRead) {
      // Сначала гасим точку, потом просим сервер: ответа ждать незачем.
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? null);
      setUnread(Math.max(0, unread - 1));
      notificationsApi.markRead(n.id).catch(() => load());
    }
    const to = destination(n);
    if (to) router.push(to);
  };

  const readAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((list) => list?.map((x) => ({ ...x, isRead: true })) ?? null);
      setUnread(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Could not mark them as read');
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={items ? (unread ? `${unread} unread` : 'You are up to date') : undefined}
        actions={
          unread > 0 ? (
            <Button variant="secondary" onClick={readAll}>
              <CheckCheck size={16} aria-hidden /> Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-3xl space-y-2 px-5 py-6 md:px-8">
        {!items && !error && <ListSkeleton count={4} />}

        {error && (
          <Card className="p-5 text-sm text-danger" role="alert">
            Could not load notifications.{' '}
            <button type="button" onClick={load} className="font-semibold underline focus-ring">
              Retry
            </button>
          </Card>
        )}

        {items && items.length === 0 && (
          <Card className="p-8 text-center">
            <Bell size={22} aria-hidden className="mx-auto text-text-tertiary" />
            <p className="mt-2 font-medium text-text-primary">Nothing here yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              New applications, stage changes and meetings will show up here.
            </p>
          </Card>
        )}

        {items?.map((n, i) => {
          const Icon = ICON[n.type] ?? Bell;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n)}
              style={riseStyle(i)}
              className={cn(
                'rise lift flex w-full items-start gap-3 rounded-lg border p-4 text-left focus-ring',
                n.isRead ? 'border-line bg-surface' : 'border-accent bg-accent-muted',
              )}
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-accent-text">
                <Icon size={17} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className={cn('text-text-primary', !n.isRead && 'font-semibold')}>{n.title}</span>
                  <span className="shrink-0 text-xs text-text-secondary">{ago(n.createdAt)}</span>
                </span>
                <span className="mt-0.5 block text-sm text-text-secondary [overflow-wrap:anywhere]">{n.message}</span>
              </span>
              {!n.isRead && <span aria-label="Unread" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-strong dark:bg-accent" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
