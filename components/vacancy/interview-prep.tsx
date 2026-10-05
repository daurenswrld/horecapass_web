'use client';

import * as React from 'react';
import { Lock, RotateCcw, Sparkles } from 'lucide-react';
import { VoiceButton } from '@/components/onboarding/answer-input';
import { DemoNotice } from '@/components/demo-notice';
import { Button } from '@/components/ui/primitives';
import { useCandidate } from '@/lib/candidate/context';
import { speechRecognitionAvailable } from '@/lib/demo/storage';
import { http } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import type { Vacancy } from '@/lib/api/vacancies';
import { canSyncToServer } from '@/lib/demo/employer-sync';

/**
 * «Prepare for interview with AI» — бриф кандидата, пункт 10. Формулировку
 * заказчица оставила как есть — исключение из правила Smart/AI.
 *
 * Мок-интервью под эту вакансию: 4 вероятных вопроса из банка (роль + уровень
 * кандидата) и 1–2 ситуационных по деталям вакансии. Под каждым — подсказка,
 * как строить ответ; после ответа — короткий отзыв в тоне коуча, без баллов.
 * Это приватная тренировка: ответы нигде не сохраняются и работодателю не
 * уходят — и это написано прямо у кнопки, иначе тренировки будут бояться.
 */

/**
 * Общие вопросы собеседования. Вопросы по роли и уровню кандидата бриф
 * берёт из банка заказчицы через Smart на сервере — на сайте банка нет,
 * поэтому здесь только общие и ситуационные по самой вакансии.
 */
const GENERAL = [
  'Tell me about yourself and your experience in hospitality.',
  'Describe a time you handled a difficult guest. What did you do, and what happened?',
  'What does great service mean to you?',
  'How do you stay calm and fast when the place is full?',
  'Why do you want to work in the GCC?',
];

function questionsFor(v: Vacancy, years: number | null): string[] {
  const likely = [...GENERAL].sort(() => Math.random() - 0.5).slice(0, years !== null && years >= 5 ? 3 : 4);
  if (years !== null && years >= 5) likely.push('Tell me about a team you led — how did you train and keep your people?');
  const situational = [
    v.venueType && `This is a ${v.venueType.toLowerCase()}. What would you do differently here than in other places you've worked?`,
    v.schedule && `The schedule is ${v.schedule.toLowerCase()}. How do you keep your energy and service level up through a long week?`,
    v.companyName && `Why do you want to work at ${v.companyName} in particular?`,
  ].filter((x): x is string => !!x);
  return [...likely, ...situational.slice(0, 2)];
}

/**
 * Настоящий коуч на сервере: GET /api/vacancies/<id>/interview-prep/ — вопросы
 * под эту вакансию и резюме кандидата, готовность, на что сделать упор и что
 * подтянуть. Отзыв на ответ сервер не даёт — он остаётся подсказкой ниже.
 */
interface ServerPrep {
  readiness: number | null;
  questions: string[];
  talkingPoints: string[];
  prepare: string[];
}

async function loadPrep(id: number): Promise<ServerPrep | null> {
  try {
    const d = await http.get<Record<string, unknown>>(API.vacancies.interviewPrep(id));
    const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
    const prep = {
      readiness: typeof d.readiness === 'number' ? Math.round(d.readiness) : null,
      questions: list(d.questions),
      talkingPoints: list(d.talking_points),
      prepare: list(d.prepare),
    };
    return prep.questions.length ? prep : null;
  } catch {
    return null;
  }
}

/** Отзыв по форме ответа, а не оценка: где конкретика, где результат. */
function feedback(answer: string): string {
  const hasNumber = /\d/.test(answer);
  if (answer.trim().length < 60)
    return 'Good start. Add a concrete example: where it was, what you did, and what happened next.';
  if (hasNumber) return 'Strong — the numbers make it real. Finish with one line on why that matters for this role.';
  return 'Clear answer. Add the result — what changed because of what you did? A number helps if you have one.';
}

export function InterviewPrep({ vacancy }: { vacancy: Vacancy }) {
  const { draft } = useCandidate();
  const [open, setOpen] = React.useState(false);
  const [questions, setQuestions] = React.useState<string[]>([]);
  const [i, setI] = React.useState(0);
  const [text, setText] = React.useState('');
  const [note, setNote] = React.useState<string | null>(null);

  const [prep, setPrep] = React.useState<ServerPrep | null>(null);
  const [loading, setLoading] = React.useState(false);

  const start = async () => {
    setI(0);
    setText('');
    setNote(null);
    setOpen(true);
    // Настоящий вход — вопросы от серверного коуча, иначе (или если он
    // недоступен) — подборка правил в браузере, каждый раз новая.
    if (canSyncToServer()) {
      setLoading(true);
      const p = await loadPrep(vacancy.id);
      setLoading(false);
      setPrep(p);
      if (p) {
        setQuestions(p.questions);
        return;
      }
    }
    setPrep(null);
    setQuestions(questionsFor(vacancy, draft?.years ?? null));
  };

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={start}>
          <Sparkles size={16} aria-hidden />
          Prepare for interview with Smart
        </Button>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
          <Lock size={12} aria-hidden />
          Practice only — your answers aren&apos;t saved or shared with the employer.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-line-strong bg-surface-alt p-5 text-sm text-text-secondary">
        Preparing questions for this role and your CV…
      </div>
    );
  }

  const done = i >= questions.length;
  return (
    <div className="space-y-4 rounded-lg border border-line-strong bg-surface-alt p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-heading">Interview game plan</p>
        {!prep && (
          <button type="button" onClick={start} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary focus-ring">
            <RotateCcw size={14} aria-hidden />
            New questions
          </button>
        )}
      </div>

      {prep && i === 0 && !note && (
        <div className="space-y-3 rounded-md bg-surface px-4 py-3 text-sm">
          {prep.readiness !== null && (
            <p className="text-text-primary">
              <span className="font-bold text-heading">{prep.readiness}% ready</span> for this interview, based on your CV.
            </p>
          )}
          {prep.talkingPoints.length > 0 && (
            <div>
              <p className="font-semibold text-text-primary">Make sure to mention</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-text-primary">
                {prep.talkingPoints.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {prep.prepare.length > 0 && (
            <div>
              <p className="font-semibold text-text-primary">Brush up on</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-text-primary">
                {prep.prepare.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {done ? (
        <p className="text-text-primary">
          That&apos;s the set. Nice work — say your answers out loud once more before the real interview.
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">
            Likely question {i + 1} of {questions.length}
          </p>
          <p className="text-lg font-semibold leading-snug text-heading">{questions[i]}</p>
          <p className="text-sm text-text-secondary">
            Tip: mention a specific experience, the result, and why it matters for this role.
          </p>
          {note ? (
            <>
              <p className="rounded-md bg-surface px-4 py-3 text-sm text-text-primary">{note}</p>
              <Button
                onClick={() => {
                  setI((x) => x + 1);
                  setText('');
                  setNote(null);
                }}
              >
                Next question
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Answer as you would in the interview"
                  aria-label="Your answer"
                  className="flex-1 resize-y rounded border border-line-strong bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
                />
                {speechRecognitionAvailable() && <VoiceButton onText={setText} />}
              </div>
              <Button disabled={text.trim().length < 5} onClick={() => setNote(feedback(text))}>
                Get feedback
              </Button>
            </>
          )}
        </>
      )}
      {!prep && (
        <DemoNotice
          what="Questions and feedback here are simple rules in the browser. The real coach runs on the server."
          endpoint="GET /api/vacancies/<id>/interview-prep/"
        />
      )}
    </div>
  );
}
