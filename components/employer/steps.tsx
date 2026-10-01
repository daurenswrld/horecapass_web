'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  ImagePlus,
  Linkedin,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Bubble } from '@/components/landing/bubble';
import { DemoNotice } from '@/components/demo-notice';
import { VoiceButton } from '@/components/onboarding/answer-input';
import { Button, ChoiceChip, Field } from '@/components/ui/primitives';
import { aiApi, plainAiText } from '@/lib/api/ai';
import { saveVacancyDraft, syncError } from '@/lib/demo/employer-sync';
import { vacanciesApi } from '@/lib/api/vacancies';
import { speechRecognitionAvailable } from '@/lib/demo/storage';
import { useAssistant } from '@/lib/demo/assistant';
import { CompanyAvatar, CompanyProfileCard, PhotoHeader, VacancyCard } from './cards';
import { Composer, MessageBubble, Thread, Typing } from './chat';
import { SignaturePad } from './signature-pad';
import {
  COMPANY_SIZES,
  HIRING_STAGES,
  OFFER_FACTS,
  PERK_OPTIONS,
  PLANS,
  PROJECT_INTRO,
  PROJECT_QUESTIONS,
  PROJECT_SUGGESTIONS,
  VACANCY_FIRST_SUGGESTION,
  VACANCY_GREETING,
  applyChoice,
  companyLabel,
  msgId,
  nextTurn,
  parseVacancy,
  projectStory,
  salaryLine,
  sampleAbout,
  scheduleLine,
  shrinkImage,
  smartReview,
  suggestResponsibilities,
  tagline,
  vacancyText,
  type ChatMessage,
  type EmployerDraft,
  type Step,
  type VacancyDraft,
} from '@/lib/demo/employer';
import { PRIVACY_URL, TERMS_URL } from '@/lib/legal';
import { cn } from '@/lib/utils';

export interface StepProps {
  draft: EmployerDraft;
  update: (fn: (d: EmployerDraft) => EmployerDraft) => void;
  go: (step: Step) => void;
  /** Настоящий вход: профиль компании и черновик вакансии уходят на сервер. */
  server?: boolean;
}

/** Основная кнопка шага — как в макете: тёмно-коричневая, крупная. */
function Continue({
  children = 'Continue',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button size="lg" className={cn('w-full sm:w-auto sm:min-w-56', className)} {...props}>
      {children}
      <ArrowRight size={18} aria-hidden />
    </Button>
  );
}

function StepTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-heading lg:text-4xl">{title}</h1>
      {lead && <p className="mt-2 max-w-2xl text-text-secondary">{lead}</p>}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors focus-ring', on ? 'bg-accent-strong dark:bg-accent' : 'bg-line-strong')}
    >
      <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-transform', on ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

/** Подсказка-мостик под выбором: не модальное окно, не требует подтверждения (бриф, пункт 12). */
function Heads({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex animate-fade-up gap-2.5 rounded-md border border-line-strong bg-surface-alt px-4 py-3 text-sm leading-relaxed text-text-primary">
      <HelpCircle size={17} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
      <span>{children}</span>
    </p>
  );
}

/* Мостик ------------------------------------------------------------------------ */

/**
 * «Мостик» — реплика помощника между шагами. В макете это фото рекрутёра
 * во весь экран и облачко поверх; на широком экране фото и реплика рядом.
 */
function Bridge({ children, onNext, next = 'Continue' }: { children: React.ReactNode; onNext: () => void; next?: string }) {
  const { talk } = useAssistant();
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-[0.8fr_1fr] md:gap-14 md:px-8 lg:py-16">
      <div className="relative mx-auto w-full max-w-xs md:max-w-none">
        <Image
          src={talk}
          alt="Your HorecaPass recruiter"
          width={720}
          height={1209}
          unoptimized
          priority
          className="photo-calm aspect-[4/5] w-full rounded-lg object-cover object-top shadow-lift"
        />
      </div>
      <div className="animate-fade-up">
        <Bubble className="text-base leading-relaxed lg:text-lg">{children}</Bubble>
        <Continue className="mt-8" onClick={onNext}>
          {next}
        </Continue>
      </div>
    </div>
  );
}

export function IntroStep({ go }: StepProps) {
  return (
    <Bridge onNext={() => go('company')} next="Set up my company">
      <p className="font-semibold text-heading">Before we set things up — a quick thought.</p>
      <p className="mt-3">
        Hiring has changed. Today&apos;s strongest candidates — especially the younger generation — are choosing
        where they want to build their career, not just accepting the first offer that comes through. The way your
        company is presented here directly affects not just how many people apply, but who applies.
      </p>
      <p className="mt-3 font-semibold text-heading">
        Let&apos;s build a profile that makes the right candidates want in.
      </p>
    </Bridge>
  );
}

export function BridgeStep({ draft, go }: StepProps) {
  return (
    <Bridge onNext={() => go(draft.company.preOpening ? 'project' : 'vacancy-intro')}>
      We&apos;ll turn whatever you share into a company description candidates actually want to read — you just
      review and approve it.
    </Bridge>
  );
}

/* 1. Setup your company ------------------------------------------------------------- */

