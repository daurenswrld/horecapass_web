'use client';

import * as React from 'react';
import { Ban, RotateCcw, Search } from 'lucide-react';
import { useStaff } from '@/components/admin/admin-shell';
import { AdminHeader, Badge, Empty, ErrorNote, Modal, StatTile, TileSkeletons, shortDate, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { adminApi, errorText, type AdminVacancy } from '@/lib/api/admin';

/**
 * Вакансии: сводка за месяц и модерация. Фейковую вакансию можно заблокировать
 * (она уходит в архив и исчезает у кандидатов), причина обязательна и попадает
 * в журнал; разблокировка возвращает прежний статус.
 */

const STATUS_TONE = { ACTIVE: 'good', DRAFT: 'neutral', ARCHIVED: 'warn' } as const;
const PAGE = 25;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function VacanciesPage() {
  const staff = useStaff();
  const toast = useToast();
  const [month, setMonth] = React.useState(currentMonth());
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [blockedOnly, setBlockedOnly] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [target, setTarget] = React.useState<AdminVacancy | null>(null);

  // Поиск уходит на сервер с задержкой: не на каждую букву.
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(q.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const summary = useLoad(() => adminApi.vacanciesMonth(month), [month]);
  const list = useLoad(
    () => adminApi.vacancies({ q: search, status, blocked: blockedOnly ? 1 : undefined, limit: PAGE, offset }),
    [search, status, blockedOnly, offset],
  );

  const onChanged = (v: AdminVacancy) => {
    list.reload();
    summary.reload();
    toast.success(v.blocked ? `“${v.title}” is blocked` : `“${v.title}” is unblocked`);
  };

  const unblock = async (v: AdminVacancy) => {
    try {
      onChanged(await adminApi.unblockVacancy(v.id));
    } catch (e) {
      toast.error(errorText(e, 'Could not unblock the vacancy'));
    }
  };

  const s = summary.data;
  const total = list.data?.count ?? 0;

  return (
    <>
      <AdminHeader
        title="Vacancies"
        subtitle="The month at a glance and moderation"
        actions={
          <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
            Month
            <input
              type="month"
              value={month}
              max={currentMonth()}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="h-10 rounded border border-line-strong bg-surface px-3 text-text-primary focus-ring"
            />
          </label>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
        {summary.error && <ErrorNote message={summary.error} onRetry={summary.reload} />}
        {!s ? (
          <TileSkeletons count={5} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile index={0} label="Active now" value={s.active_now} hint="open vacancies" />
            <StatTile index={1} label="Submitted in the month" value={s.submitted} hint="drafts, archived and blocked included" />
            <StatTile index={2} label="Published" value={s.by_status.active} hint="still active" />
            <StatTile index={3} label="Blocked in the month" value={s.blocked} />
            <StatTile index={4} label="On moderation" value={s.on_moderation} unavailable hint="No pre-moderation queue" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title or company"
              aria-label="Search vacancies"
              className="h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-text-primary placeholder:text-text-tertiary focus-ring"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            aria-label="Status"
            className="h-11 rounded-full border border-line-strong bg-surface px-4 text-text-primary focus-ring"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={blockedOnly}
              onChange={(e) => {
                setBlockedOnly(e.target.checked);
                setOffset(0);
              }}
              className="h-4 w-4 accent-[rgb(var(--accent))]"
            />
            Blocked only
          </label>
        </div>

        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {list.loading && !list.data && <ListSkeleton count={5} />}
        {list.data && list.data.results.length === 0 && <Empty title="No vacancies found" hint="Change the filters or the search." />}

        {list.data && list.data.results.length > 0 && (
          <ul className="space-y-2">
            {list.data.results.map((v, i) => (
              <li
                key={v.id}
                className="rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
                style={riseStyle(i)}
              >
                <div className="min-w-0 flex-1 basis-60">
                  <p className="truncate font-medium text-text-primary">{v.title}</p>
                  <p className="truncate text-sm text-text-secondary">
                    {v.company}
                    {v.city ? ` · ${v.city}` : ''}
                  </p>
                  {v.blocked && <p className="mt-1 text-xs text-danger">Blocked: {v.block_reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {v.blocked ? <Badge tone="bad">Blocked</Badge> : <Badge tone={STATUS_TONE[v.status]}>{v.status.toLowerCase()}</Badge>}
                </div>
                <div className="w-28 text-right text-xs text-text-secondary">
                  <p>{v.applications ?? 0} applications</p>
                  <p>posted {shortDate(v.created_at)}</p>
                </div>
                {staff.can.moderate &&
                  (v.blocked ? (
                    <Button size="sm" variant="secondary" onClick={() => unblock(v)}>
                      <RotateCcw size={14} aria-hidden /> Unblock
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setTarget(v)} aria-label={`Block ${v.title}`}>
                      <Ban size={14} aria-hidden /> Block
                    </Button>
                  ))}
              </li>
            ))}
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

      <BlockDialog vacancy={target} onClose={() => setTarget(null)} onDone={onChanged} />
    </>
  );
}

function BlockDialog({ vacancy, onClose, onDone }: { vacancy: AdminVacancy | null; onClose: () => void; onDone: (v: AdminVacancy) => void }) {
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (vacancy) {
      setReason('');
      setError(null);
    }
  }, [vacancy]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacancy || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const v = await adminApi.blockVacancy(vacancy.id, reason.trim());
      onClose();
      onDone(v);
    } catch (err) {
      setError(errorText(err, 'Could not block the vacancy.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!vacancy} title="Block this vacancy?" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-text-secondary">
          “{vacancy?.title}” by {vacancy?.company} goes to the archive and disappears for candidates. You can unblock it later.
        </p>
        <label className="block text-sm font-medium text-text-secondary" htmlFor="block-reason">
          Reason (saved in the audit log)
        </label>
        <textarea
          id="block-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          required
          className="w-full rounded border border-line-strong bg-surface p-3 text-text-primary focus-ring"
          placeholder="For example: no real venue, looks like a fake posting"
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={busy || !reason.trim()}>
            {busy ? 'Blocking…' : 'Block vacancy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
