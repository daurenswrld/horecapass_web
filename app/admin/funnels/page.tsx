'use client';

import * as React from 'react';
import { AdminHeader, ErrorNote, Funnel, Segmented, StatTile, TileSkeletons, useLoad } from '@/components/admin/ui';
import { Skeleton } from '@/components/ui/motion';
import { adminApi } from '@/lib/api/admin';

/**
 * Воронки кандидата и работодателя. Каждый переход отдельной цифрой, а не
 * общий процент: по общему не видно, где именно течёт (спецификация, п. 2–3).
 */
export default function FunnelsPage() {
  const [days, setDays] = React.useState(30);
  const cand = useLoad(() => adminApi.candidateFunnel(days), [days]);
  const emp = useLoad(() => adminApi.employerFunnel(days), [days]);
  const m = emp.data?.metrics;

  return (
    <>
      <AdminHeader
        title="Funnels"
        subtitle="Of the people who registered in the period, how many reached each step"
        actions={
          <Segmented
            label="Registration period"
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

      <div className="space-y-6 px-5 py-6 md:px-8">
        {cand.error && <ErrorNote message={cand.error} onRetry={cand.reload} />}
        {cand.data ? (
          <Funnel title="Candidate funnel" steps={cand.data.steps} />
        ) : (
          <Skeleton className="h-72 !rounded-lg" />
        )}

        {emp.error && <ErrorNote message={emp.error} onRetry={emp.reload} />}
        {emp.data ? (
          <Funnel title="Employer funnel" steps={emp.data.steps} unit="companies" />
        ) : (
          <Skeleton className="h-56 !rounded-lg" />
        )}

        <section aria-labelledby="speed">
          <h2 id="speed" className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Speed and depth
          </h2>
          <p className="mb-3 text-sm text-text-secondary">
            Platform-wide over vacancies posted in the period; a handful of new companies is too few for a median.
          </p>
          {!m ? (
            <TileSkeletons count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile index={0} label="Hours to first application" value={m.hours_to_first_application} hint="median" />
              <StatTile index={1} label="Hours to first qualified application" value={m.hours_to_first_qualified_application} unavailable />
              <StatTile index={2} label="Applications per vacancy" value={m.avg_applications_per_vacancy} hint="average" />
              <StatTile index={3} label="Days to hire" value={m.days_to_hire} hint={`median, ${m.hires} ${m.hires === 1 ? 'hire' : 'hires'}`} />
              <StatTile
                index={4}
                label="Posted a second vacancy"
                value={m.repeat_posting_rate}
                suffix="%"
                hint="of employers with a first one: the sign the product works"
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
