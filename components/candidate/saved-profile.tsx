'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Spinner } from '@/components/ui/primitives';
import { useCandidate } from '@/lib/candidate/context';
import { useAuth } from '@/lib/auth/context';
import { candidateApi } from '@/lib/api/candidate';
import { ProfileOverview } from './profile-overview';
import { SavedCv } from './saved-cv';
import { CvBuilder } from './cv-builder';

export function SavedProfile() {
  const { user } = useAuth();
  const { draft, resume, loading, reload, refreshResume } = useCandidate();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  if (loading) return <div className="grid place-items-center py-24"><Spinner /></div>;
  if (!draft) return <div className="space-y-4 p-6"><p>Your saved profile could not be loaded.</p><Button onClick={() => void reload()}>Retry</Button></div>;
  const download = async () => {
    setBusy(true); setError('');
    const tab = window.open('', '_blank');
    try { const url = await candidateApi.pdfUrl(); if (tab) tab.location.href = url; else window.location.href = url; }
    catch { tab?.close(); setError('Your PDF could not be prepared. Please retry after saving your profile.'); }
    finally { setBusy(false); }
  };
  return <>
    <PageHeader title="My profile" subtitle="Your saved experience, materials and qualification" />
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 md:px-8">
      <ProfileOverview />
      <section id="cv" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-heading">Your saved CV</h2><Button variant="secondary" onClick={() => setEditing(true)}>{resume ? 'Update with Smart' : 'Build with Smart'}</Button></div>
        {resume ? <><div className="overflow-hidden rounded-lg border border-line"><SavedCv resume={resume} draft={draft} name={{first:user?.first_name ?? '',last:user?.last_name ?? ''}} /></div><Button className="w-full sm:w-auto" disabled={busy} onClick={() => void download()}>{busy ? 'Preparing PDF…' : 'Download PDF — free during launch'}</Button></> : <p className="text-text-secondary">Build your profile or upload a CV to add your experience here. <Link className="font-semibold text-accent-text underline" href="/onboarding?step=materials">Add your CV</Link></p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </section>
    </div>
    {editing && <CvBuilder initialFile={null} initialResumeId={resume?.id} initialBuilt={!!resume?.hasContent} targetRoles={draft.targetRoles} onClose={(built) => { setEditing(false); if (built) void refreshResume().catch(() => setError('Your CV is saved but could not be reloaded. Refresh your profile.')); }} />}
  </>;
}
