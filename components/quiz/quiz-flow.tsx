'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Wordmark } from '@/components/brand';
import { Bubble } from '@/components/landing/bubble';
import { Button } from '@/components/ui/primitives';
import { homeFor, useAuth } from '@/lib/auth/context';
import { QUESTION_HINT, QUIZ, type QuizOption, type QuizRole } from '@/lib/quiz/content';
import { loadProgress, saveProgress, sendProgress, type QuizProgress } from '@/lib/quiz/session';
import { cn } from '@/lib/utils';

/**
 * Приветственный квиз до регистрации (макет «Welcome page+quiz»).
 *
 * Экраны двух видов: «мостик» — реплика рекрутера в облачке — и вопрос с
 * вариантами. Ответы уходят на сервер после каждого вопроса, прогресс живёт в
 * sessionStorage, так что перезагрузка не сбрасывает место. Квиз ничего не
 * блокирует: пропустить можно вопрос и весь квиз, регистрация доступна всегда.
 */

const PRIMARY =
  'inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent-strong px-7 text-base font-semibold text-on-accent transition-[filter,transform] hover:brightness-95 active:scale-[0.98] focus-ring sm:w-auto';

function OptionRow({ option, multi, selected, onPick }: { option: QuizOption; multi: boolean; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onPick}
      className={cn(
        'flex min-h-14 w-full items-center gap-3.5 rounded-lg border-[1.5px] px-4 py-3 text-left text-[15px] leading-snug transition-[background-color,border-color,transform] duration-150 active:scale-[0.99] focus-ring',
        selected ? 'border-accent-strong bg-accent-muted text-heading' : 'border-line bg-surface text-text-primary hover:border-accent',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center border-[1.5px] transition-colors',
          multi ? 'rounded-[6px]' : 'rounded-full',
          selected ? 'border-accent-strong bg-accent-strong text-on-accent' : 'border-line-strong bg-surface',
        )}
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0">{option.label}</span>
    </button>
  );
}

