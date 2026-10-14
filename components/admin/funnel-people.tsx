'use client';

import * as React from 'react';
import { Mail, MessageCircle, X } from 'lucide-react';
import { ExportMenu } from '@/components/admin/export-menu';
import { Empty, ErrorNote, Segmented, shortDate, timeAgo, useLoad } from '@/components/admin/ui';
import { Skeleton } from '@/components/ui/motion';
import { adminApi, type FunnelPerson } from '@/lib/api/admin';

/**
 * Люди за цифрой воронки (заказчица, видео 14.10): «нажать и увидеть весь
 * список… кто вышел… почту, номер, WhatsApp, чтобы менеджер написал: что
 * случилось, почему не закончил». «Stopped here» — дошли до шага, но не до
 * следующего: это те, кого возвращают.
 */
export function FunnelPeoplePanel({
  kind,
  step,
  label,
  days,
  onClose,
}: {
  kind: 'candidates' | 'employers';
  step: string;
  label: string;
  days: number;
  onClose: () => void;
}) {
  const [dropped, setDropped] = React.useState(true);
  const list = useLoad(() => adminApi.funnelPeople(kind, step, days, dropped), [kind, step, days, dropped]);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const data = list.data;

  React.useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const who = kind === 'candidates' ? 'Candidates' : 'Employers';
  const report = () => ({
    name: `${kind}-${step}-${dropped ? 'stopped' : 'reached'}-${days}d`,
    title: `${who}: ${label}${data?.dropped ? ` — stopped before “${data.next_step}”` : ''}`,
    subtitle: `Registered in the last ${days} days`,
    columns: [
      { label: 'Name', value: (p: FunnelPerson) => p.name },
      { label: 'Email', value: (p: FunnelPerson) => p.email },
      { label: 'Phone', value: (p: FunnelPerson) => p.phone },
      ...(kind === 'employers' ? [{ label: 'Company', value: (p: FunnelPerson) => p.company }] : []),
      { label: 'Nationality', value: (p: FunnelPerson) => p.nationality },
      { label: 'Location', value: (p: FunnelPerson) => p.location },
      { label: 'Registered', value: (p: FunnelPerson) => shortDate(p.registered_at) },
      { label: 'Last activity', value: (p: FunnelPerson) => shortDate(p.last_activity) },
    ],
    rows: data?.people ?? [],
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="fade-in absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="funnel-people-title"
        className="slide-in-right relative flex h-dvh w-full flex-col bg-surface shadow-card sm:w-[44rem]"
      >
        <header className="flex items-start gap-3 border-b border-line px-6 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{who} · last {days} days</p>
            <h2 id="funnel-people-title" className="mt-1 text-xl font-bold text-heading">
              {label}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Segmented
                label="Who to show"
                value={dropped ? 'stopped' : 'reached'}
                onChange={(v) => setDropped(v === 'stopped')}
                options={[
                  { value: 'stopped', label: 'Stopped here' },
                  { value: 'reached', label: 'Everyone who reached it' },
                ]}
              />
              <ExportMenu report={report} disabled={!data?.people.length} />
            </div>
            {data && (
              <p className="mt-2 text-sm text-text-secondary">
                {data.dropped
                  ? `${data.count} reached this step but not “${data.next_step}”. Write to them and bring them back.`
                  : `${data.count} reached this step.`}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close list"
            className="-mr-2 rounded-full p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
          >
            <X size={20} />
          </button>
        </header>

        <div className="scroll-slim flex-1 overflow-y-auto px-6 py-4">
          {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
          {!data && !list.error && <Skeleton className="h-64 !rounded-lg" />}
          {data && data.people.length === 0 && <Empty title="Nobody here" hint="No one matches this step in the period." />}
          {data && data.people.length > 0 && (
            <ul className="divide-y divide-line">
              {data.people.map((p) => (
                <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{p.name}</p>
                    {[p.company, p.nationality, p.location].some(Boolean) && (
                      <p className="text-sm text-text-secondary">
                        {[p.company, p.nationality, p.location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      Registered {shortDate(p.registered_at)} · active {timeAgo(p.last_activity)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <a
                      href={`mailto:${p.email}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-text-primary hover:bg-surface-muted focus-ring"
                      title={p.email}
                    >
                      <Mail size={14} aria-hidden />
                      Email
                    </a>
                    {p.whatsapp && (
                      <a
                        href={p.whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-text-primary hover:bg-surface-muted focus-ring"
                        title={p.phone ?? ''}
                      >
                        <MessageCircle size={14} aria-hidden />
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <p className="basis-full text-xs text-text-secondary">
                    {p.email}
                    {p.phone ? ` · ${p.phone}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
