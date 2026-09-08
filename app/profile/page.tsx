"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CvDocument } from "@/components/cv/cv-document";
import { AssistantNudge } from "@/components/onboarding/assistant";
import { Button, Card } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { draft } from "@/lib/api/pending";
import { nudge } from "@/lib/onboarding/engine";
import { getProfession, type Answers } from "@/lib/professions";

/**
 * Готовый профиль — он же резюме.
 *
 * Ассистент остаётся и здесь: по документу он должен подсказывать, чего
 * не хватает, а не исчезать после онбординга.
 */
export default function ProfilePage() {
  const [answers, setAnswers] = React.useState<Answers>({});
  const [professionId, setProfessionId] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  // Черновик лежит в localStorage — читать его можно только в браузере,
  // иначе серверный рендер и клиент разойдутся.
  React.useEffect(() => {
    const d = draft.load();
    setAnswers(d.answers);
    setProfessionId(d.professionId);
    setLoaded(true);
  }, []);

  const profession = getProfession(professionId);

  if (!loaded) return null;

  if (!profession) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Card className="p-6">
          <h1 className="text-lg font-semibold text-fg">
            Профиль ещё не начат
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Выберите профессию — от неё зависит, какие параметры мы спросим. У
            хостес, официанта, менеджера и шефа наборы разные.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Выбрать профессию</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const hint = nudge(profession, answers);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg focus-ring"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={`/onboarding?profession=${profession.id}`}>
            <Button variant="secondary" size="sm">
              Дополнить анкету
            </Button>
          </Link>
        </div>
      </div>

      {hint && <AssistantNudge message={hint} className="mb-4" />}

      <CvDocument profession={profession} answers={answers} />
    </main>
  );
}
