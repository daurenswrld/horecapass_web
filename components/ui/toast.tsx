'use client';

import * as React from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Короткие уведомления после действий: «сохранено», «опубликовано», «этап
 * изменён». Без них человек жмёт кнопку и не понимает, сработало ли.
 *
 * Провайдер стоит в каркасе приложения. Сообщение живёт 3,5 с, под курсором
 * не пропадает, читается экранным диктором (aria-live).
 */

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: Kind;
  text: string;
}

interface Api {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = React.createContext<Api | null>(null);

const ICON = { success: CheckCircle2, error: TriangleAlert, info: Info } as const;
const TONE: Record<Kind, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const seq = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (kind: Kind, text: string) => {
      const id = ++seq.current;
      // Не больше трёх сразу: старые уходят, чтобы не закрывать экран.
      setToasts((list) => [...list.slice(-2), { id, kind, text }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  const api = React.useMemo<Api>(
    () => ({
      success: (t) => push('success', t),
      error: (t) => push('error', t),
      info: (t) => push('info', t),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className="pop-in pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border border-line bg-surface py-2.5 pl-4 pr-2.5 text-sm text-text-primary shadow-lift"
            >
              <Icon size={18} aria-hidden className={cn('shrink-0', TONE[t.kind])} />
              <span className="min-w-0">{t.text}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Вне провайдера возвращает пустые функции, чтобы компонент не падал в тестах. */
export function useToast(): Api {
  return (
    React.useContext(ToastContext) ?? {
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    }
  );
}
