'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui/primitives';
import { WizardHeader } from '@/components/ui/wizard-header';
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
import { cn } from '@/lib/utils';

/**
 * Онбординг кандидата — демо по брифу кандидата (см. lib/demo/candidate.ts).
 * Черновик сохраняется после каждого изменения и открывается на том же шаге.
 */

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

  const go = React.useCallback(
    (step: CStep) => {
      update((d) => ({ ...d, step }));
      window.scrollTo({ top: 0 });
    },
    [update],
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
