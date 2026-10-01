'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/primitives';
import { WizardHeader, type ServerSync } from '@/components/ui/wizard-header';
import {
  BasedStep,
  CheckStep,
  ConsentStep,
  CountriesStep,
  DoneStep,
  MaterialsStep,
  QualificationStep,
  UpgradeStep,
  VideoStep,
  type CProps,
} from '@/components/candidate/steps';
import { useAuth } from '@/lib/auth/context';
import {
  C_STEP_INDEX,
  C_STEP_TITLE,
  C_STEP_TOTAL,
  candidateDraft,
  emptyCandidate,
  type CStep,
  type CandidateDraft,
} from '@/lib/demo/candidate';
import { canSyncToServer, syncCandidate, uploadCandidateFile, type CandidateFile } from '@/lib/demo/candidate-sync';
import { syncError } from '@/lib/demo/employer-sync';
import { cn } from '@/lib/utils';

/**
 * Онбординг кандидата по брифу кандидата (см. lib/demo/candidate.ts).
 * Черновик сохраняется в браузере после каждого изменения и открывается на том
 * же шаге. При настоящем входе профиль и резюме уходят на сервер при переходе
 * между шагами, файлы — сразу при выборе (lib/demo/candidate-sync.ts).
 */

/** После каких шагов отправляем профиль и резюме на сервер. */
const SYNC_AFTER: CStep[] = ['based', 'countries', 'check', 'consent', 'qualification'];

const BACK: Partial<Record<CStep, CStep>> = {
  materials: 'based',
  countries: 'materials',
  check: 'countries',
  upgrade: 'check',
  consent: 'upgrade',
  qualification: 'consent',
  video: 'qualification',
};

export default function CandidateOnboardingPage() {
  const { user } = useAuth();
  const [draft, setDraft] = React.useState<CandidateDraft | null>(null);
  const [saved, setSaved] = React.useState(true);
  const touched = React.useRef(false);

  // ?step=… — переход из «My Profile» сразу к нужному шагу (бриф, пункт 12:
  // каждый пункт профиля кликабелен и ведёт в редактирование).
  React.useEffect(() => {
    const d = candidateDraft.load();
    const s = new URLSearchParams(window.location.search).get('step');
    setDraft(s && s in C_STEP_INDEX ? { ...d, step: s as CStep } : d);
  }, []);
  React.useEffect(() => {
    if (draft && touched.current) setSaved(candidateDraft.save(draft));
  }, [draft]);

  const update = React.useCallback((fn: (d: CandidateDraft) => CandidateDraft) => {
    touched.current = true;
    setDraft((prev) => (prev ? fn(prev) : prev));
  }, []);

  const [server, setServer] = React.useState<ServerSync | undefined>(undefined);
  const draftRef = React.useRef<CandidateDraft | null>(null);
  draftRef.current = draft;
  const nameRef = React.useRef({ first: '', last: '' });
  nameRef.current = { first: user?.first_name ?? '', last: user?.last_name ?? '' };

  const run = React.useCallback(async (job: () => Promise<unknown>) => {
    if (!canSyncToServer()) return;
    setServer('saving');
    try {
      await job();
      setServer('saved');
    } catch (e) {
      setServer({ error: syncError(e), retry: () => void run(job) });
    }
  }, []);

  const go = React.useCallback(
    (step: CStep) => {
      const from = draftRef.current?.step;
      update((d) => ({ ...d, step }));
      window.scrollTo({ top: 0 });
      if (from && SYNC_AFTER.includes(from) && draftRef.current) {
        const d = draftRef.current;
        void run(() => syncCandidate(d, nameRef.current));
      }
    },
    [update, run],
  );

  const upload = React.useCallback(
    (kind: CandidateFile, file: File) => void run(() => uploadCandidateFile(kind, file)),
    [run],
  );

  if (!draft) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  const props: CProps = {
    draft,
    update,
    go,
    name: { first: user?.first_name ?? '', last: user?.last_name ?? '' },
    upload,
  };
  const n = C_STEP_INDEX[draft.step];
  const back = BACK[draft.step];

  return (
    <div className={cn('flex flex-col', draft.step === 'check' && 'h-[calc(100dvh-5rem)] md:h-[100dvh]')}>
      <WizardHeader
        step={n}
        total={C_STEP_TOTAL}
        title={C_STEP_TITLE[n]}
        saved={saved}
        onBack={back ? () => go(back) : undefined}
        server={server}
        onRestart={() => {
          candidateDraft.clear();
          setDraft(emptyCandidate());
        }}
      />

      {draft.step === 'based' && <BasedStep {...props} />}
      {draft.step === 'materials' && <MaterialsStep {...props} />}
      {draft.step === 'countries' && <CountriesStep {...props} />}
      {draft.step === 'check' && <CheckStep {...props} />}
      {draft.step === 'upgrade' && <UpgradeStep {...props} />}
      {draft.step === 'consent' && <ConsentStep {...props} />}
      {draft.step === 'qualification' && <QualificationStep {...props} />}
      {draft.step === 'video' && <VideoStep {...props} />}
      {draft.step === 'done' && <DoneStep {...props} />}
    </div>
  );
}
