'use client';

import * as React from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { Spinner } from '@/components/ui/primitives';
import {
  AgreementStep,
  BridgeStep,
  CompanyPreviewStep,
  CompanyStep,
  DoneStep,
  IntroStep,
  PaymentStep,
  ProjectStep,
  SourcesStep,
  VacancyChatStep,
  VacancyDetailsStep,
  VacancyIntroStep,
  VacancyPreviewStep,
  type StepProps,
} from '@/components/employer/steps';
import { useAuth } from '@/lib/auth/context';
import { companyApi } from '@/lib/api/company';
import { canSyncToServer, saveCompany, saveVacancyDraft, syncError } from '@/lib/demo/employer-sync';
import {
  STEP_INDEX,
  STEP_TITLE,
  STEP_TOTAL,
  EMPTY_VACANCY,
  emptyDraft,
  employerDraft,
  type EmployerDraft,
  type Step,
} from '@/lib/demo/employer';
import { cn } from '@/lib/utils';

/**
 * Онбординг работодателя — демо по утверждённому редизайну (см. lib/demo/employer.ts).
 *
 * Черновик сохраняется после каждого изменения и открывается на том же шаге:
 * бриф требует автосохранения без кнопки «Save».
 */

/** Куда ведёт «Назад» с каждого шага. */
const BACK: Partial<Record<Step, (d: EmployerDraft) => Step>> = {
  company: () => 'intro',
  sources: () => 'company',
  bridge: () => 'sources',
  project: () => 'bridge',
  'vacancy-intro': (d) => (d.company.preOpening ? 'project' : 'bridge'),
  vacancy: () => 'vacancy-intro',
  'vacancy-details': () => 'vacancy',
  'vacancy-preview': () => 'vacancy-details',
  'company-preview': () => 'vacancy-preview',
  agreement: () => 'company-preview',
  payment: () => 'agreement',
};

const CHAT_STEPS: Step[] = ['project', 'vacancy'];

