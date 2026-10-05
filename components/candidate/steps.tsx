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
import { CvBuilder } from './cv-builder';
import { cn } from '@/lib/utils';
import { afterMaterials } from '@/lib/candidate/state';

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
        src="/landing/kitchen.webp"
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
  onFiles,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  onFiles: (names: string[], files: File[]) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent focus-within:ring-2 focus-within:ring-[rgb(var(--accent-focus))]">
      <Upload size={15} aria-hidden />
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
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
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const addCv = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      await upload?.('cv', file);
      set({ cvFile: file.name });
      setCvRaw(file);
      if (live) setBuilder({ file });
    } catch { setUploadError('Your CV was not uploaded. Please choose the file again to retry.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <Title title="Start with your CV" lead="Upload an existing CV or create one from scratch. Smart will help you fill in the missing details." />
      <Image src="/landing/kitchen.webp" alt="A hospitality team working together" width={720} height={320} unoptimized className="h-24 w-full rounded-lg object-cover object-center sm:h-32" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile Icon={Upload} title="Upload existing CV" note={draft.cvFile ?? 'PDF or DOCX'} done={!!draft.cvFile}>
          <FilePick label={uploading ? 'Uploading…' : draft.cvFile ? 'Replace' : 'Choose a file'} accept=".pdf,.docx,.txt,image/*" onFiles={(n, f) => {
              if (f[0] && !uploading) void addCv(f[0]);
            }}
          />
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
            <FilePick label="Upload" accept=".pdf,.doc,.docx,.txt" onFiles={(n) => set({ coverLetterFile: n[0] ?? null })} />
            <button
              type="button"
              onClick={() => setLetterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:border-accent focus-ring"
            >
              <PenLine size={15} aria-hidden />
              Write
            </button>
          </div>
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
            onFiles={(n, f) => {
              set({ certificates: [...draft.certificates, ...n.map((name) => ({ name, type: 'Other' as const }))] });
              f.forEach((file) => { void upload?.('certificate', file).catch(() => setUploadError('A certificate could not be uploaded. Keep the original file.')); });
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
                  <button type="button" aria-label="Remove" onClick={() => set({ certificates: draft.certificates.filter((_, j) => j !== i) })} className="rounded p-1 text-text-secondary hover:text-danger focus-ring">
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile Icon={Images} title="Portfolio" note={draft.portfolio.length ? `${draft.portfolio.length} files` : 'Photos or videos of your work'} done={draft.portfolio.length > 0}>
          <FilePick label="Add photos or videos" accept="image/*,video/*" multiple onFiles={(n) => set({ portfolio: [...draft.portfolio, ...n] })} />
        </Tile>
      </div>

      <DemoNotice
        what={
          canSyncToServer()
            ? 'Your CV file is saved to your account. Keep the original cover letter and portfolio files: file names alone do not upload these materials.'
            : 'Only file names are kept, in this browser: nothing is uploaded yet.'
        }
        endpoint="Certificate type on /api/resumes/my/certificates/, POST /api/resumes/my/<id>/portfolio/, cover letter file"
      />

      {uploadError && <p role="alert" className="text-sm text-danger">{uploadError}</p>}
      <Continue disabled={!hasCv || uploading} onClick={() => go(afterMaterials(draft))} />
      {!hasCv && <p className="text-sm text-text-secondary">Upload your CV or start the CV builder to continue.</p>}
      {builder && (
        <CvBuilder
          initialFile={builder.file}
          initialResumeId={resumeId}
          initialBuilt={!!draft.cvBuilt}
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
  const gaps = profileGaps({ ...draft, years: draft.checkDone.includes('years') ? draft.years : null });
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
        title="Your CV is ready for GCC employers"
        lead="Smart turned your answers into a polished resume in the format employers here expect. It stays on your profile for free, and employers see it when you apply."
      />

      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Before</p>
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
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent-text">After</p>
          <div className="overflow-hidden rounded-lg border border-line shadow-lift">
            <CvTemplate data={buildCv(draft, name)} />
          </div>
        </div>
      </div>

      <DemoNotice
        what={`The preview is assembled from your answers in the browser; Smart would rewrite the full CV. Downloading the PDF costs ${CV_DOWNLOAD_PRICE}, but no payment is taken yet: payment needs the server.`}
        endpoint="Stripe checkout for the CV download + GET /api/resumes/my/<id>/pdf/ after payment"
      />
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

/**
 * Квалификация. Кандидат выбирает роль и стаж; 8 вопросов под них по брифу
 * (пункт 8) генерирует Smart на сервере — каждый раз новые, чтобы их нельзя
 * было выучить. Поэтому вопросов в коде сайта нет: без сервера этот шаг
 * честно говорит, что вопросы придут, когда он будет подключён.
 */
export function QualificationStep({ draft, update, go }: CProps) {
  if (draft.qualRequested && !isKitchen(draft.role)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
        <Title
          title="Your 8 questions are on their way"
          lead={`Smart prepares them for a ${draft.role?.toLowerCase() ?? 'hospitality'} role with ${draft.years ?? 0}+ years of experience — different for every candidate. Answer by typing or by voice.`}
        />
        <DemoNotice
          what="Qualification questions are generated on the server and it isn't connected yet, so there are no questions to show in this preview."
          endpoint="POST /api/qualification/generate/ (role, level → 8 questions) and POST /api/qualification/answers/"
        />
        <div className="flex flex-wrap gap-2">
          <Continue onClick={() => go('video')}>Continue to the video intro</Continue>
          <Button variant="secondary" size="lg" onClick={() => update((d) => ({ ...d, qualRequested: false }))}>
            Change role
          </Button>
        </div>
      </div>
    );
  }

  const kitchen = isKitchen(draft.role);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <Title title="Get Verified" lead="8 quick questions about your work — a Verified star stands out to every employer." />
      <div>
        <p className="text-sm font-medium text-text-secondary">Your role</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...QUALIFIED_ROLES, ...KITCHEN_ROLES].map((r) => (
            <ChoiceChip key={r} selected={draft.role === r} onClick={() => update((d) => ({ ...d, role: r }))}>
              {r}
            </ChoiceChip>
          ))}
        </div>
      </div>
      <div className="max-w-xs">
        <Field
          label="Years in this role"
          type="number"
          inputMode="numeric"
          min={0}
          value={draft.years ?? ''}
          onChange={(e) => update((d) => ({ ...d, years: e.target.value === '' ? null : Number(e.target.value) }))}
        />
      </div>

      {kitchen ? (
        <>
          {/* Бриф кандидата, пункт 8: кухня квалификацию не проходит — её
              закрывают портфолио и опыт в конкретных заведениях. */}
          <div className="relative pt-6">
            <Bubble>
              <span className="flex items-start gap-2">
                <ChefHat size={18} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
                Kitchen roles skip the questions — your dish photos and where you&apos;ve cooked say more than a quiz.
              </span>
            </Bubble>
          </div>
          <Continue onClick={() => go('video')} />
        </>
      ) : (
        <Continue
          disabled={!draft.role || draft.years === null}
          onClick={() => update((d) => ({ ...d, qualRequested: true }))}
        >
          Get my 8 questions
        </Continue>
      )}
    </div>
  );
}

export function VideoStep({ draft, update, go, upload }: CProps) {
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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              update((d) => ({ ...d, video: 'added', videoFile: f.name }));
              void upload?.('video', f).catch(() => update((d) => ({ ...d, video: null, videoFile: null })));
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
      <p className="text-sm text-text-secondary">You can also record it in the HorecaPass app — it syncs to the same account.</p>
      <div className="flex flex-wrap gap-2">
        <Continue disabled={!draft.videoFile} onClick={() => go('done')}>
          Finish
        </Continue>
        <Button
          variant="secondary"
          size="lg"
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
  const kitchen = isKitchen(draft.role);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-12 text-center md:px-8 lg:py-20">
      <SuccessMark />
      <h1 className="text-3xl font-bold tracking-tight text-heading lg:text-4xl">Your profile is ready</h1>
      <p className="text-lg leading-relaxed text-text-secondary">
        {draft.video === 'added' || kitchen
          ? 'Once your qualification and video intro are reviewed, the Verified star appears on your profile.'
          : 'Add your video intro any time to complete the Verified star.'}
      </p>
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
