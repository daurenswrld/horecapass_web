'use client';

import { useIsDemo } from '@/lib/demo/session';
import { cn } from '@/lib/utils';

/**
 * Плашка «это показ замысла, а не рабочая функция».
 *
 * Ставится на каждом разделе, который работает без бэкенда. Заказчица уже
 * получала демо, выглядевшее рабочим, и отдельно на это указала — поэтому
 * здесь прямо написано, что данные никуда не уходят и какой эндпоинт нужен.
 */
/**
 * Решение 30.09 (вариант «б» — рабочий сайт для видео): плашки видны только
 * в демо-входе. У настоящих аккаунтов неготовое либо скрыто, либо сделано
 * честно (бесплатная публикация на запуске, массовые действия через смену
 * этапа), либо тихо хранится в браузере до появления ручки на сервере.
 * NEXT_PUBLIC_SHOW_PREVIEW_NOTICES=1 — показать плашки всем (для проверки).
 */
const ALWAYS = process.env.NEXT_PUBLIC_SHOW_PREVIEW_NOTICES === '1';

export function DemoNotice({
  what,
  endpoint,
  className,
}: {
  what: string;
  endpoint?: string;
  className?: string;
}) {
  const demo = useIsDemo();
  if (!demo && !ALWAYS) return null;

  return (
    <div
      className={cn(
        'rounded-sm border border-dashed border-line-strong bg-surface-muted px-4 py-3',
        className,
      )}
      role="note"
    >
      <p className="text-sm font-medium text-text-primary">
        <span aria-hidden className="mr-1.5">
          ⚑
        </span>
        Preview only: data is kept in the browser and never leaves it
      </p>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{what}</p>
      {endpoint && (
        <p className="mt-1.5 text-sm text-text-secondary">
          Endpoint needed:{' '}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-text-primary">{endpoint}</code>
        </p>
      )}
    </div>
  );
}
