'use client';

import * as React from 'react';
import { ArrowRight, MessagesSquare, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { DemoNotice } from '@/components/demo-notice';
import { CvDocument } from '@/components/cv/cv-document';
import { OnboardingChat } from '@/components/onboarding/chat';
import { AssistantNudge } from '@/components/onboarding/assistant';
import { nudge } from '@/lib/onboarding/engine';
import { activeQuestions, getProfession, PROFESSIONS, type Answers } from '@/lib/professions';
import { profileDraft } from '@/lib/demo/storage';
import { useAuth } from '@/lib/auth/context';
import { plural } from '@/lib/utils';

/**
 * Profile кандидата — раздел, который заказчица просила переделать.
 *
 * Здесь показан её замысел, а не то, что сейчас в мобилке:
 *  • анкета идёт разговором, отвечать можно by voice или текстом;
 *  • набор вопросов зависит от профессии — «если хостес, то один параметр,
 *    если официант, другой... это всё должно быть вшито в платформу»;
 *  • на выходе не карточка платформы, а лист резюме.
 *
 * Бэкенда под это нет, поэтому ответы лежат в браузере, и на экране об этом
 * прямо написано.
 */

type Mode = 'pick' | 'chat' | 'cv';

export default function ProfilePage() {
  const { user } = useAuth();
  const [professionId, setProfessionId] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [mode, setMode] = React.useState<Mode>('pick');
  const [loaded, setLoaded] = React.useState(false);

  // Черновик читаем только в браузере, иначе серверный рендер разойдётся
  // с клиентским.
  React.useEffect(() => {
    const d = profileDraft.load();
    setProfessionId(d.professionId);
    setAnswers(d.answers);
    setMode(d.professionId ? 'cv' : 'pick');
    setLoaded(true);
  }, []);

  const profession = getProfession(professionId);
  const candidateName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your name';

  if (!loaded) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  if (mode === 'chat' && profession) {
    return (
      // Высота задана явно: лента внутри прокручивается сама, поэтому
      // контейнеру нужна опора. На узком экране вычитаем нижнюю панель.
      <div className="flex h-[calc(100dvh-5rem)] flex-col md:h-[100dvh]">
        <OnboardingChat
          profession={profession}
          onDone={(state) => {
            setAnswers(state.answers);
            profileDraft.save(profession.id, state.answers);
            setMode('cv');
          }}
        />
      </div>
    );
  }

  if (mode === 'pick' || !profession) {
    return (
      <>
        <PageHeader title="Profile" subtitle="We will build your CV in one conversation" />
        <div className="space-y-5 px-5 py-6 md:px-8">
          <DemoNotice
            what="This is the profile as the client intended it: questions are asked one at a time, you can answer by voice or text, and the question set depends on the profession."
            endpoint="GET/PUT /api/resumes/my/<id>/profession-profile/"
          />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              What do you do?
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              The profession decides what we ask: a hostess, a waiter, a chef and a manager each
              have their own set of parameters.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PROFESSIONS.map((p) => {
                const count = activeQuestions(p, {}).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProfessionId(p.id);
                      setAnswers({});
                      profileDraft.save(p.id, {});
                      setMode('chat');
                    }}
                    className="rounded-lg focus-ring"
                  >
                    <Card className="flex h-full items-start gap-3 p-4 text-left transition-shadow hover:shadow-lift">
                      <MessagesSquare size={20} className="mt-0.5 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-text-primary">{p.title}</span>
                          <ArrowRight size={15} className="text-text-tertiary" />
                        </span>
                        <span className="mt-0.5 block text-sm text-text-secondary">{p.blurb}</span>
                        <span className="mt-2 block text-xs text-text-secondary">
                          ~{count} {plural(count, 'question')} · its own position parameters
                        </span>
                      </span>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  const hint = nudge(profession, answers);

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle={profession.title}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMode('chat')}>
              Continue the questions
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                profileDraft.clear();
                setProfessionId(null);
                setAnswers({});
                setMode('pick');
              }}
              title="Pick another profession and start over"
            >
              <RotateCcw size={15} />
              Start over
            </Button>
          </div>
        }
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        <DemoNotice
          what="The CV is built from your answers and kept in the browser. Once the endpoint exists, the same data will go to the server and become visible to employers."
          endpoint="GET/PUT /api/resumes/my/<id>/profession-profile/"
        />

        {hint && <AssistantNudge message={hint} />}

        <CvDocument profession={profession} answers={answers} candidateName={candidateName} />
      </div>
    </>
  );
}