export function QuizFlow({ role }: { role: QuizRole }) {
  const router = useRouter();
  const { user } = useAuth();
  const quiz = QUIZ[role];
  const finishIndex = quiz.steps.length;
  const [progress, setProgress] = React.useState<QuizProgress | null>(null);
  const stepRef = React.useRef<HTMLDivElement>(null);
  const moved = React.useRef(false);

  React.useEffect(() => setProgress(loadProgress(role)), [role]);
  React.useEffect(() => {
    if (user) router.replace(homeFor(user));
  }, [user, router]);
  // После перехода на новый экран фокус на него: читалка озвучит вопрос, клавиатура не потеряется.
  React.useEffect(() => {
    if (progress && moved.current) stepRef.current?.focus();
  }, [progress?.index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!progress) return <div className="min-h-[100dvh] bg-gradient-to-b from-peach-from to-peach-to" aria-busy />;

  const { index, answers } = progress;
  const step = index < finishIndex ? quiz.steps[index] : null;
  const registerHref = `/register?role=${role}`;

  const commit = (next: QuizProgress, send: boolean) => {
    moved.current = true;
    setProgress(next);
    saveProgress(next);
    if (send) sendProgress(next);
  };
  const forward = (nextAnswers: QuizProgress['answers'], send: boolean) => {
    const to = index + 1;
    commit({ ...progress, answers: nextAnswers, index: to, finished: to === finishIndex }, send || to === finishIndex);
  };
  const pick = (questionId: string, optionId: string, multi: boolean) => {
    const current = answers[questionId] ?? [];
    const next = multi ? (current.includes(optionId) ? current.filter((x) => x !== optionId) : [...current, optionId]) : [optionId];
    setProgress({ ...progress, answers: { ...answers, [questionId]: next } });
  };
  const skip = () => {
    if (step?.kind !== 'question') return;
    const { [step.id]: _dropped, ...rest } = answers;
    void _dropped;
    forward(rest, false);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-peach-from to-peach-to">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 pt-6">
        <Link href="/" className="rounded focus-ring" aria-label="HorecaPass home">
          <Wordmark />
        </Link>
        <Link href={registerHref} className="rounded text-sm font-medium text-text-secondary underline-offset-4 hover:underline focus-ring">
          Skip the quiz
        </Link>
      </header>

      <div
        className="mx-auto mt-5 h-1.5 w-full max-w-xl px-6"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={finishIndex}
        aria-valuenow={index}
      >
        <div className="h-full overflow-hidden rounded-full bg-surface/70">
          <div className="h-full rounded-full bg-accent-strong transition-[width] duration-500 ease-out" style={{ width: `${(Math.max(index, 0) / finishIndex) * 100}%` }} />
        </div>
      </div>

      <div ref={stepRef} tabIndex={-1} className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-8 pt-8 outline-none">
        {step?.kind === 'question' ? (
          <section key={step.id} className="flex flex-1 flex-col" aria-labelledby="quiz-q">
            <h1 id="quiz-q" className="text-[1.65rem] font-bold leading-tight tracking-tight text-heading sm:text-3xl">
              {step.title}
            </h1>
            {step.multi && <p className="mt-2 text-sm text-text-secondary">{QUESTION_HINT}</p>}
            <div
              role={step.multi ? 'group' : 'radiogroup'}
              aria-labelledby="quiz-q"
              className="mt-6 grid gap-3"
            >
              {step.options.map((o) => (
                <OptionRow
                  key={o.id}
                  option={o}
                  multi={!!step.multi}
                  selected={(answers[step.id] ?? []).includes(o.id)}
                  onPick={() => pick(step.id, o.id, !!step.multi)}
                />
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row-reverse sm:items-center sm:justify-between">
              <Button size="lg" className="w-full rounded-full sm:w-auto sm:px-10" disabled={(answers[step.id] ?? []).length === 0} onClick={() => forward(answers, true)}>
                Continue
                <ArrowRight size={18} aria-hidden />
              </Button>
              <div className="flex items-center justify-between gap-4 sm:justify-start">
                {index > 0 && (
                  <button type="button" onClick={() => commit({ ...progress, index: index - 1 }, false)} className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-text-secondary hover:text-text-primary focus-ring">
                    <ArrowLeft size={16} aria-hidden />
                    Back
                  </button>
                )}
                <button type="button" onClick={skip} className="rounded text-sm text-text-secondary underline-offset-4 hover:underline focus-ring">
                  Skip this one
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section key={`bridge-${index}`} className="flex flex-1 flex-col items-center justify-center text-center" aria-label="HorecaPass recruiter">
            <h1 className="sr-only">{role === 'applicant' ? 'A few quick questions about your job search' : 'A few quick questions about your hiring'}</h1>
            <Image src="/landing/recruiter-woman-avatar.svg" alt="" width={160} height={160} unoptimized className="h-36 w-36 rounded-full shadow-card sm:h-40 sm:w-40" />
            <Bubble className="mt-10 w-full text-left">
              {step ? step.text : quiz.finish}
            </Bubble>
            <div className="mt-10 flex w-full flex-col items-center gap-4">
              {step ? (
                <button type="button" className={PRIMARY} onClick={() => forward(answers, false)}>
                  Continue
                  <ArrowRight size={18} aria-hidden />
                </button>
              ) : (
                <>
                  <Link href={registerHref} className={PRIMARY}>
                    {quiz.cta}
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                  <Link href="/login" className="rounded text-sm text-text-secondary underline-offset-4 hover:underline focus-ring">
                    I already have an account
                  </Link>
                </>
              )}
              {index > 0 && (
                <button type="button" onClick={() => commit({ ...progress, index: index - 1, finished: false }, false)} className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-text-secondary hover:text-text-primary focus-ring">
                  <ArrowLeft size={16} aria-hidden />
                  Back
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
