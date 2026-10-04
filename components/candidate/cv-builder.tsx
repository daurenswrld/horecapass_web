'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Composer, MessageBubble, Thread, Typing } from '@/components/employer/chat';
import { aiApi, fileToBase64, plainAiText, type AiMessage } from '@/lib/api/ai';
import type { ChatMessage } from '@/lib/demo/employer';
import { extractCvText } from '@/lib/cv-text';

/**
 * Smart CV builder — разговор с серверным ИИ (/api/ai/cv-builder/stream/),
 * тем же, что в мобилке. Созвон 29.09: кандидат загружает своё резюме, ИИ
 * задаёт вопросы и адаптирует его под формат GCC; можно и с нуля.
 *
 * Сервер сам сохраняет резюме, когда соберёт его, и возвращает resume_id —
 * работодатель сразу видит его в отклике. Кнопку «Export as PDF» из подсказок
 * не показываем: скачивание — отдельный платный шаг ($8) в онбординге.
 */

const GREETING =
  "Hi! I'll put together a CV that GCC employers expect. Attach your current CV, or tell me the role you're going for and I'll ask the rest.";
const FROM_UPLOAD = "Here's my current CV. Please adapt it for employers in the GCC.";
const PAID_EXPORT = /export|pdf|download|скача|экспорт/i;

let seq = 0;
const id = () => `cv-${Date.now()}-${seq++}`;

interface Turn extends ChatMessage {
  images?: string[];
  /** Текст приложенного резюме — уходит ИИ, в ленте не показываем. */
  attached?: string;
}

export function CvBuilder({ initialFile, onClose }: { initialFile?: File | null; onClose: (built: boolean) => void }) {
  const [messages, setMessages] = React.useState<Turn[]>([{ id: id(), from: 'assistant', text: GREETING }]);
  const [typing, setTyping] = React.useState(false);
  const [options, setOptions] = React.useState<string[]>([]);
  const [resumeId, setResumeId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const abort = React.useRef<AbortController | null>(null);
  const history = React.useRef(messages);
  history.current = messages;

  React.useEffect(() => () => abort.current?.abort(), []);

  const send = React.useCallback(
    async (text: string, fileName?: string, raw?: File) => {
      setError(null);
      setOptions([]);
      // Картинку отдаём как есть; из PDF/DOCX достаём текст сами — сервер
      // на проде вложения пока не читает (см. lib/cv-text.ts).
      const attached = raw ? await extractCvText(raw) : null;
      const images = raw && raw.type.startsWith('image/') ? [await fileToBase64(raw)] : undefined;
      const mine: Turn = { id: id(), from: 'user', text, file: fileName, images, attached: attached ?? undefined };
      const all = [...history.current, mine];
      setMessages(all);

      const botId = id();
      // Добавить ответ или обновить уже добавленный — решаем по самому списку:
      // React применяет обновления позже, флаг тут ненадёжен.
      const show = (t: string) =>
        setMessages((m) =>
          m.some((x) => x.id === botId)
            ? m.map((x) => (x.id === botId ? { ...x, text: plainAiText(t) } : x))
            : [...m, { id: botId, from: 'assistant', text: plainAiText(t) }],
        );
      setTyping(true);
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        // Приветствие — наше, не серверное: в историю для ИИ его не кладём.
        const payload: AiMessage[] = all
          .filter((m, i) => !(i === 0 && m.from === 'assistant'))
          .map((m) => ({
            role: m.from,
            text: m.attached ? `${m.text}

My current CV (${m.file ?? 'file'}):
${m.attached}`.slice(0, 7900) : m.text,
            ...(m.images ? { images: m.images } : {}),
          }));
        const res = await aiApi.cvBuilder(
          payload,
          (t) => {
            setTyping(false);
            show(t);
          },
          null,
          ctrl.signal,
        );
        show(res.reply.trim() || 'Could you tell me a bit more?');
        setOptions(res.suggestions.filter((o) => !PAID_EXPORT.test(o)));
        // Сервер отдаёт resume_id всегда, а сохраняет резюме только в конце —
        // и тогда же (по своему промпту) предлагает «Export as PDF».
        if (res.resumeId && res.suggestions.some((o) => PAID_EXPORT.test(o))) setResumeId(res.resumeId);
      } catch {
        if (ctrl.signal.aborted) return;
        setError("Couldn't reach the assistant. Please try again.");
      } finally {
        setTyping(false);
      }
    },
    [resumeId],
  );

  // Пришли с загруженным файлом — сразу отдаём его ИИ.
  const started = React.useRef(false);
  React.useEffect(() => {
    if (initialFile && !started.current) {
      started.current = true;
      void send(FROM_UPLOAD, initialFile.name, initialFile);
    }
  }, [initialFile, send]);

  const last = messages[messages.length - 1];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cv-builder-title" className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-line px-5 py-3 md:px-8">
        <div className="min-w-0 flex-1">
          <h2 id="cv-builder-title" className="text-lg font-bold text-heading">
            Smart CV builder
          </h2>
          <p className="text-xs text-text-secondary">
            {resumeId ? 'Your CV is saved to your profile — employers see it when you apply.' : 'Your CV for GCC employers, built in one conversation'}
          </p>
        </div>
        {resumeId && (
          <Button size="sm" onClick={() => onClose(true)}>
            Done
          </Button>
        )}
        <button
          type="button"
          onClick={() => onClose(!!resumeId)}
          aria-label="Close the CV builder"
          className="-mr-2 rounded-full p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
        >
          <X size={20} />
        </button>
      </header>

      <Thread deps={`${messages.length}-${last?.text.length ?? 0}-${typing}`}>
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
        {typing && <Typing />}
        {error && <p className="text-sm text-danger">{error}</p>}
      </Thread>

      <div className="border-t border-line px-5 py-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <Composer
            onSend={(t, f, raw) => void send(t, f, raw)}
            disabled={typing}
            options={options.length ? { list: options, multi: false } : null}
            placeholder="Message, or attach your CV"
          />
        </div>
      </div>
    </div>
  );
}
