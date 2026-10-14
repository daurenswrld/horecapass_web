'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp, Maximize2, Sparkles, Trash2, X } from 'lucide-react';
import { ExportMenu } from '@/components/admin/export-menu';
import { Spinner } from '@/components/ui/primitives';
import { adminApi, errorText, type GeorgeTable } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

/**
 * Джордж — ИИ-аналитик внутри админки (прототип A-15 чат, A-16 панель на любом
 * экране; голосовое заказчицы 14.10: «дать ему имя… чтобы не вручную смотреть
 * каждую метрику, а брать у него информацию»). Отвечает только по цифрам
 * платформы (сервер даёт модели лишь чтение метрик), список людей приходит
 * таблицей, которую можно скачать. Переписка живёт в этой вкладке браузера.
 */

interface Message {
  role: 'user' | 'assistant';
  text: string;
  tables?: GeorgeTable[];
  error?: boolean;
}

const KEY = 'hp_george_chat';
const SUGGESTIONS = [
  'How many candidates registered this week, and how many applied?',
  'Who registered this month but never filled the profile?',
  'Which roles were posted this month, and which have no applications?',
  'Найди резюме барист с опытом в Дубае',
];

/** **жирный** и списки «- »/«* » — без HTML: текст модели не вставляется как разметка. */
function Rich({ text }: { text: string }) {
  const inline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    );
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="my-1.5 list-disc space-y-1 pl-5">
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    const item = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (item) {
      list.push(item[1]);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p${blocks.length}`} className="my-1.5">{inline(line)}</p>);
  }
  flush();
  return <>{blocks}</>;
}

function TableCard({ table }: { table: GeorgeTable }) {
  const report = () => ({
    name: `george-${table.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: table.title,
    subtitle: 'Prepared by George, HorecaPass admin',
    columns: table.columns.map(([key, label]) => ({ label, value: (r: Record<string, unknown>) => r[key] as string | number | null })),
    rows: table.rows,
  });
  const shown = table.rows.slice(0, 5);
  return (
    <div className="mt-2 rounded-md border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">
          {table.title}
          {table.total != null && <span className="font-normal text-text-secondary"> · {table.total}</span>}
        </p>
        <ExportMenu report={report} disabled={!table.rows.length} />
      </div>
      <ul className="mt-2 space-y-0.5 text-xs text-text-secondary">
        {shown.map((r, i) => (
          <li key={i} className="truncate">
            {String(r.name ?? '')}
            {r.email ? ` · ${String(r.email)}` : ''}
          </li>
        ))}
        {table.rows.length > shown.length && <li>…and {table.rows.length - shown.length} more in the file</li>}
      </ul>
      {table.total != null && table.total > table.rows.length && (
        <p className="mt-1 text-xs text-text-tertiary">
          The file has the first {table.rows.length}. The full list is on the Funnels and Resume bank pages.
        </p>
      )}
    </div>
  );
}

export function GeorgeChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [draft, setDraft] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const end = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: Message[] = [...messages, { role: 'user', text: question }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    try {
      const answer = await adminApi.george(next.filter((m) => !m.error).map(({ role, text }) => ({ role, text })));
      const tables = answer.tables ?? (answer.table ? [answer.table] : []);
      setMessages((m) => [...m, { role: 'assistant', text: answer.reply, tables }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: errorText(e, 'George is not available right now. Please try again in a minute.'), error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('scroll-slim flex-1 overflow-y-auto', compact ? 'px-4 py-3' : 'px-5 py-5 md:px-8')}>
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl py-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-muted text-accent-text">
              <Sparkles size={22} aria-hidden />
            </span>
            <p className="mt-3 text-lg font-semibold text-heading">Hi, I&apos;m George</p>
            <p className="mt-1 text-sm text-text-secondary">
              Ask me about the platform&apos;s numbers: registrations, funnels, who stopped where, resumes, vacancies,
              payments. I answer only from the platform&apos;s data and attach lists you can download.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-muted focus-ring"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={cn('space-y-3', !compact && 'mx-auto max-w-3xl')}>
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-accent-strong px-3.5 py-2 text-sm text-on-accent dark:bg-accent">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={i} className="flex gap-2.5">
                <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-muted text-xs font-bold text-accent-text">
                  G
                </span>
                <div className={cn('min-w-0 max-w-[90%] text-sm leading-relaxed', m.error ? 'text-danger' : 'text-text-primary')}>
                  <Rich text={m.text} />
                  {m.tables?.map((t, k) => <TableCard key={k} table={t} />)}
                </div>
              </div>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-text-secondary" aria-live="polite">
              <Spinner className="h-4 w-4" /> George is looking at the data…
            </div>
          )}
          <div ref={end} />
        </div>
      </div>

      <form
        className={cn('border-t border-line bg-surface', compact ? 'p-3' : 'px-5 py-4 md:px-8')}
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <div className={cn('flex items-end gap-2', !compact && 'mx-auto max-w-3xl')}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={1}
            placeholder="Ask George about the numbers…"
            aria-label="Message to George"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent disabled:opacity-50 focus-ring dark:bg-accent"
          >
            <ArrowUp size={18} />
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              aria-label="Clear the conversation"
              title="Clear the conversation"
              className="grid h-11 w-9 shrink-0 place-items-center rounded-full text-text-secondary hover:text-danger focus-ring"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/** A-16: Джордж в углу любого экрана админки; на своей странице кнопка не нужна. */
export function GeorgeLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  if (pathname === '/admin/george') return null;
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-accent-strong px-4 font-semibold text-on-accent shadow-lift transition hover:brightness-110 focus-ring dark:bg-accent"
        >
          <Sparkles size={18} aria-hidden />
          Ask George
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="George"
          className="pop-in fixed inset-x-0 bottom-0 z-40 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift md:inset-x-auto md:bottom-5 md:right-5 md:h-[36rem] md:w-[26rem] md:rounded-2xl"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-muted text-accent-text">
              <Sparkles size={16} aria-hidden />
            </span>
            <p className="flex-1 font-semibold text-heading">George · AI analyst</p>
            <Link
              href="/admin/george"
              onClick={() => setOpen(false)}
              aria-label="Open George full screen"
              className="rounded-full p-2 text-text-secondary hover:bg-surface-muted focus-ring"
            >
              <Maximize2 size={16} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close George"
              className="rounded-full p-2 text-text-secondary hover:bg-surface-muted focus-ring"
            >
              <X size={18} />
            </button>
          </div>
          <GeorgeChat compact />
        </div>
      )}
    </>
  );
}
