"use client";

import * as React from "react";
import { Mic } from "lucide-react";
import { AnswerInput } from "./answer-input";
import { AssistantMark, AssistantNudge } from "./assistant";
import { Progress } from "@/components/ui/primitives";
import {
  answer,
  nudge,
  skip,
  start,
  type OnboardingState,
} from "@/lib/onboarding/engine";
import { profileDraft } from "@/lib/demo/storage";
import type { Profession } from "@/lib/professions";
import { cn } from "@/lib/utils";

/**
 * Лента онбординга.
 *
 * Диалог, а не форма: это прямое требование заказчицы. Форма из тех же
 * вопросов уже была в прошлой версии и получила ответ «вообще не то».
 */

interface Props {
  accountId?: number;
  profession: Profession;
  onDone: (state: OnboardingState) => void;
}

export function OnboardingChat({ profession, onDone, accountId }: Props) {
  const [state, setState] = React.useState<OnboardingState>(() =>
    start(profession, profileDraft.load(accountId).professionId === profession.id ? profileDraft.load(accountId).answers : {}),
  );
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const doneRef = React.useRef(false);

  /**
   * Держим последнюю реплику в поле зрения.
   *
   * Прокручиваем саму область, а не «якорь» в конце ленты: якорь нулевой
   * высоты прижимается к низу без учёта отступа, и часть сообщения остаётся
   * под краем.
   */
  const scrollToBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Мгновенно, а не плавно: плавная прокрутка живёт на кадрах анимации
    // и не доезжает, если следом меняется высота панели ответа. Для ленты
    // вопросов рывок и не нужен — новая реплика просто оказывается на месте.
    el.scrollTop = el.scrollHeight;
  }, []);

  // Прокручиваем сразу после отрисовки реплики. Чтение scrollHeight само
  // заставляет браузер пересчитать раскладку, поэтому ждать кадр не нужно —
  // и прокрутка не зависит от того, отрисовывается ли вкладка вообще.
  React.useLayoutEffect(() => {
    scrollToBottom();
  }, [state.messages.length, scrollToBottom]);

  /**
   * Панель ответа меняет высоту вместе с типом вопроса: у списка вариантов
   * она в разы выше, чем у поля ввода. Из-за этого лента съезжала — прокрутка
   * успевала отработать до того, как панель менялась. Следим за её размером
   * и до-прокручиваем.
   */
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => scrollToBottom());
    observer.observe(panel);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  // Черновик переживает перезагрузку: анкета длинная, терять её нельзя.
  React.useEffect(() => {
    profileDraft.save(profession.id, state.answers, accountId);
  }, [profession.id, state.answers, accountId]);

  React.useEffect(() => {
    if (state.current === null && !doneRef.current) {
      doneRef.current = true;
      onDone(state);
    }
  }, [state, onDone]);

  const handleAnswer = (value: unknown, byVoice?: boolean) => {
    setState((s) => answer(s, { value, byVoice }));
  };

  const hint = state.current ? null : nudge(profession, state.answers);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line bg-background">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <AssistantMark size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {profession.title}
            </p>
            <p className="text-xs text-text-secondary">
              Profile {state.progress}% complete
            </p>
          </div>
        </div>
        <Progress value={state.progress} className="h-1 rounded-none" />
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-slim">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
          {state.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex animate-fade-up gap-2.5",
                m.from === "candidate" && "justify-end",
              )}
            >
              {m.from === "assistant" && (
                <AssistantMark size={28} className="mt-0.5" />
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  m.from === "assistant"
                    ? "bg-surface text-text-primary shadow-card"
                    : "bg-accent-strong text-on-accent",
                )}
              >
                {m.text}
                {m.byVoice && (
                  <span className="ml-2 inline-flex items-center gap-1 align-middle text-[11px] opacity-70">
                    <Mic size={11} />
                    by voice
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={panelRef} className="shrink-0 border-t border-line bg-background">
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
          {hint && <AssistantNudge message={hint} />}
          {state.current && (
            <AnswerInput
              question={state.current}
              onAnswer={handleAnswer}
              onSkip={() => setState((s) => skip(s))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
