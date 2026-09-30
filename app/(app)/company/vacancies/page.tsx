'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { JobStats } from '@/components/employer/stats';
import { SetupInvite } from '@/components/employer/setup-invite';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Chip, Field, Spinner } from '@/components/ui/primitives';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { useToast } from '@/components/ui/toast';
import { formatSalary, vacanciesApi, type Vacancy } from '@/lib/api/vacancies';
import { ApiError } from '@/lib/api/client';

/**
 * Jobs работодателя — экран company_home_screen.dart мобилки.
 *
 * Первым делом список опубликованного, а не аналитика: заказчица про графики
 * сказала прямо — «красивые графики, но это ни о чём. На первом этапе должны
 * быть вакансии, которые запустил работодатель».
 */
export default function CompanyVacanciesPage() {
  const [items, setItems] = React.useState<Vacancy[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    vacanciesApi
      .mine()
      .then(setItems)
      .catch(() => setError('Could not load company jobs.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  // Active / Drafts / Archived — как в брифе (пункт 8). Черновики создаёт
  // онбординг работодателя: вакансия ждёт оплаты и кандидатам не видна.
  const active = items.filter((v) => v.status === 'ACTIVE');
  const drafts = items.filter((v) => v.status === 'DRAFT');
  const archived = items.filter((v) => v.status === 'ARCHIVED');

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={loading ? undefined : `Active: ${active.length}`}
        actions={
          // Голосовое 15.09: «нажимает Create — и в этом же окошке появляется
          // чат». Главная кнопка ведёт в Smart vacancy; короткая форма, которая
          // публикует на сервер уже сейчас, остаётся рядом.
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setCreating((v) => !v)}>
              {creating ? <X size={16} /> : null}
              {creating ? 'Cancel' : 'Quick form'}
            </Button>
            <Link
              href="/company/onboarding?new=vacancy"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-semibold text-on-accent transition-colors hover:brightness-110 focus-ring dark:bg-accent"
            >
              <Plus size={16} aria-hidden />
              New job
            </Link>
          </div>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
        <SetupInvite />

        {creating && (
          <CreateVacancyForm
            onCancel={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              load();
            }}
          />
        )}

        {loading && (
          <ListSkeleton count={4} />
        )}

        {!loading && error && (
          <Card className="p-5">
            <p className="text-sm text-danger">{error}</p>
          </Card>
        )}

        {!loading && !error && items.length === 0 && !creating && (
          <Card className="p-8 text-center">
            <p className="font-medium text-text-primary">No jobs yet</p>
            <p className="mt-1 text-sm text-text-secondary">
              Post your first one and candidate applications will appear here.
            </p>
            <Link
              href="/company/onboarding?new=vacancy"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-semibold text-on-accent transition-colors hover:brightness-110 focus-ring dark:bg-accent"
            >
              <Plus size={16} aria-hidden />
              New job
            </Link>
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <JobStats vacancies={items} />
            <VacancyGroup title="Active" items={active} />
            {drafts.length > 0 && <VacancyGroup title="Drafts" items={drafts} onPublished={load} />}
            {archived.length > 0 && <VacancyGroup title="Archived" items={archived} muted />}
          </>
        )}
      </div>
    </>
  );
}

/**
 * Публикация вакансии.
 *
 * Короткая форма с обязательным минимумом: в мобилке это пятишаговый мастер,
 * но для веба важнее опубликовать быстро, а детали дописать потом. Уходит
 * настоящим запросом на `/api/vacancies/`.
 */
/**
 * Валюты стран GCC. Раньше форма всегда отправляла KZT — наследие первой
 * версии, хотя рынок платформы — Залив. На сервере уже лежат вакансии в AED
 * и SAR; остальные коды сервером пока не проверены — если он их не примет,
 * форма покажет его ответ.
 */
const CURRENCIES = ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'] as const;

function CreateVacancyForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState('');
  const [city, setCity] = React.useState('');
  const [salaryMin, setSalaryMin] = React.useState('');
  const [salaryMax, setSalaryMax] = React.useState('');
  const [currency, setCurrency] = React.useState<(typeof CURRENCIES)[number]>('AED');
  const [description, setDescription] = React.useState('');
  const [requirements, setRequirements] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Сервер требует название и описание (VacancySerializer).
    if (!title.trim() || !description.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await vacanciesApi.create({
        title: title.trim(),
        city: city.trim() || undefined,
        address: city.trim() || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        currency,
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        // is_active сервер вычисляет из status при сохранении.
        status: 'ACTIVE',
      });
      onCreated();
    } catch (err) {
      // Показываем, что именно не понравилось серверу: у публикации вакансии
      // на бэкенде могут быть обязательные поля, которых нет в этой форме.
      const payload = err instanceof ApiError ? err.payload : null;
      let message = 'Could not publish the job.';
      if (payload && typeof payload === 'object') {
        const parts = Object.entries(payload as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
          .slice(0, 4);
        if (parts.length) message = parts.join('; ');
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">New job</h2>
      <p className="mt-1 text-sm text-text-secondary">
        The position and a short description are required, the rest can be added later.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Position"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chef de Partie"
          autoFocus
        />
        <Field label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dubai" />
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
          <Field
            label="Salary from"
            type="number"
            inputMode="numeric"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="4000"
          />
          <Field
            label="to"
            type="number"
            inputMode="numeric"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="6000"
          />
          <div className="space-y-1.5">
            <label htmlFor="v-cur" className="block text-sm font-medium text-text-secondary">
              Currency
            </label>
            <select
              id="v-cur"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
              className="h-12 rounded border border-line-strong bg-surface px-3 text-text-primary focus-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <label className="block text-sm font-medium text-text-secondary" htmlFor="v-desc">
            Description
          </label>
          <textarea
            id="v-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What the job involves"
            className="mt-1.5 w-full resize-none rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <label className="block text-sm font-medium text-text-secondary" htmlFor="v-req">
            Requirements
          </label>
          <textarea
            id="v-req"
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Experience, skills, languages"
            className="mt-1.5 w-full resize-none rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </div>

        {error && <p className="text-sm text-danger lg:col-span-2 xl:col-span-3">{error}</p>}

        <div className="flex gap-2 lg:col-span-2 xl:col-span-3">
          <Button type="submit" disabled={!title.trim() || !description.trim() || busy}>
            {busy ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : 'Publish'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * Публикация черновика — status DRAFT → ACTIVE (PATCH /api/vacancies/my/<id>/).
 * По брифу (пункт 14) публикация платная и идёт после оплаты; пока оплата
 * не подключена, публикуем сразу — так же, как «Quick form». Когда появится
 * оплата, эта кнопка ведёт на выбор тарифа.
 */
function PublishButton({ vacancy, onDone }: { vacancy: Vacancy; onDone: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const toast = useToast();
  return (
    <div className="mt-3">
      <Button
        size="sm"
        disabled={busy}
        aria-label={`Publish ${vacancy.title}`}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await vacanciesApi.update(vacancy.id, { status: 'ACTIVE' });
            toast.success(`“${vacancy.title}” is live`);
            onDone();
          } catch (e) {
            const p = e instanceof ApiError ? e.payload : null;
            setError(p && typeof p === 'object' ? Object.values(p as Record<string, unknown>).flat().join(' ') : 'Could not publish.');
            setBusy(false);
          }
        }}
      >
        {busy ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : 'Publish'}
      </Button>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function VacancyGroup({
  title,
  items,
  muted,
  onPublished,
}: {
  title: string;
  items: Vacancy[];
  muted?: boolean;
  /** Есть только у черновиков: кнопка «Publish» на карточке. */
  onPublished?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((v, i) => {
          const salary = formatSalary(v);
          return (
            <Card
              key={v.id}
              style={riseStyle(i)}
              className={muted ? 'rise min-w-0 p-4 opacity-70' : 'rise min-w-0 p-4'}
            >
              <h3 className="truncate font-semibold text-text-primary">{v.title}</h3>
              {salary && <p className="mt-1.5 text-sm font-medium text-text-primary">{salary}</p>}
              {v.address && <p className="mt-0.5 truncate text-sm text-text-secondary">{v.address}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[v.venueType, v.employmentType, v.schedule]
                  .filter((x): x is string => !!x)
                  .map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
              </div>
              {onPublished && <PublishButton vacancy={v} onDone={onPublished} />}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
