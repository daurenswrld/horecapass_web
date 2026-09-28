"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useAssistant } from "@/lib/demo/assistant";
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
  // У ассистента должно быть лицо, которое кандидат запомнит. Раньше здесь
  // был нарисованный человечек в поварском колпаке; на созвоне 22.09
  // заказчица: «аватар должен быть не шефом, а менеджером в костюме
  // рекрутёра». Это рекрутёр из утверждённого макета.
  // Мужчина или женщина — по выбору в Settings (созвон 22.09).
  const { avatar } = useAssistant();
  return (
    // Обычный img: крошечный локальный файл, next/image здесь ничего не даёт.
    <img
      src={avatar}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full bg-accent-muted object-cover", className)}
      style={{ width: size, height: size }}
    />
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
