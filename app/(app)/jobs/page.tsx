'use client';

import * as React from 'react';
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react';
import { CandidateSetupInvite, ProfileProgress } from '@/components/candidate/profile-overview';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { VacancyCard } from '@/components/vacancy/vacancy-card';
import { VacancyDetails } from '@/components/vacancy/vacancy-details';
import { vacanciesApi, type Vacancy, type VacancyFilters } from '@/lib/api/vacancies';
import { cn } from '@/lib/utils';

/**
 * Search jobs — экран Jobs соискателя.
 *
 * На телефоне это список, из которого проваливаешься в карточку. На широком
 * экране обе части видны сразу: список слева, вакансия справа. Так не теряется
 * место в списке при просмотре десятка вакансий подряд — на десктопе это
 * основной сценарий.
 */

type Tab = 'all' | 'matches';

/** Фильтры — только те, что боевой сервер действительно применяет (проверено
 *  запросами): city, currency, min_salary. Тип занятости, бенефиты и тип
 *  заведения в коде бэкенда есть, но прод их пока игнорирует. */
interface Filters {
  city: string;
  currency: string;
  minSalary: string;
}
const NO_FILTERS: Filters = { city: '', currency: '', minSalary: '' };
const CURRENCIES = ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'USD'] as const;
const SELECT = 'h-11 w-full rounded-full border border-line-strong bg-surface px-4 text-text-primary focus-ring';

