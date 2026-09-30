'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { AdminHeader, Badge, Empty, ErrorNote, Segmented, shortDate, timeAgo, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Card } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { adminApi, type FeedRow } from '@/lib/api/admin';

/**
 * Ежедневная лента: конкретные люди, а не проценты, чтобы менеджер мог
 * лично дотянуть человека (спецификация, п. 4–5). Застрявшие сверху, у каждого
 * написано, на каком шаге он остановился и когда был последний раз.
 */

type Tab = 'candidates' | 'employers';

const STAGE_TONE: Record<string, 'neutral' | 'good' | 'warn' | 'info'> = {
  registered: 'warn',
  filling_profile: 'warn',
  profile_complete: 'info',
  applied: 'good',
  company_filled: 'info',
  vacancy_draft: 'warn',
  vacancy_published: 'good',
};

export default function FeedPage() {
  return (
    <React.Suspense fallback={null}>
      <FeedInner />
    </React.Suspense>
  );
}

function FeedInner() {
  const params = useSearchParams();
  const [tab, setTab] = React.useState<Tab>(params.get('tab') === 'employers' ? 'employers' : 'candidates');
  const [hours, setHours] = React.useState(24);
  const [onlyStuck, setOnlyStuck] = React.useState(false);

  const feed = useLoad(
    () => (tab === 'candidates' ? adminApi.candidateFeed(hours) : adminApi.employerFeed(hours)),
    [tab, hours],
  );
  const rows = React.useMemo(() => {
    const all = feed.data?.results ?? [];
    const list = onlyStuck ? all.filter((r) => r.stuck_at) : all;
    // Застрявшие первыми, внутри — давнее молчание выше: их надо дотянуть раньше.
    return [...list].sort((a, b) => Number(!!b.stuck_at) - Number(!!a.stuck_at));
  }, [feed.data, onlyStuck]);
  const stuckCount = feed.data?.results.filter((r) => r.stuck_at).length ?? 0;

  return (
    <>
      <AdminHeader
        title="Daily feed"
        subtitle="Who started to register, where they are now, where they stopped"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Kind of person"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'candidates', label: 'Candidates' },
                { value: 'employers', label: 'Employers' },
              ]}
            />
            <Segmented
              label="Period"
              value={hours}
              onChange={setHours}
              options={[
                { value: 24, label: '24 h' },
                { value: 72, label: '3 days' },
                { value: 168, label: '7 days' },
              ]}
            />
          </div>
        }
      />

      <div className="space-y-5 px-5 py-6 md:px-8">
        {feed.error && <ErrorNote message={feed.error} onRetry={feed.reload} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary" aria-live="polite">
            {feed.data ? `${feed.data.count} registered · ${stuckCount} not finished` : 'Loading…'}
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={onlyStuck}
              onChange={(e) => setOnlyStuck(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--accent))]"
            />
            Only people who stopped
          </label>
        </div>

        {feed.data && !feed.data.channel_tracked && (
          <p className="text-xs text-text-secondary">
            The sign-up channel (WhatsApp or web) is not recorded yet, so it is not shown.
          </p>
        )}

        {feed.loading && !feed.data && <ListSkeleton count={5} />}

        {feed.data && rows.length === 0 && (
          <Empty
            title={onlyStuck ? 'Nobody is stuck' : 'Nobody registered in this period'}
            hint={onlyStuck ? 'Everyone who registered has finished their steps.' : 'Try a longer period.'}
          />
        )}

        {rows.length > 0 && (
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <FeedItem key={`${tab}-${r.id}`} row={r} index={i} kind={tab} />
            ))}
          </ul>
        )}

        {tab === 'employers' && feed.data?.abandoned_drafts && feed.data.abandoned_drafts.length > 0 && (
          <section aria-labelledby="drafts" className="pt-2">
            <h2 id="drafts" className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Started a vacancy and left
            </h2>
            <p className="mb-3 text-sm text-text-secondary">A separate drop-off point inside employers who are already registered.</p>
            <Card className="divide-y divide-line">
              {feed.data.abandoned_drafts.map((d) => (
                <div key={d.vacancy_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium text-text-primary">{d.title || 'Untitled vacancy'}</span>
                    <span className="text-text-secondary"> · {d.company}</span>
                  </span>
                  <span className="text-xs text-text-secondary">edited {timeAgo(d.updated_at)}</span>
                </div>
              ))}
            </Card>
          </section>
        )}
      </div>
    </>
  );
}

function FeedItem({ row, index, kind }: { row: FeedRow; index: number; kind: Tab }) {
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(row.email);
      setCopied(true);
      toast.success('Email copied');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy the email');
    }
  };

  return (
    <li
      className="rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
      style={riseStyle(index)}
    >
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate font-medium text-text-primary">{row.name}</p>
        <p className="truncate text-sm text-text-secondary">
          {kind === 'employers' && row.contact ? `${row.contact} · ` : ''}
          {row.email}
        </p>
      </div>

      <div className="flex flex-col items-start gap-1 sm:items-center">
        <Badge tone={STAGE_TONE[row.stage] ?? 'neutral'}>{row.stage_label}</Badge>
        {row.stuck_at && <span className="text-xs text-text-secondary">stopped at: {row.stuck_at}</span>}
      </div>

      <div className="text-right text-xs text-text-secondary" title={`Registered ${shortDate(row.registered_at)}`}>
        <p>registered {timeAgo(row.registered_at)}</p>
        <p>last seen {timeAgo(row.last_activity)}</p>
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label={`Copy email of ${row.name}`}
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring"
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </button>
    </li>
  );
}
