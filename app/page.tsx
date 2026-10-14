import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, BadgeCheck, Check, ChevronDown, FileText, Play, ShieldCheck, Users } from 'lucide-react';
import { BUTTON } from '@/components/landing/buttons';
import { JoinButton } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { LandingHeader } from '@/components/landing/header';
import { IntroSplash } from '@/components/landing/intro';
import { Reveal } from '@/components/ui/motion';
import { SUPPORT_EMAIL } from '@/lib/legal';
import { cn } from '@/lib/utils';

/**
 * Лендинг.
 *
 * Дизайн и тексты — веб-прототип v2 (HorecaPass_web_prototype_v2.pdf, страница
 * L-01, 14.10.2026): «утверждённый первый экран Desktop-1, тексты всех блоков —
 * из файла Landing Prototype». Голосовое заказчицы 14.10: «берём этот светлый
 * дизайн за основу… первую страницу разбавить картинками, но не наляписто».
 *
 * Ответы FAQ, кроме первого, в прототипе свёрнуты — они собраны из фактов,
 * которые эта же страница говорит выше, без новых обещаний.
 *
 * Страница статичная и рисуется сервером; клиентские только шапка и кнопки,
 * которым нужно знать, вошёл ли посетитель.
 */

/** Цены — из прототипа. Заказчица ещё их обсуждает (голосовое 14.10), поэтому в одном месте. */
const PLANS_FROM = '$199';
const PDF_CV_PRICE = '$8';

export const metadata: Metadata = {
  title: 'HorecaPass — hospitality hiring across the GCC',
  description:
    'Verified hospitality jobs and talent across the GCC. Candidates see salary, visa and housing upfront; employers get ranked shortlists on one flat plan, not a commission.',
  openGraph: {
    title: 'HorecaPass — hospitality hiring across the GCC',
    description:
      'Faster, safer and cheaper than a recruitment agency. Verified jobs and pre-screened candidates for hotels, restaurants and catering.',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <IntroSplash />
      <LandingHeader />

      <main>
        <Hero />
        <Stats />
        <Why />
        <Pain />
        <ForCandidates />
        <ForEmployers />
        <WhoYouCanHire />
        <Pricing />
        <Steps />
        <BuiltBy />
        <Faq />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

/* Общие кусочки ----------------------------------------------------------------- */

const WRAP = 'mx-auto max-w-6xl px-5 sm:px-6 lg:px-10';
const H2 = 'font-serif text-[2rem] font-medium leading-[1.12] tracking-tight text-heading sm:text-[2.6rem]';

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md bg-accent/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-text-primary',
        className,
      )}
    >
      {children}
    </span>
  );
}

function Tag({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'good' | 'soft' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2.5 py-1 text-[13px] font-medium',
        tone === 'plain' && 'border border-line bg-surface text-text-primary',
        tone === 'good' && 'bg-success/10 text-success',
        tone === 'soft' && 'bg-surface-muted text-text-primary',
      )}
    >
      {children}
    </span>
  );
}

function Verified() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent-text">
      <Check size={12} strokeWidth={3} aria-hidden />
      Verified
    </span>
  );
}

function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary', className)}>{children}</p>;
}

