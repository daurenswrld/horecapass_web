import { cn } from '@/lib/utils';

/**
 * Плашка «это показ замысла, а не рабочая функция».
 *
 * Ставится на каждом разделе, который работает без бэкенда. Заказчица уже
 * получала демо, выглядевшее рабочим, и отдельно на это указала — поэтому
 * здесь прямо написано, что данные никуда не уходят и какой эндпоинт нужен.
 */
export function DemoNotice({
  what,
  endpoint,
  className,
}: {
  what: string;
  endpoint?: string;
  className?: string;
}) {
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
        Показ замысла — данные хранятся в браузере и на сервер не уходят
      </p>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{what}</p>
      {endpoint && (
        <p className="mt-1.5 text-sm text-text-secondary">
          Нужен эндпоинт{' '}
          <code className="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-text-primary">{endpoint}</code>
        </p>
      )}
    </div>
  );
}
