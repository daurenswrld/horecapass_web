'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronRight, Plus } from 'lucide-react';
import { CountUp } from '@/components/ui/motion';
import { Card } from '@/components/ui/primitives';
import { useAuth } from '@/lib/auth/context';
import { profileProgress, qualificationStatus } from '@/lib/demo/candidate';
import { cvConsent } from '@/lib/demo/storage';
import { cn } from '@/lib/utils';
import { useCandidate } from '@/lib/candidate/context';

/** Прогресс профиля — один компонент для ленты вакансий и профиля (бриф, пункты 9 и 12). */
export function ProfileProgress({ className }: { className?: string }) {
  const { user } = useAuth();
  const { draft } = useCandidate();
  const state = draft ? profileProgress(draft, !!cvConsent.load(user?.id).signedAt) : null;
  if (!state) return null;

  return (
    <div className={cn('rounded-lg border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-heading">
          Profile <CountUp value={state.pct} suffix="%" /> ready
        </span>
        {state.next && (
          <Link href={hrefFor(state.next.key)} className="inline-flex items-center gap-1 font-semibold text-accent-text underline-offset-4 hover:underline focus-ring">
            {state.next.action}
            <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-alt" role="progressbar" aria-valuenow={state.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile readiness">
        <div className="h-full rounded-full bg-accent-strong transition-[width] duration-500 dark:bg-accent" style={{ width: `${state.pct}%` }} />
      </div>
    </div>
  );
}

function hrefFor(key: string): string {
  const step: Record<string, string> = {
    based: 'based',
    cv: 'materials',
    certificates: 'materials',
    portfolio: 'materials',
    countries: 'countries',
    consent: 'consent',
    qualification: 'qualification',
    video: 'video',
  };
  return step[key] ? `/onboarding?step=${step[key]}` : '/profile#references';
}

/**
 * Шапка страницы профиля — бриф кандидата, пункт 12: «сейчас это скорее
 * настройки аккаунта, чем мой профиль». Сверху карточка личности (имя, а не
 * email; роль, национальность, город, Verified), прогресс, затем «My Profile»
 * — все материалы кандидата одним кликабельным списком.
 */
export function ProfileOverview() {
  const { user } = useAuth();
  const { draft: d, update, error, reload } = useCandidate();
  const [signed, setSigned] = React.useState(false);
  const [refDraft, setRefDraft] = React.useState('');
  React.useEffect(() => {
    setSigned(!!cvConsent.load(user?.id).signedAt);
  }, [user?.id]);
  if (!d) return null;

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your name';
  // Verified ставит сервер после проверки — в браузере его не выдаём.
  const verified = false;
  const qual = qualificationStatus(d);

  const rows: { label: string; status: string; add?: boolean; href: string }[] = [
    {
      label: 'Qualification',
      status: qual === 'pending' ? 'Waiting for questions' : qual === 'not-needed' ? 'Not needed for kitchen roles' : 'Add',
      add: qual === 'not-started',
      href: '/onboarding?step=qualification',
    },
    { label: 'Video Intro', status: d.video === 'added' ? 'Added' : 'Add', add: d.video !== 'added', href: '/onboarding?step=video' },
    { label: 'Resume / CV', status: d.cvFile ?? 'Built below', href: '#cv' },
    {
      label: 'Cover Letter',
      status: d.coverLetterFile ?? (d.coverLetterText ? 'Written' : 'Add'),
      add: !d.coverLetterFile && !d.coverLetterText,
      href: '/onboarding?step=materials',
    },
    {
      label: 'Certificates',
      status: d.certificates.length ? d.certificates.map((c) => c.type).join(' · ') : 'Add',
      add: !d.certificates.length,
      href: '/onboarding?step=materials',
    },
    { label: 'Portfolio', status: d.portfolio.length ? `${d.portfolio.length} files` : 'Add', add: !d.portfolio.length, href: '/onboarding?step=materials' },
    { label: 'Consent', status: signed ? 'Signed' : 'Sign', add: !signed, href: '/onboarding?step=consent' },
  ];

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-danger">{error} <button onClick={() => void reload()} className="underline">Reload account copy</button></p>}
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-accent-muted text-2xl font-bold text-accent-text">
          {name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-heading">
            {name}
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-info-surface px-2.5 py-0.5 text-sm font-semibold text-on-info-surface">
                <BadgeCheck size={15} aria-hidden />
                Verified
              </span>
            )}
          </h2>
          <p className="mt-1 text-text-secondary">
            {[d.role, d.nationality, d.location].filter(Boolean).join(' · ') || (
              <Link href="/onboarding" className="font-semibold text-accent-text underline-offset-4 hover:underline">
                Set up your profile
              </Link>
            )}
          </p>
        </div>
      </Card>

      <ProfileProgress />

      <Card className="divide-y divide-line">
        <h3 className="px-5 py-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">My Profile</h3>
        {rows.map((r) => (
          <Link key={r.label} href={r.href} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted focus-ring">
            <span className="flex-1 font-medium text-text-primary">{r.label}</span>
            <span className={cn('max-w-[50%] truncate text-sm', r.add ? 'inline-flex items-center gap-1 font-semibold text-accent-text' : 'text-text-secondary')}>
              {r.add && <Plus size={14} aria-hidden />}
              {r.status}
            </span>
            <ChevronRight size={16} aria-hidden className="text-text-tertiary" />
          </Link>
        ))}

        {/* References — новый раздел профиля: контакт или письмо с прошлого места работы. */}
        <div id="references" className="scroll-mt-24 px-5 py-3.5">
          <p className="font-medium text-text-primary">References</p>
          {d.references.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
              {d.references.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = refDraft.trim();
              if (!t) return;
              const next = { ...d, references: [...d.references, t] };
              update(() => next);
              setRefDraft('');
            }}
          >
            <input
              value={refDraft}
              onChange={(e) => setRefDraft(e.target.value)}
              placeholder="e.g. Maria Lopez, F&B Manager at Rixos — +971 50 …"
              aria-label="Add a reference"
              className="h-10 flex-1 rounded border border-line-strong bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
            />
            <button type="submit" disabled={!refDraft.trim()} className="rounded-full border border-line-strong px-4 text-sm font-semibold text-text-primary hover:border-accent focus-ring disabled:opacity-40">
              Add
            </button>
          </form>
        </div>

        <div className="px-5 py-3.5 text-sm text-text-secondary">
          Account: {user?.email ?? '—'}
        </div>
      </Card>
    </div>
  );
}

/** Приглашение в онбординг — на ленте вакансий, пока профиль не собран. */
export function CandidateSetupInvite() {
  const { draft, status } = useCandidate();
  const show = draft && status !== 'completed';
  if (!show) return null;
  return (
    <Link
      href="/onboarding"
      className="flex items-center gap-4 rounded-lg border-[1.5px] border-accent-strong bg-gradient-to-r from-peach-from to-peach-to p-4 transition-shadow hover:shadow-card focus-ring dark:border-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-heading">{status === 'deferred' ? 'Continue your saved profile' : 'Set up your profile so employers can find you'}</span>
        <span className="block text-sm text-text-secondary">Your CV, where you are, where you want to work — continue at your own pace.</span>
      </span>
      <ArrowRight size={18} aria-hidden className="shrink-0 text-accent-text" />
    </Link>
  );
}
