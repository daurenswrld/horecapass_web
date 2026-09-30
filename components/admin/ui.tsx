'use client';

import * as React from 'react';
import { CountUp, riseStyle, Skeleton } from '@/components/ui/motion';
import { Card } from '@/components/ui/primitives';
import type { FunnelStep } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

/** Общие кирпичики админ-панели: плитки, воронка, переключатели, загрузка. */

/* --- загрузка данных ------------------------------------------------------ */

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Запрос с состояниями. Старые данные не пропадают, пока идёт перезапрос
 * (смена периода не должна мигать пустотой), а гонку двух запросов выигрывает
 * последний.
 */
export function useLoad<T>(fn: () => Promise<T>, deps: React.DependencyList): Loaded<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        const status = (e as { status?: number })?.status;
        setError(status === 403 ? 'Your access level does not include this section.' : 'Could not load the data. Try again.');
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, error, loading, reload: () => setTick((t) => t + 1) };
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-danger-surface px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full border border-danger px-3 py-1 font-medium hover:bg-surface focus-ring">
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-medium text-text-primary">{title}</p>
      {hint && <p className="mt-1 text-sm text-text-secondary">{hint}</p>}
    </Card>
  );
}

export function TileSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-28 !rounded-lg" />
      ))}
    </div>
  );
}

/* --- плитка показателя ------------------------------------------------------ */

export function StatTile({
  label,
  value,
  suffix,
  hint,
  index = 0,
  unavailable,
  Icon,
}: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  hint?: string;
  index?: number;
  unavailable?: boolean;
  Icon?: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
}) {
  const missing = unavailable || value === null || value === undefined;
  return (
    <div className="rise rounded-lg border border-line bg-surface p-4" style={riseStyle(index)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-text-secondary">{label}</span>
        {Icon && (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-muted text-accent-text">
            <Icon size={16} aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-heading">
        {missing ? (
          <span className="text-2xl font-semibold text-text-tertiary">—</span>
        ) : (
          <CountUp value={value as number} suffix={suffix} />
        )}
      </p>
      <p className="mt-1 min-h-4 text-xs text-text-secondary">{missing && unavailable ? 'Not tracked yet' : hint}</p>
    </div>
  );
}

/* --- воронка ------------------------------------------------------------------ */

/**
 * Горизонтальная воронка: один оттенок, столбик растёт от базовой линии,
 * число у конца, конверсия от предыдущего шага справа. Шаг, который сервер ещё
 * не считает, рисуется пунктиром и подписан, а не нулём. Под графиком — та же
 * таблица, для чтения без цвета и с клавиатуры.
 */
export function Funnel({ title, steps, unit = 'people' }: { title: string; steps: FunnelStep[]; unit?: string }) {
  const top = Math.max(1, ...steps.map((s) => s.count ?? 0));
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      <ol className="mt-4 space-y-2.5">
        {steps.map((s, i) => {
          const width = s.count ? Math.max(2, (s.count / top) * 100) : 0;
          return (
            <li
              key={s.key}
              className="rise grid grid-cols-[minmax(7rem,11rem)_1fr_auto] items-center gap-3"
              style={riseStyle(i)}
              title={s.available ? `${s.label}: ${s.count} ${unit}${s.conversion !== null ? ` (${s.conversion}% of the previous step)` : ''}` : `${s.label}: not tracked yet`}
            >
              <span className="text-sm text-text-primary">{s.label}</span>
              {s.available ? (
                <span className="flex items-center gap-2">
                  <span
                    className="bar-grow block h-5 rounded-r-[4px] bg-accent"
                    style={{ width: `${width}%`, minWidth: 4 }}
                    role="presentation"
                  />
                  <span className="text-sm font-semibold tabular-nums text-heading">{s.count}</span>
                </span>
              ) : (
                <span className="flex h-5 items-center rounded-r-[4px] border border-dashed border-line-strong px-2 text-xs text-text-secondary">
                  Not tracked yet
                </span>
              )}
              <span className="w-16 text-right text-xs tabular-nums text-text-secondary">
                {s.available && s.conversion !== null ? `${s.conversion}%` : ''}
              </span>
            </li>
          );
        })}
      </ol>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-text-secondary hover:text-text-primary focus-ring">Table view</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-text-secondary">
            <tr>
              <th className="py-1 font-medium">Step</th>
              <th className="py-1 text-right font-medium">Count</th>
              <th className="py-1 text-right font-medium">From previous</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.key} className="border-t border-line">
                <td className="py-1.5">{s.label}</td>
                <td className="py-1.5 text-right tabular-nums">{s.available ? s.count : 'not tracked'}</td>
                <td className="py-1.5 text-right tabular-nums">{s.conversion !== null ? `${s.conversion}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}

/* --- переключатель периода ------------------------------------------------------ */

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-ring',
            o.value === value ? 'bg-accent-strong text-on-accent dark:bg-accent' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* --- время ------------------------------------------------------------------------ */

export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '—';
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Подпись-чип статуса: цвет помогает, но смысл всегда есть и в тексте. */
export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info'; children: React.ReactNode }) {
  const tones = {
    neutral: 'bg-surface-muted text-text-secondary',
    good: 'bg-[rgb(var(--success)/0.15)] text-success',
    warn: 'bg-[rgb(var(--warning)/0.16)] text-warning',
    bad: 'bg-danger-surface text-danger',
    info: 'bg-info-surface text-on-info-surface',
  } as const;
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}

/** Шапка раздела. На телефоне ниже полосы разделов, на десктопе — у края. */
export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="sticky top-[49px] z-10 border-b border-line bg-background/90 px-5 py-4 backdrop-blur md:top-0 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}

/**
 * Диалог: закрывается по Esc и по клику на фон, фокус уходит внутрь и
 * возвращается на кнопку, которая его открыла.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // onClose держим в ref: родитель передаёт новую функцию на каждом рендере, и
  // эффект с ней в зависимостях перебрасывал бы фокус на первое поле при
  // каждом нажатии клавиши.
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('textarea, input, select, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="fade-in absolute inset-0 bg-black/40" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pop-in relative w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-lift"
      >
        <h2 id={titleId} className="text-lg font-semibold text-heading">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
