"use client";

import * as React from "react";
import { Mic, MicOff, Send, SkipForward, Upload } from "lucide-react";
import { Button, ChoiceChip } from "@/components/ui/primitives";
import { DemoNotice } from "@/components/demo-notice";
import { speechRecognitionAvailable } from "@/lib/demo/storage";
import type { Question } from "@/lib/professions";
import { cn } from "@/lib/utils";

/**
 * Поле ответа на текущий вопрос.
 *
 * Форма поля зависит от типа вопроса, но кнопка микрофона есть всегда, где
 * ответ можно наговорить: «кандидат может либо начитывать, либо печатать».
 * Голос — не отдельный режим и не отдельный экран, а второй способ ответить
 * на тот же вопрос.
 */

interface Props {
  question: Question;
  onAnswer: (value: unknown, byVoice?: boolean) => void;
  onSkip: () => void;
}

/** Минимальный контракт Web Speech API — типов для него в TS нет. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function createRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    (new () => SpeechRecognitionLike) | undefined;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "ru-RU";
  r.interimResults = true;
  r.continuous = true;
  return r;
}

function VoiceButton({
  onText,
  disabled,
}: {
  onText: (t: string) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = React.useState(false);
  const recRef = React.useRef<SpeechRecognitionLike | null>(null);

  // Распознавание останавливаем при размонтировании: иначе на телефоне
  // остаётся гореть индикатор микрофона после ухода со страницы.
  React.useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = createRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++)
        text += e.results[i][0].transcript;
      onText(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <Button
      type="button"
      variant={listening ? "primary" : "secondary"}
      size="md"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Остановить запись" : "Ответить голосом"}
      className="shrink-0"
    >
      {listening ? <MicOff size={18} /> : <Mic size={18} />}
      <span className="hidden sm:inline">{listening ? "Стоп" : "Голосом"}</span>
    </Button>
  );
}

export function AnswerInput({ question, onAnswer, onSkip }: Props) {
  const [text, setText] = React.useState("");
  const [multi, setMulti] = React.useState<string[]>([]);
  const [usedVoice, setUsedVoice] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);

  // Новый вопрос — чистое поле. Без сброса ответ на прошлый вопрос
  // «перетекает» в следующий.
  React.useEffect(() => {
    setText("");
    setMulti([]);
    setUsedVoice(false);
    setFiles([]);
  }, [question.id]);

  const voiceSupported = speechRecognitionAvailable();
  const canSkip = !question.required;

  const submitText = () => {
    const v = text.trim();
    if (!v) return;
    onAnswer(question.kind === "number" ? Number(v) : v, usedVoice);
  };

  const toggleMulti = (opt: string) => {
    setMulti((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  };

  return (
    <div className="space-y-3">
      {question.hint && (
        <p className="text-xs text-text-secondary">{question.hint}</p>
      )}

      {question.kind === "single" && (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => (
            <ChoiceChip key={opt} onClick={() => onAnswer(opt)}>
              {opt}
            </ChoiceChip>
          ))}
        </div>
      )}

      {question.kind === "multi" && (
        <>
          <div className="flex flex-wrap gap-2">
            {question.options?.map((opt) => (
              <ChoiceChip
                key={opt}
                selected={multi.includes(opt)}
                onClick={() => toggleMulti(opt)}
              >
                {opt}
              </ChoiceChip>
            ))}
          </div>
          <Button onClick={() => onAnswer(multi)} disabled={multi.length === 0}>
            Готово{multi.length > 0 ? ` · ${multi.length}` : ""}
          </Button>
        </>
      )}

      {question.kind === "scale" && (
        <div className="flex flex-wrap gap-2">
          {Array.from(
            { length: (question.max ?? 5) - (question.min ?? 1) + 1 },
            (_, i) => (question.min ?? 1) + i,
          ).map((n) => (
            <ChoiceChip
              key={n}
              onClick={() => onAnswer(n)}
              className="min-w-11 justify-center"
            >
              {n}
            </ChoiceChip>
          ))}
        </div>
      )}

      {question.kind === "bool" && (
        <div className="flex gap-2">
          <ChoiceChip onClick={() => onAnswer(true)}>Да</ChoiceChip>
          <ChoiceChip onClick={() => onAnswer(false)}>Нет</ChoiceChip>
        </div>
      )}

      {(question.kind === "text" || question.kind === "number") && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {question.kind === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Напишите или нажмите «Голосом»"
              className="min-h-24 flex-1 resize-y rounded border border-line bg-surface px-3 py-2 text-text-primary placeholder:text-text-tertiary focus-ring"
            />
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={text}
                min={question.min}
                max={question.max}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitText()}
                placeholder="0"
                className="h-11 w-40 rounded border border-line bg-surface px-3 text-text-primary placeholder:text-text-tertiary focus-ring"
              />
              {question.unit && (
                <span className="text-sm text-text-secondary">{question.unit}</span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {question.kind === "text" && voiceSupported && (
              <VoiceButton
                onText={(t) => {
                  setText(t);
                  setUsedVoice(true);
                }}
              />
            )}
            <Button onClick={submitText} disabled={!text.trim()}>
              <Send size={16} />
              Ответить
            </Button>
          </div>
        </div>
      )}

      {question.kind === "photos" && (
        <div className="space-y-3">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-line-strong",
              "bg-surface-muted px-4 py-8 text-center transition-colors hover:border-accent hover:bg-surface-muted",
            )}
          >
            <Upload size={22} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Выбрать файлы</span>
            <span className="text-xs text-text-secondary">
              {/* Правка Алдияра: много фото с телефона одним заходом.
                  multiple + capture даёт выбор «камера или галерея» на телефоне. */}
              Можно выбрать сразу несколько — с камеры или из галереи
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              className="sr-only"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f) => (
                <span
                  key={f.name}
                  className="rounded-full bg-surface-alt px-3 py-1 text-xs text-text-secondary"
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}

          <DemoNotice
            what="Файлы остаются в браузере: сохраняются только их имена, чтобы показать, как будет выглядеть портфолио."
            endpoint="POST /api/resumes/my/<id>/portfolio/"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => onAnswer(files.map((f) => f.name))}
              disabled={files.length === 0}
            >
              Загрузить{files.length > 0 ? ` · ${files.length}` : ""}
            </Button>
          </div>
        </div>
      )}

      {canSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary underline-offset-4 hover:text-text-secondary hover:underline focus-ring"
        >
          <SkipForward size={13} />
          Пропустить — вернёмся позже
        </button>
      )}
    </div>
  );
}
