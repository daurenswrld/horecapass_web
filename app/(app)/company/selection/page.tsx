'use client';

import * as React from 'react';
import { Check, MessageSquare, Search, ShoppingBasket, UserCheck, UserX, X } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { DemoNotice } from '@/components/demo-notice';
import {
  companyApplicationsApi,
  FUNNEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ApplicationStatus,
  type CompanyApplication,
} from '@/lib/api/applications';
import { basket as basketStore } from '@/lib/demo/storage';
import { isSample, SAMPLE_CANDIDATES } from '@/lib/demo/samples';
import { cn, plural } from '@/lib/utils';

/**
 * Find candidates — раздел с правками заказчицы (пункты 15–17 документа).
 *
 * Список кандидатов и перевод по этапам работают по-настоящему: эндпоинты
 * `/api/applications/company/` и `/api/applications/<id>/status/` есть.
 *
 * Корзина и массовые действия — показ замысла: «Employer добавляет кандидатов
 * в свою корзину... и одним действием отправляет приглашение сразу нескольким».
 * Серверной ручки под пакетную операцию нет, поэтому выбор живёт в браузере,
 * и на экране об этом написано.
 */

const DATE_FMT = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });

function Avatar({ name, url }: { name: string; url: string | null }) {
  const [broken, setBroken] = React.useState(false);
  if (url && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" onError={() => setBroken(true)} className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <span
      aria-hidden
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-alt text-sm font-semibold text-text-secondary"
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function MatchBadge({ score }: { score: number }) {
  const tone =
    score >= 80 ? 'bg-surface-alt text-success' : score >= 55 ? 'bg-info-surface text-on-info-surface' : 'bg-surface-muted text-text-secondary';
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', tone)} title="Match with the job">
      {score}%
    </span>
  );
}

export default function SelectionPage() {
  const [items, setItems] = React.useState<CompanyApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [stage, setStage] = React.useState<ApplicationStatus | 'ALL'>('ALL');
  const [selected, setSelected] = React.useState<number[]>([]);
  const [bulkNote, setBulkNote] = React.useState<string | null>(null);
  const [sample, setSample] = React.useState(false);

  React.useEffect(() => setSelected(basketStore.load()), []);
  React.useEffect(() => basketStore.save(selected), [selected]);

  React.useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    companyApplicationsApi
      .list({ search: query || undefined })
      .then((list) => {
        if (cancelled) return;
        // На пустом аккаунте показываем примеры — иначе раздел выглядит
        // сломанным. Как появятся живые отклики, примеры исчезнут сами.
        setSample(list.length === 0);
        setItems(list.length > 0 ? list : SAMPLE_CANDIDATES);
      })
      .catch(() => {
        if (cancelled) return;
        setSample(true);
        setItems(SAMPLE_CANDIDATES);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const shown = stage === 'ALL' ? items : items.filter((a) => a.status === stage);
  const allShownSelected = shown.length > 0 && shown.every((a) => selected.includes(a.id));

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulk = (label: string) => {
    setBulkNote(
      `${label} for ${selected.length} ${plural(selected.length, 'candidate')}: ` +
        'bulk actions run on the server, and the endpoint does not exist yet.',
    );
  };

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={loading ? undefined : `${items.length} ${plural(items.length, 'application')}`}
      />

      <div className="space-y-4 px-5 py-5 md:px-8">
        <DemoNotice
          what={
            sample
              ? 'There are no applications on the server yet, so sample candidates are shown. The basket and bulk actions are a preview too: the selection is kept in the browser.'
              : 'The candidate list and moving between stages are real. The basket and bulk actions are a preview: the selection is kept in the browser.'
          }
          endpoint="POST /api/applications/company/bulk/"
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, job"
              aria-label="Search candidates"
              className="h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-text-primary placeholder:text-text-tertiary focus-ring"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['ALL', ...FUNNEL] as (ApplicationStatus | 'ALL')[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-ring',
                  stage === s
                    ? 'bg-accent-strong text-on-accent'
                    : 'bg-surface-muted text-text-secondary hover:text-text-primary',
                )}
              >
                {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid place-items-center py-20">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <Card className="p-5">
            <p className="text-sm text-danger">{error}</p>
          </Card>
        )}

        {!loading && !error && shown.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-medium text-text-primary">No candidates</p>
            <p className="mt-1 text-sm text-text-secondary">
              Applications will appear here as soon as candidates apply to your jobs.
            </p>
          </Card>
        )}

        {!loading && !error && shown.length > 0 && (
          <>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={allShownSelected}
                onChange={() =>
                  setSelected((prev) =>
                    allShownSelected
                      ? prev.filter((id) => !shown.some((a) => a.id === id))
                      : [...new Set([...prev, ...shown.map((a) => a.id)])],
                  )
                }
                className="h-4 w-4 accent-[rgb(var(--accent))]"
              />
              Select all in the list
            </label>

            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {shown.map((a) => {
                const picked = selected.includes(a.id);
                return (
                  <Card
                    key={a.id}
                    className={cn(
                      'flex items-start gap-3 p-4 transition-[border-color,box-shadow]',
                      picked && 'border-accent shadow-card',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={picked}
                      onChange={() => toggle(a.id)}
                      aria-label={`Select ${a.applicant}`}
                      className="mt-3 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
                    />
                    <Avatar name={a.applicant} url={a.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-text-primary">{a.applicant}</span>
                        {a.matchScore != null && <MatchBadge score={a.matchScore} />}
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            STATUS_TONE[a.status],
                          )}
                        >
                          {STATUS_LABEL[a.status]}
                        </span>
                        {isSample(a.id) && (
                          <span className="rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[11px] text-text-secondary">
                            sample
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-text-secondary">{a.vacancyTitle}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Applied {DATE_FMT.format(a.createdAt)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Панель массовых действий — «25 Candidates selected → Invite selected». */}
      {selected.length > 0 && (
        <div className="sticky bottom-0 z-20 border-t border-line bg-surface/95 px-5 py-3.5 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 font-semibold text-text-primary">
              <ShoppingBasket size={18} className="text-accent" />
              Selected: {selected.length}
            </span>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => bulk('Invite to interview')}>
                <UserCheck size={15} />
                Invite
              </Button>
              <Button variant="secondary" size="sm" onClick={() => bulk('Shortlist')}>
                <Check size={15} />
                Shortlist
              </Button>
              <Button variant="secondary" size="sm" onClick={() => bulk('Send a message')}>
                <MessageSquare size={15} />
                Message
              </Button>
              <Button variant="secondary" size="sm" onClick={() => bulk('Reject')}>
                <UserX size={15} />
                Reject
              </Button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setBulkNote(null);
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded text-sm text-text-secondary hover:text-text-primary focus-ring"
            >
              <X size={15} />
              Clear selection
            </button>
          </div>

          {bulkNote && (
            <DemoNotice className="mt-3" what={bulkNote} endpoint="POST /api/applications/company/bulk/" />
          )}
        </div>
      )}
    </>
  );
}
