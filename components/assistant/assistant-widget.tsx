'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, MapPin, MessagesSquare, Send, Square, Trash2, X } from 'lucide-react';
import {
  askAssistant,
  assistantActive,
  AssistantError,
  type AssistantVacancy,
} from '@/lib/api/assistant';
import { isCompany } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Ассистент HorecaPass: плавающая кнопка и окно чата на каждой странице сайта.
 *
 * Отвечает на вопросы о платформе (из базы знаний, которую ведёт команда) и
 * подбирает открытые вакансии. Гостю тоже: это вопросы, с которых человек
 * начинает. Кнопки нет, пока сервер не сказал, что ассистент включён: на
 * сервере без этой функции или при выключении из админки её просто не видно.
 *
 * История хранится в браузере (на сервере разговор не сохраняется), у каждого
 * пользователя своя, гостевая отдельно.
 */

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  vacancies?: AssistantVacancy[];
  suggestions?: string[];
  note?: string;
  streaming?: boolean;
}

const MAX_STORED = 30;
const MAX_SENT = 12;
const STARTERS = ['Is it free for candidates?', 'How do I post a job?', 'What does Verified mean?'];
// Страницы, где окно только мешало бы: у мастеров онбординга свой помощник.
const HIDDEN_ON = ['/admin', '/onboarding', '/company/onboarding'];

function readHistory(key: string): Msg[] {
  try {
    const raw = window.localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(list) ? list.filter((m) => !m.streaming) : [];
  } catch {
    return [];
  }
}

function writeHistory(key: string, list: Msg[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list.filter((m) => !m.streaming).slice(-MAX_STORED)));
  } catch {
    /* приватный режим: история просто не переживёт перезагрузку */
  }
}

