'use client';

import { useToast } from '@/components/ui/toast';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Image as ImageIcon, Mail, MessageSquare, Phone, Sparkles, Video, X } from 'lucide-react';
import { Button, Chip, Spinner } from '@/components/ui/primitives';
import { ApiError } from '@/lib/api/client';
import {
  companyApplicationsApi,
  FUNNEL,
  RELOCATION_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ApplicationStatus,
  type CandidateSummary,
  type CompanyApplication,
} from '@/lib/api/applications';
import type { CandidateMaterial } from '@/lib/api/materials';
import { chatsApi } from '@/lib/api/chats';
import { isSample } from '@/lib/demo/samples';
import { venueLine } from '@/lib/candidate/venues';
import { cn } from '@/lib/utils';

/**
 * Карточка кандидата у работодателя: профиль, этап воронки, чат, AI-разбор.
 *
 * Всё настоящее: PATCH /api/applications/<id>/status/,
 * POST /api/chats/applications/<id>/start/,
 * GET /api/applications/company/<id>/ai-summary/.
 * На образцах (пустой аккаунт) этап меняется только на экране.
 */

const STAGES: ApplicationStatus[] = [...FUNNEL, 'REJECTED'];
const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '' || value === false) return null;
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-6 py-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

export function CandidatePanel({
  app,
  onClose,
  onStatus,
}: {
  app: CompanyApplication;
  onClose: () => void;
  onStatus: (id: number, status: ApplicationStatus) => void;
}) {
  const router = useRouter();
  const sample = isSample(app.id);
  const d = app.details;
  const closeRef = React.useRef<HTMLButtonElement>(null);

  const [saving, setSaving] = React.useState<ApplicationStatus | null>(null);
  const [stageError, setStageError] = React.useState<string | null>(null);
  const toast = useToast();
  const [opening, setOpening] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<CandidateSummary | null>(null);
  const [summaryState, setSummaryState] = React.useState<'idle' | 'loading' | { error: string }>('idle');
  const [materials, setMaterials] = React.useState<CandidateMaterial[]>([]);
  const [materialsState, setMaterialsState] = React.useState<'idle' | 'loading' | { error: string }>('idle');
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);

  // Esc закрывает, фокус — на кнопку закрытия, страница под панелью не прокручивается.
  React.useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Другой кандидат — разбор и ошибки прошлого не показываем.
  React.useEffect(() => {
    setSummary(null);
    setSummaryState('idle');
    setStageError(null);
    setChatError(null);
    setMaterials([]);
    if (sample) {
      setMaterialsState('idle');
      return;
    }
    setMaterialsState('loading');
    let cancelled = false;
    companyApplicationsApi
      .materials(app.id)
      .then((items) => {
        if (!cancelled) {
          setMaterials(items);
          setMaterialsState('idle');
        }
      })
      .catch(() => {
        if (!cancelled) setMaterialsState({ error: 'Could not load the candidate’s attachments.' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const downloadMaterial = async (item: CandidateMaterial) => {
    setDownloadingId(item.id);
    try {
      await companyApplicationsApi.downloadMaterial(app.id, item);
    } catch {
      toast.error('Could not download the file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const move = async (status: ApplicationStatus) => {
    if (status === app.status || saving) return;
    const prev = app.status;
    setStageError(null);
    onStatus(app.id, status);
    if (sample) return;
    setSaving(status);
    try {
      await companyApplicationsApi.setStatus(app.id, status);
      toast.success(status === 'REJECTED' ? 'Candidate rejected' : `Moved to ${STATUS_LABEL[status]}`);
    } catch {
      onStatus(app.id, prev);
      setStageError('Could not change the stage. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const message = async () => {
    setChatError(null);
    setOpening(true);
    try {
      const room = await chatsApi.startForApplication(app.id);
      router.push(`/company/chats?room=${room.id}`);
    } catch {
      setChatError('Could not open the chat. Please try again.');
      setOpening(false);
    }
  };

  const loadSummary = async () => {
    setSummaryState('loading');
    try {
      setSummary(await companyApplicationsApi.aiSummary(app.id));
      setSummaryState('idle');
    } catch (e) {
      setSummaryState({
        error:
          e instanceof ApiError && e.status === 503
            ? 'The Smart summary is unavailable right now. Try again in a minute.'
            : 'Could not get the Smart summary. Please try again.',
      });
    }
  };

  const whatsapp = d.phone ? d.phone.replace(/[^\d]/g, '') : '';
  const position = [d.position, d.positionLevel].filter(Boolean).join(' · ');
  const empty =
    !position && !d.location && !d.nationality && !d.languages.length && !d.skills.length && !d.experiences.length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="fade-in absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-name"
        className="slide-in-right relative flex h-dvh w-full flex-col overflow-y-auto bg-surface shadow-card sm:w-[34rem] scroll-slim"
      >
        <header className="flex items-start gap-3 px-6 pb-4 pt-5">
          <span
            aria-hidden
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-alt text-lg font-semibold text-text-secondary"
          >
            {(app.applicant || '?').trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="candidate-name" className="truncate text-xl font-bold text-heading">
              {app.applicant}
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              {app.vacancyTitle} · applied {DATE_FMT.format(app.createdAt)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_TONE[app.status])}>
                {STATUS_LABEL[app.status]}
              </span>
              {app.matchScore != null && <Chip>{app.matchScore}% match</Chip>}
              {sample && (
                <span className="rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[11px] text-text-secondary">
                  sample
                </span>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close candidate"
            className="-mr-2 rounded-full p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex flex-wrap gap-2 px-6 pb-5">
          <Button size="sm" onClick={message} disabled={sample || opening}>
            {opening ? <Spinner className="h-4 w-4" /> : <MessageSquare size={15} />}
            Message
          </Button>
          {d.email && (
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = `mailto:${d.email}`)}>
              <Mail size={15} />
              Email
            </Button>
          )}
          {d.phone && (
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = `tel:${d.phone}`)}>
              <Phone size={15} />
              Call
            </Button>
          )}
          {whatsapp && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`https://wa.me/${whatsapp}`, '_blank', 'noopener')}
            >
              WhatsApp
            </Button>
          )}
        </div>
        {chatError && <p className="px-6 pb-4 text-sm text-danger">{chatError}</p>}
        {sample && (
          <p className="px-6 pb-4 text-xs text-text-secondary">
            This is a sample candidate: the stage changes only on this screen, messages and the Smart summary are off.
          </p>
        )}

        <Section title="Stage">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Move to stage">
            {STAGES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={app.status === s}
                disabled={!!saving}
                onClick={() => move(s)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-ring disabled:opacity-70',
                  app.status === s
                    ? s === 'REJECTED'
                      ? 'bg-danger text-white'
                      : 'bg-accent-strong text-on-accent'
                    : 'bg-surface-muted text-text-secondary hover:text-text-primary',
                )}
              >
                {saving === s && <Spinner className="h-3.5 w-3.5" />}
                {s === 'REJECTED' ? 'Reject' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">The candidate is notified when the stage changes.</p>
          {stageError && <p className="mt-2 text-sm text-danger">{stageError}</p>}
          {app.relocationStep && app.relocationStep !== 'NOT_STARTED' && (
            <p className="mt-3 text-sm text-text-primary">
              Visa and relocation:{' '}
              <span className="font-medium">{RELOCATION_LABEL[app.relocationStep] ?? app.relocationStep}</span>
            </p>
          )}
        </Section>

        <Section title="Smart summary">
          {!summary && summaryState !== 'loading' && (
            <>
              <p className="text-sm text-text-secondary">
                An honest take on this candidate for this job: fit, strengths, gaps and questions to ask.
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={loadSummary} disabled={sample}>
                <Sparkles size={15} />
                Get Smart summary
              </Button>
            </>
          )}
          {summaryState === 'loading' && (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner className="h-4 w-4" /> Reading the profile…
            </p>
          )}
          {typeof summaryState === 'object' && <p className="mt-2 text-sm text-danger">{summaryState.error}</p>}
          {summary && (
            <div className="space-y-4">
              {(summary.fitScore != null || summary.verdict) && (
                <p className="text-sm text-text-primary">
                  {summary.fitScore != null && (
                    <span className="mr-2 font-bold text-heading">{summary.fitScore}% fit</span>
                  )}
                  {summary.verdict}
                </p>
              )}
              {summary.strengths.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-text-primary">Strengths</p>
                  <List items={summary.strengths} />
                </div>
              )}
              {summary.gaps.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-text-primary">Gaps</p>
                  <List items={summary.gaps} />
                </div>
              )}
              {summary.interviewQuestions.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-text-primary">Questions for the interview</p>
                  <List items={summary.interviewQuestions} />
                </div>
              )}
            </div>
          )}
        </Section>

        <Section title="Profile">
          {empty ? (
            <p className="text-sm text-text-secondary">The candidate hasn&apos;t filled in the profile yet.</p>
          ) : (
            <dl>
              <Row label="Position" value={position} />
              <Row label="Location" value={d.location} />
              <Row label="Nationality" value={d.nationality} />
              <Row label="Age" value={d.age} />
              <Row label="Visa" value={d.visaStatus} />
              <Row label="Wants to work in" value={d.targetCountry} />
              <Row label="Expected salary" value={d.desiredSalary} />
              <Row label="Available from" value={d.availableFrom} />
              <Row label="Relocation" value={d.relocationReady ? 'Ready to relocate' : null} />
            </dl>
          )}
          {d.languages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.languages.map((l) => (
                <Chip key={l}>{l}</Chip>
              ))}
            </div>
          )}
          {d.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.skills.map((s) => (
                <Chip key={s} className="bg-accent-muted text-text-primary">
                  {s}
                </Chip>
              ))}
            </div>
          )}
        </Section>

        {d.experiences.length > 0 && (
          <Section title="Experience">
            <ol className="space-y-3">
              {d.experiences.map((e, i) => (
                <li key={i} className="text-sm">
                  <p className="font-semibold text-text-primary">{e.position || 'Role'}</p>
                  <p className="text-text-secondary">{[e.company, e.location, e.period].filter(Boolean).join(' · ')}</p>
                  {venueLine(e) && <p className="mt-0.5 font-medium text-accent-text">{venueLine(e)}</p>}
                  {e.about && <p className="mt-1 whitespace-pre-line text-text-secondary">{e.about}</p>}
                  {e.responsibilities.length === 0 && e.achievements.length === 0 && e.description && <p className="mt-1 text-text-primary">{e.description}</p>}
                  {e.responsibilities.length > 0 && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-text-primary">
                      {e.responsibilities.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  )}
                  {e.achievements.length > 0 && (
                    <>
                      <p className="mt-1.5 font-semibold text-text-primary">Achievements</p>
                      <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-text-primary">
                        {e.achievements.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {d.educations.length > 0 && (
          <Section title="Education">
            <List items={d.educations} />
          </Section>
        )}

        {d.certificates.length > 0 && (
          <Section title="Certificates">
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">
              {d.certificates.map((c, i) => (
                <li key={i}>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent-text underline-offset-2 hover:underline focus-ring"
                    >
                      {c.title}
                    </a>
                  ) : (
                    c.title
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(app.coverLetter || app.videoGreetingUrl) && (
          <Section title="From the candidate">
            {app.coverLetter && <p className="whitespace-pre-line text-sm text-text-primary">{app.coverLetter}</p>}
            {app.videoGreetingUrl && (
              <a
                href={app.videoGreetingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text underline-offset-2 hover:underline focus-ring"
              >
                <Video size={15} />
                Watch the video intro
              </a>
            )}
          </Section>
        )}

        {(materials.length > 0 || materialsState === 'loading' || typeof materialsState === 'object') && (
          <Section title="Attachments">
            {materialsState === 'loading' && (
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <Spinner className="h-4 w-4" /> Loading attachments…
              </p>
            )}
            {typeof materialsState === 'object' && <p className="text-sm text-danger">{materialsState.error}</p>}
            {materialsState === 'idle' && materials.length > 0 && (
              <ul className="space-y-2">
                {materials.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    {item.kind === 'portfolio' ? (
                      <ImageIcon size={16} className="shrink-0 text-text-secondary" />
                    ) : (
                      <FileText size={16} className="shrink-0 text-text-secondary" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => downloadMaterial(item)}
                      disabled={downloadingId === item.id}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-text underline-offset-2 hover:underline focus-ring disabled:opacity-60"
                    >
                      {downloadingId === item.id ? <Spinner className="h-3.5 w-3.5" /> : <Download size={14} />}
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {(d.email || d.phone) && (
          <Section title="Contacts">
            <dl>
              <Row label="Email" value={d.email} />
              <Row label="Phone" value={d.phone} />
            </dl>
          </Section>
        )}
      </div>
    </div>
  );
}
