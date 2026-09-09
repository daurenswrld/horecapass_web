import { cn } from '@/lib/utils';

/**
 * Логотип.
 *
 * Исходник — `assets/images/logo.png` из мобильного приложения, тот же файл,
 * что показан на экранах телефона. Из него вырезаны поля и получена маска:
 * знак одноцветный, поэтому в разметку кладётся только форма, а цвет задаётся
 * через `background-color` и следует за темой. Иначе на тёмном фоне
 * коричневый #9A7F6B пришлось бы держать вторым файлом.
 *
 * Пропорции взяты из обрезанного файла — 913×143 у полного начертания
 * и 82×87 у знака «H». Менять их нельзя: логотип начнёт «плыть».
 */

const WORDMARK_RATIO = 913 / 143;
const MARK_RATIO = 82 / 87;

const maskStyle = (url: string) =>
  ({
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }) as const;

/** Знак без надписи — там, где на полное начертание нет места. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 bg-accent', className)}
      style={{ height: size, width: Math.round(size * MARK_RATIO), ...maskStyle('/logo-h-mask.png') }}
    />
  );
}

/** Полное начертание: HORECAPASS с подписью HIRING PLATFORM. */
export function Wordmark({ height = 26, className }: { height?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="HorecaPass — платформа найма"
      className={cn('inline-block shrink-0 bg-accent', className)}
      style={{ height, width: Math.round(height * WORDMARK_RATIO), ...maskStyle('/logo-mask.png') }}
    />
  );
}
