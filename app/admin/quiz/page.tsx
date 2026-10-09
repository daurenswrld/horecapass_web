'use client';

import * as React from 'react';
import { AdminHeader, Empty, ErrorNote, Segmented, StatTile, TileSkeletons, useLoad } from '@/components/admin/ui';
import { Skeleton } from '@/components/ui/motion';
import { adminApi, type QuizRoleStats } from '@/lib/api/admin';
import { labelOf, questionIds, QUIZ, type QuizRole } from '@/lib/quiz/content';

/**
 * Ответы на приветственный квиз для маркетинга: сколько посетителей начали и
 * дошли до конца, и какие варианты выбирали. Доля считается от ответивших на
 * этот вопрос, а не от всех начавших: пропустивший вопрос не искажает картину.
 * В вопросах с несколькими ответами доли в сумме больше 100%.
 */

const ROLE_TITLE: Record<QuizRole, string> = { applicant: 'Candidates', company: 'Employers' };

function Question({ role, id, stats }: { role: QuizRole; id: string; stats: QuizRoleStats['questions'][string] | undefined }) {
  const multi = QUIZ[role].steps.some((s) => s.kind === 'question' && s.id === id && s.multi);
  const rows = stats?.options ?? [];
  // Те же варианты в порядке макета, даже если их ещё никто не выбрал: нулевой вариант тоже ответ.
  const known = QUIZ[role].steps.flatMap((s) => (s.kind === 'question' && s.id === id ? s.options : []));
  const merged = [
    ...rows.map((r) => ({ id: r.id, count: r.count, share: r.share })),
    ...known.filter((o) => !rows.some((r) => r.id === o.id)).map((o) => ({ id: o.id, count: 0, share: stats?.answered ? 0 : null })),
  ].sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h3 className="font-semibold text-heading">{labelOf(role, id)}</h3>
      <p className="mt-0.5 text-xs text-text-secondary">
        {stats?.answered ?? 0} answered{multi ? ' · several answers allowed' : ''}
      </p>
      <ul className="mt-3 space-y-2.5">
        {merged.map((o) => (
          <li key={o.id}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-text-primary">{labelOf(role, id, o.id)}</span>
              <span className="shrink-0 tabular-nums text-text-secondary">
                {o.count} · {o.share === null ? '—' : `${o.share}%`}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${o.share ?? 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function QuizPage() {
  const [days, setDays] = React.useState(30);
  const quiz = useLoad(() => adminApi.quiz(days), [days]);

  return (
    <>
      <AdminHeader
        title="Welcome quiz"
        subtitle="What visitors answered before signing up, for marketing"
        actions={
          <Segmented
            label="Period"
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
        {quiz.error && <ErrorNote message={quiz.error} onRetry={quiz.reload} />}
        {!quiz.data ? (
          <>
            <TileSkeletons count={3} />
            <Skeleton className="h-72 !rounded-lg" />
          </>
        ) : quiz.data.total === 0 ? (
          <Empty title="No quiz answers in this period" hint="Visitors who press a role button on the landing page go through the quiz first." />
        ) : (
          (['applicant', 'company'] as const).map((role) => {
            const stats = quiz.data!.roles[role];
            return (
              <section key={role} aria-labelledby={`quiz-${role}`}>
                <h2 id={`quiz-${role}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  {ROLE_TITLE[role]}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatTile index={0} label="Started" value={stats.started} />
                  <StatTile index={1} label="Finished" value={stats.completed} />
                  <StatTile index={2} label="Completion" value={stats.completion} suffix="%" hint="of those who started" />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {questionIds(role).map((id) => (
                    <Question key={id} role={role} id={id} stats={stats.questions[id]} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
