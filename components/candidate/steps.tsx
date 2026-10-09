'use client';

import { SuccessMark } from '@/components/ui/motion';
import * as React from 'react';
import { StripeTestCheckout } from '@/components/billing/test-checkout';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Check,
  ChefHat,
  FileText,
  Images,
  Mail,
  PenLine,
  Sparkles,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { Bubble } from '@/components/landing/bubble';
import { DemoNotice } from '@/components/demo-notice';
import { CvTemplate, type CvData } from '@/components/cv/cv-template';
import { PublishConsent } from '@/components/cv/publish-consent';
import { Composer, MessageBubble, Thread } from '@/components/employer/chat';
import { VoiceButton } from '@/components/onboarding/answer-input';
import { Button, ChoiceChip, Field } from '@/components/ui/primitives';
import {
  CERT_TYPES,
  CHECK_INTRO,
  GCC_COUNTRIES,
  KITCHEN_ROLES,
  QUALIFIED_ROLES,
  isKitchen,
  matchNationality,
  parseYears,
  profileGaps,
  type CStep,
  type CandidateDraft,
} from '@/lib/demo/candidate';
import { cvConsent, profileDraft, speechRecognitionAvailable } from '@/lib/demo/storage';
import { canSyncToServer } from '@/lib/demo/candidate-sync';
import { candidateApi } from '@/lib/api/candidate';
import { AutofillError, autofillApi, readDocument } from '@/lib/api/autofill';
import { JobDetails } from './job-details';
import { mergeJobs, roleNudge, toServerExperiences, type JobDraft } from '@/lib/candidate/venues';
import { applyCvFields } from '@/lib/candidate/autofill';
import { CvBuilder } from './cv-builder';
import { CandidateRolePicker } from './role-picker';
import { SavedMaterials } from './saved-materials';
import { SavedCv } from './saved-cv';
export { QualificationStep } from './qualification';
import { cn } from '@/lib/utils';
import { afterMaterials } from '@/lib/candidate/state';
import { useCandidate } from '@/lib/candidate/context';

export interface CProps {
  draft: CandidateDraft;
  update: (fn: (d: CandidateDraft) => CandidateDraft) => void;
  go: (step: CStep) => void;
  name: { first: string; last: string };
  /** Файл — сразу на сервер (при настоящем входе). Статус показывает шапка. */
  upload?: (kind: 'cv' | 'certificate' | 'video', file: File) => Promise<void>;
  resumeId?: number | null;
  onBuilt?: () => Promise<void>;
  accountId?: number;
}

function Continue({ children = 'Continue', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button size="lg" className={cn('w-full sm:w-auto sm:min-w-56', className)} {...props}>
      {children}
      <ArrowRight size={18} aria-hidden />
    </Button>
  );
}

function Title({ title, lead }: { title: string; lead?: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-heading lg:text-4xl">{title}</h1>
      {lead && <p className="mt-2 max-w-2xl text-text-secondary">{lead}</p>}
    </div>
  );
}

/* 1. Tell us where you're based ------------------------------------------------------------ */

/**
 * Бриф кандидата, пункт 1: фоном — фото команды в ресторане, а не стоковая
 * девушка со смартфоном. Nationality — автокомплит по всему миру с первого
 * символа; Current location — свободный текст «город, страна»: маленьких
 * городов нет в справочниках, и список заставлял бы врать.
 */
