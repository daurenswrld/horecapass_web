'use client';

import * as React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { VacancyCard } from '@/components/vacancy/vacancy-card';
import { VacancyDetails } from '@/components/vacancy/vacancy-details';
import { vacanciesApi, type Vacancy } from '@/lib/api/vacancies';
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

export default function JobsPage() {
  const [tab, setTab] = React.useState<Tab>('all');
  const [items, setItems] = React.useState<Vacancy[]>([]);
  const [selected, setSelected] = React.useState<Vacancy | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');

  // Поиск не дёргает сервер на каждую букву.
  React.useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = tab === 'matches' ? vacanciesApi.matches() : vacanciesApi.list({ search: query || undefined });

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
  }, [tab, query]);

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

      <div className="px-5 py-4 md:px-8">
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
          <Button variant="secondary" className="shrink-0" disabled title="Filters will arrive with the backend sections">
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 px-5 pb-8 md:px-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="space-y-3 lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto lg:pr-1 scroll-slim">
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
                onSelect={setSelected}
                onToggleSave={(x) => {
                  patch({ ...x, isSaved: !x.isSaved });
                  void vacanciesApi.toggleFavorite(x.id).catch(() => patch(x));
                }}
              />
            ))}
        </div>

        <Card className="hidden p-6 lg:block lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto scroll-slim">
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