export default function EmployerOnboardingPage() {
  const { user } = useAuth();
  const [draft, setDraft] = React.useState<EmployerDraft | null>(null);
  const [saved, setSaved] = React.useState(true);

  // Черновик читаем только в браузере — иначе серверный рендер разойдётся
  // с клиентским. Пустые поля подставляем из аккаунта.
  // Сохраняем после каждого изменения, но не сразу после загрузки: иначе
  // пустой черновик получил бы отметку времени и считался бы начатым.
  const touched = React.useRef(false);

  // «New job» с экрана Jobs. Параметр читаем в эффекте (при переходе по Link
  // адрес меняется после рендера) и запоминаем: в dev React запускает эффекты
  // дважды, и после replaceState второй запуск уже не увидел бы ?new=vacancy.
  const newVacancy = React.useRef<boolean | null>(null);

  // Раздел рисуется только после того, как известен пользователь (AppShell),
  // поэтому черновик читаем один раз при монтировании.
  React.useEffect(() => {
    if (newVacancy.current === null) {
      newVacancy.current = new URLSearchParams(window.location.search).get('new') === 'vacancy';
    }
    let d = employerDraft.load();
    if (!d.updatedAt) {
      d.company.name ||= user?.company_name ?? '';
      d.company.email ||= user?.email ?? '';
      d.company.phone ||= user?.phone_number ?? '';
    }
    // Профиль компании остаётся, вакансия — с нуля, сразу в чат
    // (бриф, пункт 8: точка входа открывает композер).
    if (newVacancy.current) {
      d = {
        ...d,
        step: 'vacancy',
        vacancy: { ...EMPTY_VACANCY },
        vacancyChat: [],
        turn: null,
        asked: [],
        plan: null,
        serverVacancyId: null,
      };
      touched.current = true;
      window.history.replaceState(null, '', window.location.pathname);
    }
    setDraft(d);

    // Настоящий вход: пустой черновик заполняем тем, что уже есть у компании
    // на сервере, — чтобы не просить ввести заново то, что заполнено в приложении.
    const onServer = canSyncToServer();
    setServer(onServer);
    if (onServer && !d.updatedAt) {
      companyApi
        .get()
        .then((c) =>
          setDraft((cur) =>
            cur && !cur.updatedAt
              ? {
                  ...cur,
                  // Только пустые поля: ответ сервера может прийти, когда
                  // человек уже начал вводить, — его ввод не затираем.
                  company: {
                    ...cur.company,
                    name: cur.company.name || c.name,
                    about: cur.company.about || c.description,
                    city: cur.company.city || (c.address ?? ''),
                    phone: cur.company.phone || (c.phoneNumber ?? ''),
                    email: cur.company.email || (c.email ?? ''),
                    website: cur.company.website || (c.website ?? ''),
                    linkedin: cur.company.linkedin || (c.linkedin ?? ''),
                    whatsapp: cur.company.whatsapp || (c.whatsapp ?? ''),
                    size: cur.company.size ?? c.size,
                    preOpening: cur.company.preOpening || c.isPreOpening,
                    hideName: cur.company.hideName || c.hideName,
                  },
                  project: cur.project.length ? cur.project : c.preOpeningAnswers,
                }
              : cur,
          ),
        )
        .catch(() => {
          /* компании на сервере ещё нет — заполнится при первом сохранении */
        });
    }
  }, []);
  React.useEffect(() => {
    if (draft && touched.current) setSaved(employerDraft.save(draft));
  }, [draft]);

  const update = React.useCallback((fn: (d: EmployerDraft) => EmployerDraft) => {
    touched.current = true;
    setDraft((prev) => (prev ? fn(prev) : prev));
  }, []);

  // Сохранение на сервер (только настоящий вход, см. lib/demo/employer-sync.ts).
  const [server, setServer] = React.useState(false);
  const [serverState, setServerState] = React.useState<'idle' | 'saving' | 'saved' | { error: string; retry: () => void }>('idle');
  const draftRef = React.useRef<EmployerDraft | null>(null);
  draftRef.current = draft;

  const pushToServer = React.useCallback(
    async (what: 'company' | 'vacancy') => {
      const d = draftRef.current;
      if (!d || !canSyncToServer()) return;
      setServerState('saving');
      try {
        if (what === 'company') await saveCompany(d);
        else {
          const id = await saveVacancyDraft(d);
          if (id !== d.serverVacancyId) update((x) => ({ ...x, serverVacancyId: id }));
        }
        setServerState('saved');
      } catch (e) {
        setServerState({ error: syncError(e), retry: () => void pushToServer(what) });
      }
    },
    [update],
  );

  const go = React.useCallback(
    (step: Step) => {
      const from = draftRef.current?.step;
      update((d) => ({ ...d, step }));
      window.scrollTo({ top: 0 });
      // Профиль компании — при уходе с шагов, где он заполняется; вакансия —
      // черновиком, когда работодатель доходит до превью.
      if (from === 'company' || from === 'sources' || from === 'project') void pushToServer('company');
      if (step === 'vacancy-preview') void pushToServer('vacancy');
    },
    [update, pushToServer],
  );

  const restart = React.useCallback(() => {
    employerDraft.clear();
    const d = emptyDraft();
    d.company.name = user?.company_name ?? '';
    d.company.email = user?.email ?? '';
    setDraft(d);
  }, [user]);

  if (!draft) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  const props: StepProps = { draft, update, go, server };
  const n = STEP_INDEX[draft.step];
  const back = BACK[draft.step];
  const chat = CHAT_STEPS.includes(draft.step);

  return (
    <div className={cn('flex flex-col', chat && 'h-[calc(100dvh-5rem)] md:h-[100dvh]')}>
      <header className="sticky top-0 z-10 shrink-0 border-b border-line bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 md:px-8">
          {back ? (
            <button
              type="button"
              onClick={() => go(back(draft))}
              aria-label="Back"
              className="-ml-2 rounded-full p-2 text-heading transition-colors hover:bg-surface-muted focus-ring"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <span className="w-5" />
          )}

          <div className="min-w-0 flex-1">
            {/* Полосочки сверху — «для тревожных людей», и «Step X of Y» рядом:
                неопределённая длина пугает сильнее, чем реальное число шагов. */}
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: STEP_TOTAL }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-500',
                    i < n ? 'bg-accent-strong dark:bg-accent' : 'bg-surface-alt dark:bg-surface-muted',
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-text-secondary">
              Step {n} of {STEP_TOTAL} · {STEP_TITLE[n]}
              <span className="ml-2 text-text-secondary">{saved ? '· Saved in this browser' : '· Could not save'}</span>
              {server && serverState === 'saving' && <span className="ml-2 text-text-tertiary">· Saving to your account…</span>}
              {server && serverState === 'saved' && <span className="ml-2 text-success">· Saved to your account</span>}
              {server && typeof serverState === 'object' && (
                <span className="ml-2 text-danger">
                  · Not saved to your account ({serverState.error}){' '}
                  <button type="button" onClick={serverState.retry} className="font-semibold underline underline-offset-2 focus-ring">
                    Retry
                  </button>
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={restart}
            aria-label="Start over"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring"
          >
            <RotateCcw size={14} aria-hidden />
            <span className="hidden sm:inline">Start over</span>
          </button>
        </div>
      </header>

      <div key={draft.step} className="page-enter">
        {draft.step === 'intro' && <IntroStep {...props} />}
        {draft.step === 'company' && <CompanyStep {...props} />}
        {draft.step === 'sources' && <SourcesStep {...props} />}
        {draft.step === 'bridge' && <BridgeStep {...props} />}
        {draft.step === 'project' && <ProjectStep {...props} />}
        {draft.step === 'vacancy-intro' && <VacancyIntroStep {...props} />}
        {draft.step === 'vacancy' && <VacancyChatStep {...props} />}
        {draft.step === 'vacancy-details' && <VacancyDetailsStep {...props} />}
        {draft.step === 'vacancy-preview' && <VacancyPreviewStep {...props} />}
        {draft.step === 'company-preview' && <CompanyPreviewStep {...props} />}
        {draft.step === 'agreement' && <AgreementStep {...props} />}
        {draft.step === 'payment' && <PaymentStep {...props} />}
        {draft.step === 'done' && <DoneStep {...props} restart={restart} />}
      </div>
    </div>
  );
}
