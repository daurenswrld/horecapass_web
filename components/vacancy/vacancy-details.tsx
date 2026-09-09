'use client';

import * as React from 'react';
import { BadgeCheck, Bookmark, Check, MapPin, Video } from 'lucide-react';
import { Button, Chip, Spinner } from '@/components/ui/primitives';
import { formatSalary, vacanciesApi, type Vacancy } from '@/lib/api/vacancies';
import { ApiError } from '@/lib/api/client';

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
      await vacanciesApi.apply(vacancy.id);
      setApplied(true);
      onChanged?.({ ...vacancy, isApplied: true });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? 'Отклик не отправлен: возможно, вы уже откликались или профиль заполнен не полностью.'
          : 'Не удалось отправить отклик. Попробуйте ещё раз.',
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
      onChanged?.({ ...vacancy, isSaved: next });
    } catch {
      setSaved(!next);
    }
  };

  const conditions = [
    ['Тип занятости', vacancy.employmentType],
    ['График', vacancy.schedule],
    ['Часы', vacancy.hours],
    ['Тип заведения', vacancy.venueType],
    ['Уровень', vacancy.venueLevel],
    ['Отдел', vacancy.department],
    ['Выплаты', vacancy.paymentSchedule],
    ['Тип оплаты', vacancy.salaryType],
  ].filter((r): r is [string, string] => !!r[1]);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold tracking-tight text-text-primary">{vacancy.title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
          {vacancy.companyName}
          {vacancy.isVerified && <BadgeCheck size={15} className="text-info" aria-label="Проверенная компания" />}
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
            Нужна видео-презентация — её можно записать в мобильном приложении.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={apply} disabled={applied || applying}>
            {applying ? (
              <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" />
            ) : applied ? (
              'Отклик отправлен'
            ) : (
              'Откликнуться'
            )}
          </Button>
          <Button variant="secondary" onClick={toggleSave}>
            <Bookmark size={16} className={saved ? 'fill-accent text-accent' : undefined} />
            {saved ? 'Сохранено' : 'Сохранить'}
          </Button>
        </div>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </header>

      {conditions.length > 0 && (
        <Section title="Условия">
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
        <Section title="Описание">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">{vacancy.description}</p>
        </Section>
      )}

      {vacancy.responsibilities.length > 0 && (
        <Section title="Обязанности">
          <Bullets items={vacancy.responsibilities} />
        </Section>
      )}

      {vacancy.requirements && (
        <Section title="Требования">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">{vacancy.requirements}</p>
        </Section>
      )}

      {vacancy.skills.length > 0 && (
        <Section title="Навыки">
          <div className="flex flex-wrap gap-1.5">
            {vacancy.skills.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </Section>
      )}

      {vacancy.benefits.length > 0 && (
        <Section title="Что предлагают">
          <Bullets items={vacancy.benefits} />
        </Section>
      )}

      {vacancy.hiringSteps.length > 0 && (
        <Section title="Этапы найма">
          <ol className="space-y-2">
            {vacancy.hiringSteps.map((step, i) => (
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
