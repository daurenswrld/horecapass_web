"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Assistant — «маленький человечек, такой подсказочный, который выходит
 * и говорит: вот тут у тебя нужна, если ты вот это добавишь, будет лучше».
 *
 * Это не чат-бот и не всплывающая реклама. Правила поведения:
 *  • появляется только когда есть что сказать по делу (см. nudge() в engine);
 *  • одна мысль за раз, закрывается и не возвращается с тем же текстом;
 *  • не перекрывает поле ответа — на телефоне он над полем, а не поверх него.
 */

export function AssistantMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Собственная фигура, а не иконка из набора: у ассистента должно быть лицо,
  // которое кандидат запомнит. Токены — те же, что у остального интерфейса.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle cx="24" cy="24" r="24" className="fill-accent-muted" />
      {/* колпак — отсылка к поварскому, но геометричная */}
      <path
        d="M14 20c0-4.4 3.6-8 8-8h4c4.4 0 8 3.6 8 8v2H14v-2Z"
        className="fill-accent"
      />
      <rect
        x="14"
        y="21"
        width="20"
        height="4"
        rx="1.6"
        className="fill-accent"
      />
      {/* лицо */}
      <rect
        x="16"
        y="26"
        width="16"
        height="13"
        rx="5"
        className="fill-surface"
      />
      <circle cx="21" cy="31" r="1.7" className="fill-text-primary" />
      <circle cx="27" cy="31" r="1.7" className="fill-text-primary" />
      <path
        d="M20.5 34.6c1.2 1.2 5.8 1.2 7 0"
        stroke="currentColor"
        className="text-text-secondary"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Props {
  message: string | null;
  /** Действие, которое ассистент предлагает вместе с подсказкой. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function AssistantNudge({ message, action, className }: Props) {
  const [dismissed, setDismissed] = React.useState<string | null>(null);

  // Новый текст — снова показываем. Закрытая подсказка не возвращается,
  // пока ассистенту нечего добавить сверх уже сказанного.
  const visible = message !== null && message !== dismissed;
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-line-strong bg-surface-muted p-3 animate-fade-up",
        "dark:bg-surface-muted",
        className,
      )}
      role="status"
    >
      <AssistantMark size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-text-primary">{message}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1.5 text-sm font-medium text-accent-text underline-offset-4 hover:underline focus-ring"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(message)}
        aria-label="Dismiss hint"
        className="-m-1 shrink-0 rounded p-1 text-text-secondary transition-colors hover:text-text-primary focus-ring"
      >
        <X size={16} />
      </button>
    </div>
  );
}
