'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Briefcase, Building2, Scale, UserRound, Wallet } from 'lucide-react';
import {
  AdminHeader,
  ErrorNote,
  Segmented,
  StatTile,
  TileSkeletons,
  useLoad,
} from '@/components/admin/ui';
import { Card } from '@/components/ui/primitives';
import { adminApi } from '@/lib/api/admin';

/**
 * Главный экран админки: жива ли площадка. Первым идёт баланс сторон,
 * потому что главный риск двустороннего маркетплейса не рост, а перекос
 * (спецификация, раздел 1). Ниже то, что требует рук сегодня.
 */
export default function AdminOverviewPage() {
  const [days, setDays] = React.useState(30);
  const overview = useLoad(() => adminApi.overview({ days }), [days]);
  const trust = useLoad(() => adminApi.trust(), []);
  const revenue = useLoad(() => adminApi.revenue(), []);
  const candFeed = useLoad(() => adminApi.candidateFeed(24), []);
  const empFeed = useLoad(() => adminApi.employerFeed(24), []);
  const tickets = useLoad(() => adminApi.tickets({ status: 'OPEN', limit: 1 }), []);

  const o = overview.data;
  const stuckCandidates = candFeed.data?.results.filter((r) => r.stuck_at).length ?? 0;
  const stuckEmployers = empFeed.data?.results.filter((r) => r.stuck_at).length ?? 0;

  return (
    <>
      <AdminHeader
        title="Overview"
        subtitle="Is the marketplace alive, and is it balanced?"
        actions={
          <Segmented
            label="Activity window"
            value={days}
            onChange={setDays}
            options={[
              { value: 7, label: '7 days' },
              { value: 30, label: '30 days' },
              { value: 90, label: '90 days' },
            ]}
          />
        }
      />

      <div className="space-y-8 px-5 py-6 md:px-8">
        {overview.error && <ErrorNote message={overview.error} onRetry={overview.reload} />}

        <section aria-labelledby="liquidity">
          <h2 id="liquidity" className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Liquidity
          </h2>
          {!o ? (
            <TileSkeletons count={5} />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatTile index={0} Icon={UserRound} label="Active candidates" value={o.candidates_active} hint={`of ${o.candidates_total} in total`} />
              <StatTile index={1} Icon={Building2} label="Active employers" value={o.employers_active} hint={`of ${o.employers_total}, with an open job`} />
              <StatTile index={2} Icon={Briefcase} label="Open vacancies" value={o.vacancies_open} />
              <StatTile
                index={3}
                Icon={Scale}
                label="Candidates per vacancy"
                value={o.candidates_per_vacancy}
                hint={o.candidates_per_vacancy === null ? 'No open vacancies' : 'active candidates ÷ open jobs'}
              />
              <StatTile
                index={4}
                label="Jobs with no applications"
                value={o.vacancies_without_applications}
                hint={`older than ${o.stale_days} days`}
              />
            </div>
          )}
        </section>

        <section aria-labelledby="attention">
          <h2 id="attention" className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Needs a person today
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AttentionCard
              href="/admin/feed"
              value={stuckCandidates}
              total={candFeed.data?.count}
              loading={candFeed.loading && !candFeed.data}
              title="Candidates stuck in sign-up"
              note="registered in the last 24 h, profile not finished"
            />
            <AttentionCard
              href="/admin/feed?tab=employers"
              value={stuckEmployers}
              total={empFeed.data?.count}
              loading={empFeed.loading && !empFeed.data}
              title="Employers stuck in sign-up"
              note="registered in the last 24 h, nothing published"
            />
            <AttentionCard
              href="/admin/feed?tab=employers"
              value={empFeed.data?.abandoned_drafts?.length ?? 0}
              loading={empFeed.loading && !empFeed.data}
              title="Unfinished vacancy drafts"
              note="started and left, company has nothing live"
            />
            <AttentionCard
              href="/admin/tickets"
              value={tickets.data?.count ?? 0}
              loading={tickets.loading && !tickets.data}
              title="Open support tickets"
              note="waiting for an answer"
            />
          </div>
        </section>

        <section aria-labelledby="trust">
          <h2 id="trust" className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Trust and money
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              index={0}
              Icon={BadgeCheck}
              label="Employers Verified"
              value={trust.data?.employers_verified_pct}
              suffix="%"
              hint={trust.data ? `${trust.data.employers_verified} of ${trust.data.employers_total}` : undefined}
            />
            <StatTile index={1} Icon={BadgeCheck} label="Candidates Verified" value={null} unavailable hint="Needs stored qualification results" />
            <StatTile index={2} Icon={Wallet} label="Earned in 24 h" value={revenue.data?.last_24h} unavailable={revenue.data ? !revenue.data.available : false} />
            <StatTile index={3} Icon={Wallet} label="Earned this month" value={revenue.data?.this_month} unavailable={revenue.data ? !revenue.data.available : false} />
          </div>
          {revenue.data && !revenue.data.available && (
            <p className="mt-2 text-xs text-text-secondary">
              Payments are not connected yet, so there is nothing to total. The numbers appear once the payment provider is live.
            </p>
          )}
        </section>

        <section aria-labelledby="balance">
          <h2 id="balance" className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Demand by role and city
          </h2>
          <p className="mb-3 text-sm text-text-secondary">Open vacancies and how many applications they drew. A high ratio means too few jobs, a low one too few candidates.</p>
          {!o ? (
            <TileSkeletons count={1} />
          ) : o.by_role_city.length === 0 ? (
            <Card className="p-6 text-center text-sm text-text-secondary">No open vacancies yet.</Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-line text-xs text-text-secondary">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">City</th>
                    <th className="px-4 py-2.5 text-right font-medium">Open jobs</th>
                    <th className="px-4 py-2.5 text-right font-medium">Applications</th>
                    <th className="px-4 py-2.5 text-right font-medium">Per job</th>
                  </tr>
                </thead>
                <tbody>
                  {o.by_role_city.map((r) => (
                    <tr key={`${r.role}-${r.city}`} className="border-t border-line">
                      <td className="px-4 py-2.5 font-medium text-text-primary">{r.role}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{r.city}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.vacancies}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.applications}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.applications_per_vacancy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}

function AttentionCard({
  href,
  value,
  total,
  title,
  note,
  loading,
}: {
  href: string;
  value: number;
  total?: number;
  title: string;
  note: string;
  loading?: boolean;
}) {
  return (
    <Link href={href} className="lift group block rounded-lg border border-line bg-surface p-4 focus-ring">
      <div className="flex items-start justify-between gap-2">
        <p className="text-3xl font-bold tracking-tight text-heading tabular-nums">{loading ? '…' : value}</p>
        <ArrowRight size={18} aria-hidden className="mt-1.5 text-accent-text transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 font-medium text-text-primary">{title}</p>
      <p className="mt-0.5 text-xs text-text-secondary">
        {note}
        {typeof total === 'number' ? ` · ${total} registered` : ''}
      </p>
    </Link>
  );
}
