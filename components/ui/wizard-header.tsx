'use client';

import { ChevronLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Шапка пошагового онбординга: полоски сверху и «Step X of Y» рядом.
 * Бриф: полоски — «для тревожных людей, чтобы контролировали процесс»,
 * а неопределённая длина пугает сильнее, чем реальное число шагов.
 */
export type ServerSync = 'idle' | 'saving' | 'saved' | { error: string; retry: () => void };

export function WizardHeader({
  step,
  total,
  title,
  saved,
  onBack,
  onRestart,
  server,
}: {
  step: number;
  total: number;
  title: string;
  saved: boolean;
  onBack?: () => void;
  onRestart: () => void;
  /** Состояние сохранения на сервер — только при настоящем входе. */
  server?: ServerSync;
}) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 md:px-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 rounded-full p-2 text-heading transition-colors hover:bg-surface-muted focus-ring"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <span className="w-5" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-500',
                  i < step ? 'bg-accent-strong dark:bg-accent' : 'bg-surface-alt dark:bg-surface-muted',
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            Step {step} of {total} · {title}
            <span className="ml-2 text-text-secondary">{saved ? '· Saved in this browser' : '· Could not save'}</span>
            {server === 'saving' && <span className="ml-2 text-text-tertiary">· Saving to your account…</span>}
            {server === 'saved' && <span className="ml-2 text-success">· Saved to your account</span>}
            {server && typeof server === 'object' && (
              <span className="ml-2 text-danger">
                · Not saved to your account ({server.error}){' '}
                <button type="button" onClick={server.retry} className="font-semibold underline underline-offset-2 focus-ring">
                  Retry
                </button>
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onRestart}
          aria-label="Start over"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring"
        >
          <RotateCcw size={14} aria-hidden />
          <span className="hidden sm:inline">Start over</span>
        </button>
      </div>
    </header>
  );
}
