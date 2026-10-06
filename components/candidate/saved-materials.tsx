'use client';

import * as React from 'react';
import { Download, Upload, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { materialsApi, type CandidateMaterial } from '@/lib/api/materials';
import { canSyncToServer } from '@/lib/demo/candidate-sync';
import type { CandidateDraft } from '@/lib/demo/candidate';
import { Button } from '@/components/ui/primitives';

export function SavedMaterials({ kind, update }: { kind: CandidateMaterial['kind']; update: (fn: (d: CandidateDraft) => CandidateDraft) => void }) {
  const [items, setItems] = React.useState<CandidateMaterial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const input = React.useRef<HTMLInputElement>(null);
  const sequence = React.useRef(0);
  const mounted = React.useRef(true);
  const live = canSyncToServer();
  const apply = React.useCallback((rows: CandidateMaterial[]) => {
    const matching = rows.filter((row) => row.kind === kind);
    setItems(matching);
    update((d) => kind === 'portfolio' ? { ...d, portfolio: matching.map((m) => m.name) } : { ...d, coverLetterFile: matching[0]?.name ?? null });
  }, [kind, update]);
  const load = React.useCallback(async () => {
    const version = ++sequence.current;
    setLoading(true); setError('');
    try { if (live) { const rows = await materialsApi.list(); if (mounted.current && sequence.current === version) apply(rows); } }
    catch { if (mounted.current && sequence.current === version) setError('Saved files could not be loaded. Retry before adding more files.'); }
    finally { if (mounted.current && sequence.current === version) setLoading(false); }
  }, [live, apply]);
  React.useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; sequence.current++; }; }, [load]);
  const upload = async (files: File[]) => {
    sequence.current++;
    setBusy(true); setError('');
    const added: CandidateMaterial[] = [];
    try {
      for (const file of files) {
        const max = 4;
        if (!file.size || file.size > max * 1024 * 1024) throw new Error(`“${file.name}” must be a non-empty file up to ${max} MB.`);
        added.push(await materialsApi.upload(kind, file));
        if (!mounted.current) return;
        // Reflect each confirmed save even if a later file fails.
        apply(kind === 'cover_letter' ? [added[added.length - 1]] : [...items, ...added]);
      }
    } catch (e) {
      const detail = e instanceof ApiError && e.payload && typeof e.payload === 'object' ? e.payload as Record<string, unknown> : null;
      if (mounted.current) setError(detail?.detail ? String(detail.detail) : detail?.file ? String(detail.file) : e instanceof ApiError ? 'The file was not saved. Check its format and try again.' : e instanceof Error ? e.message : 'Upload failed.');
    } finally { if (mounted.current) setBusy(false); }
  };
  return <div className="space-y-3">
    <p className="text-xs text-text-secondary">{kind === 'cover_letter' ? 'PDF, DOCX or TXT · up to 4 MB' : 'JPG, PNG, WebP, MP4 or WebM · up to 4 MB per file. Up to 12 files; compress longer videos before uploading.'}</p>
    <input ref={input} type="file" aria-label={kind === 'portfolio' ? 'Portfolio files' : 'Cover letter file'} className="sr-only" disabled={!live || busy || loading || !!error} multiple={kind === 'portfolio'} accept={kind === 'portfolio' ? '.jpg,.jpeg,.png,.webp,.mp4,.webm' : '.pdf,.docx,.txt'} onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ''; if (files.length) void upload(files); }} />
    <Button size="sm" variant="secondary" disabled={!live || busy || loading || !!error} onClick={() => input.current?.click()}><Upload size={15} aria-hidden />{busy ? 'Saving…' : loading ? 'Loading…' : kind === 'cover_letter' && items.length ? 'Replace file' : 'Add files'}</Button>
    {!live && <p className="text-sm text-text-secondary">Sign in to upload and keep your files across devices.</p>}
    {items.length > 0 && <ul className="space-y-2">{items.map((item) => <li key={item.id} className="flex min-w-0 items-center gap-2 rounded border border-line p-2 text-sm">
      <span className="min-w-0 flex-1"><span className="block break-all text-text-primary">{item.name}</span><span className="text-xs text-text-secondary">{item.size < 1024 * 1024 ? `${Math.max(1, Math.round(item.size / 1024))} KB` : `${(item.size / 1024 / 1024).toFixed(1)} MB`} · Saved to your account</span></span>
      <button disabled={busy} className="grid h-10 w-10 shrink-0 place-items-center rounded hover:bg-surface-alt focus-ring" aria-label={`Download ${item.name}`} onClick={async () => { setBusy(true); setError(''); try { await materialsApi.download(item); } catch { setError('Download failed. Please retry.'); } finally { setBusy(false); } }}><Download size={17} /></button>
      <button disabled={busy} className="grid h-10 w-10 shrink-0 place-items-center rounded text-text-secondary hover:text-danger focus-ring" aria-label={`Remove ${item.name}`} onClick={async () => { setBusy(true); setError(''); try { await materialsApi.remove(item.id); apply(items.filter((m) => m.id !== item.id)); } catch { setError('The file was not removed. Please retry.'); } finally { setBusy(false); } }}><X size={17} /></button>
    </li>)}</ul>}
    {error && <div role="alert" className="space-y-2"><p className="text-sm text-danger">{error}</p><Button variant="secondary" size="sm" disabled={busy} onClick={() => void load()}>Reload saved files</Button></div>}
  </div>;
}
