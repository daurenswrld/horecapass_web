'use client';

import * as React from 'react';
import { Bookmark, BadgeCheck, MapPin } from 'lucide-react';
import { Button, Chip, Spinner } from '@/components/ui/primitives';
import { formatSalary, isNewVacancy, type Vacancy } from '@/lib/api/vacancies';
import { cn } from '@/lib/utils';
import { useApply } from './use-apply';

/** Логотип компании: картинка, а если её нет — буква на приглушённой подложке.
 *  Так же поступает AvatarCircle в мобилке. */
function CompanyLogo({ v, size = 44 }: { v: Vacancy; size?: number }) {
  const [broken, setBroken] = React.useState(false);
  const letter = (v.companyName || '?').trim().charAt(0).toUpperCase();

  if (v.companyLogoUrl && !broken) {
    return (
      // Логотипы приходят с произвольными размерами; next/image здесь только
      // мешает — url отдаёт бэкенд, а размеры заранее неизвестны.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={v.companyLogoUrl}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        // contain, а не cover: вытянутый логотип обрезался до «AREERTER»
        // вместо «Careerteria» (бриф кандидата). Белая подложка — чтобы
        // тёмный логотип на прозрачном фоне не пропадал в тёмной теме.
        className="shrink-0 rounded-sm border border-line bg-white object-contain p-0.5"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-sm bg-surface-alt font-semibold text-text-secondary"
    >
      {letter}
    </div>
  );
}

interface Props {
  vacancy: Vacancy;
  selected?: boolean;
  onSelect?: (v: Vacancy) => void;
  onToggleSave?: (v: Vacancy) => void;
  /** Отклик из карточки: список обновляет вакансию и правая панель видит новый статус. */
  onChanged?: (v: Vacancy) => void;
}

/**
 * Карточка в списке — по макету: заведение и город, метка «New», название,
 * зарплата, теги и кнопка Apply во всю ширину. Открывается кнопкой-названием,
 * растянутой на всю карточку: так карточка доступна с клавиатуры, а сохранить
 * и откликнуться можно, не открывая вакансию.
 */
export function VacancyCard({ vacancy, selected, onSelect, onToggleSave, onChanged }: Props) {
  const salary = formatSalary(vacancy);
  const { apply, applying, applied, error } = useApply(vacancy, onChanged);
  const fresh = isNewVacancy(vacancy);
  const place = [vacancy.companyName, vacancy.address].filter(Boolean).join(', ');
  // Бриф кандидата, пункт 9: вместо общих навыков («Teamwork», «Positive
  // attitude») — 2–4 реальных перка позиции: жильё, еда, чаевые. Навыки —
  // только если работодатель перки не указал.
  const tags = (vacancy.benefits.length ? vacancy.benefits.slice(0, 4) : vacancy.skills.slice(0, 3));

  return (
    <article
      className={cn(
        'lift relative rounded-lg border bg-surface p-4',
        selected ? 'border-accent shadow-card' : 'border-line hover:border-line-strong hover:shadow-card',
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo v={vacancy} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1 text-sm text-text-secondary">
              <MapPin size={13} aria-hidden className="shrink-0 text-accent-text" />
              <span className="min-w-0 truncate">{place}</span>
              {vacancy.isVerified && <BadgeCheck size={14} className="shrink-0 text-info" aria-label="Verified company" />}
            </p>

            <div className="flex shrink-0 items-center gap-2">
              {fresh && <Chip className="bg-accent-muted font-semibold text-accent-text">New</Chip>}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(vacancy)}
                  aria-pressed={vacancy.isSaved}
                  aria-label={vacancy.isSaved ? 'Remove from saved' : 'Save job'}
                  className="relative z-10 -m-1 shrink-0 rounded p-1 text-text-tertiary transition-colors hover:text-accent focus-ring"
                >
                  <Bookmark size={18} className={vacancy.isSaved ? 'fill-accent text-accent' : undefined} />
                </button>
              )}
            </div>
          </div>

          <h2 className="mt-1 font-semibold text-text-primary">
            <button
              type="button"
              onClick={() => onSelect?.(vacancy)}
              aria-current={selected ? 'true' : undefined}
              className="rounded text-left after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-ring"
            >
              {vacancy.title}
            </button>
          </h2>

          {salary && <p className="mt-1 text-sm text-text-secondary">{salary}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {vacancy.matchScore != null && (
              <Chip className="bg-info-surface font-semibold text-on-info-surface">{vacancy.matchScore}% match</Chip>
            )}
            {vacancy.venueType && <Chip>{vacancy.venueType}</Chip>}
            {tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
      </div>

      <Button
        className="relative z-10 mt-4 w-full rounded-full"
        disabled={applied || applying}
        onClick={apply}
        aria-label={applied ? `Application sent: ${vacancy.title}` : `Apply: ${vacancy.title}`}
      >
        {applying ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : applied ? 'Application sent' : 'Apply'}
      </Button>
      {error && (
        <p role="alert" className="relative z-10 mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </article>
  );
}
