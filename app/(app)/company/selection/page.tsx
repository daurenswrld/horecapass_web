'use client';

import * as React from 'react';
import { Bookmark, Search, Trash2, UserCheck, UserX, X } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { DemoNotice } from '@/components/demo-notice';
import { CandidatePanel } from '@/components/employer/candidate-panel';
import { ShortlistButton, useShortlistGroups } from '@/components/employer/shortlist';
import {
  companyApplicationsApi,
  shortlistApi,
  FUNNEL,
  funnelStage,
  STATUS_LABEL,
  STATUS_TONE,
  type ApplicationStatus,
  type CompanyApplication,
} from '@/lib/api/applications';
import { basket as basketStore } from '@/lib/demo/storage';
import { isSample, SAMPLE_CANDIDATES } from '@/lib/demo/samples';
import { demoSession } from '@/lib/demo/session';
import { cn, plural } from '@/lib/utils';

/**
 * Find candidates — раздел с правками заказчицы (пункты 15–17 документа).
 *
 * Список кандидатов и перевод по этапам работают по-настоящему: эндпоинты
 * `/api/applications/company/` и `/api/applications/<id>/status/` есть.
 * Карточка кандидата со сменой этапа, чатом и AI-разбором —
 * components/employer/candidate-panel.tsx.
 *
 * Отобранные — по группам на сервере (N-06b/c; заказчица 14.10: «отложить…
 * несколько групп: пригласить на собеседование, рассмотреть позже»). Те же
 * группы видит мобилка. Массовые действия идут по одному запросу на отклик:
 * пакетной ручки нет, а результат тот же. Выбранные галочками помнит браузер.
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
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [group, setGroup] = React.useState<number | 'ANY' | null>(null);
  const opened = items.find((a) => a.id === openId) ?? null;
  const { groups, local, create, remove } = useShortlistGroups(!loading, sample || !!demoSession.get());
  const patchItem = React.useCallback(
    (id: number, patch: Partial<CompanyApplication>) =>
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [],
  );
  const setStatus = React.useCallback(
    (id: number, status: ApplicationStatus) => patchItem(id, { status }),
    [patchItem],
  );

  /** Кладёт отклики в группу (null — убирает). Сначала на экране, потом на сервере. */
  const shortlist = React.useCallback(
    async (ids: number[], groupId: number | null) => {
      const name = groups.find((g) => g.id === groupId)?.name ?? null;
      const before = new Map(items.filter((a) => ids.includes(a.id)).map((a) => [a.id, a]));
      setItems((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, shortlistGroupId: groupId, shortlistGroupName: name } : a)),
      );
      const real = ids.filter((id) => !isSample(id));
      if (local || !real.length) return 0;
      const results = await Promise.allSettled(real.map((id) => shortlistApi.put(id, groupId)));
      const failed = real.filter((_, i) => results[i].status === 'rejected');
      if (failed.length) setItems((prev) => prev.map((a) => (failed.includes(a.id) ? before.get(a.id) ?? a : a)));
      return failed.length;
    },
    [groups, items, local],
  );
  const close = React.useCallback(() => setOpenId(null), []);
  // ?application=<id> — переход из чата сразу к карточке кандидата, один раз.
  const deepLinked = React.useRef(false);
  React.useEffect(() => {
    if (deepLinked.current || !items.length) return;
    const wanted = Number(new URLSearchParams(window.location.search).get('application'));
    deepLinked.current = true;
    if (wanted && items.some((a) => a.id === wanted)) setOpenId(wanted);
  }, [items]);

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
        // Образцы кандидатов — только в демо; у настоящего аккаунта честно пусто.
        const demo = !!demoSession.get();
        setSample(demo && list.length === 0);
        setItems(list.length > 0 || !demo ? list : SAMPLE_CANDIDATES);
      })
      .catch(() => {
        if (cancelled) return;
        if (demoSession.get()) {
          setSample(true);
          setItems(SAMPLE_CANDIDATES);
        } else setError('Could not load candidates. Please refresh.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const byGroup =
    group === null
      ? items
      : group === 'ANY'
        ? items.filter((a) => a.shortlistGroupId != null)
        : items.filter((a) => a.shortlistGroupId === group);
  const shown = stage === 'ALL' ? byGroup : byGroup.filter((a) => funnelStage(a.status) === stage);
  const inGroup = (id: number) => items.filter((a) => a.shortlistGroupId === id).length;
  const groupTabs: [number | 'ANY' | null, string, number][] = [
    [null, 'All responses', items.length],
    ['ANY', 'Shortlisted', items.filter((a) => a.shortlistGroupId != null).length],
    ...groups.map((g): [number, string, number] => [g.id, g.name, inGroup(g.id)]),
  ];
  const customGroup = typeof group === 'number' ? groups.find((g) => g.id === group && g.kind === 'CUSTOM') : undefined;

  const deleteGroup = async () => {
    if (!customGroup) return;
    try {
      await remove(customGroup.id);
      setItems((prev) =>
        prev.map((a) => (a.shortlistGroupId === customGroup.id ? { ...a, shortlistGroupId: null, shortlistGroupName: null } : a)),
      );
      setGroup(null);
      setBulkNote(`Group “${customGroup.name}” deleted. Its candidates stay in the responses.`);
    } catch {
      setBulkNote('Could not delete the group. Please try again.');
    }
  };
  const allShownSelected = shown.length > 0 && shown.every((a) => selected.includes(a.id));

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Массовые действия — через смену этапа у каждого выбранного (тот же
  // PATCH /api/applications/<id>/status/): отдельной пакетной ручки нет, а
  // результат для работодателя тот же. В демо и на образцах — только на экране.
  const BULK: Record<string, ApplicationStatus> = { Invite: 'INVITED', Reject: 'REJECTED' };
  const bulkShortlist = async (groupId: number | null) => {
    const ids = selected.filter((id) => items.some((a) => a.id === id));
    if (!ids.length) return;
    setSelected([]);
    const name = groups.find((g) => g.id === groupId)?.name;
    setBulkNote(`Updating ${ids.length} ${plural(ids.length, 'candidate')}…`);
    const failed = await shortlist(ids, groupId);
    setBulkNote(
      failed
        ? `${failed} of ${ids.length} could not be updated. Please try again.`
        : name
          ? `Added to “${name}”: ${ids.length} ${plural(ids.length, 'candidate')}.`
          : `Removed from the shortlist: ${ids.length} ${plural(ids.length, 'candidate')}.`,
    );
  };
  const bulk = async (label: string) => {
    const status = BULK[label];
    const ids = selected.filter((id) => items.some((a) => a.id === id));
    if (!status || !ids.length) return;
    setItems((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, status } : a)));
    setSelected([]);
    setBulkNote(`Updating ${ids.length} ${plural(ids.length, 'candidate')}…`);
    const real = ids.filter((id) => !isSample(id));
    const results = await Promise.allSettled(real.map((id) => companyApplicationsApi.setStatus(id, status)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkNote(
      failed
        ? `${failed} of ${real.length} could not be updated. Please try again.`
        : `${STATUS_LABEL[status]}: ${ids.length} ${plural(ids.length, 'candidate')}. They are notified.`,
    );
  };

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={loading ? undefined : `${items.length} ${plural(items.length, 'application')}`}
      />

      <div className="space-y-4 px-5 py-5 md:px-8">
        {sample && (
          <DemoNotice
            what="There are no applications on the server yet, so sample candidates are shown. Stages and shortlist groups change only on this screen."
            endpoint="GET /api/applications/company/"
          />
        )}

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

        {/* Группы отобранных: все отклики, все отобранные, каждая группа со счётчиком. */}
        {groups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Shortlist groups">
            <Bookmark size={16} aria-hidden className="mr-1 text-text-secondary" />
            {groupTabs.map(([id, label, count]) => (
              <button
                key={String(id)}
                type="button"
                aria-pressed={group === id}
                onClick={() => setGroup(id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-ring',
                  group === id
                    ? 'border-accent-strong bg-accent-muted text-text-primary dark:border-accent'
                    : 'border-line bg-surface text-text-secondary hover:text-text-primary',
                )}
              >
                {label} <span className="text-text-tertiary">{count}</span>
              </button>
            ))}
            {customGroup && (
              <button
                type="button"
                onClick={() => void deleteGroup()}
                className="ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-danger hover:bg-danger-surface focus-ring"
              >
                <Trash2 size={14} aria-hidden />
                Delete group
              </button>
            )}
          </div>
        )}

        {loading && (
          <ListSkeleton count={4} />
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
              {group !== null && items.length > 0
                ? 'No candidates in this group yet. Use the bookmark on a response to shortlist it.'
                : 'Applications will appear here as soon as candidates apply to your jobs.'}
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

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {shown.map((a, i) => {
                const picked = selected.includes(a.id);
                return (
                  <Card
                    key={a.id}
                    style={riseStyle(i)}
                    className={cn(
                      'rise flex items-start gap-3 p-4 transition-[border-color,box-shadow]',
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
                    {/* Вся карточка, кроме галочки, открывает кандидата. */}
                    <button
                      type="button"
                      onClick={() => setOpenId(a.id)}
                      aria-label={`Open ${a.applicant}`}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-md text-left focus-ring"
                    >
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
                        {a.shortlistGroupName && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 font-medium text-accent-text">
                            <Bookmark size={11} aria-hidden />
                            {a.shortlistGroupName}
                          </span>
                        )}
                      </p>
                      </div>
                    </button>
                    {groups.length > 0 && (
                      <ShortlistButton
                        name={a.applicant}
                        groups={groups}
                        current={a.shortlistGroupId}
                        onPick={(g) => void shortlist([a.id], g)}
                        onCreate={create}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {bulkNote && selected.length === 0 && (
        <p role="status" className="sticky bottom-0 z-20 border-t border-line bg-surface/95 px-5 py-3 text-sm text-text-primary backdrop-blur md:px-8">
          {bulkNote}
        </p>
      )}

      {opened && (
        <CandidatePanel
          app={opened}
          onClose={close}
          onStatus={setStatus}
          onViewed={() => patchItem(opened.id, { viewed: true })}
          groups={groups}
          onShortlist={(g) => shortlist([opened.id], g)}
          onCreateGroup={create}
        />
      )}

      {/* Панель массовых действий — «25 Candidates selected → Invite selected». */}
      {selected.length > 0 && (
        <div className="sticky bottom-0 z-20 border-t border-line bg-surface/95 px-5 py-3.5 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 font-semibold text-text-primary">
              <Bookmark size={18} className="text-accent" />
              Selected: {selected.length}
            </span>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void bulk('Invite')}>
                <UserCheck size={15} />
                Invite
              </Button>
              {groups.map((g) => (
                <Button key={g.id} variant="secondary" size="sm" onClick={() => void bulkShortlist(g.id)}>
                  <Bookmark size={15} />
                  {g.name}
                </Button>
              ))}
              <Button variant="secondary" size="sm" onClick={() => void bulk('Reject')}>
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


        </div>
      )}
    </>
  );
}