export function BasedStep({ draft, update, go }: CProps) {
  const [q, setQ] = React.useState(draft.nationality);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const options = open ? matchNationality(q) : [];

  const pick = (n: string) => {
    setQ(n);
    setOpen(false);
    update((d) => ({ ...d, nationality: n }));
  };

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-8 md:px-8 lg:grid-cols-[1fr_0.9fr] lg:py-12">
      <div className="space-y-6">
        <Title title="Tell us where you're based" lead="It helps us match you with roles you can actually take." />

        <div className="relative space-y-1.5">
          <label htmlFor="nationality" className="block text-sm font-medium text-text-secondary">
            Nationality
          </label>
          <input
            id="nationality"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls="nationality-list"
            aria-autocomplete="list"
            autoComplete="off"
            value={q}
            placeholder="Start typing, e.g. Fil…"
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
              // Своё значение не засчитываем, пока не выбрано из списка.
              update((d) => ({ ...d, nationality: '' }));
            }}
            onKeyDown={(e) => {
              if (!options.length) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => (a + 1) % options.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => (a - 1 + options.length) % options.length);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                pick(options[active]);
              } else if (e.key === 'Escape') setOpen(false);
            }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            className="h-12 w-full rounded border border-line-strong bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          {options.length > 0 && (
            <ul id="nationality-list" role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-lift">
              {options.map((n, i) => (
                <li
                  key={n}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(n);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn('cursor-pointer px-4 py-2.5 text-text-primary', i === active && 'bg-accent-muted')}
                >
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field
          label="Current location"
          value={draft.location}
          onChange={(e) => update((d) => ({ ...d, location: e.target.value }))}
          placeholder="City, country — e.g. Pokhara, Nepal"
        />

        <Continue disabled={!draft.nationality || draft.location.trim().length < 2} onClick={() => go('countries')} />
      </div>

      <Image
        src="/landing/kitchen-documentary.webp"
        alt="A restaurant team at work"
        width={720}
        height={1209}
        unoptimized
        priority
        className="photo-calm hidden aspect-[4/5] w-full rounded-lg object-cover shadow-lift lg:block"
      />
    </div>
  );
}

/* 2. Create your CV or upload it ------------------------------------------------------------- */

