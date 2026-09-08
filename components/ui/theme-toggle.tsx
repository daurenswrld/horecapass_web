"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Переключатель темы. Тёмная тема — пункт 1.7.1 договора.
 *
 * Три состояния, а не два: «как в системе» должно оставаться выбором, иначе
 * пользователь, у которого телефон сам переключается вечером, не сможет это
 * вернуть. Выбор пишется в localStorage и применяется до первого кадра
 * скриптом из layout — без него страница моргает светлым.
 */

export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "hp_theme";

/** Тот же ключ и та же логика, что в inline-скрипте layout. Расходиться им нельзя. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* приватный режим — тема просто не переживёт перезагрузку */
  }
}

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Светлая", Icon: Sun },
  { value: "system", label: "Как в системе", Icon: Monitor },
  { value: "dark", label: "Тёмная", Icon: Moon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("system");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === "light" || saved === "dark" || saved === "system")
      setTheme(saved);
  }, []);

  const pick = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Тема оформления"
      className={cn(
        "inline-flex rounded-full border border-line bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => pick(value)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-ring",
            theme === value
              ? "bg-primary-600 text-on-primary"
              : "text-fg-subtle hover:text-fg",
          )}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