function Ticks({ items }: { items: [string, string][] }) {
  return (
    <ul className="space-y-4">
      {items.map(([title, text]) => (
        <li key={title} className="flex gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
            <Check size={13} strokeWidth={3} aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-heading">{title}</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-text-secondary">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* 1. Первый экран ----------------------------------------------------------------- */

function Hero() {
  const reveal = (d: number) => ({ '--d': `${d}ms` }) as React.CSSProperties;

  return (
    <section className="relative overflow-hidden">
      {/* Фото зала растворяется в фоне слева, как в Desktop-1. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/landing/restaurant.webp"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-[70%_center] blur-[6px] saturate-[.8]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/75 lg:via-background/75 lg:to-background/10" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
      </div>

      <div className={cn(WRAP, 'relative grid gap-10 pb-14 pt-12 lg:grid-cols-[1.25fr_0.75fr] lg:pb-20 lg:pt-20')}>
        <div>
          <div className="hero-reveal flex flex-wrap gap-2" style={reveal(0)}>
            <Chip>Hospitality hiring platform</Chip>
            <Chip>Saudi Arabia, UAE &amp; the GCC</Chip>
          </div>

          <h1
            className="hero-reveal mt-6 font-serif text-[2.4rem] font-medium leading-[1.1] tracking-tight text-heading sm:text-5xl lg:text-[3.4rem]"
            style={reveal(80)}
          >
            Hospitality hiring across the GCC: faster, safer and cheaper than a recruitment agency.
          </h1>

          <p className="hero-reveal mt-6 max-w-xl text-lg leading-relaxed text-text-secondary" style={reveal(180)}>
            Candidates see verified jobs with salary, visa and housing upfront. Employers get ranked, pre-screened
            shortlists on a flat monthly plan, instead of paying 15–20% of annual salary for every hire.
          </p>

          <div className="hero-reveal mt-9 flex flex-wrap gap-3" style={reveal(280)}>
            <JoinButton role="applicant">Find a job</JoinButton>
            <JoinButton role="company" variant="outline">
              Hire staff
            </JoinButton>
          </div>
        </div>

        <HeroCards />
      </div>
    </section>
  );
}

function HeroCards() {
  return (
    <div className="hero-reveal relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none" style={{ '--d': '220ms' } as React.CSSProperties}>
      <div className="ml-auto w-full max-w-[17rem] rounded-lg border border-line bg-surface p-3 shadow-lift">
        <Image
          src="/landing/hero-waiter.webp"
          alt="Maria S., a waitress with three years of experience"
          width={308}
          height={296}
          unoptimized
          className="aspect-[1.05] w-full rounded-md object-cover"
        />
        <div className="px-1.5 pb-1 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xl font-semibold text-heading">Maria S.</span>
            <Verified />
          </div>
          <Kicker className="mt-1">Waiter · 3 years experience</Kicker>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Tag tone="soft">English</Tag>
            <Tag tone="soft">Russian</Tag>
            <Tag tone="soft">Hospitality</Tag>
          </div>
        </div>
      </div>

      <div className="relative mt-5 rounded-lg border border-line bg-surface p-5 shadow-lift lg:-ml-40 lg:mr-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-heading">Waiter / Waitress</span>
              <Verified />
            </div>
            <Kicker className="mt-1">Fine-dining restaurant · Riyadh, KSA</Kicker>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold text-heading">4,000 SAR</p>
            <p className="text-xs text-text-secondary">per month</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Tag tone="good">Visa sponsored</Tag>
          <Tag tone="good">Accommodation</Tag>
          <Tag tone="good">Transport</Tag>
          <Tag tone="soft">Meals on duty</Tag>
          <Tag tone="soft">2-year contract</Tag>
        </div>
      </div>
    </div>
  );
}

/* 2. Цифры ----------------------------------------------------------------------- */

function Stats() {
  const stats = [
    ['9+', 'years hiring in the GCC'],
    ['1,000+', 'hospitality placements'],
    ['6', 'GCC countries'],
  ];
  return (
    <section className="border-y border-line bg-surface-alt">
      <div className={cn(WRAP, 'flex flex-wrap items-center justify-between gap-6 py-7')}>
        <dl className="grid grid-cols-3 gap-4 sm:flex sm:gap-0 sm:divide-x sm:divide-line">
          {stats.map(([value, label]) => (
            <div key={label} className="sm:px-10 sm:first:pl-0">
              <dt className="sr-only">{label}</dt>
              <dd className="font-serif text-3xl font-semibold text-heading sm:text-4xl">{value}</dd>
              <dd className="mt-1 text-sm text-text-secondary">{label}</dd>
            </div>
          ))}
        </dl>
        <a
          href="https://careerteria.com"
          target="_blank"
          rel="noreferrer"
          className="rounded text-left focus-ring sm:text-right"
        >
          <Kicker>Built by</Kicker>
          <span className="block font-serif text-2xl font-semibold text-heading underline underline-offset-4">Careerteria</span>
          <span className="inline-flex items-center gap-0.5 text-sm text-text-secondary">
            careerteria.com <ArrowUpRight size={14} aria-hidden />
          </span>
        </a>
      </div>
    </section>
  );
}

/* 3. Почему мы -------------------------------------------------------------------- */

function Why() {
  const items = [
    [
      ShieldCheck,
      'Verified on both sides',
      "Employers are checked before they post. Candidates complete a role-specific check before they're shown as Verified.",
    ],
    [FileText, 'Every detail upfront', 'Salary, visa, housing, transport and contract terms are on the job card. No surprises after the interview.'],
    [Users, 'Hire without commissions', 'Employers pay one flat plan, not a percentage of every salary. Candidates never pay to get hired.'],
  ] as const;
  return (
    <section className="bg-surface-muted/60">
      <div className={cn(WRAP, 'py-16 lg:py-24')}>
        <Reveal>
          <h2 className={cn(H2, 'max-w-2xl')}>Built only for hospitality hiring in the GCC</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map(([Icon, title, text], i) => (
            <Reveal key={title} delay={i * 110}>
              <div className="h-full rounded-lg border border-line bg-surface p-7 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-muted text-accent-text">
                  <Icon size={19} aria-hidden />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-heading">{title}</h3>
                <p className="mt-2 leading-relaxed text-text-secondary">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4. Боль ------------------------------------------------------------------------- */

function Pain() {
  const columns = [
    {
      who: "If you're looking for work",
      title: "You apply everywhere and still don't know what you're applying for.",
      items: [
        "The post doesn't say the salary.",
        'You find out about visa and housing only after the interview, if at all.',
        "You can't tell if the employer is real, or if anyone will ever reply.",
      ],
      answer: 'On HorecaPass you see the full offer before you apply, and every application gets a status.',
    },
    {
      who: "If you're hiring",
      title: "You don't need more CVs. You need the right people, without paying an agency for every hire.",
      items: [
        'Hundreds of applications, three worth calling.',
        'Good candidates disappear after the first call.',
        "Every agency hire costs 15–20% of a year's salary.",
      ],
      answer: 'On HorecaPass you start with a ranked shortlist and pay one flat monthly plan.',
    },
  ];

  return (
    <section>
      <div className={cn(WRAP, 'py-16 lg:py-24')}>
        <Reveal>
          <h2 className={cn(H2, 'max-w-4xl')}>Hospitality hiring shouldn&apos;t take hundreds of CVs, or a commission on every hire.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-text-secondary">
            Job groups are full of noise. Agencies charge a share of the salary. And candidates still can&apos;t tell which
            offers are real until they&apos;ve already applied.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {columns.map((c, i) => (
            <Reveal key={c.who} delay={i * 130}>
              <div className="flex h-full flex-col rounded-lg border border-line bg-surface p-7 shadow-card lg:p-9">
                <Kicker>{c.who}</Kicker>
                <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-heading lg:text-2xl">{c.title}</h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {c.items.map((t) => (
                    <li key={t} className="flex gap-3 text-text-primary">
                      <span aria-hidden className="font-semibold text-danger">
                        –
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-line pt-5 font-semibold text-heading">{c.answer}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 5. Кандидатам ------------------------------------------------------------------- */

function ForCandidates() {
  const roles = ['Waiters', 'Chefs & commis', 'Baristas', 'Bartenders & mixologists', 'Hosts', 'Front office', 'Housekeeping', 'Supervisors', 'Managers'];
  return (
    <section id="candidates" className="scroll-mt-20 bg-surface-muted">
      <div className={cn(WRAP, 'py-16 lg:py-24')}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Chip>For candidates</Chip>
            <h2 className={cn(H2, 'mt-4')}>See the full offer before you apply.</h2>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">
              Hotels, restaurants and catering companies in Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain and Oman. Every
              job shows the salary, visa, accommodation and contract terms upfront, so you only apply to offers that work
              for you.
            </p>
            <Kicker className="mt-8">Roles you&apos;ll find</Kicker>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((r) => (
                <Tag key={r}>{r}</Tag>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Ticks
              items={[
                ['Every detail on the job card', 'Salary, visa sponsorship, housing, transport, meals and contract length. No guessing, no surprises after the interview.'],
                ['Only verified employers', "Every company is checked before it can post. You know who you're talking to."],
                ['Matched to your experience', 'Create one profile and see the jobs where you actually fit, not an endless feed.'],
                ['Talk to employers directly', 'Chat, interview invites and offers in one place. Every application gets a status.'],
                ['Free for candidates', 'Your profile, applications and chats cost nothing. You never pay to get hired.'],
              ]}
            />
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <JoinButton role="applicant" arrow>
                Create my free profile
              </JoinButton>
              <span className="text-text-secondary">Free to join. Build your profile in minutes.</span>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <div className="grid overflow-hidden rounded-lg border border-line shadow-card lg:grid-cols-[1.35fr_1fr]">
            <div className="bg-surface p-7 lg:p-10">
              <Kicker>Your profile, upgraded</Kicker>
              <h3 className="mt-3 font-serif text-2xl font-semibold leading-snug text-heading lg:text-[1.85rem]">
                We rewrite your profile the way GCC employers want to read it.
              </h3>
              <p className="mt-4 leading-relaxed text-text-secondary">
                When you fill in your experience, HorecaPass turns it into a clear, selling profile built on our
                recruiters&apos; years of hiring for GCC hotels and restaurants. It highlights what employers here look
                for first: your roles, venues, GCC experience, languages and availability.
              </p>
              <p className="mt-4 leading-relaxed text-text-secondary">
                <strong className="font-semibold text-heading">Employers always see your upgraded profile, for free.</strong>{' '}
                If you&apos;d also like to keep it as a ready CV, download it as a PDF for {PDF_CV_PRICE}.
              </p>
              <p className="mt-6 flex items-baseline gap-3">
                <span className="font-serif text-4xl font-semibold text-heading">{PDF_CV_PRICE}</span>
                <span className="text-text-secondary">one-time · optional · PDF CV for your own use</span>
              </p>
            </div>
            <div className="space-y-4 bg-surface-muted/70 p-7 lg:p-10">
              <div className="rounded-lg bg-surface p-5">
                <Kicker className="text-danger">What you wrote</Kicker>
                <p className="mt-2 text-text-secondary">Worked as waiter in restaurant, good with customers, 3 years.</p>
              </div>
              <div className="rounded-lg border-[1.5px] border-success bg-surface p-5">
                <Kicker className="text-success">What employers see</Kicker>
                <p className="mt-2 font-semibold text-heading">Waiter · 3 years in fine dining</p>
                <p className="mt-1.5 text-text-primary">
                  Upscale Italian restaurant, 120 covers. Wine service, upselling, POS (Micros). English and Russian.
                  Available in 30 days.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 6. Работодателям ------------------------------------------------------------------ */

function ForEmployers() {
  const rows = [
    ['Experience', '6 years · 3 in the GCC'],
    ['Last venues', 'Upscale Italian, Dubai · Hotel banquet, Riyadh'],
    ['Skills check', 'Passed · Hot kitchen, HACCP'],
    ['Visa status', 'In UAE · transferable'],
    ['Available', 'In 30 days'],
    ['Languages', 'English, Russian'],
  ];
  return (
    <section id="employers" className="scroll-mt-20">
      <div className={cn(WRAP, 'grid items-start gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24')}>
        <Reveal>
          <Chip>For employers</Chip>
          <h2 className={cn(H2, 'mt-4')}>Spend your time interviewing, not reading CVs.</h2>
          <p className="mt-5 text-lg leading-relaxed text-text-secondary">
            Post a role and get a ranked shortlist of verified hospitality candidates, with skills checks and video intros,
            ready to interview. One flat monthly plan, no commission on any hire.
          </p>
          <div className="mt-8">
            <Ticks
              items={[
                ['Start with the strongest candidates', 'Every candidate arrives with a match score and a short summary of the experience that matters for your role.'],
                ['Know them before the first call', 'Role-specific skills check, video introduction, GCC experience and visa status on every Verified profile.'],
                ['Your job post, drafted for you', 'Describe the role in a line. HorecaPass drafts the full post from similar hospitality roles; you review and publish in minutes.'],
                ['One pipeline, nobody lost', 'Move candidates from shortlist to interview to offer in one place, not across email threads and spreadsheets.'],
                ['Predictable cost', 'A flat subscription instead of 15–20% of annual salary for every person you hire.'],
              ]}
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <JoinButton role="company" arrow>
              Post your first role
            </JoinButton>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Hiring%2010%2B%20roles`} className={BUTTON.outline}>
              Hiring 10+? Talk to our team
            </a>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Plans from <strong className="font-semibold text-text-primary">{PLANS_FROM}/month</strong>. Pre-opening and
            volume hiring supported by our recruitment team.
          </p>
        </Reveal>

        <Reveal delay={140} className="lg:pt-14">
          <div className="rounded-lg border border-line bg-surface p-6 shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent-muted text-lg font-semibold text-accent-text">
                  AK
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-semibold text-heading">Aziz K.</span>
                    <Verified />
                  </div>
                  <p className="text-sm text-text-secondary">Chef de Partie · Italian &amp; Mediterranean</p>
                </div>
              </div>
              <span className="font-serif text-3xl font-semibold text-accent-strong dark:text-accent">94%</span>
            </div>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="text-right font-semibold text-heading">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex items-center gap-3 rounded-md bg-surface-muted px-4 py-3 text-sm text-text-primary">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
                <Play size={13} fill="currentColor" aria-hidden className="translate-x-px" />
              </span>
              Video intro · 0:48 · &ldquo;Why I want to work in Riyadh&rdquo;
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 7. Кого можно нанять -------------------------------------------------------------- */

function WhoYouCanHire() {
  const groups = [
    ['Front of house', ['Waiters', 'Hosts', 'Baristas', 'Bartenders', 'Sommeliers', 'Captains']],
    ['Kitchen', ['Commis', 'Demi & CDP', 'Sous chefs', 'Pastry', 'Stewarding']],
    ['Hotel & management', ['Front office', 'Housekeeping', 'Supervisors', 'Outlet & F&B managers']],
  ] as const;
  return (
    <section>
      <div className={cn(WRAP, 'pb-16 lg:pb-24')}>
        <Reveal>
          <h2 className={cn(H2, 'text-[1.75rem] sm:text-[2.1rem]')}>Who you can hire</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {groups.map(([title, roles], i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="h-full rounded-lg border border-line bg-surface p-5 shadow-card">
                <Kicker className="text-accent-text">{title}</Kicker>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <Tag key={r}>{r}</Tag>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 max-w-4xl leading-relaxed text-text-secondary">
          Candidates already working in the GCC, ready to transfer, alongside experienced hospitality professionals from
          Eastern Europe, Central Asia and Africa, the same talent pools Careerteria has hired from for luxury hotels,
          restaurant groups and pre-openings since 2014.
        </p>
      </div>
    </section>
  );
}

/* 8. Цены ------------------------------------------------------------------------- */

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-surface-muted">
      <div className={cn(WRAP, 'py-16 lg:py-24')}>
        <Reveal>
          <Kicker>Pricing</Kicker>
          <h2 className={cn(H2, 'mt-3 max-w-2xl')}>One agency placement can cost more than a year of HorecaPass.</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-lg border border-line bg-surface p-7 shadow-card lg:p-9">
              <Kicker>Recruitment agency</Kicker>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
                <span className="font-serif text-5xl font-semibold text-heading">15–20%</span>
                <span className="text-text-secondary">of annual salary, per hire</span>
              </p>
              <div className="mt-6 border-t border-line pt-5 text-sm">
                <p className="text-text-secondary">Example: one supervisor at 6,000 SAR/month</p>
                <dl className="mt-2 space-y-2.5 text-base">
                  {[
                    ['Annual salary', '72,000 SAR'],
                    ['Agency fee at 15–20%', '10,800–14,400 SAR'],
                    ['For the next hire', 'Pay again'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-text-primary">{k}</dt>
                      <dd className="font-semibold text-heading">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            {/* Тёмная карточка одинакова в обеих темах: это акцент блока, а не поверхность. */}
            <div className="h-full rounded-lg bg-[#5A2E14] p-7 text-white shadow-lift lg:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">HorecaPass</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-5xl">from {PLANS_FROM}</span>
                <span className="text-white/75">/month</span>
              </p>
              <ul className="mt-6 space-y-3 border-t border-white/20 pt-5">
                {[
                  'Ranked shortlists for every role you post',
                  'Verified profiles with skills checks and video intros',
                  'Direct chat and one hiring pipeline',
                  'No commission on any hire',
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check size={17} aria-hidden className="mt-0.5 shrink-0 text-white/80" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        <p className="mt-8 font-serif text-xl font-semibold text-heading">
          Every hire you make through HorecaPass costs you the same: nothing extra.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <JoinButton role="company" arrow>
            See employer plans
          </JoinButton>
          <span className="text-text-secondary">Hiring for a pre-opening or 20+ roles? We&apos;ll build a plan with you.</span>
        </div>
      </div>
    </section>
  );
}

/* 9. Шаги ------------------------------------------------------------------------- */

function Steps() {
  const steps = [
    ['Tell us your role, or who you need', 'Candidates build one profile. Employers describe the role in a line.'],
    ['See the right matches', 'Candidates see full offers that fit. Employers see a ranked shortlist.'],
    ['Chat and interview directly', 'Video intros, chat and interview invites in one place.'],
    ['Get hired. Or make the hire.', 'Every stage stays visible until the offer is signed.'],
  ];
  return (
    <section id="how" className="scroll-mt-20">
      <div className={cn(WRAP, 'py-16 lg:py-24')}>
        <Reveal>
          <h2 className={cn(H2, 'max-w-sm')}>From first profile to first day</h2>
        </Reveal>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, text], i) => (
            <li key={title}>
              <Reveal delay={i * 100} className="border-t-2 border-accent-strong pt-4 dark:border-accent">
                <span className="text-xs font-semibold tracking-wider text-accent-text">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-heading">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-text-secondary">{text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 10. Кто за этим стоит ------------------------------------------------------------ */

function BuiltBy() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <Image src="/landing/lobby.webp" alt="" fill unoptimized className="object-cover blur-[2px]" />
      <div aria-hidden className="absolute inset-0 bg-[#2B1A0F]/85" />
      <div className={cn(WRAP, 'relative grid items-center gap-10 py-16 lg:grid-cols-[1.5fr_1fr] lg:py-24')}>
        <Reveal>
          <h2 className="font-serif text-[2rem] leading-tight sm:text-[2.5rem]">
            Built by people who&apos;ve been hiring for GCC hospitality for 9+ years.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/80">
            HorecaPass is built by <strong className="text-white">Careerteria</strong>, a Dubai-based hospitality
            recruitment company with <strong className="text-white">1,000+ placements</strong> across Saudi Arabia, the UAE
            and the wider GCC.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            We spent years hiring through CVs, spreadsheets, emails and WhatsApp. Then we turned that experience into the
            platform we wished we&apos;d had.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
            {[
              ['9+', 'Years'],
              ['1,000+', 'Placements'],
              ['6', 'GCC markets'],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="sr-only">{k}</dt>
                <dd className="font-serif text-4xl">{v}</dd>
                <dd className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">{k}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={140}>
          <div className="rounded-lg border border-white/15 bg-white/5 p-7 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">Who&apos;s behind HorecaPass</p>
            <p className="mt-3 font-serif text-2xl">Careerteria</p>
            <p className="mt-3 leading-relaxed text-white/80">
              Hospitality recruitment for luxury venues, pre-opening launches and restaurant groups across Saudi Arabia,
              the UAE and the GCC.
            </p>
            <a
              href="https://careerteria.com"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1 rounded-md bg-white px-5 py-2.5 font-semibold text-[#5A2E14] transition hover:bg-white/90 focus-ring"
            >
              Visit careerteria.com <ArrowUpRight size={16} aria-hidden />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 11. FAQ ------------------------------------------------------------------------- */

function Faq() {
  const items = [
    [
      'Is HorecaPass free for candidates?',
      `Yes. Your profile, applications and chats are free, and you never pay to get hired. We also upgrade your profile for GCC employers, and they always see that upgraded version. The only paid option is downloading it as a PDF CV for your own use: ${PDF_CV_PRICE}, one time.`,
    ],
    [
      'Will I see the salary, visa and housing before I apply?',
      'Yes. Every job card shows the salary, visa sponsorship, housing, transport, meals and contract length, so you only apply to offers that work for you.',
    ],
    ['Which countries are the jobs in?', 'Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain and Oman.'],
    [
      'What does "Verified" mean?',
      'Employers are checked before they can post. Candidates complete a role-specific skills check before they are shown as Verified.',
    ],
    [
      'How much does it cost to hire?',
      `Employers pay one flat plan, not a percentage of every salary: plans start from ${PLANS_FROM}/month, with no commission on any hire. Hiring for a pre-opening or 20+ roles? We'll build a plan with you.`,
    ],
    [
      'What kind of candidates are on HorecaPass?',
      'Hospitality professionals already working in the GCC and ready to transfer, alongside experienced staff from Eastern Europe, Central Asia and Africa: front of house, kitchen, hotel and management roles.',
    ],
  ];

  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className={cn(H2, 'text-center')}>Before you sign up</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {items.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group rounded-lg border border-line bg-surface shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg px-6 py-5 font-semibold text-heading focus-ring [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown size={20} aria-hidden className="shrink-0 text-accent-text transition-transform group-open:rotate-180" />
              </summary>
              <p className="-mt-1 px-6 pb-5 leading-relaxed text-text-secondary">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 12. Финал ------------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="bg-surface-muted">
      <div className={cn(WRAP, 'py-16 text-center lg:py-24')}>
        <h2 className={cn(H2, 'mx-auto max-w-3xl')}>Your next hospitality job, or your next hire, starts here.</h2>
        <p className="mt-4 text-lg text-text-secondary">Join HorecaPass and start on the side that matters to you.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-start">
          <div>
            <JoinButton role="applicant">Find my next job</JoinButton>
            <p className="mt-2 text-sm text-text-secondary">Free for candidates</p>
          </div>
          <div>
            <JoinButton role="company" variant="outline">
              Hire staff
            </JoinButton>
            <p className="mt-2 text-sm text-text-secondary">Plans from {PLANS_FROM}/month · no commission per hire</p>
          </div>
        </div>
        <p className="mt-10 inline-flex items-center gap-2 text-sm text-text-secondary">
          <BadgeCheck size={16} aria-hidden className="text-accent-text" />
          The same account works in the HorecaPass app.
        </p>
      </div>
    </section>
  );
}