function Tile({
  Icon,
  title,
  note,
  done,
  children,
}: {
  Icon: typeof Upload;
  title: string;
  note: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border bg-surface p-4', done ? 'border-accent-strong dark:border-accent' : 'border-line')}>
      <div className="flex items-center gap-3">
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-md', done ? 'bg-accent-strong text-on-accent dark:bg-accent' : 'bg-accent-muted text-accent-text')}>
          {done ? <Check size={20} aria-hidden /> : <Icon size={20} aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-heading">{title}</span>
          <span className="block truncate text-sm text-text-secondary">{note}</span>
        </span>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FilePick({
  label,
  accept,
  multiple,
  disabled,
  onFiles,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (names: string[], files: File[]) => void;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent focus-within:ring-2 focus-within:ring-[rgb(var(--accent-focus))]">
      <Upload size={15} aria-hidden />
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          onFiles(
            files.map((f) => f.name),
            files,
          );
          e.target.value = '';
        }}
      />
    </label>
  );
}

/**
 * Бриф кандидата, пункт 2: пять равных точек действия, все видны всем,
 * без «Skip» — профиль не может остаться пустым. Нужно хотя бы резюме:
 * загруженное или собранное в конструкторе.
 */
export function MaterialsStep({ draft, update, go, upload, resumeId, onBuilt, accountId }: CProps) {
  const [builtCv, setBuiltCv] = React.useState(false);
  const [letterOpen, setLetterOpen] = React.useState(false);
  React.useEffect(() => { if (!canSyncToServer()) setBuiltCv(!!profileDraft.load(accountId).professionId); }, [accountId]);
  const set = (patch: Partial<CandidateDraft>) => update((d) => ({ ...d, ...patch }));
  // Настоящий вход — Smart CV builder с серверным ИИ; в демо — прежний конструктор.
  const live = canSyncToServer();
  const [builder, setBuilder] = React.useState<{ file: File | null } | null>(null);
  const [cvRaw, setCvRaw] = React.useState<File | null>(null);
  const hasCv = !!draft.cvFile || builtCv || !!draft.cvBuilt;
  const targetRoles = draft.targetRoles?.length ? draft.targetRoles : draft.role ? [draft.role] : [];
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState(false);
  const [found, setFound] = React.useState<{ label: string; value: string }[] | null>(null);
  const [autofillError, setAutofillError] = React.useState<string | null>(null);
  const [jobs, setJobs] = React.useState<JobDraft[] | null>(null);
  const [cvFacts, setCvFacts] = React.useState<{ title: string | null; aboutMe: string | null; languages: string[] }>({ title: null, aboutMe: null, languages: [] });
  const [savingJobs, setSavingJobs] = React.useState(false);
  const [jobsSaved, setJobsSaved] = React.useState(false);
  const [jobsError, setJobsError] = React.useState<string | null>(null);
  // Резюме загружено: ИИ молча читает его и заполняет анкету, человек проверяет.
  const autofillFrom = async (file: File) => {
    setReading(true);
    setFound(null);
    setAutofillError(null);
    try {
      const fields = await autofillApi.cv(await readDocument(file));
      let applied: { label: string; value: string }[] = [];
      update((d) => {
        const res = applyCvFields(d, fields);
        applied = res.applied;
        return res.draft;
      });
      setFound(applied);
      setCvFacts({ title: fields.desired_positions[0] ?? null, aboutMe: fields.summary, languages: fields.languages });
      setJobsSaved(false);
      setJobsError(null);
      if (fields.experiences.length) {
        const saved = await candidateApi.myResume().catch(() => null);
        setJobs(mergeJobs(saved?.experiences ?? [], fields.experiences));
      } else setJobs(null);
    } catch (e) {
      setAutofillError(e instanceof AutofillError ? e.message : 'We could not read this CV automatically.');
    } finally {
      setReading(false);
    }
  };
  const saveJobs = async () => {
    if (!jobs) return;
    setSavingJobs(true);
    setJobsError(null);
    setJobsSaved(false);
    try {
      await candidateApi.saveCvDetails({ ...cvFacts, experiences: toServerExperiences(jobs) });
      setJobsSaved(true);
      await onBuilt?.();
    } catch {
      setJobsError('Could not save your jobs. Please try again.');
    } finally {
      setSavingJobs(false);
    }
  };
  const addCv = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      await upload?.('cv', file);
      set({ cvFile: file.name });
      setCvRaw(file);
      if (live) void autofillFrom(file);
    } catch { setUploadError('Your CV was not uploaded. Please choose the file again to retry.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <Title title="Create your candidate profile" lead="Upload an existing CV or build your profile in a short conversation. Smart will help fill in missing details. You will confirm your next positions after creating your profile." />
      <details className="rounded-lg border border-line p-4"><summary className="cursor-pointer font-semibold text-heading">Already know your desired positions? (optional)</summary><div className="mt-4"><CandidateRolePicker value={targetRoles} onChange={(roles) => set({ targetRoles: roles })} /></div></details>
      <Image src="/landing/kitchen-documentary.webp" alt="Chefs working together in a restaurant kitchen" width={720} height={1080} unoptimized className="h-24 w-full rounded-lg object-cover object-[center_65%] sm:h-32" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile Icon={Upload} title="Upload existing CV" note={draft.cvFile ?? 'PDF or DOCX'} done={!!draft.cvFile}>
          <FilePick disabled={uploading} label={uploading ? 'Uploading…' : draft.cvFile ? 'Replace' : 'Choose a file'} accept=".pdf,.docx,.txt,image/*" onFiles={(n, f) => {
              if (f[0] && !uploading) void addCv(f[0]);
            }}
          />
          {live && reading && (
            <p role="status" className="mt-3 text-sm text-text-secondary">Reading your CV and filling in your profile…</p>
          )}
          {live && found && (
            <div role="status" className="mt-3 rounded-md bg-accent-muted p-3 text-sm">
              {found.length ? (
                <>
                  <p className="font-semibold text-heading">Found in your CV</p>
                  <ul className="mt-1 space-y-0.5 text-text-secondary">
                    {found.map((x) => (
                      <li key={x.label}><span className="font-medium text-text-primary">{x.label}:</span> {x.value}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-text-secondary">We filled these in for you. Check them on the next steps.</p>
                </>
              ) : (
                <p className="text-text-secondary">Your CV is saved. We did not find anything new to fill in; you will add the details on the next steps.</p>
              )}
            </div>
          )}
          {live && autofillError && <p role="alert" className="mt-3 text-sm text-danger">{autofillError}</p>}
          {/* Созвон 29.09: загрузил резюме → ИИ задаёт вопросы и адаптирует под GCC. */}
          {live && cvRaw && (
            <button
              type="button"
              onClick={() => setBuilder({ file: cvRaw })}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text underline-offset-4 hover:underline focus-ring"
            >
              Adapt it for GCC employers with Smart
              <ArrowRight size={14} aria-hidden />
            </button>
          )}
        </Tile>

        <Tile
          Icon={PenLine}
          title="Create from scratch"
          note={draft.cvBuilt ? 'Built with Smart and saved' : builtCv ? 'Started in the CV builder' : 'Build it in a short conversation'}
          done={builtCv || !!draft.cvBuilt}
        >
          {live ? (
            <button
              type="button"
              onClick={() => setBuilder({ file: null })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text underline-offset-4 hover:underline focus-ring"
            >
              {draft.cvBuilt ? 'Open the Smart CV builder' : 'Build it with Smart'}
              <ArrowRight size={14} aria-hidden />
            </button>
          ) : (
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text underline-offset-4 hover:underline focus-ring">
              {builtCv ? 'Open the CV builder' : 'Start the CV builder'}
              <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </Tile>

        <Tile
          Icon={Mail}
          title="Cover letter"
          note={draft.coverLetterFile ?? (draft.coverLetterText ? 'Written here' : 'Upload a file or write it here')}
          done={!!draft.coverLetterFile || draft.coverLetterText.trim().length > 20}
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLetterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:border-accent focus-ring"
            >
              <PenLine size={15} aria-hidden />
              Write
            </button>
          </div>
          <div className="mt-3"><SavedMaterials kind="cover_letter" update={update} /></div>
          {letterOpen && (
            <textarea
              rows={5}
              value={draft.coverLetterText}
              onChange={(e) => set({ coverLetterText: e.target.value })}
              placeholder="A few lines about you and the kind of role you want."
              aria-label="Cover letter"
              className="mt-3 w-full resize-y rounded border border-line-strong bg-surface px-3 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
            />
          )}
        </Tile>

        <Tile Icon={Award} title="Certificates" note={draft.certificates.length ? `${draft.certificates.length} added` : 'HACCP, Food Safety, Barista…'} done={draft.certificates.length > 0}>
          <FilePick
            label="Add files"
            accept=".pdf,image/*"
            multiple
            disabled={uploading}
            onFiles={(_, files) => {
              void (async () => {
                setUploading(true); setUploadError(null);
                try { for (const file of files) {
                  await upload?.('certificate', file);
                  update((d) => ({ ...d, certificates: [...d.certificates, { name: file.name, type: 'Other' }] }));
                } } catch { setUploadError('A certificate was not saved. Files already uploaded are kept; choose the remaining files to retry.'); }
                finally { setUploading(false); }
              })();
            }}
          />
          {draft.certificates.length > 0 && (
            <ul className="mt-3 space-y-2">
              {draft.certificates.map((c, i) => (
                <li key={`${c.name}-${i}`} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-text-primary">{c.name}</span>
                  <select
                    value={c.type}
                    aria-label={`Type of ${c.name}`}
                    onChange={(e) =>
                      set({
                        certificates: draft.certificates.map((x, j) => (j === i ? { ...x, type: e.target.value as (typeof CERT_TYPES)[number] } : x)),
                      })
                    }
                    className="h-9 rounded border border-line-strong bg-surface px-2 text-text-primary focus-ring"
                  >
                    {CERT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <button type="button" aria-label={`Remove ${c.name} from this checklist`} title="Removes from this checklist; the uploaded account file is retained" onClick={() => update((d) => ({ ...d, certificates: d.certificates.filter((_, j) => j !== i) }))} className="grid h-11 w-11 shrink-0 place-items-center rounded text-text-secondary hover:text-danger focus-ring">
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile Icon={Images} title="Portfolio" note={draft.portfolio.length ? `${draft.portfolio.length} files` : 'Photos or videos of your work'} done={draft.portfolio.length > 0}>
          <p className="mb-3 text-sm text-text-secondary">Optional: dishes for kitchen roles, drinks for bar roles, or work examples and achievements for service and management roles. If you want several positions, you can include examples for each.</p>
          <SavedMaterials kind="portfolio" update={update} />
        </Tile>
      </div>

      {live && jobs && jobs.length > 0 && (
        <JobDetails
          jobs={jobs}
          onChange={(next) => { setJobs(next); setJobsSaved(false); }}
          onSave={() => void saveJobs()}
          saving={savingJobs}
          saved={jobsSaved}
          error={jobsError}
          nudge={roleNudge([...targetRoles, cvFacts.title ?? ''])}
        />
      )}

      {!live && <DemoNotice what="Sign in to upload your materials to your account." />}

      {uploadError && <p role="alert" className="text-sm text-danger">{uploadError}</p>}
      <Continue disabled={!hasCv || uploading} onClick={() => go(afterMaterials(draft))} />
      {!hasCv && <p className="text-sm text-text-secondary">Upload your CV or start the CV builder to continue.</p>}
      {builder && (
        <CvBuilder
          initialFile={builder.file}
          initialResumeId={resumeId}
          initialBuilt={!!draft.cvBuilt}
          targetRoles={targetRoles}
          onClose={(built) => {
            setBuilder(null);
            if (built) { set({ cvBuilt: true }); void onBuilt?.().catch(() => setUploadError('Your CV is saved, but could not be reloaded. Refresh to load the latest details.')); }
          }}
        />
      )}
    </div>
  );
}

/* 3. Preferred work location ------------------------------------------------------------------ */

export function CountriesStep({ draft, update, go }: CProps) {
  const toggle = (c: string) =>
    update((d) => ({ ...d, countries: d.countries.includes(c) ? d.countries.filter((x) => x !== c) : [...d.countries, c] }));
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      {/* Бриф кандидата, пункт 3: несколько стран сразу, без выбора города. */}
      <Title title="Where do you want to work?" lead="Choose all the countries where you're open to working." />
      <div className="grid gap-3 sm:grid-cols-2">
        {GCC_COUNTRIES.map((c) => {
          const on = draft.countries.includes(c);
          return (
            <label
              key={c}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border bg-surface p-4 transition-colors',
                on ? 'border-accent-strong dark:border-accent' : 'border-line hover:border-line-strong',
              )}
            >
              <input type="checkbox" checked={on} onChange={() => toggle(c)} className="h-5 w-5 accent-[rgb(var(--accent-strong))]" />
              <span className="font-medium text-heading">{c}</span>
            </label>
          );
        })}
      </div>
      <Continue disabled={!draft.countries.length} onClick={() => go('check')} />
    </div>
  );
}

/* 4. Smart-проверка профиля ------------------------------------------------------------------ */

export function CheckStep({ draft, update, go }: CProps) {
  const gaps = profileGaps(draft);
  const current = gaps.find((g) => !draft.checkDone.includes(g.key));

  const answer = (key: string, text: string | null) =>
    update((d) => ({
      ...d,
      checkDone: [...d.checkDone, key],
      check: text ? { ...d.check, [key]: text } : d.check,
      years: key === 'years' && text ? parseYears(text) : d.years,
    }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl px-5 pt-6">
        <Title title="Let's make your profile stand out" />
      </div>
      <Thread deps={draft.checkDone.length}>
        <MessageBubble m={{ id: 'intro', from: 'assistant', text: CHECK_INTRO }} />
        {gaps.map((g) =>
          draft.checkDone.includes(g.key) || g === current ? (
            <React.Fragment key={g.key}>
              <MessageBubble m={{ id: `q-${g.key}`, from: 'assistant', text: g.question }} />
              {draft.checkDone.includes(g.key) && (
                <MessageBubble m={{ id: `a-${g.key}`, from: 'user', text: draft.check[g.key] ?? 'Skipped' }} />
              )}
            </React.Fragment>
          ) : null,
        )}
        {!current && <MessageBubble m={{ id: 'done', from: 'assistant', text: 'Thanks — that makes your profile much stronger.' }} />}
      </Thread>
      <div className="shrink-0 border-t border-line bg-background">
        <div className="mx-auto max-w-2xl space-y-3 px-5 py-4">
          {current ? (
            <>
              <Composer allowFile={false} suggestion={current.suggestion} onSend={(t) => answer(current.key, t)} />
              {/* Пропущенный вопрос тихо выпадает, без «пробелов» потом. */}
              <button type="button" onClick={() => answer(current.key, null)} className="text-sm text-text-secondary underline-offset-4 hover:underline focus-ring">
                Skip this one
              </button>
            </>
          ) : (
            <Continue onClick={() => go('upgrade')} />
          )}
        </div>
      </div>
    </div>
  );
}

/* Резюме под GCC: сначала результат, потом предложение скачать -------------------------------- */

export function buildCv(d: CandidateDraft, name: { first: string; last: string }): CvData {
  const certs = d.certificates.map((c) => (c.type === 'Other' ? c.name.replace(/\.[a-z]+$/i, '') : c.type));
  const fromCheck = d.check.certs ? [d.check.certs] : [];
  const role = d.role;
  return {
    firstName: name.first || 'Your',
    lastName: name.last || 'Name',
    role,
    nationality: d.nationality || null,
    years: d.years,
    location: d.location || null,
    summary:
      [
        role ? `${role}` : 'Hospitality professional',
        d.years !== null ? `with ${d.years}+ years of experience` : null,
        d.countries.length ? `open to roles in ${d.countries.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' ') + '.',
    skills: [],
    work: d.check.achievement ? [{ title: role ?? 'Most recent role', place: null, dates: null, bullets: [d.check.achievement] }] : [],
    education: [],
    languages: d.check.languages ? [d.check.languages] : [],
    certificates: [...certs, ...fromCheck],
  };
}

/**
 * Созвон 29.09: адаптированное под GCC резюме есть у каждого кандидата и его
 * видит работодатель — бесплатно. Платно ($8, разово) — только скачать и
 * распечатать PDF самому кандидату. Отказ ничего не блокирует.
 */
const CV_DOWNLOAD_PRICE = '$8';

export function UpgradeStep({ draft, update, go, name, resumeId }: CProps) {
  const { resume, refreshResume } = useCandidate();
  const choose = (upgrade: 'yes' | 'no') => {
    update((d) => ({ ...d, upgrade }));
    go('consent');
  };
  // Настоящий вход (вариант «б», 30.09): платёжки ещё нет — на запуске PDF
  // скачивается бесплатно, его собирает сервер (/api/resumes/my/<id>/pdf/).
  const live = canSyncToServer();
  const [downloading, setDownloading] = React.useState(false);
  const [dlError, setDlError] = React.useState<string | null>(null);
  const download = async () => {
    setDlError(null);
    setDownloading(true);
    // Вкладку открываем сразу по клику: открытую после ожидания сервера
    // браузер сочтёт всплывающим окном и заблокирует.
    const tab = window.open('', '_blank');
    try {
      const url = await candidateApi.pdfUrl();
      if (tab) tab.location.href = url;
      else window.location.href = url;
      choose('yes');
    } catch {
      tab?.close();
      setDlError("Couldn't prepare the PDF. Finish your profile first, then try again from your profile.");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <Title
        title="Review your profile"
        lead="Check the details saved to your profile before continuing. Downloading a CV is optional and does not block your qualification."
      />

      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Your source</p>
          <ul className="mt-3 space-y-1.5 text-sm text-text-primary">
            <li>{draft.cvFile ?? 'CV from the builder'}</li>
            {Object.entries(draft.check).map(([k, v]) => (
              <li key={k} className="text-text-secondary">
                {v}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent-text">{live ? 'Saved profile' : 'Browser preview'}</p>
          <div className="overflow-hidden rounded-lg border border-line shadow-lift">
            {live ? resume ? <SavedCv resume={resume} draft={draft} name={name} /> : <div className="space-y-3 p-5"><p>Your saved profile is not loaded yet.</p><Button variant="secondary" onClick={() => void refreshResume().catch(() => setDlError('Could not reload your profile. Please retry.'))}>Reload profile</Button></div> : <CvTemplate data={buildCv(draft, name)} />}
          </div>
        </div>
      </div>

      {!live && <DemoNotice what="This preview uses your browser answers. Sign in to build and download your saved CV." />}
      {live && <StripeTestCheckout plan="cv_download" resourceId={resumeId} />}

      <div className="flex flex-wrap gap-2">
        {live ? (
          <Continue onClick={download} disabled={downloading}>
            <Sparkles size={17} aria-hidden />
            {downloading ? 'Preparing your PDF…' : 'Download PDF — free during launch'}
          </Continue>
        ) : (
          <Continue onClick={() => choose('yes')}>
            <Sparkles size={17} aria-hidden />
            Download PDF — {CV_DOWNLOAD_PRICE}
          </Continue>
        )}
        {/* Отказ не блокирует — сразу дальше, без экранов-препятствий. */}
        <Button variant="secondary" size="lg" onClick={() => choose('no')}>
          Continue for free
        </Button>
      </div>
      {dlError && <p className="text-sm text-danger">{dlError}</p>}
    </div>
  );
}

/* 5. Согласие ---------------------------------------------------------------------------------- */

export function ConsentStep({ go, name, accountId }: CProps) {
  const [signed, setSigned] = React.useState(false);
  React.useEffect(() => setSigned(!!cvConsent.load(accountId).signedAt), [accountId]);
  const full = [name.first, name.last].filter(Boolean).join(' ');
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <PublishConsent defaultName={full} onSigned={() => go('qualification')} />
      {signed && <Continue onClick={() => go('qualification')} />}
    </div>
  );
}

/* 6. Квалификация --------------------------------------------------------------------------------- */

export function VideoStep({ draft, update, go, upload }: CProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <Title title="Add a short video intro" lead="Optional. 30–60 seconds: who you are and what you do. Not speaking on camera won't count against you." />
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-strong px-5 py-3 font-semibold text-on-accent focus-within:ring-2 focus-within:ring-[rgb(var(--accent-focus))] dark:bg-accent">
          <Video size={18} aria-hidden />
          {draft.videoFile ? 'Replace video' : 'Upload a video'}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={uploading}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.size > 4 * 1024 * 1024) { setError('Choose a video up to 4 MB. Compress longer recordings before uploading.'); return; }
              setUploading(true); setError('');
              try { await upload?.('video', f); update((d) => ({ ...d, video: 'added', videoFile: f.name })); }
              catch { setError('Your video was not saved. Your previous video is kept; choose the file again to retry.'); }
              finally { setUploading(false); }
            }}
          />
        </label>
        {draft.videoFile && (
          <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
            <Check size={15} aria-hidden className="text-success" />
            {draft.videoFile}
          </span>
        )}
      </div>
      {uploading && <p role="status" className="text-sm text-text-secondary">Saving your video…</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <p className="text-sm text-text-secondary">Video files up to 4 MB.</p>
      <p className="text-sm text-text-secondary">You can also record it in the HorecaPass app — it syncs to the same account.</p>
      <div className="flex flex-wrap gap-2">
        <Continue disabled={!draft.videoFile || uploading} onClick={() => go('done')}>
          Finish
        </Continue>
        <Button
          variant="secondary"
          size="lg"
          disabled={uploading}
          onClick={() => {
            update((d) => ({ ...d, video: d.videoFile ? 'added' : 'later' }));
            go('done');
          }}
        >
          Later
        </Button>
      </div>
    </div>
  );
}

export function DoneStep({ draft }: CProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-12 text-center md:px-8 lg:py-20">
      <SuccessMark />
      <h1 className="text-3xl font-bold tracking-tight text-heading lg:text-4xl">Your profile is ready</h1>
      <p className="text-lg leading-relaxed text-text-secondary">Your saved profile is ready to use. You can return to your qualification and video introduction at any time. A Verified badge requires a separate review.</p>
      {/* При настоящем входе профиль уже на сервере — плашка только для демо. */}
      {!canSyncToServer() && (
        <DemoNotice className="text-left" what="Nothing was sent to the server: this walkthrough keeps everything in the browser." />
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/jobs" className="inline-flex h-13 items-center gap-2 rounded-full bg-accent-strong px-6 font-semibold text-on-accent focus-ring dark:bg-accent">
          See matching jobs
          <ArrowRight size={18} aria-hidden />
        </Link>
        <Link href="/profile" className="inline-flex h-13 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 font-semibold text-text-primary focus-ring">
          My profile
        </Link>
      </div>
    </div>
  );
}
