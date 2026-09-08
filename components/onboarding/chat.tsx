"use client";

import * as React from "react";
import { Mic } from "lucide-react";
import { AnswerInput } from "./answer-input";
import { AssistantMark, AssistantNudge } from "./assistant";
import { Progress } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  answer,
  nudge,
  skip,
  start,
  type OnboardingState,
} from "@/lib/onboarding/engine";
import { draft } from "@/lib/api/pending";
import type { Profession } from "@/lib/professions";
import { cn } from "@/lib/utils";

/**
 * Лента онбординга.
 *
 * Диалог, а не форма: это прямое требование заказчицы. Форма из тех же
 * вопросов уже была в прошлой версии и получила ответ «вообще не то».
 */

interface Props {
  profession: Profession;
  onDone: (state: OnboardingState) => void;
}

export function OnboardingChat({ profession, onDone }: Props) {
  const [state, setState] = React.useState<OnboardingState>(() =>
    start(profession),
  );
  const endRef = React.useRef<HTMLDivElement>(null);
  const doneRef = React.useRef(false);

  // Держим последнюю реплику в поле зрения. smooth, потому что резкий скачок
  // на длинной ленте дезориентирует.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.messages.length]);

  // Черновик переживает перезагрузку: анкета длинная, терять её нельзя.
  React.useEffect(() => {
    draft.save(profession.id, state.answers);
  }, [profession.id, state.answers]);

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
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <AssistantMark size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">
              {profession.title}
            </p>
            <p className="text-xs text-fg-subtle">
              Профиль заполнен на {state.progress}%
            </p>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
        <Progress value={state.progress} className="h-1 rounded-none" />
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-6">
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
                  ? "bg-surface text-fg shadow-card"
                  : "bg-primary-600 text-on-primary",
              )}
            >
              {m.text}
              {m.byVoice && (
                <span className="ml-2 inline-flex items-center gap-1 align-middle text-[11px] opacity-70">
                  <Mic size={11} />
                  голосом
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 border-t border-line bg-bg/95 backdrop-blur">
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
