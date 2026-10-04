'use client';

import * as React from 'react';
import { BadgeCheck, Search } from 'lucide-react';
import { useStaff } from '@/components/admin/admin-shell';
import { AdminHeader, Badge, Empty, ErrorNote, Segmented, shortDate, timeAgo, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { adminApi, errorText, type AdminUser } from '@/lib/api/admin';

/**
 * Люди: поиск кандидатов и работодателей и ручной значок Verified компании
 * (ведение вручную, спецификация п. 8). Сотрудники с правом только на просмотр
 * видят список, но не кнопки.
 */

const PAGE = 25;
type Group = 'candidate' | 'employer';

export default function PeoplePage() {
  const staff = useStaff();
  const toast = useToast();
  const [group, setGroup] = React.useState<Group>('candidate');
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [offset, setOffset] = React.useState(0);
  const [verified, setVerified] = React.useState<Record<number, boolean>>({});
  const [busy, setBusy] = React.useState<number | null>(null);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(q.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const list = useLoad(() => adminApi.users({ group, q: search, limit: PAGE, offset }), [group, search, offset]);

  const toggleVerified = async (u: AdminUser) => {
    if (!u.company_id) return;
    const next = !(verified[u.company_id] ?? u.company_verified);
    setBusy(u.company_id);
    try {
      const res = await adminApi.verifyCompany(u.company_id, next);
      setVerified((v) => ({ ...v, [res.id]: res.is_verified }));
      toast.success(res.is_verified ? `${res.name} is now Verified` : `Verified removed from ${res.name}`);
    } catch (e) {
      toast.error(errorText(e, 'Could not change the Verified badge'));
    } finally {
      setBusy(null);
    }
  };

  const total = list.data?.count ?? 0;

  return (
    <>
      <AdminHeader
        title="People"
        subtitle="Find a candidate or an employer"
        actions={
          <Segmented
            label="Kind of account"
            value={group}
            onChange={(g) => {
              setGroup(g);
              setOffset(0);
            }}
            options={[
              { value: 'candidate', label: 'Candidates' },
              { value: 'employer', label: 'Employers' },
            ]}
          />
        }
      />

      <div className="space-y-5 px-5 py-6 md:px-8">
        <div className="relative max-w-xl">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={group === 'candidate' ? 'Name or email' : 'Name, email or company'}
            aria-label="Search people"
            className="h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </div>

        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {list.loading && !list.data && <ListSkeleton count={6} />}
        {list.data && list.data.results.length === 0 && <Empty title="Nobody found" hint="Check the spelling or clear the search." />}

        {list.data && list.data.results.length > 0 && (
          <ul className="space-y-2">
            {list.data.results.map((u, i) => {
              const isVerified = u.company_id ? (verified[u.company_id] ?? u.company_verified) : false;
              return (
                <li
                  key={u.id}
                  className="rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
                  style={riseStyle(i)}
                >
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="flex items-center gap-1.5 truncate font-medium text-text-primary">
                      {u.company ?? u.name}
                      {isVerified && <BadgeCheck size={15} aria-label="Verified" className="shrink-0 text-info" />}
                    </p>
                    <p className="truncate text-sm text-text-secondary">
                      {u.company ? `${u.name} · ` : ''}
                      {u.email}
                    </p>
                  </div>
                  {!u.is_active && <Badge tone="bad">inactive</Badge>}
                  {u.role === 'COMPANY_MANAGER' && <Badge>manager</Badge>}
                  <div className="text-right text-xs text-text-secondary" title={`Joined ${shortDate(u.joined)}`}>
                    <p>joined {timeAgo(u.joined)}</p>
                    <p>last login {timeAgo(u.last_login)}</p>
                  </div>
                  {staff.can.operate && group === 'employer' && u.company_id && u.role === 'COMPANY_OWNER' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy === u.company_id}
                      onClick={() => toggleVerified(u)}
                      aria-pressed={isVerified ?? false}
                    >
                      <BadgeCheck size={14} aria-hidden /> {isVerified ? 'Remove Verified' : 'Mark Verified'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {total > PAGE && (
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>
              {offset + 1}–{Math.min(offset + PAGE, total)} of {total}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
                Next
              </Button>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
