'use client';

import * as React from 'react';
import { useStaff } from '@/components/admin/admin-shell';
import { AdminHeader, Badge, Empty, ErrorNote, Segmented, timeAgo, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { useToast } from '@/components/ui/toast';
import { adminApi, errorText, type Ticket, type TicketStatus } from '@/lib/api/admin';

/** Обращения в поддержку: их создаёт ИИ-агент поддержки, сотрудник ведёт статус. */

const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];
const TONE = { OPEN: 'bad', IN_PROGRESS: 'warn', RESOLVED: 'good', CLOSED: 'neutral' } as const;
const CATEGORY: Record<string, string> = {
  PAYMENT: 'Payment',
  ACCOUNT: 'Account',
  BUG: 'Bug',
  VACANCY: 'Vacancies',
  RESUME: 'Resume',
  FEATURE: 'Feature request',
  OTHER: 'Other',
};

export default function TicketsPage() {
  const staff = useStaff();
  const toast = useToast();
  const [filter, setFilter] = React.useState<TicketStatus | ''>('OPEN');
  const list = useLoad(() => adminApi.tickets({ status: filter, limit: 100 }), [filter]);

  const change = async (t: Ticket, status: TicketStatus) => {
    try {
      await adminApi.setTicketStatus(t.id, status);
      toast.success(`Ticket #${t.id} is now ${status.toLowerCase().replace('_', ' ')}`);
      list.reload();
    } catch (e) {
      toast.error(errorText(e, 'Could not change the ticket'));
    }
  };

  const counts = list.data?.status_counts ?? {};

  return (
    <>
      <AdminHeader
        title="Support"
        subtitle="Requests raised by users"
        actions={
          <Segmented
            label="Status"
            value={filter}
            onChange={setFilter}
            options={[
              ...STATUSES.map((s) => ({ value: s.value as TicketStatus | '', label: `${s.label}${counts[s.value] ? ` · ${counts[s.value]}` : ''}` })),
              { value: '', label: 'All' },
            ]}
          />
        }
      />

      <div className="space-y-3 px-5 py-6 md:px-8">
        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {list.loading && !list.data && <ListSkeleton count={4} />}
        {list.data && list.data.results.length === 0 && <Empty title="No tickets here" hint="Nothing is waiting in this status." />}

        {list.data?.results.map((t, i) => (
          <article key={t.id} className="rise rounded-lg border border-line bg-surface p-4" style={riseStyle(i)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text-primary">
                  #{t.id} · {t.subject}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {t.user} · {t.email} · {timeAgo(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{CATEGORY[t.category] ?? t.category}</Badge>
                <Badge tone={TONE[t.status]}>{t.status.toLowerCase().replace('_', ' ')}</Badge>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-text-primary">{t.message}</p>
            {staff.can.operate && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <label htmlFor={`st-${t.id}`} className="text-text-secondary">
                  Status
                </label>
                <select
                  id={`st-${t.id}`}
                  value={t.status}
                  onChange={(e) => change(t, e.target.value as TicketStatus)}
                  className="h-9 rounded-full border border-line-strong bg-surface px-3 text-text-primary focus-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
