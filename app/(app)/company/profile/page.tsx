'use client';

import * as React from 'react';
import { Check, Eye, Pencil, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Chip, Field, Spinner } from '@/components/ui/primitives';
import { DemoNotice } from '@/components/demo-notice';
import { companyBrand, type CompanyBrand } from '@/lib/demo/storage';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Профиль компании как HR-бренд — пункт 13 документа заказчицы.
 *
 * «У работодателя должен быть полноценный Company Profile. Это фактически
 * HR Branding page внутри платформы»: Who We Are, Why Work With Us, Our
 * Projects, Our Achievements, What We Offer, Our Culture, плюс этапы найма
 * (пункт 18), чтобы кандидат заранее понимал, что его ждёт.
 *
 * Полей под это в сериализаторе компании нет, поэтому раздел работает
 * на браузерном хранилище и честно об этом пишет.
 */

const TEXT_FIELDS: { key: keyof CompanyBrand; label: string; hint: string; rows: number }[] = [
  { key: 'whoWeAre', label: 'Кто мы', hint: 'Одно-два предложения: чем занимается компания.', rows: 3 },
  { key: 'whyUs', label: 'Почему стоит работать у нас', hint: 'Главный ответ на вопрос кандидата.', rows: 3 },
  { key: 'about', label: 'О компании', hint: 'История, масштаб, чем гордитесь.', rows: 4 },
  { key: 'projects', label: 'Наши проекты', hint: 'Рестораны, отели, площадки.', rows: 3 },
  { key: 'achievements', label: 'Достижения', hint: 'Награды, рейтинги, результаты.', rows: 3 },
  { key: 'culture', label: 'Культура', hint: 'Как устроена работа в команде.', rows: 3 },
];

/** Что предлагают сотруднику — список из документа заказчицы. */
const OFFER_OPTIONS = [
  'Питание',
  'Проживание',
  'Транспорт',
  'Страховка',
  'Обучение',
  'Карьерный рост',
  'Форма',
  'Бонусы',
  'Оплата визы',
  'Билеты',
];

