'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/context';
import { candidateApi, type ServerResume } from '@/lib/api/candidate';
import { ApiError } from '@/lib/api/client';
import { candidateProgressApi, type ProgressStatus } from '@/lib/api/candidate-progress';
import { candidateDraft, type CandidateDraft } from '@/lib/demo/candidate';
import { canSyncToServer } from '@/lib/demo/candidate-sync';
import { hydrateCandidate } from './state';
import type { ServerSync } from '@/components/ui/wizard-header';

type Status = Exclude<ProgressStatus, 'not_started'>;
interface CandidateState {
  draft: CandidateDraft | null;
  resume: ServerResume | null;
  loading: boolean;
  error: string | null;
  server: ServerSync | undefined;
  status: ProgressStatus;
  saved: boolean;
  update: (fn: (d: CandidateDraft) => CandidateDraft) => void;
  saveNow: (status?: Status) => Promise<void>;
  reload: () => Promise<void>;
  refreshResume: () => Promise<void>;
}
const Context = React.createContext<CandidateState | null>(null);
const metaKey = (id: number) => `hp_candidate_progress_meta:${id}`;
const failure = (e: unknown) => e instanceof ApiError && e.status === 409
  ? 'This profile was updated on another device. Your local answers are kept. Reload the account copy before continuing.'
  : 'Could not save to your account. Your answers are kept in this browser. Check your connection and retry.';

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [draft, setDraft] = React.useState<CandidateDraft | null>(null);
  const [resume, setResume] = React.useState<ServerResume | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [server, setServer] = React.useState<ServerSync>();
  const [status, setStatus] = React.useState<ProgressStatus>('not_started');
  const [saved, setSaved] = React.useState(true);
  const current = React.useRef<CandidateDraft | null>(null);
  const version = React.useRef(0);
  const dirty = React.useRef(false);
  const generation = React.useRef(0);
  const statusRef = React.useRef<Status>('in_progress');
  const queue = React.useRef(Promise.resolve());
  const alive = React.useRef(true);
  const requests = React.useRef(new AbortController());
  React.useEffect(() => {
    alive.current = true;
    if (requests.current.signal.aborted) requests.current = new AbortController();
    return () => { alive.current = false; requests.current.abort(); };
  }, []);

  const cache = React.useCallback((d: CandidateDraft, pending: boolean) => {
    if (!user) return;
    setSaved(candidateDraft.save(d, user.id));
    try { localStorage.setItem(metaKey(user.id), JSON.stringify({ version: version.current, status: statusRef.current, dirty: pending })); }
    catch { setSaved(false); }
  }, [user]);

  const load = React.useCallback(async (discardLocal = false) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const local = candidateDraft.load(user.id);
      let meta: { version?: number; status?: Status; dirty?: boolean } = {};
      try { meta = JSON.parse(localStorage.getItem(metaKey(user.id)) || '{}'); } catch { /* no local pending changes */ }
      if (!canSyncToServer()) {
        current.current = local;
        setDraft(local);
        statusRef.current = meta.status ?? (local.step === 'done' ? 'completed' : 'in_progress');
        setStatus(statusRef.current);
        return;
      }
      const [progress, latestResume] = await Promise.all([candidateProgressApi.load(requests.current.signal), candidateApi.myResume()]);
      if (!alive.current) return;
      const pending = !discardLocal && meta.dirty;
      if (pending && meta.version !== progress.version) {
        current.current = local;
        setDraft(local);
        version.current = meta.version ?? 0;
        dirty.current = true;
        setError(failure(new ApiError(409, null)));
      } else {
        version.current = progress.version;
        statusRef.current = pending ? meta.status ?? 'in_progress' : progress.status === 'not_started' ? 'in_progress' : progress.status;
        const restored = hydrateCandidate(pending ? local : progress.draft, user, latestResume);
        current.current = restored;
        dirty.current = !!pending;
        setDraft(restored);
        setStatus(pending ? statusRef.current : progress.status);
        cache(restored, !!pending);
        setServer(progress.draft ? 'saved' : undefined);
      }
      setResume(latestResume);
    } catch {
      setError('Could not load your saved profile. Retry before editing so existing answers are not overwritten.');
    } finally { if (alive.current) setLoading(false); }
  }, [user, cache]);
  React.useEffect(() => { void load(); }, [load]);

  const update = React.useCallback((fn: (d: CandidateDraft) => CandidateDraft) => {
    if (!current.current) return;
    const next = { ...fn(current.current), updatedAt: new Date().toISOString() };
    current.current = next;
    dirty.current = true;
    generation.current += 1;
    statusRef.current = next.step === 'done' ? 'completed' : 'in_progress';
    setStatus(statusRef.current);
    setDraft(next);
    cache(next, true);
  }, [cache]);

  const saveNow: CandidateState['saveNow'] = React.useCallback((requested?: Status): Promise<void> => {
    if (requested) { statusRef.current = requested; setStatus(requested); }
    const job = queue.current.catch(() => undefined).then(async () => {
      if (!alive.current) return;
      const snapshot = current.current;
      if (!snapshot) return;
      if (!canSyncToServer()) { dirty.current = false; cache(snapshot, false); return; }
      const change = generation.current;
      const savingStatus = statusRef.current;
      setServer('saving');
      try {
        const response = await candidateProgressApi.save(snapshot, savingStatus, version.current, requests.current.signal);
        if (!alive.current) return;
        version.current = response.version;
        dirty.current = generation.current !== change || savingStatus !== statusRef.current;
        cache(current.current!, dirty.current);
        setServer(dirty.current ? 'idle' : 'saved');
        setError(null);
      } catch (e) {
        const message = failure(e);
        if (alive.current) { setError(message); setServer({ error: message, retry: () => { void saveNow().catch(() => undefined); } }); }
        throw e;
      }
    });
    queue.current = job;
    return job;
  }, [cache]);

  React.useEffect(() => {
    if (!draft || loading || error || !dirty.current) return;
    const timer = setTimeout(() => { void saveNow().catch(() => undefined); }, 700);
    return () => clearTimeout(timer);
  }, [draft, loading, error, saveNow]);

  const refreshResume = React.useCallback(async () => {
    const latest = await candidateApi.myResume();
    setResume(latest);
    if (latest) update((d) => ({ ...d, cvBuilt: !!latest.hasContent, role: latest.position || d.role, check: { ...d.check, ...(latest.languages.length ? { languages: latest.languages.join(', ') } : {}), ...(latest.aboutMe ? { achievement: latest.aboutMe } : {}) } }));
  }, [update]);
  const value = { draft, resume, loading, error, server, status, saved, update, saveNow, reload: () => load(true), refreshResume };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCandidate() {
  const value = React.useContext(Context);
  if (!value) throw new Error('useCandidate must be used inside CandidateProvider');
  return value;
}