export function CompanyStep({ draft, update, go }: StepProps) {
  const c = draft.company;
  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) =>
    update((d) => ({ ...d, company: { ...d.company, [k]: v } }));

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      set('logo', await shrinkImage(file, 160));
    } catch {
      /* не картинка — просто не ставим */
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:px-8 lg:grid-cols-[1fr_380px] lg:gap-14 lg:py-12">
      <div className="space-y-6">
        <StepTitle
          title="Setup your company"
          lead="Start with the basics. The card on the right is what candidates will see — it updates as you type."
        />

        <div className="flex items-center gap-4">
          <CompanyAvatar company={c} size={64} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent focus-within:ring-2 focus-within:ring-[rgb(var(--accent-focus))]">
            <Upload size={15} aria-hidden />
            {c.logo ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
          </label>
          <span className="text-xs text-text-secondary">JPG or PNG</span>
        </div>

        <Field label="Company name" value={c.name} onChange={(e) => set('name', e.target.value)} placeholder="Steppe Garden Hotel" autoFocus />

        <div className="space-y-1.5">
          <label htmlFor="website" className="block text-sm font-medium text-text-secondary">
            Website or Instagram
          </label>
          <div className="relative">
            <input
              id="website"
              value={c.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="steppegardenhotel.ae"
              className="h-12 w-full rounded border border-line-strong bg-surface pl-4 pr-28 text-text-primary placeholder:text-text-tertiary focus-ring"
            />
            <button
              type="button"
              disabled={!c.website.trim()}
              onClick={() => update((d) => ({ ...d, company: { ...d.company, about: sampleAbout(d.company), aboutDrafted: true } }))}
              className="absolute right-1.5 top-1.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-muted px-3 text-sm font-medium text-accent-text transition-colors hover:brightness-95 focus-ring disabled:opacity-40"
            >
              <Sparkles size={14} aria-hidden />
              Draft
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-end justify-between gap-3">
            <label htmlFor="about" className="block text-sm font-medium text-text-secondary">
              About your company
            </label>
            {/* Три способа, о которых договаривались с самого начала: напечатать,
                надиктовать, загрузить файл (файл — на следующем шаге). */}
            {speechRecognitionAvailable() && (
              <VoiceButton onText={(t) => update((d) => ({ ...d, company: { ...d.company, about: t, aboutDrafted: false } }))} />
            )}
          </div>
          <textarea
            id="about"
            rows={4}
            value={c.about}
            onChange={(e) => update((d) => ({ ...d, company: { ...d.company, about: e.target.value, aboutDrafted: false } }))}
            placeholder="What kind of place it is, and why people like working there."
            className="w-full resize-y rounded border border-line-strong bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          {c.aboutDrafted && (
            <>
              <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Sparkles size={14} aria-hidden className="text-accent-text" />
                Drafted from your website — edit as needed
              </p>
              <DemoNotice
                what="This is a starter text built from what you typed, not a real reading of the website: the smart draft of an employer description is not connected yet."
                endpoint="POST /api/ai/company-brand/draft/ (website, Instagram, LinkedIn or PDF → positioning line + company story)"
              />
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" value={c.city} onChange={(e) => set('city', e.target.value)} placeholder="Abu Dhabi" />
          <Field label="Contact email" type="email" value={c.email} onChange={(e) => set('email', e.target.value)} placeholder="hr@company.com" />
          <Field label="Phone" type="tel" value={c.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+971 50 000 0000" />
          <Field label="WhatsApp" type="tel" value={c.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Same as phone, or another number" />
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary">Company size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPANY_SIZES.map((s) => (
              <ChoiceChip key={s} selected={c.size === s} onClick={() => set('size', c.size === s ? null : s)}>
                {s}
              </ChoiceChip>
            ))}
          </div>
        </div>

        <p className="flex items-start gap-2 text-sm text-text-secondary">
          <MessageSquare size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            Once you&apos;re set up, you can invite your team from{' '}
            <Link href="/company/settings" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              Settings
            </Link>{' '}
            anytime — hiring works better together.
          </span>
        </p>

        <Continue disabled={!c.name.trim()} onClick={() => go('sources')} />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm font-semibold text-text-secondary">Preview card</p>
        <VacancyCard company={c} />

        <div className="rounded-lg border border-line-strong bg-surface p-4">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-heading">Hide company name</p>
            <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-text">
              Premium
            </span>
            <span className="ml-auto">
              <Switch on={c.hideName} onChange={(v) => set('hideName', v)} label="Hide company name" />
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Candidates won&apos;t see your company name or logo — but they&apos;ll still see full details about the
            role, seniority level, and what makes your company a great place to work. Available on Premium plans.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* 2. Complete your company profile ------------------------------------------------------ */

function SourceRow({
  Icon,
  title,
  note,
  done,
  children,
  open,
  onToggle,
  dashed,
}: {
  Icon: typeof Globe;
  title: string;
  note: string;
  done?: boolean;
  children?: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
  dashed?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border bg-surface', dashed ? 'border-dashed border-accent' : 'border-accent', open && 'shadow-card')}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 rounded-lg p-4 text-left focus-ring">
        <Icon size={22} aria-hidden className="shrink-0 text-accent-text" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-heading">{title}</span>
          <span className="block truncate text-sm text-text-secondary">{note}</span>
        </span>
        {done ? (
          <Check size={20} aria-hidden className="shrink-0 text-accent-text" />
        ) : (
          <ChevronRight size={20} aria-hidden className={cn('shrink-0 text-text-tertiary transition-transform', open && 'rotate-90')} />
        )}
      </button>
      {open && children && <div className="border-t border-line px-4 py-4">{children}</div>}
    </div>
  );
}

export function SourcesStep({ draft, update, go, server }: StepProps) {
  const c = draft.company;
  const [open, setOpen] = React.useState<string | null>(null);
  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) =>
    update((d) => ({ ...d, company: { ...d.company, [k]: v } }));
  const toggle = (k: string) => setOpen((o) => (o === k ? null : k));

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const shrunk = await Promise.all(Array.from(files).slice(0, 6).map((f) => shrinkImage(f, 720).catch(() => null)));
    const ok = shrunk.filter((x): x is string => !!x);
    update((d) => ({ ...d, company: { ...d.company, photos: [...d.company.photos, ...ok].slice(0, 6) } }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <StepTitle
        title="Complete your company profile"
        lead="A vacancy without a real company profile loses candidates before they even read the role. Give us a bit more so we can build one that sells."
      />

      <div className="space-y-3">
        <SourceRow Icon={Globe} title="Company website" note={c.website || 'Add a link'} done={!!c.website.trim()} open={open === 'web'} onToggle={() => toggle('web')}>
          <Field label="Website or Instagram" value={c.website} onChange={(e) => set('website', e.target.value)} placeholder="steppegardenhotel.ae" />
        </SourceRow>

        <SourceRow Icon={Linkedin} title="LinkedIn page" note={c.linkedin || 'Add a link (optional)'} done={!!c.linkedin.trim()} open={open === 'li'} onToggle={() => toggle('li')}>
          <Field label="LinkedIn page" value={c.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="linkedin.com/company/…" />
        </SourceRow>

        <SourceRow Icon={FileText} title="Upload a PDF" note={c.pdfName ?? 'Property deck, brochure, or presentation'} done={!!c.pdfName} dashed open={open === 'pdf'} onToggle={() => toggle('pdf')}>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-line-strong bg-surface-muted px-4 py-6 text-center transition-colors hover:border-accent">
            <Upload size={20} aria-hidden className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">{c.pdfName ?? 'Choose a PDF'}</span>
            <input type="file" accept=".pdf" className="sr-only" onChange={(e) => set('pdfName', e.target.files?.[0]?.name ?? null)} />
          </label>
        </SourceRow>

        <SourceRow Icon={Pencil} title="Setup manually" note="Write it manually" done={!!c.manual.trim()} open={open === 'manual'} onToggle={() => toggle('manual')}>
          <textarea
            rows={4}
            value={c.manual}
            onChange={(e) => set('manual', e.target.value)}
            placeholder="Anything candidates should know: the team, the atmosphere, training, growth…"
            aria-label="Company description"
            className="w-full resize-y rounded border border-line-strong bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </SourceRow>

        <div className="flex items-center gap-4 rounded-lg border border-accent bg-surface p-4">
          <HelpCircle size={22} aria-hidden className="shrink-0 text-accent-text" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-heading">Pre-opening</span>
            <span className="block text-sm text-text-secondary">No live website yet? We&apos;ll ask a few questions instead.</span>
          </span>
          <Switch on={c.preOpening} onChange={(v) => set('preOpening', v)} label="This is a pre-opening" />
        </div>
      </div>

      <div>
        {/* Бриф, пункт 13: логотип, фото заведения и фото жилья для сотрудников;
            фото продают лучше логотипа и идут в шапку вакансии каруселью. */}
        <p className="text-sm font-medium text-text-secondary">Photos of the venue and staff accommodation</p>
        <p className="mt-0.5 text-xs text-text-secondary">They go at the top of your vacancies — photos sell a job better than a logo.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {c.photos.map((src, i) => (
            <div key={i} className="group relative">
              {/* Обычный img: data URL из браузера. */}
              <img src={src} alt="" className="h-24 w-32 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => set('photos', c.photos.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-surface px-2 text-xs text-text-primary shadow focus-ring"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {c.photos.length < 6 && (
            <label className="grid h-24 w-32 cursor-pointer place-items-center rounded-md border-2 border-dashed border-line-strong text-text-secondary transition-colors hover:border-accent">
              <ImagePlus size={22} aria-hidden />
              <span className="sr-only">Add photos</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      {server ? (
        <DemoNotice
          what="Website, LinkedIn and pre-opening are saved to your company profile. Photos and the PDF stay in this browser for now: the server has no upload for them yet."
          endpoint="POST /users/api/users/me/company/images/ (photos) and POST /api/ai/company-brand/draft/"
        />
      ) : (
        <DemoNotice
          what="Links, the PDF and photos stay in this browser. Reading them into a company description needs the server."
          endpoint="PATCH /users/api/users/me/company/ (website, linkedin, is_pre_opening, photos) and POST /api/ai/company-brand/draft/"
        />
      )}

      <Continue onClick={() => go('bridge')} />
    </div>
  );
}

/* Pre-opening: разговор о проекте ------------------------------------------------------ */

export function ProjectStep({ draft, update, go }: StepProps) {
  const answers = draft.project;
  const i = answers.length;
  const finished = i >= PROJECT_QUESTIONS.length;
  const story = finished ? projectStory(answers) : '';

  const messages: ChatMessage[] = [{ id: 'intro', from: 'assistant', text: PROJECT_INTRO }];
  PROJECT_QUESTIONS.slice(0, Math.min(i + 1, PROJECT_QUESTIONS.length)).forEach((q, k) => {
    messages.push({ id: `q${k}`, from: 'assistant', text: q });
    if (answers[k] !== undefined) messages.push({ id: `a${k}`, from: 'user', text: answers[k] });
  });

  const useStory = () => {
    update((d) => ({
      ...d,
      company: {
        ...d.company,
        // Своё описание не затираем; черновик с сайта — можно.
        about: !d.company.about.trim() || d.company.aboutDrafted ? story : d.company.about,
        aboutDrafted: !d.company.about.trim() || d.company.aboutDrafted ? true : d.company.aboutDrafted,
        city: d.company.city || answers[2]?.replace(/\.$/, '') || '',
      },
    }));
    go('vacancy-intro');
  };

  return (
    <ChatLayout
      title="Tell us about the project"
      lead="Pre-opening · no live website yet, so we'll build your profile together"
      scrollKey={answers.length}
      composer={
        finished ? (
          <div className="space-y-3">
            <DemoNotice
              what="The project story is assembled from your answers in the browser. Writing it up properly is the job of the smart assistant on the server."
              endpoint="POST /api/ai/company-brand/draft/ (pre-opening answers → positioning line + company story)"
            />
            <div className="flex flex-wrap gap-2">
              <Continue onClick={useStory}>Use it and continue</Continue>
              <Button variant="secondary" size="lg" onClick={() => update((d) => ({ ...d, project: d.project.slice(0, -1) }))}>
                <RotateCcw size={16} aria-hidden />
                Change the last answer
              </Button>
            </div>
          </div>
        ) : (
          <Composer
            suggestion={PROJECT_SUGGESTIONS[i]}
            onSend={(text, file) =>
              update((d) => ({
                ...d,
                project: [...d.project, file ? [text === 'Attached a file.' ? '' : text, `(${file})`].join(' ').trim() : text],
              }))
            }
          />
        )
      }
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} m={m} />
      ))}
      {finished && (
        <MessageBubble m={{ id: 'story', from: 'assistant', text: `Thanks — here is a first draft of your project story:\n\n${story}` }} />
      )}
    </ChatLayout>
  );
}

/** Чат во всю высоту: лента прокручивается, поле ответа прижато к низу. */
function ChatLayout({
  title,
  lead,
  children,
  composer,
  scrollKey,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  composer: React.ReactNode;
  scrollKey: unknown;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl px-5 pt-6">
        <StepTitle title={title} lead={lead} />
      </div>
      <Thread deps={scrollKey}>{children}</Thread>
      <div className="shrink-0 border-t border-line bg-background">
        <div className="mx-auto max-w-2xl px-5 py-4">{composer}</div>
      </div>
    </div>
  );
}

/* 3. Create your first vacancy ----------------------------------------------------------- */

export function VacancyIntroStep({ go }: StepProps) {
  // Без «Skip» — бриф, пункт 7: это первое реальное действие, ради которого
  // работодатель пришёл, лёгкий выход здесь ведёт к пустому аккаунту.
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2 md:px-8 lg:py-16">
      <div className="animate-fade-up">
        <h1 className="text-4xl font-bold tracking-tight text-heading lg:text-5xl">Create your first vacancy</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-text-secondary">
          Describe the role the way you would to a recruiter — type it, say it, or upload a job description. We&apos;ll
          draft the listing and ask about anything that&apos;s missing.
        </p>
        <Continue className="mt-8" onClick={() => go('vacancy')}>
          Create a vacancy
        </Continue>
      </div>
      <Image
        src="/landing/team.webp"
        alt="A hotel manager, a chef, a front office manager and a waitress"
        width={900}
        height={1350}
        unoptimized
        className="photo-calm mx-auto h-auto w-full max-w-sm [mask-image:linear-gradient(to_bottom,black_75%,transparent)]"
      />
    </div>
  );
}

/* Smart vacancy --------------------------------------------------------------------------- */

/**
 * «Publish» ИИ не отправляем: серверный конструктор на такую просьбу сразу
 * создаёт активную вакансию, а у нас впереди проверка, соглашение и оплата.
 */
const PUBLISH_RE = /\b(publish|post it|go live)\b|опубликуй|опубликовать/i;

export function VacancyChatStep({ draft, update, go, server }: StepProps) {
  const [typing, setTyping] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Настоящий вход: отвечает серверный ИИ (/api/ai/vacancy-builder/stream/),
  // тот же, что в мобилке. В демо — сценарий в браузере, как раньше.
  const [aiOptions, setAiOptions] = React.useState<string[]>([]);
  const [aiDraft, setAiDraft] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abortRef.current?.abort(), []);

  // Первая реплика — сразу при входе в чат (голосовое 15.09: «нажимает Create,
  // и в этом же окошке появляется чат»).
  React.useEffect(() => {
    if (draft.vacancyChat.length) return;
    update((d) => ({
      ...d,
      vacancyChat: [{ id: msgId(), from: 'assistant', text: VACANCY_GREETING }],
      turn: { kind: 'text', key: 'intro', text: VACANCY_GREETING, suggestion: VACANCY_FIRST_SUGGESTION },
    }));
    // Только при входе в чат: дальше реплики добавляет reply().
  }, []);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const replyLive = async (text: string, file?: string) => {
    const onlyFile = !!file && text === 'Attached a file.';
    // Структуру вакансии для шага «Check the details» по-прежнему собираем
    // из слов работодателя — ИИ отдаёт её только при публикации.
    let v: VacancyDraft = onlyFile ? draft.vacancy : parseVacancy(text, draft.vacancy);
    if (file) v = { ...v, jdFile: file };
    const userMsg: ChatMessage = { id: msgId(), from: 'user', text, file };
    const history = [...draft.vacancyChat, userMsg];
    update((d) => ({ ...d, vacancy: v, vacancyChat: [...d.vacancyChat, userMsg] }));
    setAiOptions([]);
    if (PUBLISH_RE.test(text)) {
      toDetails();
      return;
    }

    const botId = msgId();
    // Добавить ответ или обновить уже добавленный — решаем по самому списку:
    // React применяет обновления позже, флаг тут ненадёжен.
    const show = (t: string) =>
      update((d) =>
        d.vacancyChat.some((m) => m.id === botId)
          ? { ...d, vacancyChat: d.vacancyChat.map((m) => (m.id === botId ? { ...m, text: plainAiText(t) } : m)) }
          : { ...d, vacancyChat: [...d.vacancyChat, { id: botId, from: 'assistant', text: plainAiText(t) }] },
      );
    setTyping(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await aiApi.vacancyBuilder(
        history
          .filter((m) => !m.draft && m.text)
          .map((m) => ({
            role: m.from,
            text: m.file && m.text === 'Attached a file.' ? `I attached the job description file ${m.file}.` : m.text,
          })),
        (t) => {
          setTyping(false);
          show(t);
        },
        ctrl.signal,
      );
      show(res.reply.trim() || 'Could you tell me a bit more about the role?');
      setAiOptions(res.suggestions.filter((o) => !PUBLISH_RE.test(o)));
      if (/responsibilit/i.test(res.reply) && /hiring|benefit/i.test(res.reply)) setAiDraft(true);
      // Если ИИ всё же создал вакансию — держим её черновиком и дальше обновляем её же.
      if (res.vacancyId) {
        const id = res.vacancyId;
        void vacanciesApi.update(id, { status: 'DRAFT' }).catch(() => {});
        update((d) => ({ ...d, serverVacancyId: id }));
      }
    } catch {
      if (ctrl.signal.aborted) return;
      show("Sorry, I couldn't reach the assistant just now. Please send that again, or review the details when you're ready.");
    } finally {
      setTyping(false);
    }
  };

  const reply = (text: string, file?: string) => {
    if (server) {
      void replyLive(text, file);
      return;
    }
    const turn = draft.turn;
    const onlyFile = !!file && text === 'Attached a file.';
    let v: VacancyDraft = draft.vacancy;
    if (turn && turn.kind !== 'draft' && turn.kind !== 'text') v = applyChoice(v, turn.key, text);
    else if (!onlyFile) {
      v = parseVacancy(text, v);
      // Ответы, которые не разобрать правилами, сохраняем как есть.
      if (turn?.kind === 'text' && turn.key === 'hours' && !v.shiftHours) v = { ...v, shiftHours: text.replace(/\.$/, '') };
      if (turn?.kind === 'text' && turn.key === 'experience' && !v.experience) v = { ...v, experience: text.replace(/\.$/, '') };
    }
    // Job description — вложение к вакансии, а не текст для переписывания
    // (заметка к Vacancy Prompt).
    if (file) v = { ...v, jdFile: file };

    update((d) => ({ ...d, vacancy: v, vacancyChat: [...d.vacancyChat, { id: msgId(), from: 'user', text, file }] }));
    setTyping(true);

    // Пауза — «как сказанная человеком фраза, а не загрузка» (бриф, пункт 2).
    timer.current = setTimeout(() => {
      setTyping(false);
      update((d) => {
        if (onlyFile) {
          // Не объясняем кандидату/работодателю технические ограничения
          // (бриф кандидата, пункт 11) — просто говорим, что будет с файлом.
          return {
            ...d,
            vacancyChat: [
              ...d.vacancyChat,
              {
                id: msgId(),
                from: 'assistant',
                text: "Thanks — I'll attach it to the vacancy as the full job description. Now tell me in a sentence or two: the role, the city and the salary.",
              },
            ],
          };
        }
        const next = nextTurn(d.vacancy, d.asked);
        if (next.kind === 'draft') {
          return {
            ...d,
            turn: next,
            vacancyChat: [...d.vacancyChat, { id: msgId(), from: 'assistant', text: 'Draft ready', draft: true }],
          };
        }
        return {
          ...d,
          turn: next,
          asked: [...d.asked, ...next.key.split('+')],
          vacancyChat: [...d.vacancyChat, { id: msgId(), from: 'assistant', text: next.text }],
        };
      });
    }, 900);
  };

  const toDetails = () => {
    // Обязанности: из слов работодателя их здесь не вытащить, поэтому
    // стартовый список по должности, помеченный как предложение (пункт 11).
    update((d) =>
      d.vacancy.responsibilities.length
        ? d
        : {
            ...d,
            vacancy: {
              ...d.vacancy,
              responsibilities: suggestResponsibilities(d.vacancy.title),
              responsibilitiesSource: suggestResponsibilities(d.vacancy.title).length ? 'suggested' : null,
            },
          },
    );
    go('vacancy-details');
  };

  const turn = draft.turn;
  const done = turn?.kind === 'draft';
  const v = draft.vacancy;
  const last = draft.vacancyChat[draft.vacancyChat.length - 1];
  // С ИИ разговор не «заканчивается» — к деталям можно перейти, как только
  // понятна роль; когда ИИ показал полный черновик, это основная кнопка.
  const canReview = server && (aiDraft || !!v.title);

  return (
    <ChatLayout
      title="Smart vacancy"
      lead={
        draft.company.preOpening
          ? 'Pre-opening · tell us about the first role you are hiring for'
          : 'Describe the role in your own words — the assistant asks about anything missing'
      }
      scrollKey={`${draft.vacancyChat.length}-${last?.text.length ?? 0}-${typing}`}
      composer={
        server ? (
          <div className="space-y-3">
            {canReview && (
              <Button variant={aiDraft ? 'primary' : 'secondary'} size={aiDraft ? 'lg' : 'sm'} onClick={toDetails}>
                Review the details
              </Button>
            )}
            <Composer
              onSend={reply}
              disabled={typing}
              suggestion={!aiOptions.length && turn?.kind === 'text' ? turn.suggestion : null}
              options={aiOptions.length ? { list: aiOptions, multi: false } : null}
            />
          </div>
        ) : done ? (
          <div className="space-y-3">
            <DemoNotice
              what="The assistant here is a script in the browser: it picks out role, city, salary and benefits from your text and asks about the rest. The real one runs on the server."
              endpoint="POST /api/ai/vacancy-builder/stream/ (the mobile app already uses it)"
            />
            <Continue onClick={toDetails}>Review the details</Continue>
          </div>
        ) : (
          <Composer
            onSend={reply}
            disabled={typing}
            suggestion={turn?.kind === 'text' ? turn.suggestion : null}
            options={turn && (turn.kind === 'single' || turn.kind === 'multi') ? { list: turn.options, multi: turn.kind === 'multi' } : null}
          />
        )
      }
    >
      {draft.vacancyChat.map((m) =>
        m.draft ? (
          <MessageBubble key={m.id} m={{ ...m, text: '' }}>
            <p className="text-sm text-text-secondary">Draft ready</p>
            <p className="mt-1 font-semibold text-heading">{v.title ?? 'Open role'}</p>
            <p className="text-sm text-text-primary">
              {[salaryLine(v), v.employment, scheduleLine(v)].filter(Boolean).join(' · ')}
            </p>
          </MessageBubble>
        ) : (
          <MessageBubble key={m.id} m={m} />
        ),
      )}
      {typing && <Typing />}
    </ChatLayout>
  );
}

/* Детали: What you offer / Responsibilities / Hiring process ----------------------------- */

/**
 * Режим правки того, что ассистент уже собрал (бриф, пункты 10–12), — не
 * форма с нуля. Все три блока пишут в ту же модель вакансии, что и чат.
 */
export function VacancyDetailsStep({ draft, update, go }: StepProps) {
  const v = draft.vacancy;
  const setV = (patch: Partial<VacancyDraft>) => update((d) => ({ ...d, vacancy: { ...d.vacancy, ...patch } }));
  const [offerDraft, setOfferDraft] = React.useState('');
  const [respDraft, setRespDraft] = React.useState('');
  const [stageDraft, setStageDraft] = React.useState('');
  const [editing, setEditing] = React.useState<number | null>(null);

  const isKitchen = /chef|cook|commis|pastry/i.test(v.title ?? '');
  const stages = [...HIRING_STAGES, ...v.hiringSteps.filter((s) => !HIRING_STAGES.includes(s))];

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-8 md:px-8 lg:py-12">
      <StepTitle title="Check the details" lead="This is what the assistant understood. Tap to correct anything — nothing is published yet." />

      {/* What you offer — пункт 10 */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-heading">What you offer</h2>
        <div className="flex flex-wrap gap-2">
          {OFFER_FACTS.map((f) => {
            const on = v[f.key] === true;
            return (
              <ChoiceChip key={f.label} selected={on} onClick={() => setV({ [f.key]: !on } as Partial<VacancyDraft>)}>
                {on && <Check size={14} aria-hidden className="mr-1.5" />}
                {f.label}
              </ChoiceChip>
            );
          })}
          {PERK_OPTIONS.map((p) => {
            const on = v.perks.includes(p);
            return (
              <ChoiceChip key={p} selected={on} onClick={() => setV({ perks: on ? v.perks.filter((x) => x !== p) : [...v.perks, p] })}>
                {on && <Check size={14} aria-hidden className="mr-1.5" />}
                {p}
              </ChoiceChip>
            );
          })}
          {v.customOffers.map((p) => (
            <ChoiceChip key={p} selected onClick={() => setV({ customOffers: v.customOffers.filter((x) => x !== p) })}>
              <Check size={14} aria-hidden className="mr-1.5" />
              {p}
            </ChoiceChip>
          ))}
        </div>
        <p className="text-sm text-text-secondary">
          Only real benefits go here — candidates see this before applying, so keep it accurate. Things like
          &lsquo;stable income&rsquo; or &lsquo;great culture&rsquo; come through in how we describe your company, not as a
          checklist item.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = offerDraft.trim();
            if (t && !v.customOffers.includes(t)) setV({ customOffers: [...v.customOffers, t] });
            setOfferDraft('');
          }}
        >
          <input
            value={offerDraft}
            onChange={(e) => setOfferDraft(e.target.value)}
            placeholder="e.g. Free gym access"
            aria-label="Add your own benefit"
            className="h-11 flex-1 rounded border border-line-strong bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <Button type="submit" variant="secondary" disabled={!offerDraft.trim()}>
            <Plus size={16} aria-hidden />
            Add
          </Button>
        </form>
      </section>

      {/* Responsibilities — пункт 11 */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-heading">Responsibilities</h2>
          {v.responsibilitiesSource === 'suggested' && (
            <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent-text">
              Suggested from the job title — please review
            </span>
          )}
        </div>
        {v.responsibilities.length === 0 && (
          <p className="text-sm text-text-secondary">Add 3–6 concrete things this person will do.</p>
        )}
        <ul className="space-y-2">
          {v.responsibilities.map((r, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
              {editing === i ? (
                <input
                  autoFocus
                  defaultValue={r}
                  aria-label="Edit responsibility"
                  onBlur={(e) => {
                    const t = e.target.value.trim();
                    setV({
                      responsibilities: t ? v.responsibilities.map((x, j) => (j === i ? t : x)) : v.responsibilities.filter((_, j) => j !== i),
                      responsibilitiesSource: 'employer',
                    });
                    setEditing(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="flex-1 bg-transparent text-text-primary outline-none"
                />
              ) : (
                <span className="flex-1 text-text-primary">{r}</span>
              )}
              <button type="button" onClick={() => setEditing(i)} aria-label="Edit" className="rounded p-1 text-text-secondary hover:text-text-primary focus-ring">
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setV({ responsibilities: v.responsibilities.filter((_, j) => j !== i) })}
                aria-label="Delete"
                className="rounded p-1 text-text-secondary hover:text-danger focus-ring"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = respDraft.trim();
            if (t) setV({ responsibilities: [...v.responsibilities, t] });
            setRespDraft('');
          }}
        >
          <input
            value={respDraft}
            onChange={(e) => setRespDraft(e.target.value)}
            placeholder="Add a responsibility"
            aria-label="Add a responsibility"
            className="h-11 flex-1 rounded border border-line-strong bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <Button type="submit" variant="secondary" disabled={!respDraft.trim()}>
            <Plus size={16} aria-hidden />
            Add
          </Button>
        </form>
      </section>

      {/* Hiring process — пункт 12 */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-heading">Hiring process</h2>
        <p className="-mt-1 text-text-secondary">What stages will candidates go through?</p>
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => {
            const on = v.hiringSteps.includes(s);
            return (
              <ChoiceChip
                key={s}
                selected={on}
                onClick={() => setV({ hiringSteps: on ? v.hiringSteps.filter((x) => x !== s) : [...v.hiringSteps, s] })}
              >
                {on && <Check size={14} aria-hidden className="mr-1.5" />}
                {s}
              </ChoiceChip>
            );
          })}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = stageDraft.trim();
            if (t && !v.hiringSteps.includes(t)) setV({ hiringSteps: [...v.hiringSteps, t] });
            setStageDraft('');
          }}
        >
          <input
            value={stageDraft}
            onChange={(e) => setStageDraft(e.target.value)}
            placeholder={isKitchen ? 'e.g. Kitchen skills test' : 'e.g. Meeting with the owner'}
            aria-label="Add your own stage"
            className="h-11 flex-1 rounded border border-line-strong bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <Button type="submit" variant="secondary" disabled={!stageDraft.trim()}>
            <Plus size={16} aria-hidden />
            Add
          </Button>
        </form>
        {v.hiringSteps.length > 1 && (
          <Heads>
            Each additional stage means fewer candidates make it to the end — that&apos;s normal, but worth choosing
            deliberately. If you need to fill this role fast, a leaner process usually gets you there quicker. If
            you&apos;re hiring for a senior or high-trust position, extra stages can be the right call. Pick what fits
            this specific hire, not a default.
          </Heads>
        )}

        <div className="rounded-lg border border-line-strong bg-surface p-4">
          <div className="flex items-center gap-3">
            <p className="flex-1 font-semibold text-heading">Prefer an English video intro</p>
            <Switch on={v.preferVideoIntro} onChange={(on) => setV({ preferVideoIntro: on })} label="Prefer an English video intro" />
          </div>
          <p className="mt-1.5 text-sm text-text-secondary">
            Candidates can optionally send a short video greeting. Not speaking on camera won&apos;t count against them.
          </p>
        </div>
        {v.preferVideoIntro && (
          <Heads>
            Heads up: even as optional, some strong candidates may skip applying if they&apos;re not confident on camera
            or in spoken English — especially for hands-on roles where that&apos;s not what the job actually requires.
            Consider whether this is worth the trade-off for this specific role.
          </Heads>
        )}
      </section>

      <Continue onClick={() => go('vacancy-preview')}>Preview the vacancy</Continue>
    </div>
  );
}

/* 4. Превью + Smart vacancy review --------------------------------------------------------- */

export function VacancyPreviewStep({ draft, update, go }: StepProps) {
  const v = draft.vacancy;
  const c = draft.company;
  const text = vacancyText(v, c, c.preOpening ? draft.project[3] : undefined);
  const review = smartReview(v, c);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <StepTitle title="Vacancy preview" lead="This is how the role appears in the candidate's job list — and what they read when they open it." />

      <PhotoHeader company={c} />
      <VacancyCard company={c} vacancy={v} />

      {/* Бриф, пункт 13.8: со страницы вакансии должен быть путь к профилю компании. */}
      <button
        type="button"
        onClick={() => go('company-preview')}
        className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-accent focus-ring"
      >
        <CompanyAvatar company={c} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-heading">{companyLabel(c)}</span>
          <span className="block truncate text-sm text-text-secondary">
            {c.about.trim() ? tagline(c.about) : 'Company profile: coming soon'}
          </span>
        </span>
        <ChevronRight size={18} aria-hidden className="text-text-tertiary" />
      </button>

      <article className="whitespace-pre-line rounded-lg border border-line bg-surface p-6 leading-relaxed text-text-primary shadow-card">{text}</article>

      {/* Smart vacancy review — до публикации, не после (бриф, пункт 13.7). */}
      <section className="rounded-lg border-[1.5px] border-accent-strong bg-surface p-6 dark:border-accent">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent-strong text-2xl font-bold text-on-accent dark:bg-accent">
            {review.score}
          </span>
          <div>
            <p className="flex items-center gap-2 font-semibold text-heading">
              <Sparkles size={16} aria-hidden className="text-accent-text" />
              Smart vacancy review
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">{review.summary}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-success">Strengths</p>
            <ul className="mt-2 space-y-1.5 text-sm text-text-primary">
              {review.strengths.map((s) => (
                <li key={s} className="flex gap-2">
                  <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-success" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {review.improve.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-warning">Improve before publishing</p>
              <ul className="mt-2 space-y-1.5 text-sm text-text-primary">
                {review.improve.map((s) => (
                  <li key={s} className="flex gap-2">
                    <ArrowRight size={15} aria-hidden className="mt-0.5 shrink-0 text-warning" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DemoNotice
          className="mt-5"
          what="The score here comes from simple rules in the browser. The real review is written by the smart assistant from the full draft."
          endpoint="POST /api/vacancies/my/<id>/ai-score/ (already exists — run it on the draft, before publishing)"
        />
      </section>

      <p className="text-sm text-text-secondary">Nothing is published until you confirm it at the end.</p>
      <div className="flex flex-wrap gap-2">
        <Continue onClick={() => go('company-preview')} />
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            // Назад в чат: снимаем «готово», чтобы можно было дописать.
            update((d) => ({
              ...d,
              turn: { kind: 'text', key: 'edit', text: 'What would you like to change?' },
              vacancyChat: [...d.vacancyChat, { id: msgId(), from: 'assistant', text: 'What would you like to change?' }],
            }));
            go('vacancy');
          }}
        >
          <Pencil size={16} aria-hidden />
          Change in chat
        </Button>
      </div>
    </div>
  );
}

export function CompanyPreviewStep({ draft, go }: StepProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8 lg:py-12">
      <StepTitle title="Company profile preview" lead="The page candidates open from your vacancy." />
      <CompanyProfileCard company={draft.company} />
      <div className="flex flex-wrap gap-2">
        <Continue onClick={() => go('agreement')} />
        <Button variant="secondary" size="lg" onClick={() => go('company')}>
          <Pencil size={16} aria-hidden />
          Edit company
        </Button>
      </div>
    </div>
  );
}

/* 5. Agreement & Policies ---------------------------------------------------------------- */

export function AgreementStep({ draft, update, go }: StepProps) {
  const a = draft.agreement;
  const set = <K extends keyof typeof a>(k: K, v: (typeof a)[K]) =>
    update((d) => ({ ...d, agreement: { ...d.agreement, [k]: v } }));
  const ready = a.terms && a.signer.trim().length > 2 && !!a.signature && !!a.licenseName;

  return (
    <div className="mx-auto max-w-3xl space-y-7 px-5 py-8 md:px-8 lg:py-12">
      <StepTitle title="Agreement & Policies" lead="Please review and accept our terms to proceed with your HorecaPass company profile." />

      <div className="rounded-lg border border-line-strong bg-surface p-5">
        <h2 className="font-semibold text-heading">Terms of Service</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          The employer agreement is being prepared by our legal team and will appear here in full. Until then, the
          current{' '}
          <a href={TERMS_URL} target="_blank" rel="noreferrer" className="font-medium text-accent-text underline underline-offset-4">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="font-medium text-accent-text underline underline-offset-4">
            Privacy Policy
          </a>{' '}
          apply.
        </p>
      </div>

      <div className="space-y-3">
        {[
          ['terms', 'I have read and agree to the HorecaPass Terms of Service and Privacy Policy.'],
          ['marketing', 'I agree to receive HorecaPass marketing communications. (optional)'],
        ].map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-start gap-3 text-text-primary">
            <input
              type="checkbox"
              checked={a[k as 'terms' | 'marketing']}
              onChange={(e) => set(k as 'terms' | 'marketing', e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--accent-strong))]"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="relative pt-6">
        <Bubble>Part of our due diligence — we need a copy of your valid trade license before your vacancies go live.</Bubble>
      </div>

      <div>
        <p className="text-sm font-medium text-text-secondary">Trade license</p>
        <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-line-strong bg-surface-muted px-4 py-4 transition-colors hover:border-accent">
          <Upload size={20} aria-hidden className="text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">{a.licenseName ?? 'Upload a PDF or a photo'}</span>
          {a.licenseName && <Check size={18} aria-hidden className="ml-auto text-success" />}
          <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(e) => set('licenseName', e.target.files?.[0]?.name ?? null)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name of the signatory" value={a.signer} onChange={(e) => set('signer', e.target.value)} placeholder="Name Surname" />
        <Field label="Position" value={a.position} onChange={(e) => set('position', e.target.value)} placeholder="General Manager" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">Signature</p>
        <SignaturePad value={a.signature} onChange={(s) => set('signature', s)} />
      </div>

      <DemoNotice
        what="The signed agreement and the license stay in this browser. Storing them needs the server."
        endpoint="POST /users/api/users/me/company/agreement/ (signer, position, signature image, license file)"
      />

      <Continue
        disabled={!ready}
        onClick={() => {
          update((d) => ({ ...d, agreement: { ...d.agreement, submittedAt: new Date().toISOString() } }));
          go('payment');
        }}
      >
        Submit &amp; Activate
      </Continue>
      {!ready && (
        <p className="text-sm text-text-secondary">
          To continue: accept the terms, upload the license, enter the signatory&apos;s name and sign.
        </p>
      )}
    </div>
  );
}

/* 6. Оплата — бриф, пункт 14 --------------------------------------------------------------- */

export function PaymentStep({ draft, update, go, server }: StepProps) {
  const picked = draft.plan ?? 'bundle';
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Настоящий вход (вариант «б», 30.09): платёжки ещё нет — на запуске
  // публикуем бесплатно и по-настоящему, тарифы показываем как будущие.
  const publishFree = async () => {
    setError(null);
    setPublishing(true);
    try {
      const id = await saveVacancyDraft(draft);
      await vacanciesApi.update(id, { status: 'ACTIVE' });
      update((d) => ({ ...d, serverVacancyId: id, published: true }));
      go('done');
    } catch (e) {
      setError(`Could not publish: ${syncError(e)}. Please try again.`);
    } finally {
      setPublishing(false);
    }
  };

  if (server) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 md:px-8 lg:py-12">
        <StepTitle title="Publish your vacancy" lead="Posting is free while we launch. Paid plans start later — this is what they will look like." />
        <div className="rounded-lg border-[1.5px] border-accent-strong bg-accent-muted px-5 py-4 dark:border-accent">
          <p className="font-semibold text-heading">Free during launch</p>
          <p className="mt-1 text-sm text-text-primary">
            Your vacancy goes live now and candidates can apply right away. No card needed.
          </p>
        </div>
        <div className="grid gap-4 opacity-70 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className="flex flex-col rounded-lg border border-line bg-surface p-5">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-heading">{p.name}</span>
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-secondary">After launch</span>
              </span>
              <span className="mt-3 text-3xl font-bold text-heading">
                {p.price} <span className="text-base font-semibold">SAR</span>
              </span>
              <span className="text-sm text-text-secondary">{p.period}</span>
              <ul className="mt-4 space-y-1.5 text-sm text-text-primary">
                {p.lines.map((l) => (
                  <li key={l} className="flex gap-2">
                    <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Continue onClick={publishFree} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish for free'}
        </Continue>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 md:px-8 lg:py-12">
      <StepTitle title="Publish your vacancy" lead="Your vacancy is reviewed and ready. Choose how you want to post." />

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const on = picked === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => update((d) => ({ ...d, plan: p.id }))}
              aria-pressed={on}
              className={cn(
                'flex flex-col rounded-lg border bg-surface p-5 text-left transition-shadow focus-ring',
                on ? 'border-[1.5px] border-accent-strong shadow-lift dark:border-accent' : 'border-line hover:shadow-card',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-heading">{p.name}</span>
                {p.id === 'bundle' && (
                  <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent-text">Best value</span>
                )}
              </span>
              <span className="mt-3 text-3xl font-bold text-heading">
                {p.price} <span className="text-base font-semibold">SAR</span>
              </span>
              <span className="text-sm text-text-secondary">{p.period}</span>
              <ul className="mt-4 space-y-1.5 text-sm text-text-primary">
                {p.lines.map((l) => (
                  <li key={l} className="flex gap-2">
                    <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
                    {l}
                  </li>
                ))}
              </ul>
              {/* Бриф: в карточке Premium интерфейс сам показывает выгоду при 5+ постах. */}
              {p.id === 'premium' && (
                <span className="mt-4 rounded-md bg-surface-muted px-3 py-2 text-xs leading-relaxed text-text-secondary">
                  Posting 5+ roles a month? 5 single posts cost 745 SAR — Premium is 699 SAR with no limit.
                </span>
              )}
            </button>
          );
        })}
      </div>

      <DemoNotice
        what={
          server
            ? 'No payment is taken here: the payment provider is not connected. Your vacancy is saved as a draft on your account and goes live after payment.'
            : 'No payment is taken here: the payment provider is not connected, and publishing needs the server.'
        }
        endpoint="POST /api/billing/checkout/ (plan) → publish the vacancy after payment"
      />

      <Continue onClick={() => go('done')}>Pay &amp; publish</Continue>
    </div>
  );
}

export function DoneStep({ draft, restart, server }: StepProps & { restart: () => void }) {
  const plan = PLANS.find((p) => p.id === (draft.plan ?? 'bundle'));
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-12 text-center md:px-8 lg:py-20">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
        <Check size={30} aria-hidden />
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-heading lg:text-4xl">
        {draft.published ? 'Your vacancy is live' : 'You\u2019re all set'}
      </h1>
      <p className="text-lg leading-relaxed text-text-secondary">
        {draft.published
          ? `${draft.company.name || 'Your company'} is set up, and the ${draft.vacancy.title?.toLowerCase() ?? 'new'} vacancy is live — candidates can apply now.`
          : `${draft.company.name || 'Your company'} and the ${draft.vacancy.title?.toLowerCase() ?? 'first'} vacancy are ready to go live${plan ? ` on the ${plan.name} plan` : ''}.`}
      </p>
      <DemoNotice
        className="text-left"
        what={
          server
            ? 'Your company profile and the vacancy draft are saved to your account — you’ll find the draft under Jobs → Drafts. No payment was taken, so the vacancy is not live yet; the signed agreement stays in this browser for now.'
            : 'This walkthrough ends here: nothing was sent to the server, no payment was taken and no vacancy was published.'
        }
      />
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/company/vacancies"
          className="inline-flex h-13 items-center gap-2 rounded-full bg-accent-strong px-6 font-semibold text-on-accent focus-ring dark:bg-accent dark:text-on-accent"
        >
          Go to my jobs
          <ArrowRight size={18} aria-hidden />
        </Link>
        <Button variant="secondary" size="lg" onClick={restart}>
          <RotateCcw size={16} aria-hidden />
          Start over
        </Button>
      </div>
    </div>
  );
}
