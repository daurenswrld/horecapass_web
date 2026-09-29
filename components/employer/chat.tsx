'use client';

import * as React from 'react';
import { ArrowUp, FileText, Paperclip, Sparkles } from 'lucide-react';
import { VoiceButton } from '@/components/onboarding/answer-input';
import { ChoiceChip } from '@/components/ui/primitives';
import { speechRecognitionAvailable } from '@/lib/demo/storage';
import type { ChatMessage } from '@/lib/demo/employer';
import { cn } from '@/lib/utils';

/**
 * Чат онбординга работодателя — «как ChatGPT: сначала вопросы, потом
 * результат» (встреча 15.09). Вид из макета: реплики ассистента на бежевом
 * с кружком HP, ответы — в коричневом градиенте, внизу поле со скрепкой,
 * «Suggest reply» над ним.
 *
 * Три способа ответить, как договаривались с самого начала: напечатать,
 * надиктовать, приложить файл.
 */

export function AssistantAvatar() {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-on-accent"
    >
      HP
    </span>
  );
}

export function MessageBubble({ m, children }: { m: ChatMessage; children?: React.ReactNode }) {
  const mine = m.from === 'user';
  return (
    <div className={cn('flex animate-fade-up items-end gap-2.5', mine && 'justify-end')}>
      {!mine && <AssistantAvatar />}
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-line rounded-lg px-4 py-3 text-[15px] leading-relaxed',
          mine
            ? 'bg-gradient-to-r from-[rgb(var(--on-accent-muted))] to-accent-strong text-on-accent dark:to-accent'
            : 'bg-surface-muted text-text-primary',
        )}
      >
        {m.file && (
          <span className="mb-1.5 flex items-center gap-1.5 text-sm opacity-90">
            <FileText size={14} aria-hidden />
            {m.file}
          </span>
        )}
        {m.text}
        {children}
      </div>
    </div>
  );
}

interface ComposerProps {
  /** file — имя вложения; raw — сам файл, если его нужно отправить на сервер. */
  onSend: (text: string, file?: string, raw?: File) => void;
  suggestion?: string | null;
  options?: { list: string[]; multi: boolean } | null;
  disabled?: boolean;
  placeholder?: string;
  allowFile?: boolean;
}

export function Composer({ onSend, suggestion, options, disabled, placeholder = 'Message', allowFile = true }: ComposerProps) {
  const [text, setText] = React.useState('');
  const [picked, setPicked] = React.useState<string[]>([]);
  const [file, setFile] = React.useState<string | null>(null);
  const [raw, setRaw] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const voice = speechRecognitionAvailable();

  // Новый вопрос с вариантами — сбрасываем выбор прошлого.
  const optionsKey = options?.list.join('|');
  React.useEffect(() => setPicked([]), [optionsKey]);

  const send = () => {
    const v = text.trim();
    if ((!v && !file) || disabled) return;
    onSend(v || 'Attached a file.', file ?? undefined, raw ?? undefined);
    setText('');
    setFile(null);
    setRaw(null);
  };

  return (
    <div className="space-y-3">
      {options && (
        <div className="flex flex-wrap gap-2">
          {options.list.map((o) => (
            <ChoiceChip
              key={o}
              selected={options.multi && picked.includes(o)}
              disabled={disabled}
              onClick={() =>
                options.multi
                  ? setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]))
                  : onSend(o)
              }
            >
              {o}
            </ChoiceChip>
          ))}
          {options.multi && (
            <ChoiceChip
              disabled={disabled}
              onClick={() => onSend(picked.length ? picked.join(', ') : 'None of these')}
              className="border-accent-strong font-semibold"
            >
              {picked.length ? `Done · ${picked.length}` : 'None of these'}
            </ChoiceChip>
          )}
        </div>
      )}

      {suggestion && !options && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setText(suggestion);
            inputRef.current?.focus();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface-alt px-3.5 py-1.5 text-sm text-text-primary transition-colors hover:border-accent focus-ring"
        >
          <Sparkles size={14} aria-hidden className="text-accent-text" />
          Suggest reply
        </button>
      )}

      {file && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-sm text-text-secondary">
          <FileText size={14} aria-hidden />
          {file}
        </span>
      )}

      <div className="flex items-end gap-2 rounded-[1.75rem] border border-line-strong bg-surface p-1.5 pl-2 focus-within:border-accent">
        {allowFile && (
          <label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-within:ring-2 focus-within:ring-[rgb(var(--accent-focus))]">
            <Paperclip size={18} aria-hidden />
            <span className="sr-only">Attach a file</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              className="sr-only"
              disabled={disabled}
              onChange={(e) => {
                setFile(e.target.files?.[0]?.name ?? null);
                setRaw(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
          </label>
        )}
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary [field-sizing:content]"
        />
        {voice && (
          <VoiceButton
            disabled={disabled}
            onText={(t) => {
              setText(t);
            }}
          />
        )}
        <button
          type="button"
          onClick={send}
          disabled={disabled || (!text.trim() && !file)}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent transition-opacity hover:brightness-110 focus-ring disabled:opacity-40 dark:bg-accent"
        >
          <ArrowUp size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Лента с автопрокруткой к последней реплике. */
export function Thread({ children, deps }: { children: React.ReactNode; deps: unknown }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [deps]);
  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-y-auto scroll-slim">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-5 py-6">{children}</div>
    </div>
  );
}

/** Ассистент «печатает» — пауза должна ощущаться как фраза, а не загрузка. */
export function Typing() {
  return (
    <div className="flex items-end gap-2.5">
      <AssistantAvatar />
      <div className="flex gap-1 rounded-lg bg-surface-muted px-4 py-4" aria-label="Assistant is typing">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