const DEFAULT_STEPS = [
  'Отбор по резюме',
  'Интервью с HR',
  'Интервью с руководителем',
  'Стажировка',
  'Оффер',
];

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const [brand, setBrand] = React.useState<CompanyBrand | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [stepDraft, setStepDraft] = React.useState('');

  React.useEffect(() => {
    const loaded = companyBrand.load();
    setBrand(loaded);
    // Пустой профиль сразу открываем на редактирование: смотреть нечего.
    setEditing(!loaded.whoWeAre && !loaded.about);
  }, []);

  if (!brand) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  const set = <K extends keyof CompanyBrand>(key: K, value: CompanyBrand[K]) => {
    const next = { ...brand, [key]: value };
    setBrand(next);
    companyBrand.save(next);
  };

  const toggleOffer = (item: string) =>
    set('offer', brand.offer.includes(item) ? brand.offer.filter((x) => x !== item) : [...brand.offer, item]);

  const companyName = user?.company_name || 'Ваша компания';

  return (
    <>
      <PageHeader
        title="Профиль компании"
        subtitle={companyName}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? <Eye size={15} /> : <Pencil size={15} />}
            {editing ? 'Посмотреть глазами кандидата' : 'Редактировать'}
          </Button>
        }
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        <DemoNotice
          what="Страница работодателя как HR-бренд: то, что кандидат увидит перед откликом. Пока полей под это в сериализаторе компании нет, текст хранится в браузере."
          endpoint="PATCH /users/api/users/me/company/ — поля who_we_are, why_us, projects, achievements, offer, culture, hiring_steps"
        />

        {editing ? (
          <Card className="grid gap-5 p-6 xl:grid-cols-2 xl:items-start xl:gap-x-10">
            {TEXT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-text-secondary" htmlFor={f.key}>
                  {f.label}
                </label>
                <textarea
                  id={f.key}
                  rows={f.rows}
                  value={brand[f.key] as string}
                  onChange={(e) => set(f.key, e.target.value as never)}
                  placeholder={f.hint}
                  className="mt-1.5 w-full resize-none rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
                />
              </div>
            ))}

            <div>
              <p className="text-sm font-medium text-text-secondary">Что предлагаем сотруднику</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {OFFER_OPTIONS.map((o) => {
                  const on = brand.offer.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleOffer(o)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors focus-ring',
                        on
                          ? 'border-accent bg-accent-strong text-on-accent'
                          : 'border-line bg-surface text-text-primary hover:border-accent',
                      )}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-secondary">Этапы найма</p>
              <p className="mt-1 text-sm text-text-secondary">
                Кандидат увидит их до отклика и будет понимать, сколько шагов впереди.
              </p>

              {brand.hiringSteps.length === 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => set('hiringSteps', DEFAULT_STEPS)}
                >
                  Подставить типовые
                </Button>
              )}

              <ol className="mt-3 space-y-2">
                {brand.hiringSteps.map((step, i) => (
                  <li key={`${step}-${i}`} className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-muted text-xs font-semibold text-text-primary">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-text-primary">{step}</span>
                    <button
                      type="button"
                      aria-label={`Убрать этап: ${step}`}
                      onClick={() => set('hiringSteps', brand.hiringSteps.filter((_, j) => j !== i))}
                      className="rounded p-1 text-text-secondary hover:text-danger focus-ring"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ol>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = stepDraft.trim();
                  if (!v) return;
                  set('hiringSteps', [...brand.hiringSteps, v]);
                  setStepDraft('');
                }}
                className="mt-3 flex items-end gap-2"
              >
                <div className="flex-1">
                  <Field
                    label="Добавить этап"
                    value={stepDraft}
                    onChange={(e) => setStepDraft(e.target.value)}
                    placeholder="Например, практическое задание"
                  />
                </div>
                <Button type="submit" disabled={!stepDraft.trim()}>
                  <Plus size={16} />
                  Добавить
                </Button>
              </form>
            </div>
          </Card>
        ) : (
          <BrandPreview brand={brand} companyName={companyName} />
        )}
      </div>
    </>
  );
}

/** Как страницу увидит кандидат. */
function BrandPreview({ brand, companyName }: { brand: CompanyBrand; companyName: string }) {
  const sections = [
    ['Кто мы', brand.whoWeAre],
    ['Почему стоит работать у нас', brand.whyUs],
    ['О компании', brand.about],
    ['Наши проекты', brand.projects],
    ['Достижения', brand.achievements],
    ['Культура', brand.culture],
  ].filter((s): s is [string, string] => !!s[1]?.trim());

  const empty = sections.length === 0 && brand.offer.length === 0 && brand.hiringSteps.length === 0;

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-text-primary">{companyName}</h2>

      {empty && (
        <p className="mt-3 text-sm text-text-secondary">
          Пока пусто. Нажмите «Редактировать» и расскажите о компании — это первое, что читает
          кандидат перед откликом.
        </p>
      )}

      {sections.map(([title, text]) => (
        <section key={title} className="mt-6 border-t border-line pt-5 first:border-0 first:pt-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-text">{title}</h3>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-text-primary">{text}</p>
        </section>
      ))}

      {brand.offer.length > 0 && (
        <section className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-text">
            Что предлагаем
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {brand.offer.map((o) => (
              <Chip key={o} className="bg-accent-muted text-text-primary">
                {o}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {brand.hiringSteps.length > 0 && (
        <section className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-text">
            Как проходит отбор
          </h3>
          <ol className="mt-3 space-y-2.5">
            {brand.hiringSteps.map((step, i) => (
              <li key={`${step}-${i}`} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-muted text-xs font-semibold text-text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-text-primary">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
            <Check size={15} className="text-success" />
            Кандидат видит эти этапы до отклика
          </p>
        </section>
      )}
    </Card>
  );
}
