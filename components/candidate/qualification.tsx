'use client';

import * as React from 'react';
import { Button, ChoiceChip } from '@/components/ui/primitives';
import { CandidateRolePicker } from './role-picker';
import { VoiceButton } from '@/components/onboarding/answer-input';
import { speechRecognitionAvailable } from '@/lib/demo/storage';
import { qualificationApi, type QualificationSession } from '@/lib/api/qualification';
import { candidateApi } from '@/lib/api/candidate';
import { canSyncToServer } from '@/lib/demo/candidate-sync';
import { isKitchen, KITCHEN_ROLES } from '@/lib/demo/candidate';
import type { CProps } from './steps';

export function QualificationStep({ draft, update, go }: CProps) {
  const [roles, setRoles] = React.useState<string[]>([]);
  const [recommendation, setRecommendation] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<QualificationSession | null>(null);
  const [role, setRole] = React.useState(draft.role ?? '');
  const [level, setLevel] = React.useState(draft.years === null ? 0 : draft.years <= 1 ? 1 : draft.years <= 4 ? 2 : 3);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [text, setText] = React.useState('');
  const [mode, setMode] = React.useState<'text' | 'voice_transcript'>('text');
  const [elapsed, setElapsed] = React.useState(0);
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const telemetry = React.useRef({ start: Date.now(), paste: false, lost: 0, seconds: 0, hiddenAt: null as number | null });
  const question = session?.questions[session.answers.length];
  const questionId = question?.id;
  const selected = draft.targetRoles.length ? draft.targetRoles : draft.role ? [draft.role] : [];

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    if (!canSyncToServer()) { setLoading(false); return; }
    try {
      const data = await qualificationApi.load();
      setRoles(data.roles); setSession(data.session);
      if (data.session) { setRole(data.session.role); setLevel(data.session.level); }
      const resume = await candidateApi.myResume();
      setRecommendation(resume?.position && resume.position !== 'Hospitality professional' ? resume.position : null);
    } catch { setError('Could not load qualification. Your profile is saved; retry when the service is available.'); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { setVoiceSupported(speechRecognitionAvailable()); void load(); }, [load]);
  React.useEffect(() => {
    setText(''); setMode('text'); setElapsed(0);
    telemetry.current = { start: Date.now(), paste: false, lost: 0, seconds: 0, hiddenAt: document.hidden ? Date.now() : null };
    if (!questionId) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - telemetry.current.start) / 1000)), 1000);
    const visibility = () => {
      const t = telemetry.current;
      if (document.hidden && t.hiddenAt === null) { t.hiddenAt = Date.now(); t.lost++; }
      if (!document.hidden && t.hiddenAt !== null) { t.seconds += Math.floor((Date.now() - t.hiddenAt) / 1000); t.hiddenAt = null; }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [questionId]);

  const act = async (job: () => Promise<QualificationSession>) => {
    setBusy(true); setError(null);
    try { setSession(await job()); }
    catch { setError('Could not finish this request. Your saved answers are kept. Retry, or reload your account copy.'); }
    finally { setBusy(false); }
  };
  const start = () => void act(async () => {
    const saved = await qualificationApi.start(role, level);
    update((d) => ({ ...d, role, qualRequested: true }));
    return saved;
  });
  const submit = () => {
    if (!session || !question || !text.trim()) return;
    const t = telemetry.current;
    void act(() => qualificationApi.answer(session.id, {
      question_id: question.id, text: text.trim(), mode,
      elapsed_seconds: Math.min(86400, Math.floor((Date.now() - t.start) / 1000)),
      paste_detected: t.paste, focus_lost_count: Math.min(10000, t.lost),
      focus_lost_seconds: Math.min(86400, t.seconds + (t.hiddenAt ? Math.floor((Date.now() - t.hiddenAt) / 1000) : 0)),
    }));
  };

  return <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
    <div><h1 className="text-3xl font-bold text-heading">Your next role</h1><p className="mt-2 text-text-secondary">Your experience and your next position can be different. Confirm the positions you want, then qualify for one of them.</p></div>
    {error && <div role="alert" className="space-y-2 rounded-lg border border-line p-4"><p className="text-danger">{error}</p><Button variant="secondary" disabled={busy} onClick={() => void load()}>Reload saved session</Button></div>}
    {loading ? <p role="status">Loading your saved progress…</p> : !canSyncToServer() ? <p>Sign in to save your qualification answers to your account.</p> : session ? <>
      <p className="text-sm text-text-secondary">Qualifying for: <strong>{session.role}</strong> · Level {session.level}</p>
      {question ? <>
        <div className="flex items-center justify-between gap-3 text-sm"><span>Question {session.answers.length + 1} of {session.questions.length}</span><span aria-label="Elapsed answer time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span></div>
        <progress className="h-2 w-full accent-[rgb(var(--accent-strong))]" value={session.answers.length} max={8} aria-label="Qualification progress" />
        <h2 className="text-xl font-semibold text-heading">{question.text}</h2>
        <p className="text-sm text-text-secondary">Answer by text or dictate your answer. Please use your own words and do not use AI-generated answers.</p>
        <label className="block"><span className="sr-only">Your answer</span><textarea rows={6} maxLength={4000} value={text} disabled={busy} onChange={(e) => setText(e.target.value)} onPaste={() => { telemetry.current.paste = true; }} className="w-full rounded-lg border border-line-strong bg-surface p-4 text-text-primary focus-ring" /></label>
        {voiceSupported && <VoiceButton key={question.id} disabled={busy} onText={(value) => { setText(value); setMode('voice_transcript'); }} />}
        <p className="text-xs text-text-secondary">Voice dictation creates editable text; the audio recording is not stored. We record time, pasted-text events and time away from this tab to help review answers. These signals do not determine your result.</p>
        <Button disabled={busy || !text.trim()} onClick={submit}>{busy ? 'Saving…' : 'Save answer and continue'}</Button>
      </> : <>
        <h2 className="text-xl font-semibold text-heading">Your eight answers are saved</h2>
        <p className="text-text-secondary">{session.result ? 'Your qualification is awaiting review. You can add your video introduction while it is checked.' : 'Ask Smart to review your answers. Your profile stays available while the result is checked.'}</p>
        {!session.result && <Button disabled={busy} onClick={() => void act(() => qualificationApi.evaluate(session.id))}>{busy ? 'Reviewing…' : 'Review my answers with Smart'}</Button>}
        <Button variant="secondary" disabled={busy} onClick={() => go('video')}>Continue to video introduction</Button>
      </>}
      <Button variant="ghost" disabled={busy} onClick={() => setSession(null)}>Choose another position</Button>
    </> : <>
      {recommendation && <div className="rounded-lg border border-line bg-surface p-4"><p className="text-sm text-text-secondary">Position from your saved CV</p><p className="font-semibold text-heading">{recommendation}</p><p className="mt-1 text-sm text-text-secondary">Keep this direction or choose a different next role. It does not limit your choices.</p><Button variant="secondary" onClick={() => update((d) => ({ ...d, targetRoles: [...new Set([...d.targetRoles, recommendation])].slice(0, 10) }))}>Add to my desired positions</Button></div>}
      <CandidateRolePicker choices={[...roles, ...KITCHEN_ROLES]} value={selected} onChange={(values) => { update((d) => ({ ...d, targetRoles: values })); if (!values.includes(role)) setRole(''); }} />
      <div><p className="mb-2 font-semibold text-heading">Which position would you like to qualify for now?</p><div className="flex flex-wrap gap-2">{selected.map((value) => <ChoiceChip key={value} selected={value === role} onClick={() => setRole(value)}>{value}</ChoiceChip>)}</div></div>
      {role && isKitchen(role) ? <><p>Kitchen roles use your experience and portfolio. There is no approved kitchen question bank yet.</p><Button onClick={() => { update((d) => ({ ...d, role })); go('video'); }}>Continue to video introduction</Button></> : <>
        {role && !roles.includes(role) && <p className="text-text-secondary">The question bank has no questions for “{role}” yet. Keep your desired position, or select a listed FOH role for this qualification.</p>}
        <label className="block space-y-2"><span className="font-semibold text-heading">Level for this position</span><select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full rounded border border-line-strong bg-surface p-3 text-text-primary"><option value={0}>Choose a level</option><option value={1}>Entry — 0–1 years</option><option value={2}>Experienced — 2–4 years</option><option value={3}>Senior / team lead</option></select></label>
        <Button disabled={busy || !level || !roles.includes(role) || !selected.includes(role)} onClick={start}>{busy ? 'Preparing…' : 'Start my eight questions'}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => go('video')}>Do qualification later</Button>
      </>}
    </>}
  </div>;
}
