'use client';

import * as React from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { Button, Spinner } from '@/components/ui/primitives';
import { AutofillError, readDocument } from '@/lib/api/autofill';

/**
 * «Autofill from a document»: загрузил файл (или вставил текст) — форма ниже
 * заполняется сама, человек проверяет и правит. Как «Autofill from resume»
 * в анкетах отклика: ИИ работает молча, без допроса в чате.
 */
export function AutofillBox({
  title,
  hint,
  accept = '.pdf,.docx,.txt,image/*',
  allowPaste = false,
  pastePlaceholder = 'Paste the text here',
  onRead,
}: {
  title: string;
  hint: string;
  accept?: string;
  allowPaste?: boolean;
  pastePlaceholder?: string;
  /** Получает файл или текст, возвращает сообщение об итоге; ошибки бросает AutofillError. */
  onRead: (input: { text?: string; file?: string }) => Promise<string>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [paste, setPaste] = React.useState(false);
  const [text, setText] = React.useState('');

  const run = async (read: () => Promise<{ text?: string; file?: string }>) => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      setDone(await onRead(await read()));
    } catch (e) {
      setError(e instanceof AutofillError ? e.message : 'Autofill did not work this time. You can fill the form by hand.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface-muted p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent-muted text-accent-text">
          <Sparkles size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-heading">{title}</p>
          <p className="text-sm text-text-secondary">{hint}</p>
        </div>
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent focus-within:ring-2 focus-within:ring-[rgb(var(--accent-focus))] ${busy ? 'pointer-events-none opacity-60' : ''}`}
        >
          {busy ? <Spinner className="h-4 w-4 border-accent-muted border-t-accent-strong" /> : <Upload size={15} aria-hidden />}
          {busy ? 'Reading…' : 'Upload file'}
          <input
            type="file"
            accept={accept}
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void run(() => readDocument(f));
            }}
          />
        </label>
        {allowPaste && !paste && (
          <button
            type="button"
            onClick={() => setPaste(true)}
            disabled={busy}
            className="text-sm font-semibold text-accent-text underline-offset-4 hover:underline focus-ring"
          >
            or paste text
          </button>
        )}
      </div>

      {allowPaste && paste && (
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={pastePlaceholder}
            aria-label={pastePlaceholder}
            className="w-full resize-y rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <Button type="button" size="sm" disabled={busy || text.trim().length < 20} onClick={() => void run(async () => ({ text }))}>
            {busy ? 'Reading…' : 'Fill the form'}
          </Button>
        </div>
      )}

      <div aria-live="polite">
        {done && <p className="mt-3 text-sm text-success">{done}</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
