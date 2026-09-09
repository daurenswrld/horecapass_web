'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Chip, Field, Spinner } from '@/components/ui/primitives';
import { formatSalary, vacanciesApi, type Vacancy } from '@/lib/api/vacancies';
import { ApiError } from '@/lib/api/client';

/**
 * Вакансии работодателя — экран company_home_screen.dart мобилки.
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
      .catch(() => setError('Не удалось загрузить вакансии компании.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const active = items.filter((v) => v.isActive);
  const archived = items.filter((v) => !v.isActive);

  return (
    <>
      <PageHeader
        title="Вакансии"
        subtitle={loading ? undefined : `Активных: ${active.length}`}
        actions={
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? <X size={16} /> : <Plus size={16} />}
            {creating ? 'Отменить' : 'Новая вакансия'}
          </Button>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
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
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <Card className="p-5">
            <p className="text-sm text-danger">{error}</p>
          </Card>
        )}

        {!loading && !error && items.length === 0 && !creating && (
          <Card className="p-8 text-center">
            <p className="font-medium text-text-primary">Вакансий пока нет</p>
            <p className="mt-1 text-sm text-text-secondary">
              Опубликуйте первую — и здесь появятся отклики с кандидатами.
            </p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus size={16} />
              Новая вакансия
            </Button>
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <VacancyGroup title="Активные" items={active} />
            {archived.length > 0 && <VacancyGroup title="В архиве" items={archived} muted />}
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
function CreateVacancyForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState('');
  const [city, setCity] = React.useState('');
  const [salaryMin, setSalaryMin] = React.useState('');
  const [salaryMax, setSalaryMax] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [requirements, setRequirements] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await vacanciesApi.create({
        title: title.trim(),
        city: city.trim() || undefined,
        address: city.trim() || undefined,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        currency: 'KZT',
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        is_active: true,
      });
      onCreated();
    } catch (err) {
      // Показываем, что именно не понравилось серверу: у публикации вакансии
      // на бэкенде могут быть обязательные поля, которых нет в этой форме.
      const payload = err instanceof ApiError ? err.payload : null;
      let message = 'Не удалось опубликовать вакансию.';
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
      <h2 className="text-lg font-semibold text-text-primary">Новая вакансия</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Обязательна только должность — остальное можно дописать позже.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Должность"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например, Chef de Partie"
          autoFocus
        />
        <Field label="Город" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы" />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Зарплата от"
            type="number"
            inputMode="numeric"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="400000"
          />
          <Field
            label="до"
            type="number"
            inputMode="numeric"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="600000"
          />
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <label className="block text-sm font-medium text-text-secondary" htmlFor="v-desc">
            Описание
          </label>
          <textarea
            id="v-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Чем предстоит заниматься"
            className="mt-1.5 w-full resize-none rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <label className="block text-sm font-medium text-text-secondary" htmlFor="v-req">
            Требования
          </label>
          <textarea
            id="v-req"
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Опыт, навыки, языки"
            className="mt-1.5 w-full resize-none rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </div>

        {error && <p className="text-sm text-danger lg:col-span-2 xl:col-span-3">{error}</p>}

        <div className="flex gap-2 lg:col-span-2 xl:col-span-3">
          <Button type="submit" disabled={!title.trim() || busy}>
            {busy ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : 'Опубликовать'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отменить
          </Button>
        </div>
      </form>
    </Card>
  );
}

function VacancyGroup({ title, items, muted }: { title: string; items: Vacancy[]; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((v) => {
          const salary = formatSalary(v);
          return (
            <Card key={v.id} className={muted ? 'min-w-0 p-4 opacity-70' : 'min-w-0 p-4'}>
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
            </Card>
          );
        })}
      </div>
    </section>
  );
}
