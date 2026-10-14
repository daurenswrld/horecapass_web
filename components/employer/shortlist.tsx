'use client';

import * as React from 'react';
import { Bookmark, BookmarkCheck, Check, Plus, Trash2, X } from 'lucide-react';
import { Button, Spinner } from '@/components/ui/primitives';
import { shortlistApi, type ShortlistGroup } from '@/lib/api/applications';
import { cn } from '@/lib/utils';

/**
 * Группы отобранных кандидатов (N-06b/c, голосовое заказчицы 14.10: «кнопка
 * отложить… чтобы можно было несколько групп: пригласить на собеседование,
 * рассмотреть позже»). Группы хранит сервер — те же, что в мобилке.
 *
 * В демо (без сервера) группы живут только на экране: две стандартные
 * с отрицательными id, как у образцов кандидатов. У настоящего аккаунта при
 * ошибке сервера группы просто не показываются — молча «сохранять» в никуда нельзя.
 */

const LOCAL_GROUPS: ShortlistGroup[] = [
  { id: -1, name: 'Invite to interview', kind: 'INTERVIEW', count: 0 },
  { id: -2, name: 'Consider later', kind: 'LATER', count: 0 },
];

export function useShortlistGroups(enabled: boolean, demo: boolean) {
  const [groups, setGroups] = React.useState<ShortlistGroup[]>([]);
  const [local, setLocal] = React.useState(false);

  const reload = React.useCallback(async () => {
    try {
      setGroups(await shortlistApi.groups());
      setLocal(false);
    } catch {
      setGroups(demo ? LOCAL_GROUPS : []);
      setLocal(demo);
    }
  }, [demo]);

  React.useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const create = async (name: string) => {
    // Та же группа второй раз не создаётся: кандидат кладётся в уже существующую.
    const same = groups.find((g) => g.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (same) return same;
    if (local) {
      const group: ShortlistGroup = { id: -(groups.length + 1), name, kind: 'CUSTOM', count: 0 };
      setGroups((g) => [...g, group]);
      return group;
    }
    const group = await shortlistApi.create(name);
    setGroups((g) => [...g, group]);
    return group;
  };

  const remove = async (id: number) => {
    if (!local) await shortlistApi.remove(id);
    setGroups((g) => g.filter((x) => x.id !== id));
  };

  return { groups, local, create, remove };
}

/** Строка групп: выбор группы, «убрать из отобранных» и новая группа. */
export function GroupPicker({
  groups,
  current,
  onPick,
  onCreate,
  busy,
  className,
}: {
  groups: ShortlistGroup[];
  current: number | null;
  onPick: (group: number | null) => void;
  onCreate: (name: string) => Promise<ShortlistGroup>;
  busy?: boolean;
  className?: string;
}) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    const value = name.trim();
    if (!value) return;
    setError(null);
    try {
      const group = await onCreate(value);
      setName('');
      setAdding(false);
      onPick(group.id);
    } catch {
      setError('Could not create the group. Please try again.');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Shortlist to a group">
        {groups.map((g) => {
          const on = current === g.id;
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={on}
              disabled={busy}
              onClick={() => onPick(on ? null : g.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-ring disabled:opacity-70',
                on ? 'bg-accent-strong text-on-accent dark:bg-accent' : 'bg-surface-muted text-text-secondary hover:text-text-primary',
              )}
            >
              {on ? <BookmarkCheck size={14} aria-hidden /> : <Bookmark size={14} aria-hidden />}
              {g.name}
            </button>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary focus-ring"
          >
            <Plus size={14} aria-hidden />
            New group
          </button>
        )}
        {busy && <Spinner className="h-4 w-4 self-center" />}
      </div>
      {adding && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            maxLength={60}
            aria-label="Group name"
            className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <Button size="sm" type="submit" disabled={!name.trim()}>
            Create
          </Button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setAdding(false);
              setName('');
            }}
            className="rounded-full p-1.5 text-text-secondary hover:bg-surface-muted focus-ring"
          >
            <X size={16} />
          </button>
        </form>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

/** Кнопка-закладка на карточке отклика с выпадающим выбором группы. */
export function ShortlistButton({
  name,
  groups,
  current,
  onPick,
  onCreate,
}: {
  name: string;
  groups: ShortlistGroup[];
  current: number | null;
  onPick: (group: number | null) => void;
  onCreate: (name: string) => Promise<ShortlistGroup>;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={current ? `${name}: change shortlist group` : `Shortlist ${name}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'grid h-9 w-9 place-items-center rounded-full transition-colors focus-ring',
          current ? 'bg-accent-muted text-accent-text' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
        )}
      >
        {current ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-64 rounded-lg border border-line bg-surface p-2 shadow-lift">
          <p className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">Shortlist to a group</p>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                onPick(g.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-text-primary hover:bg-surface-muted focus-ring"
            >
              {g.name}
              {current === g.id && <Check size={15} className="text-accent-text" aria-hidden />}
            </button>
          ))}
          {current != null && (
            <button
              type="button"
              onClick={() => {
                onPick(null);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-danger hover:bg-danger-surface focus-ring"
            >
              <Trash2 size={14} aria-hidden />
              Remove from shortlist
            </button>
          )}
          <div className="mt-1 border-t border-line pt-2">
            <NewGroupInline
              onCreate={async (n) => {
                const g = await onCreate(n);
                onPick(g.id);
                setOpen(false);
                return g;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NewGroupInline({ onCreate }: { onCreate: (name: string) => Promise<ShortlistGroup> }) {
  const [name, setName] = React.useState('');
  const [failed, setFailed] = React.useState(false);
  return (
    <form
      className="flex items-center gap-1.5 px-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setFailed(false);
        try {
          await onCreate(name.trim());
        } catch {
          setFailed(true);
        }
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New group"
        maxLength={60}
        aria-label="New group name"
        className={cn(
          'h-8 min-w-0 flex-1 rounded-md border bg-surface px-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus-ring',
          failed ? 'border-danger' : 'border-line-strong',
        )}
      />
      <button
        type="submit"
        disabled={!name.trim()}
        aria-label="Create group"
        className="grid h-8 w-8 place-items-center rounded-md bg-accent-strong text-on-accent disabled:opacity-50 focus-ring dark:bg-accent"
      >
        <Plus size={15} />
      </button>
    </form>
  );
}
