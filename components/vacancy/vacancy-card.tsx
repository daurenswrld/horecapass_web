'use client';

import * as React from 'react';
import { Bookmark, BadgeCheck, MapPin } from 'lucide-react';
import { Chip } from '@/components/ui/primitives';
import { formatSalary, type Vacancy } from '@/lib/api/vacancies';
import { cn } from '@/lib/utils';

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
}

export function VacancyCard({ vacancy, selected, onSelect, onToggleSave }: Props) {
  const salary = formatSalary(vacancy);

  return (
    <article
      onClick={() => onSelect?.(vacancy)}
      className={cn(
        'lift cursor-pointer rounded-lg border bg-surface p-4',
        selected ? 'border-accent shadow-card' : 'border-line hover:border-line-strong hover:shadow-card',
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo v={vacancy} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-text-primary">{vacancy.title}</h3>
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-text-secondary">
                {vacancy.companyName}
                {vacancy.isVerified && (
                  <BadgeCheck size={14} className="shrink-0 text-info" aria-label="Verified company" />
                )}
              </p>
            </div>

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(vacancy);
                }}
                aria-pressed={vacancy.isSaved}
                aria-label={vacancy.isSaved ? 'Remove from saved' : 'Save job'}
                className="-m-1 shrink-0 rounded p-1 text-text-tertiary transition-colors hover:text-accent focus-ring"
              >
                <Bookmark size={18} className={vacancy.isSaved ? 'fill-accent text-accent' : undefined} />
              </button>
            )}
          </div>

          {salary && <p className="mt-2 font-semibold text-text-primary">{salary}</p>}

          {vacancy.address && (
            <p className="mt-1 flex items-center gap-1 truncate text-sm text-text-secondary">
              <MapPin size={13} className="shrink-0" />
              {vacancy.address}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {vacancy.matchScore != null && (
              <Chip className="bg-info-surface font-semibold text-on-info-surface">
                {vacancy.matchScore}% match
              </Chip>
            )}
            {vacancy.isApplied && (
              <Chip className="bg-accent-muted text-text-primary">You applied</Chip>
            )}
            {[vacancy.venueType, vacancy.employmentType, vacancy.schedule]
              .filter((x): x is string => !!x)
              .map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            {/* Бриф кандидата, пункт 9: вместо общих навыков («Teamwork»,
                «Positive attitude») — 2–4 реальных перка позиции: жильё, еда,
                чаевые. Навыки — только если работодатель перки не указал. */}
            {(vacancy.benefits.length ? vacancy.benefits : vacancy.skills).slice(0, vacancy.benefits.length ? 4 : 3).map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