export default function JobsPage() {
  const [tab, setTab] = React.useState<Tab>('all');
  const [items, setItems] = React.useState<Vacancy[]>([]);
  const [selected, setSelected] = React.useState<Vacancy | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState<Filters>(NO_FILTERS);
  const [applied, setApplied] = React.useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = React.useState(false);
  const [cities, setCities] = React.useState<string[]>([]);
  // На телефоне список и вакансия рядом не помещаются — показываем что-то
  // одно. Раньше вакансия там была просто скрыта: открыть её и откликнуться
  // с телефона было нельзя.
  const [open, setOpen] = React.useState(false);

  // Поиск и фильтры не дёргают сервер на каждую букву.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setApplied(filters);
    }, 400);
    return () => clearTimeout(t);
  }, [search, filters]);

  React.useEffect(() => {
    vacanciesApi
      .cities()
      .then((list) => setCities(Array.isArray(list) ? list : []))
      .catch(() => setCities([]));
  }, []);

  const activeFilters = Object.values(applied).filter(Boolean).length;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: VacancyFilters = {
      search: query || undefined,
      city: applied.city || undefined,
      currency: applied.currency || undefined,
      // Сервер отвечает 400 на нечисло — такое просто не отправляем.
      min_salary: /^\d+$/.test(applied.minSalary) ? Number(applied.minSalary) : undefined,
    };
    const load = tab === 'matches' ? vacanciesApi.matches() : vacanciesApi.list(params);

    load
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        // На широком экране правая половина не должна быть пустой.
        setSelected((prev) => (prev && list.some((v) => v.id === prev.id) ? prev : (list[0] ?? null)));
      })
      .catch(() => {
        if (!cancelled) setError('Could not load jobs. Check your connection and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, query, applied]);

  const patch = (v: Vacancy) => {
    setItems((list) => list.map((x) => (x.id === v.id ? { ...x, ...v } : x)));
    setSelected((s) => (s && s.id === v.id ? { ...s, ...v } : s));
  };

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={loading ? undefined : `Found: ${items.length}`}
        actions={
          <div className="flex items-center gap-2">
            {(['all', 'matches'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-ring',
                  tab === t
                    ? 'bg-accent-strong text-on-accent'
                    : 'bg-surface-muted text-text-secondary hover:text-text-primary',
                )}
              >
                {t === 'all' ? 'All' : 'For you'}
              </button>
            ))}
          </div>
        }
      />

      <div className={cn('space-y-3 px-5 py-4 md:px-8 lg:block', open && 'hidden')}>
        {/* Бриф кандидата, пункт 9: вместо пустой шкалы — прогресс профиля
            с конкретным следующим действием. */}
        <CandidateSetupInvite />
        <ProfileProgress />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Position, company, city"
              aria-label="Search jobs"
              className="h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-text-primary placeholder:text-text-tertiary focus-ring"
            />
          </div>
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={() => setShowFilters((x) => !x)}
            disabled={tab === 'matches'}
            title={tab === 'matches' ? 'Filters apply to All jobs' : undefined}
            aria-expanded={showFilters}
            aria-controls="job-filters"
            aria-label={activeFilters > 0 ? `Filters, ${activeFilters} active` : 'Filters'}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-strong px-1 text-xs text-on-accent">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {showFilters && tab === 'all' && (
          <Card id="job-filters" className="grid gap-3 p-4 sm:grid-cols-3">
            <label className="text-sm text-text-secondary">
              City
              <select
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                className={cn(SELECT, 'mt-1')}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-text-secondary">
              Currency
              <select
                value={filters.currency}
                onChange={(e) => setFilters((f) => ({ ...f, currency: e.target.value }))}
                className={cn(SELECT, 'mt-1')}
              >
                <option value="">Any</option>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-text-secondary">
              Salary from
              <input
                inputMode="numeric"
                value={filters.minSalary}
                onChange={(e) => setFilters((f) => ({ ...f, minSalary: e.target.value.replace(/\D/g, '') }))}
                placeholder="e.g. 4000"
                className={cn(SELECT, 'mt-1 placeholder:text-text-tertiary')}
              />
            </label>
            {Object.values(filters).some(Boolean) && (
              <button
                type="button"
                onClick={() => setFilters(NO_FILTERS)}
                className="w-fit rounded text-sm font-medium text-accent-text underline-offset-2 hover:underline focus-ring sm:col-span-3"
              >
                Reset filters
              </button>
            )}
          </Card>
        )}
      </div>

      <div className="grid gap-4 px-5 pb-8 md:px-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div
          className={cn(
            'space-y-3 lg:block lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto lg:pr-1 scroll-slim',
            open && 'hidden',
          )}
        >
          {loading && (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          )}

          {!loading && error && (
            <Card className="p-5">
              <p className="text-sm text-danger">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setQuery((q) => q + '')}>
                Try again
              </Button>
            </Card>
          )}

          {!loading && !error && items.length === 0 && (
            <Card className="p-8 text-center">
              <p className="font-medium text-text-primary">Nothing found</p>
              <p className="mt-1 text-sm text-text-secondary">
                {tab === 'matches'
                  ? 'The selection is built from your CV. Fill in your profile to see it.'
                  : activeFilters > 0
                    ? 'Try a different query or reset the filters.'
                    : 'Try a different query.'}
              </p>
            </Card>
          )}

          {!loading &&
            !error &&
            items.map((v) => (
              <VacancyCard
                key={v.id}
                vacancy={v}
                selected={selected?.id === v.id}
                onSelect={(x) => {
                  setSelected(x);
                  setOpen(true);
                  // На телефоне вакансия открывается вместо списка — с её начала.
                  if (window.matchMedia('(max-width: 1023px)').matches) window.scrollTo({ top: 0 });
                }}
                onToggleSave={(x) => {
                  patch({ ...x, isSaved: !x.isSaved });
                  void vacanciesApi.toggleFavorite(x.id).catch(() => patch(x));
                }}
              />
            ))}
        </div>

        <Card
          className={cn(
            'p-6 lg:block lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto scroll-slim',
            open ? 'block' : 'hidden',
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="-ml-1 mb-4 inline-flex items-center gap-1 rounded text-sm font-medium text-text-secondary hover:text-text-primary focus-ring lg:hidden"
          >
            <ChevronLeft size={18} />
            Back to jobs
          </button>
          {selected ? (
            <VacancyDetails vacancy={selected} onChanged={patch} />
          ) : (
            <p className="py-16 text-center text-sm text-text-secondary">
              Pick a job on the left to see the details.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
