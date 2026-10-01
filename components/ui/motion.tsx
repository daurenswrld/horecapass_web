'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Небольшие клиентские помощники для движения. Сами анимации лежат в
 * globals.css; здесь только то, что нельзя сделать одним CSS.
 */

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Блок появляется, когда его прокрутили в поле зрения.
 *
 * Серверная разметка отдаёт его видимым: если JavaScript не загрузился, текст
 * не пропадёт. Прячем только после монтирования и только то, что ниже первого
 * экрана, — поэтому вспышки на верхнем экране нет.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Задержка в мс — для ступенчатого появления соседних блоков. */
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<'idle' | 'armed' | 'in'>('idle');

  React.useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setState('armed');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('in');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(state === 'armed' && 'reveal-armed', state === 'in' && 'reveal-in', className)}
      style={delay ? ({ '--d': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/** Номер элемента списка для ступенчатого подъёма (класс .rise). */
export function riseStyle(index: number): React.CSSProperties {
  return { '--i': index } as React.CSSProperties;
}

/**
 * Число, которое набегает от нуля до значения. Для процентов заполненности
 * и счётчиков. Без движения просто показывает итог.
 */
export function CountUp({
  value,
  duration = 900,
  suffix = '',
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [shown, setShown] = React.useState(value);

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const from = 0;
    const tick = (t: number) => {
      if (start === null) start = t;
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className} aria-label={`${value}${suffix}`}>
      <span aria-hidden>
        {shown}
        {suffix}
      </span>
    </span>
  );
}

/** Серая заглушка с переливом на время загрузки. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

/** Заглушка списка карточек: на время загрузки держит форму страницы. */
export function ListSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rise rounded-lg border border-line bg-surface p-4"
          style={riseStyle(i)}
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 !rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Значок успеха для финальных экранов: круг, рисующаяся галочка, кольцо и искры. */
export function SuccessMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('relative mx-auto grid h-16 w-16 place-items-center', className)}
    >
      <span className="success-halo" />
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className="spark" style={{ '--a': `${i * 45}deg` } as React.CSSProperties} />
      ))}
      <span className="success-pop relative grid h-16 w-16 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="draw-check">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
  );
}
