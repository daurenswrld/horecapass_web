'use client';

import * as React from 'react';
import { BadgeCheck, Bookmark, Check, MapPin, Video } from 'lucide-react';
import { Button, Chip, Spinner } from '@/components/ui/primitives';
import { formatSalary, vacanciesApi, type Vacancy } from '@/lib/api/vacancies';
import { InterviewPrep } from './interview-prep';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api/client';
import { useCandidate } from '@/lib/candidate/context';

/**
 * Карточка вакансии целиком — то же содержимое, что на экране
 * applicant_vacancy_details_screen.dart: условия, обязанности, требования,
 * что предлагают, этапы найма.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-sm leading-relaxed text-text-primary">
          <Check size={15} className="mt-0.5 shrink-0 text-accent" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function VacancyDetails({
  vacancy,
  onChanged,
}: {
  vacancy: Vacancy;
  onChanged?: (v: Vacancy) => void;
}) {
  const [applying, setApplying] = React.useState(false);
  const { draft } = useCandidate();
  const toast = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(vacancy.isApplied);
  const [saved, setSaved] = React.useState(vacancy.isSaved);

  // Открыли другую вакансию — состояние кнопок должно соответствовать ей.
  React.useEffect(() => {
    setApplied(vacancy.isApplied);
    setSaved(vacancy.isSaved);
    setError(null);
  }, [vacancy.id, vacancy.isApplied, vacancy.isSaved]);

  const salary = formatSalary(vacancy);

  const apply = async () => {
    setError(null);
    setApplying(true);
    try {
      await vacanciesApi.apply(vacancy.id, draft?.coverLetterText ?? '');
      setApplied(true);
      toast.success('Application sent');
      onChanged?.({ ...vacancy, isApplied: true });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? 'Application not sent: you may have already applied, or your profile is incomplete.'
          : 'Could not send the application. Please try again.',
      );
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async () => {
    // Переключаем сразу: ждать ответа ради закладки — заметная задержка.
    const next = !saved;
    setSaved(next);
    try {
      await vacanciesApi.toggleFavorite(vacancy.id);
      toast.success(next ? 'Saved to your list' : 'Removed from saved');
      onChanged?.({ ...vacancy, isSaved: next });
    } catch {
      setSaved(!next);
      toast.error('Could not update saved jobs');
    }
  };

  const conditions = [
    ['Employment type', vacancy.employmentType],
    ['Schedule', vacancy.schedule],
    ['Hours', vacancy.hours],
    ['Venue type', vacancy.venueType],
    ['Level', vacancy.venueLevel],
    ['Department', vacancy.department],
    ['Pay schedule', vacancy.paymentSchedule],
    ['Pay type', vacancy.salaryType],
  ].filter((r): r is [string, string] => !!r[1]);

  // Что компания говорит о себе. Свои бенефиты и этапы у вакансии важнее; нет их — берём общие у компании.
  const brand = vacancy.companyBrand;
  const about = ([
    ['Who we are', brand?.whoWeAre],
    ['Why work with us', brand?.whyUs],
    ['About the company', brand?.about],
    ['Our projects', brand?.projects],
    ['Achievements', brand?.achievements],
    ['Culture', brand?.culture],
  ] as [string, string | undefined][]).filter((r): r is [string, string] => !!r[1]?.trim());
  const offer = vacancy.benefits.length ? vacancy.benefits : (brand?.offer ?? []);
  const steps = vacancy.hiringSteps.length ? vacancy.hiringSteps : (brand?.hiringSteps ?? []);

  // Бриф кандидата, пункт 10: в шапке — фото заведения, а не иконка;
  // своих фото нет — стоковое фото зала.
  const photo = vacancy.companyImages[0] ?? '/landing/restaurant.webp';

  return (
    <div className="space-y-4">
      {/* Обычный img: адрес с сервера компании или локальный файл. */}
      <img src={photo} alt="" className="photo-calm aspect-[16/6] w-full rounded-lg object-cover" />
      <header>
        <h2 className="text-xl font-bold tracking-tight text-text-primary">{vacancy.title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
          {vacancy.companyName}
          {vacancy.isVerified && <BadgeCheck size={15} className="text-info" aria-label="Verified company" />}
        </p>

        {salary && <p className="mt-3 text-lg font-bold text-text-primary">{salary}</p>}

        {vacancy.address && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
            <MapPin size={14} />
            {vacancy.address}
          </p>
        )}

        {vacancy.requiresVideoGreeting && (
          <p className="mt-3 flex items-center gap-2 rounded-sm bg-info-surface px-3 py-2 text-sm text-on-info-surface">
            <Video size={15} className="shrink-0" />
            A video intro is required. You can record it in the mobile app.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={apply} disabled={applied || applying}>
            {applying ? (
              <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" />
            ) : applied ? (
              'Application sent'
            ) : (
              'Apply'
            )}
          </Button>
          <Button variant="secondary" onClick={toggleSave}>
            <Bookmark size={16} className={saved ? 'fill-accent text-accent' : undefined} />
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-4">
          <InterviewPrep key={vacancy.id} vacancy={vacancy} />
        </div>
      </header>

      {conditions.length > 0 && (
        <Section title="Conditions">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {conditions.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm">
                <dt className="text-text-secondary">{k}</dt>
                <dd className="text-right font-medium text-text-primary">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {vacancy.description && (
        <Section title="Description">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">{vacancy.description}</p>
        </Section>
      )}

      {vacancy.responsibilities.length > 0 && (
        <Section title="Responsibilities">
          <Bullets items={vacancy.responsibilities} />
        </Section>
      )}

      {vacancy.requirements && (
        <Section title="Requirements">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">{vacancy.requirements}</p>
        </Section>
      )}

      {vacancy.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {vacancy.skills.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </Section>
      )}

      {about.length > 0 && (
        <Section title={`About ${vacancy.companyName}`}>
          <div className="space-y-3">
            {about.map(([label, body]) => (
              <div key={label}>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-text-primary">{body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {offer.length > 0 && (
        <Section title="What they offer">
          <Bullets items={offer} />
        </Section>
      )}

      {steps.length > 0 && (
        <Section title="Hiring process">
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-text-primary">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-muted text-xs font-semibold text-text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}
