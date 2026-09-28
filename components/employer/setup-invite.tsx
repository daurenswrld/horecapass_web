'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { VacancyCard } from '@/components/employer/cards';
import { employerDraft, type EmployerDraft } from '@/lib/demo/employer';
import { canSyncToServer } from '@/lib/demo/employer-sync';

/**
 * Приглашение пройти онбординг работодателя — на экране Jobs.
 *
 * В приложении онбординг идёт сразу после регистрации. На вебе он пока
 * демо, поэтому регистрацию в него не заворачиваем: работодатель, которому
 * нужно просто опубликовать вакансию, должен иметь такую возможность.
 *
 * Когда мастер пройден, вакансия ещё не опубликована (оплаты нет) — она
 * показывается в «Drafts», как в списке Active / Drafts / Archived из брифа.
 */
export function SetupInvite() {
  const [draft, setDraft] = React.useState<EmployerDraft | null>(null);
  const [status, setStatus] = React.useState<'none' | 'started' | 'done' | null>(null);
  React.useEffect(() => {
    setStatus(employerDraft.status());
    setDraft(employerDraft.load());
  }, []);

  if (status === null || !draft) return null;

  // При настоящем входе черновик уже лежит на сервере и виден в «Drafts»
  // списка выше — локальную копию не дублируем.
  if (status === 'done' && canSyncToServer() && draft.serverVacancyId) return null;

  if (status === 'done') {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">Drafts</h2>
        <Link href="/company/onboarding" className="block max-w-md rounded-lg focus-ring">
          <VacancyCard company={draft.company} vacancy={draft.vacancy} className="transition-shadow hover:shadow-lift" />
        </Link>
        <p className="mt-2 text-sm text-text-secondary">
          Ready, not published yet: the payment step is still to come. Preview only — kept in this browser.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border-[1.5px] border-accent-strong bg-gradient-to-r from-peach-from to-peach-to p-5 sm:flex-row sm:items-center dark:border-accent">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
        <Sparkles size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-heading">
          {status === 'started' ? 'Finish setting up your company' : 'Set up your company and first vacancy'}
        </p>
        <p className="mt-0.5 text-sm text-text-secondary">
          A company profile that sells the job, and a vacancy drafted from a short conversation. About 5 minutes.
        </p>
      </div>
      <Link
        href="/company/onboarding"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:brightness-110 focus-ring dark:bg-accent"
      >
        {status === 'started' ? 'Continue setup' : 'Start'}
        <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  );
}
