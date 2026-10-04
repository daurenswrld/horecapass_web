'use client';

import * as React from 'react';
import { AdminHeader, Empty, ErrorNote, shortDate, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button } from '@/components/ui/primitives';
import { adminApi, type AuditEntry } from '@/lib/api/admin';

/** Журнал действий менеджеров: кто что изменил и когда (спецификация, п. 15). */

const PAGE = 50;

const ACTIONS: Record<string, string> = {
  'vacancy.block': 'Blocked a vacancy',
  'vacancy.unblock': 'Unblocked a vacancy',
  'company.verify': 'Changed a company’s Verified badge',
  'staff.add': 'Added a manager',
  'staff.level': 'Changed a manager’s access level',
  'staff.remove': 'Removed a manager',
  'ticket.status': 'Changed a ticket’s status',
};

function describe(e: AuditEntry): string {
  const d = e.details as Record<string, string | boolean | undefined>;
  switch (e.action) {
    case 'vacancy.block':
      return `“${d.title}” — ${d.reason}`;
    case 'vacancy.unblock':
      return `Vacancy #${e.target_id}, restored to ${String(d.restored_status ?? '').toLowerCase()}`;
    case 'company.verify':
      return `${d.name}: ${d.verified ? 'Verified' : 'not Verified'}`;
    case 'staff.add':
    case 'staff.level':
      return `${d.email} → ${d.level}`;
    case 'staff.remove':
      return String(d.email ?? '');
    case 'ticket.status':
      return `#${e.target_id}: ${d.old} → ${d.new}`;
    default:
      return JSON.stringify(e.details);
  }
}

export default function AuditPage() {
  const [offset, setOffset] = React.useState(0);
  const [action, setAction] = React.useState('');
  const list = useLoad(() => adminApi.auditLog({ action, limit: PAGE, offset }), [action, offset]);
  const total = list.data?.count ?? 0;

  return (
    <>
      <AdminHeader
        title="Audit log"
        subtitle="Every change made in the panel"
        actions={
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setOffset(0);
            }}
            aria-label="Filter by action"
            className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm text-text-primary focus-ring"
          >
            <option value="">All actions</option>
            <option value="vacancy">Vacancies</option>
            <option value="company">Companies</option>
            <option value="staff">Managers</option>
            <option value="ticket">Tickets</option>
          </select>
        }
      />

      <div className="space-y-3 px-5 py-6 md:px-8">
        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {list.loading && !list.data && <ListSkeleton count={6} />}
        {list.data && list.data.results.length === 0 && <Empty title="Nothing logged yet" hint="Changes made in the panel will appear here." />}

        {list.data && list.data.results.length > 0 && (
          <ol className="space-y-2">
            {list.data.results.map((e, i) => (
              <li
                key={e.id}
                className="rise grid gap-x-4 gap-y-1 rounded-lg border border-line bg-surface px-4 py-3 sm:grid-cols-[9rem_1fr]"
                style={riseStyle(i)}
              >
                <time dateTime={e.at} className="text-xs text-text-secondary sm:pt-0.5">
                  {shortDate(e.at)}
                </time>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{e.actor ?? 'Unknown'}</span> · {ACTIONS[e.action] ?? e.action}
                  </p>
                  <p className="mt-0.5 break-words text-sm text-text-secondary">{describe(e)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {total > PAGE && (
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>
              {offset + 1}–{Math.min(offset + PAGE, total)} of {total}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Newer
              </Button>
              <Button size="sm" variant="secondary" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
                Older
              </Button>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
