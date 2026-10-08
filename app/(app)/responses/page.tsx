'use client';

import * as React from 'react';
import { Check, MapPin, Plane, Video, X } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import {
  applicationsApi,
  FUNNEL,
  funnelStage,
  RELOCATION_LABEL,
  salaryLabel,
  STATUS_LABEL,
  STATUS_TONE,
  type ApplicantApplication,
  type ApplicationStatus,
} from '@/lib/api/applications';
import { cn, plural } from '@/lib/utils';

/**
 * Applications соискателя — экран applicant_responses_screen.dart мобилки.
 *
 * Раздел заказчица не правила: прозрачность статусов ей как раз нравится,
 * поэтому здесь ровно то же поведение, что в приложении, только в раскладке
 * под широкий экран.
 */

const DATE_FMT = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium', STATUS_TONE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Application stages.
 *
 * Показываем все шаги с названиями, а не одну полосу: кандидату важно видеть
 * не только где он сейчас, но и сколько осталось. Это то же требование
 * прозрачности, что в документе заказчицы про «Our Hiring Process» —
 * человек заранее понимает, что его ждёт.
 *
 * Отказ рисуем отдельной строкой: он не «шаг вперёд» по воронке.
 */
function Funnel({ status }: { status: ApplicationStatus }) {
  if (status === 'REJECTED') {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-sm bg-danger-surface px-3 py-2 text-sm text-danger">
        <X size={15} className="shrink-0" />
        The employer declined this application
      </p>
    );
  }

  const current = FUNNEL.indexOf(funnelStage(status));
  if (current < 0) return null;

  return (
    // Названия этапов длиннее, чем шестая часть узкой карточки. Позволяем
    // цепочке прокручиваться внутри себя — иначе она распирает страницу
    // и появляется горизонтальная прокрутка на телефоне.
    <ol
      className="scroll-slim -mx-1 mt-4 flex items-start gap-0 overflow-x-auto px-1 pb-1"
      aria-label="Application stages"
    >
      {FUNNEL.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex min-w-16 flex-1 flex-col items-center gap-1.5">
            <span className="flex w-full items-center" aria-hidden>
              {/* Линии по бокам точки. У крайних шагов половина линии
                  прозрачная — иначе полоса торчит за пределы цепочки. */}
              <span className={cn('h-0.5 flex-1 rounded-full', i === 0 ? 'bg-transparent' : done || active ? 'bg-accent' : 'bg-surface-alt')} />
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  done && 'border-accent bg-accent',
                  active && 'border-accent bg-surface',
                  !done && !active && 'border-surface-alt bg-surface',
                )}
              >
                {done && <Check size={11} className="text-on-accent" strokeWidth={3} />}
                {active && <span className="h-2 w-2 rounded-full bg-accent" />}
              </span>
              <span className={cn('h-0.5 flex-1 rounded-full', i === FUNNEL.length - 1 ? 'bg-transparent' : done ? 'bg-accent' : 'bg-surface-alt')} />
            </span>
            <span
              className={cn(
                'text-center text-[11px] leading-tight',
                active ? 'font-semibold text-text-primary' : 'text-text-secondary',
              )}
            >
              {STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ApplicationCard({ a, index = 0 }: { a: ApplicantApplication; index?: number }) {
  return (
    // min-w-0 обязателен: элемент сетки по умолчанию не сжимается уже своего
    // содержимого, и длинная цепочка этапов распирала карточку вместе
    // со страницей вместо того, чтобы прокручиваться внутри себя.
    <Card className="rise min-w-0 p-5" style={riseStyle(index)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-text-primary">{a.vacancyTitle}</h2>
          <p className="mt-0.5 text-sm text-text-secondary">{a.companyName}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <p className="mt-3 font-medium text-text-primary">{salaryLabel(a)}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
        {a.address && (
          <span className="flex items-center gap-1.5">
            <MapPin size={13} />
            {a.address}
          </span>
        )}
        <span>Applied {DATE_FMT.format(a.createdAt)}</span>
      </div>

      <Funnel status={a.status} />

      {a.coverLetter && (
        <p className="mt-4 whitespace-pre-line border-t border-line pt-3 text-sm leading-relaxed text-text-secondary">
          {a.coverLetter}
        </p>
      )}

      {/* Визовый этап показываем, только когда он начался — как в мобилке:
          у отклика в статусе «Не просмотрен» такой блок сбивает с толку. */}
      {a.relocationStep !== 'NOT_STARTED' && (
        <div className="mt-4 rounded-sm bg-surface-muted p-3.5">
          <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Plane size={15} className="text-accent" />
            Relocation: {RELOCATION_LABEL[a.relocationStep]}
          </p>
          {a.relocationNote && (
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{a.relocationNote}</p>
          )}
          {a.expectedArrival && (
            <p className="mt-1.5 text-sm text-text-secondary">
              Expected arrival: {DATE_FMT.format(a.expectedArrival)}
            </p>
          )}
        </div>
      )}

      {a.requiresVideoGreeting && !a.videoGreetingUrl && (
        <p className="mt-4 flex items-center gap-2 rounded-sm bg-info-surface px-3 py-2 text-sm text-on-info-surface">
          <Video size={15} className="shrink-0" />
          A video intro is required. It is recorded in the mobile app.
        </p>
      )}

      {a.videoGreetingUrl && (
        <p className="mt-4 flex items-center gap-2 text-sm text-success">
          <Check size={15} />
          Video intro sent
        </p>
      )}
    </Card>
  );
}

type Filter = 'all' | 'active' | 'archive';

export default function ResponsesPage() {
  const [items, setItems] = React.useState<ApplicantApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    applicationsApi
      .mine()
      .then((list) => {
        if (cancelled) return;
        // Свежие сверху: в приложении порядок такой же.
        setItems([...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      })
      .catch(() => !cancelled && setError('Could not load applications.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const shown = items.filter((a) => {
    if (filter === 'active') return a.status !== 'REJECTED' && a.status !== 'HIRED';
    if (filter === 'archive') return a.status === 'REJECTED' || a.status === 'HIRED';
    return true;
  });

  const counts = {
    all: items.length,
    active: items.filter((a) => a.status !== 'REJECTED' && a.status !== 'HIRED').length,
    archive: items.filter((a) => a.status === 'REJECTED' || a.status === 'HIRED').length,
  };

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle={
          loading ? undefined : `${items.length} ${plural(items.length, 'application')}`
        }
        actions={
          <div className="flex items-center gap-2">
            {(
              [
                ['all', 'All'],
                ['active', 'In progress'],
                ['archive', 'Closed'],
              ] as [Filter, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-ring',
                  filter === id
                    ? 'bg-accent-strong text-on-accent'
                    : 'bg-surface-muted text-text-secondary hover:text-text-primary',
                )}
              >
                {label}
                {counts[id] > 0 && <span className="ml-1.5 opacity-70">{counts[id]}</span>}
              </button>
            ))}
          </div>
        }
      />

      <div className="px-5 py-6 md:px-8">
        {loading && (
          <ListSkeleton count={4} />
        )}

        {!loading && error && (
          <Card className="p-5">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </Button>
          </Card>
        )}

        {!loading && !error && shown.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-medium text-text-primary">
              {items.length === 0 ? 'No applications yet' : 'Nothing in this tab'}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {items.length === 0
                ? 'Apply to a job and its status, plus your chat with the employer, will appear here.'
                : 'Check the other tabs.'}
            </p>
          </Card>
        )}

        {!loading && !error && shown.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {shown.map((a, i) => (
              <ApplicationCard key={a.id} a={a} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