export function AssistantWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const storageKey = `hp_assistant_${user?.id ?? 'guest'}`;

  const [active, setActive] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);

  const seq = React.useRef(1);
  const abort = React.useRef<AbortController | null>(null);
  const log = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const launcher = React.useRef<HTMLButtonElement>(null);
  const stick = React.useRef(true); // прокручивать вниз, пока человек сам не листает вверх

  React.useEffect(() => {
    let alive = true;
    assistantActive().then((ok) => alive && setActive(ok));
    return () => {
      alive = false;
    };
  }, []);

  // История зависит от того, кто вошёл.
  React.useEffect(() => {
    const stored = readHistory(storageKey);
    setMessages(stored);
    seq.current = stored.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  }, [storageKey]);

  React.useEffect(() => {
    if (!busy) writeHistory(storageKey, messages);
  }, [messages, busy, storageKey]);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    const el = log.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  React.useEffect(() => () => abort.current?.abort(), []);

  if (!active || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;

  const inApp = !['/', '/login', '/register'].includes(pathname);

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  const patchLast = (patch: Partial<Msg>) =>
    setMessages((list) => list.map((m, i) => (i === list.length - 1 ? { ...m, ...patch } : m)));

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text || busy || disabled) return;
    stick.current = true;
    const mine: Msg = { id: seq.current++, role: 'user', text };
    const reply: Msg = { id: seq.current++, role: 'assistant', text: '', streaming: true };
    const history = [...messages.map((m) => ({ ...m, suggestions: undefined })), mine];
    setMessages([...history, reply]);
    setInput('');
    setBusy(true);

    const controller = new AbortController();
    abort.current = controller;
    try {
      const done = await askAssistant(
        history.slice(-MAX_SENT).map((m) => ({ role: m.role, text: m.text })),
        (soFar) => patchLast({ text: soFar }),
        controller.signal,
      );
      if (done.disabled) setDisabled(true);
      patchLast({
        text: done.reply,
        streaming: false,
        vacancies: done.vacancies,
        suggestions: done.suggestions,
        note: done.unanswered
          ? 'I have passed your question to the team.'
          : done.degraded && done.vacancies.length === 0
            ? 'A quick answer from our help pages.'
            : undefined,
      });
    } catch (e) {
      if (controller.signal.aborted) {
        patchLast({ streaming: false, text: '', note: 'Stopped.' });
      } else if (e instanceof AssistantError && e.status === 429) {
        patchLast({ streaming: false, text: 'You have asked a lot of questions. Please try again in a while.' });
      } else {
        patchLast({ streaming: false, text: 'I could not reach the assistant. Please try again.' });
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  const clear = () => {
    abort.current?.abort();
    setMessages([]);
    setBusy(false);
    inputRef.current?.focus();
  };

  const last = messages[messages.length - 1];
  const chips = messages.length === 0 ? STARTERS : last?.role === 'assistant' && !busy ? (last.suggestions ?? []) : [];
  const employer = !!user && isCompany(user.role);

  return (
    <>
      {!open && (
        <button
          ref={launcher}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the assistant"
          aria-expanded={false}
          title="Ask the assistant"
          className={cn(
            'pop-in fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent-strong text-on-accent shadow-lift transition-transform hover:scale-105 active:scale-95 focus-ring dark:bg-accent md:right-6',
            inApp ? 'bottom-[4.75rem] md:bottom-6' : 'bottom-5 md:bottom-6',
          )}
        >
          <MessagesSquare size={24} aria-hidden />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="HorecaPass Assistant"
          onKeyDown={(e) => e.key === 'Escape' && close()}
          className="pop-in fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift md:inset-x-auto md:bottom-6 md:right-6 md:h-[34rem] md:w-[24rem] md:rounded-2xl"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
              <MessagesSquare size={17} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-heading">HorecaPass Assistant</p>
              <p className="truncate text-xs text-text-secondary">
                {employer ? 'Ask about the platform' : 'Ask about the platform or find a job'}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear the conversation"
                title="Clear the conversation"
                className="grid h-9 w-9 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close the assistant"
              className="grid h-9 w-9 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring"
            >
              <X size={18} aria-hidden />
            </button>
          </header>

          <div
            ref={log}
            role="log"
            aria-live="polite"
            onScroll={(e) => {
              const el = e.currentTarget;
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            }}
            className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && (
              <div className="rise rounded-2xl rounded-tl-sm bg-surface-muted px-3.5 py-3 text-sm text-text-primary">
                Hi! I can answer questions about HorecaPass
                {employer ? '.' : ' and help you find a job.'} What would you like to know?
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                {(m.text || m.streaming) && (
                  <div
                    className={cn(
                      'pop-in max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-tr-sm bg-accent-strong text-on-accent dark:bg-accent'
                        : 'rounded-tl-sm bg-surface-muted text-text-primary',
                    )}
                  >
                    {m.text || (
                      <span aria-label="The assistant is typing" className="inline-flex gap-1 py-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary"
                            style={{ animationDelay: `${i * 120}ms` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                )}
                {m.note && <p className="px-1 text-xs text-text-secondary">{m.note}</p>}
                {m.vacancies?.map((v) => (
                  <VacancyCard key={v.id} v={v} signedIn={!!user} onNavigate={close} />
                ))}
              </div>
            ))}

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => send(c)}
                    className="rise rounded-full border border-line-strong bg-surface px-3 py-1.5 text-left text-xs text-text-primary transition-colors hover:border-accent hover:bg-surface-muted focus-ring"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              disabled={disabled}
              placeholder={disabled ? 'The assistant is off right now' : 'Type your question'}
              aria-label="Your question"
              className="h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary focus-ring disabled:opacity-60"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abort.current?.abort()}
                aria-label="Stop"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-strong text-text-primary transition-colors hover:bg-surface-muted focus-ring"
              >
                <Square size={15} aria-hidden fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent transition-[filter,transform] hover:brightness-110 active:scale-95 focus-ring disabled:bg-accent-muted disabled:text-on-accent-muted dark:bg-accent"
              >
                <Send size={17} aria-hidden />
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
}

function VacancyCard({ v, signedIn, onNavigate }: { v: AssistantVacancy; signedIn: boolean; onNavigate: () => void }) {
  // Гостю вакансию не открыть без входа: ведём на регистрацию кандидата.
  const href = signedIn ? `/jobs?q=${encodeURIComponent(v.title)}` : '/register?role=applicant';
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rise lift group block w-[88%] rounded-xl border border-line bg-surface p-3 focus-ring"
    >
      <p className="truncate text-sm font-semibold text-text-primary">{v.title}</p>
      <p className="mt-0.5 truncate text-xs text-text-secondary">{v.company}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="flex min-w-0 items-center gap-1 truncate">
          {(v.city || v.country) && (
            <>
              <MapPin size={12} aria-hidden className="shrink-0" />
              <span className="truncate">{v.city || v.country}</span>
            </>
          )}
          {v.salary && <span className="ml-1 font-medium text-text-primary">{v.salary}</span>}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-accent-text">
          {signedIn ? 'View' : 'Sign up to apply'}
          <ArrowRight size={12} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
