'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/ui/primitives';
import { WizardHeader, type ServerSync } from '@/components/ui/wizard-header';
import { BasedStep, CheckStep, ConsentStep, CountriesStep, DoneStep, MaterialsStep, QualificationStep, UpgradeStep, VideoStep, type CProps } from '@/components/candidate/steps';
import { useAuth } from '@/lib/auth/context';
import { useCandidate } from '@/lib/candidate/context';
import { hydrateCandidate } from '@/lib/candidate/state';
import { C_STEP_INDEX, C_STEP_TITLE, C_STEP_TOTAL, type CStep } from '@/lib/demo/candidate';
import { canSyncToServer, syncCandidate, uploadCandidateFile, type CandidateFile } from '@/lib/demo/candidate-sync';
import { syncError } from '@/lib/demo/employer-sync';
import { cn } from '@/lib/utils';

const SYNC_AFTER: CStep[] = ['based', 'countries', 'check', 'consent', 'qualification'];
const BACK: Partial<Record<CStep, CStep>> = { based: 'materials', countries: 'based', check: 'countries', upgrade: 'check', consent: 'upgrade', qualification: 'consent', video: 'qualification' };

export default function CandidateOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { draft, resume, loading, error, server, saved, status, update, saveNow, reload, refreshResume } = useCandidate();
  const [fileServer, setFileServer] = React.useState<ServerSync>();
  const [leaving, setLeaving] = React.useState(false);
  const navigated = React.useRef(false);
  React.useEffect(() => {
    if (loading || !draft || navigated.current) return;
    navigated.current = true;
    const step = new URLSearchParams(window.location.search).get('step');
    if (step && step in C_STEP_INDEX) update((d) => ({ ...d, step: step as CStep }));
    else if (status === 'completed' || (status === 'not_started' && resume?.aboutMe && user?.nationality && user?.current_location)) router.replace('/jobs');
  }, [loading, draft, status, resume, user, update, router]);

  const run = React.useCallback(async (job: () => Promise<unknown>) => {
    if (!canSyncToServer()) return;
    setFileServer('saving');
    try { await job(); setFileServer('saved'); }
    catch (e) { setFileServer({ error: syncError(e), retry: () => { void run(job).catch(() => undefined); } }); throw e; }
  }, []);

  const go = (step: CStep) => {
    const snapshot = draft;
    update((d) => ({ ...d, step }));
    window.scrollTo({ top: 0 });
    void run(async () => {
      if (snapshot && SYNC_AFTER.includes(snapshot.step)) await syncCandidate(snapshot, { first: user?.first_name ?? '', last: user?.last_name ?? '' }, user?.id);
      await saveNow();
    }).catch(() => undefined);
  };
  const defer = async () => {
    setLeaving(true);
    try { await saveNow('deferred'); router.push('/jobs'); }
    catch { setLeaving(false); }
  };
  if (loading) return <div className="grid place-items-center py-24"><Spinner /></div>;
  if (!draft) return <div className="mx-auto max-w-xl space-y-4 px-5 py-12"><p role="alert" className="text-danger">{error}</p><Button onClick={() => void reload()}>Retry loading your profile</Button></div>;

  const props: CProps = {
    draft, update, go,
    accountId: user?.id,
    name: { first: user?.first_name ?? '', last: user?.last_name ?? '' },
    resumeId: resume?.id ?? null,
    onBuilt: refreshResume,
    upload: (kind: CandidateFile, file: File) => run(() => uploadCandidateFile(kind, file)),
  };
  const n = C_STEP_INDEX[draft.step];
  const back = BACK[draft.step];
  const sync = server && typeof server === 'object' ? server : fileServer ?? server;
  return (
    <div className={cn('flex flex-col', draft.step === 'check' && 'h-[calc(100dvh-5rem)] md:h-[100dvh]')}>
      <WizardHeader step={n} total={C_STEP_TOTAL} title={C_STEP_TITLE[n]} saved={saved} server={sync} onBack={back ? () => go(back) : undefined}
        onRestart={() => { if (user) update(() => hydrateCandidate(null, user, resume)); }} />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-4 md:px-8">
        <p className="text-sm text-text-secondary">You can pause and continue later.</p>
        <Button variant="ghost" size="sm" disabled={leaving} onClick={() => void defer()}>{leaving ? 'Saving…' : 'Do later'}</Button>
      </div>
      {error && <div role="alert" className="mx-auto w-full max-w-6xl px-5 pt-4 text-sm text-danger md:px-8">{error} <button onClick={() => void reload()} className="font-semibold underline">Reload account copy</button></div>}
      <div key={draft.step} className="page-enter flex min-h-0 flex-1 flex-col">
        {draft.step === 'materials' && <MaterialsStep {...props} />}
        {draft.step === 'based' && <BasedStep {...props} />}
        {draft.step === 'countries' && <CountriesStep {...props} />}
        {draft.step === 'check' && <CheckStep {...props} />}
        {draft.step === 'upgrade' && <UpgradeStep {...props} />}
        {draft.step === 'consent' && <ConsentStep {...props} />}
        {draft.step === 'qualification' && <QualificationStep {...props} />}
        {draft.step === 'video' && <VideoStep {...props} />}
        {draft.step === 'done' && <DoneStep {...props} />}
      </div>
    </div>
  );
}
