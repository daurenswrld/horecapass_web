import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Примитивы дизайн-системы.
 *
 * Ни один цвет здесь не задан числом — только токены из globals.css.
 * Прошлую версию пришлось разбирать вручную именно потому, что цвета жили
 * в компонентах, и «перекрасить платформу» означало обойти весь файл.
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-on-primary hover:bg-primary-700 active:bg-primary-800 shadow-card",
  secondary:
    "bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  // Акцент — только для ИИ-действий и подсказок, иначе перестанет быть акцентом.
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-card",
  danger: "bg-danger text-white hover:opacity-90",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  // Высоты кратны 44px там, где палец: онбординг проходят с телефона.
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded font-medium transition-colors focus-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          BUTTON_VARIANTS[variant],
          BUTTON_SIZES[size],
          className,
        )}
        {...props}
      />
    );
  },
);

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Вариант ответа в диалоге. Выбранный держится на цвете, а не на галочке —
 *  на телефоне галочка теряется. */
export function Chip({ className, selected, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm transition-colors focus-ring",
        selected
          ? "border-primary-600 bg-primary-600 text-on-primary"
          : "border-line bg-surface text-fg hover:border-primary-300 hover:bg-primary-50",
        className,
      )}
      {...props}
    />
  );
}

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-3",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Заполненность профиля"
    >
      <div
        className="h-full rounded-full bg-primary-600 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Плашка «этого ещё нет на сервере». Показывается везде, где работает
 *  заглушка из lib/api/pending.ts — чтобы демо не выдавало себя за продукт. */
export function PendingNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-sm border border-dashed border-accent-300 bg-accent-50 px-3 py-2 text-xs leading-relaxed text-accent-700",
        "dark:bg-transparent",
        className,
      )}
    >
      <span aria-hidden className="mt-px font-semibold">
        ⚑
      </span>
      <span>{children}</span>
    </p>
  );
}
