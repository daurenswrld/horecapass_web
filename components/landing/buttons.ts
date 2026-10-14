import { cn } from '@/lib/utils';

/**
 * Кнопки лендинга: залитая «Find a job» и контурная «Hire staff», как в
 * утверждённом первом экране (веб-прототип v2, L-01). Отдельный модуль без
 * 'use client': строки отсюда нужны и серверной странице, а значение из
 * клиентского модуля приходит на сервер ссылкой, а не строкой.
 */
const BASE =
  'group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 text-base font-semibold transition focus-ring';

export const BUTTON = {
  solid: cn(BASE, 'bg-accent-strong text-on-accent shadow-lift hover:brightness-110 dark:bg-accent'),
  outline: cn(BASE, 'border-[1.5px] border-accent-strong bg-surface/70 text-accent-strong hover:bg-accent-muted dark:border-accent dark:text-heading'),
};
