'use client';

import * as React from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import {
  benefitChips,
  companyLabel,
  salaryLine,
  tagline,
  type CompanyDraft,
  type VacancyDraft,
} from '@/lib/demo/employer';
import { cn } from '@/lib/utils';
import { LocationMap } from './location-map';

/**
 * Карточки, которые видит кандидат: вакансия и профиль компании.
 * Вид — экраны «Preview card», «Vacancy preview» и «Company profile preview»
 * из утверждённого макета.
 */

/** Логотип или инициалы. Пунктирного круга-заглушки нет — бриф, пункт 4. */
export function CompanyAvatar({ company, size = 44 }: { company: CompanyDraft; size?: number }) {
  if (company.logo && !company.hideName) {
    return (
      // Обычный img: data URL из браузера, next/image тут оптимизировать нечего.
      <img
        src={company.logo}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-line bg-surface object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = company.hideName
    ? '?'
    : company.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || 'HP';
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-accent-muted font-semibold text-accent-text"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/** Голубая плашка pre-opening — бриф: «в объявлении должно быть указано». */
export function PreOpeningBadge() {
  return (
    <span className="rounded-full bg-info-surface px-2.5 py-0.5 text-xs font-semibold text-on-info-surface">
      Pre-opening
    </span>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full bg-surface-muted px-3 py-1 text-xs text-text-secondary">
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * Карточка в списке вакансий. Пока вакансии нет (шаг Setup company), вместо
 * должности показывается сама компания — как «Preview card» в макете.
 */
export function VacancyCard({
  company,
  vacancy,
  className,
}: {
  company: CompanyDraft;
  vacancy?: VacancyDraft | null;
  className?: string;
}) {
  const place = [companyLabel(company), vacancy?.city || company.city].filter(Boolean).join(', ');
  const salary = vacancy ? salaryLine(vacancy) : null;
  // Бриф кандидата, пункт 9: на карточке 2–4 конкретных перка, не больше.
  const tags = vacancy ? benefitChips(vacancy).slice(0, 4) : [];

  return (
    <div className={cn('rounded-lg border-[1.5px] border-accent-strong bg-surface p-4 dark:border-accent', className)}>
      <div className="flex items-start gap-3">
        <CompanyAvatar company={company} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="flex min-w-0 items-center gap-1 text-xs text-text-secondary">
              <MapPin size={12} aria-hidden className="shrink-0 text-danger" />
              <span className="truncate">{place || 'Your company'}</span>
            </p>
            <span className="ml-auto flex shrink-0 gap-1.5">
              {company.preOpening && <PreOpeningBadge />}
              <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent-text">
                New
              </span>
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold leading-snug text-heading">
            {vacancy?.title ?? (company.hideName ? 'Confidential employer' : company.name || 'Company name')}
          </h3>
          {salary && <p className="mt-0.5 text-sm font-semibold text-text-primary">{salary}</p>}
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary">
        {company.about.trim() || 'A short description of the company will appear here.'}
      </p>
      <Tags items={tags} />
    </div>
  );
}

/**
 * Шапка страницы вакансии — фото заведения каруселью (бриф, пункт 13.1 и 13.9).
 * Своих фото нет — стоковое фото зала вместо иконки-заглушки: «никогда не
 * показывать заглушку-иконку как финальное состояние».
 */
export function PhotoHeader({ company }: { company: CompanyDraft }) {
  const photos = company.photos.length ? company.photos : ['/landing/restaurant.webp'];
  const [i, setI] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {photos.map((src, k) => (
          // Обычный img: data URL из браузера или локальный файл.
          <img key={k} src={src} alt="" className="photo-calm aspect-[16/7] w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {!company.photos.length && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
          Sample photo — add your own on the company profile step
        </span>
      )}
      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {photos.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`Photo ${k + 1}`}
              onClick={() => ref.current?.scrollTo({ left: k * ref.current.clientWidth, behavior: 'smooth' })}
              className={cn('h-2 w-2 rounded-full transition-colors', k === i ? 'bg-white' : 'bg-white/50')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Страница компании глазами кандидата — «Company profile preview». */
export function CompanyProfileCard({ company }: { company: CompanyDraft }) {
  const cover = company.photos[0];
  const showcase = company.photos.slice(cover ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      <div
        className="relative h-40 bg-gradient-to-br from-peach-to to-[rgb(var(--on-accent-muted))] sm:h-52"
        style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      />
      <div className="-mt-10 px-6 pb-7 text-center">
        <div className="inline-block rounded-full border-4 border-surface">
          <CompanyAvatar company={company} size={80} />
        </div>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-heading">{companyLabel(company)}</h3>
        {company.preOpening && (
          <div className="mt-2">
            <PreOpeningBadge />
          </div>
        )}
        {company.about.trim() && (
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">{tagline(company.about)}</p>
        )}
        {company.hideName && (
          <p className="mx-auto mt-2 max-w-md text-xs text-text-secondary">
            Name and logo are hidden from candidates (Premium).
          </p>
        )}
      </div>

      <div className="space-y-6 border-t border-line px-6 py-6 text-left">
        {/* Бриф, пункт 6: неполный профиль не блокирует вакансию — она выходит
            с пометкой, а работодателю напоминают дозаполнить. */}
        {!company.about.trim() && (
          <p className="rounded-md border border-dashed border-line-strong bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            Company profile: coming soon
          </p>
        )}

        {(company.email || company.phone || company.whatsapp) && (
          <section>
            <h4 className="font-semibold text-heading">Contact info</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-text-primary">
              {company.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={16} aria-hidden className="text-text-secondary" />
                  {company.email}
                </li>
              )}
              {company.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={16} aria-hidden className="text-text-secondary" />
                  {company.phone}
                </li>
              )}
              {company.whatsapp && (
                <li className="flex items-center gap-2.5">
                  <MessageCircle size={16} aria-hidden className="text-text-secondary" />
                  WhatsApp {company.whatsapp}
                </li>
              )}
            </ul>
          </section>
        )}

        {company.about.trim() && (
          <section>
            <h4 className="font-semibold text-heading">About us</h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-primary">{company.about}</p>
          </section>
        )}

        {company.city && (
          <section>
            <h4 className="font-semibold text-heading">Location</h4>
            <LocationMap address={company.city} />
          </section>
        )}

        {showcase.length > 0 && (
          <section>
            <h4 className="font-semibold text-heading">Property showcase</h4>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {showcase.map((src, i) => (
                <img key={i} src={src} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
