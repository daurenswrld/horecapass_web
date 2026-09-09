import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Примитивы. Повторяют вид мобильного приложения: скруглённые кнопки на
 * фирменном коричневом, карточки на белой поверхности, тонкая тёплая линия.
 *
 * Ни один цвет не задан числом — только токены из globals.css, которые
 * скопированы из app_colors.dart мобилки.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Основная кнопка мобилки: accent + onAccent. Отключённая — accentMuted.
  primary:
    'bg-accent-strong text-on-accent hover:brightness-95 active:brightness-90 disabled:bg-accent-muted disabled:text-on-accent-muted',
  secondary: 'bg-surface text-text-primary border border-line hover:bg-surface-muted hover:border-line-strong',
  ghost: 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
  danger: 'bg-danger text-white hover:brightness-95',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-13 px-6 text-base gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', full, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-colors focus-ring',
        'disabled:pointer-events-none',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        full && 'w-full',
        className,
      )}
      {...props}
    />
  );
});

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface', className)} {...props} />;
}

export function Chip({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, className, id, ...props },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'h-12 w-full rounded border bg-surface px-4 text-text-primary transition-colors',
          'placeholder:text-text-tertiary focus-ring',
          error ? 'border-danger' : 'border-line-strong',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-accent',
        className,
      )}
    />
  );
}

/** Плашка «этого ещё нет на сервере» — для функций мобилки, под которые
 *  на бэкенде нет эндпоинта. Показывать честно, а не имитировать. */
export function PendingNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-sm border border-dashed border-line-strong bg-surface-muted px-3 py-2 text-xs leading-relaxed text-text-secondary',
        className,
      )}
    >
      <span aria-hidden className="mt-px">
        ⚑
      </span>
      <span>{children}</span>
    </p>
  );
}

export interface ChoiceChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Вариант ответа в анкете. Выбранный держится на цвете, а не на галочке —
 *  на телефоне галочка теряется. */
export function ChoiceChip({ className, selected, ...props }: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm transition-colors focus-ring",
        selected
          ? "border-accent bg-accent-strong text-on-accent"
          : "border-line bg-surface text-text-primary hover:border-accent hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-alt", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Profile completeness"
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
