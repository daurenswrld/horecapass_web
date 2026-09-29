import Image from 'next/image';
import type { Metadata } from 'next';
import { BadgeCheck, Briefcase, Check, ChevronDown, FileText, Mail, MessageSquare, Minus, Play, Users } from 'lucide-react';
import { AppDownload } from '@/components/landing/app-download';
import { Bubble } from '@/components/landing/bubble';
import { FinalCta, HeroCta, SectionCta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { LandingHeader } from '@/components/landing/header';
import { IntroSplash } from '@/components/landing/intro';
import { cn } from '@/lib/utils';

/**
 * Лендинг.
 *
 * Тексты — утверждённая версия HorecaPass_Web_Copy.docx (22.09.2026), порядок
 * блоков тот же. Визуальный язык — из утверждённого мобильного редизайна
 * в Figma: десктопного макета нет, заказчица просила, чтобы веб и приложение
 * «были гармоничны».
 *
 * Блока с открытыми вакансиями здесь нет намеренно (пункт 5 документа):
 * пока работодателей мало, список и его счётчик выдают масштаб платформы.
 * Когда наберутся узнаваемые работодатели — на его место карусель логотипов
 * «Hiring with us» (данные уже умеет отдавать lib/api/server.ts).
 *
 * Страница статичная и рисуется сервером целиком; клиентские только шапка
 * и кнопки, которым нужно знать, вошёл ли посетитель.
 */

export const metadata: Metadata = {
  title: 'HorecaPass — a hospitality recruiter in your pocket',
  description:
    "GCC's hospitality hiring platform. Smart matches hospitality talent to real, verified roles across the GCC — and employers to candidates who are actually ready to work.",
  openGraph: {
    title: 'HorecaPass — a hospitality recruiter in your pocket',
    description:
      'Real jobs, verified employers, no agent fees for candidates. Pre-screened candidates for hotels, restaurants and catering.',
    type: 'website',
  },
};

/**
 * Ссылка на видео-презентацию. Заказчица: «на веб-версии обязательно видео
 * для ленивых». Самого ролика пока нет — до него блок показывает обложку
 * с пометкой. Сюда кладётся адрес файла (mp4 в /public или внешний).
 */
const PROMO_VIDEO_URL: string | null = null;

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh]">
      <IntroSplash />
      <LandingHeader />

      <main>
        <Hero />
        <Pain />
        <ForCandidates />
        <ForEmployers />
        <PromoVideo />
        <HowItWorks />
        <MobileApp />
        <Trust />
        <Faq />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-heading lg:text-[2.75rem]">
          {title}
        </h2>
        {lead && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">{lead}</p>}
        <div className="mt-10 lg:mt-14">{children}</div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex rounded-full bg-accent-muted px-3.5 py-1.5 text-sm font-medium text-accent-text">
      {children}
    </p>
  );
}

/* 1. Hero ------------------------------------------------------------------ */

function Hero() {
  const reveal = (d: number) => ({ '--d': `${d}ms` }) as React.CSSProperties;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-peach-from to-peach-to">
      <div className="mx-auto grid max-w-6xl items-end gap-4 px-6 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:px-10 lg:pt-16">
        <div className="pb-4 lg:pb-24">
          <div className="hero-reveal" style={reveal(0)}>
            <Eyebrow>GCC&apos;s Hospitality Hiring Platform</Eyebrow>
          </div>

          <h1
            className="hero-reveal mt-5 text-[2.6rem] font-bold leading-[1.05] tracking-tight text-heading sm:text-6xl lg:text-[4.25rem]"
            style={reveal(80)}
          >
            A hospitality recruiter — in your pocket.
          </h1>

          <p
            className="hero-reveal mt-6 max-w-xl text-lg leading-relaxed text-text-secondary lg:text-xl"
            style={reveal(180)}
          >
            Smart matches hospitality talent to real, verified roles across the GCC — and employers to
            candidates who are actually ready to work.
          </p>

          <div className="hero-reveal mt-9" style={reveal(280)}>
            <HeroCta />
          </div>

          <ul
            className="hero-reveal mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary"
            style={reveal(380)}
          >
            {['Verified employers only', 'No agent fees for candidates', 'Built for hotels, restaurants & catering'].map(
              (t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check size={15} aria-hidden className="text-accent-text" />
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Фото команды растворяется в бежевом фоне по краям — созвон 29.09: «плавный
            переход из фонового бежевого», без жёсткой рамки. */}
        <div className="hero-reveal relative mx-auto w-full max-w-md lg:max-w-none" style={reveal(200)}>
          <Image
            src="/landing/team.webp"
            alt="A hotel manager, a chef, a front office manager and a waitress"
            width={900}
            height={1350}
            priority
            unoptimized
            className="photo-calm photo-fade h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}

/* 2. Боль ------------------------------------------------------------------ */

function Pain() {
  const columns = [
    {
      Icon: Briefcase,
      who: 'If you are looking for work',
      items: [
        'You send the same CV to ten different numbers and rarely hear back.',
        "You can't always tell which job post is real.",
        'An agent wants a cut of your first salary.',
      ],
    },
    {
      Icon: Users,
      who: 'If you are hiring',
      items: [
        "Your inbox is a graveyard of CVs you'll never open.",
        'Good candidates go quiet after the first call.',
        'You write the same job requirements from scratch, every time.',
      ],
    },
  ];

  return (
    <Section title="Hospitality hiring still runs on email attachments and WhatsApp chains.">
      <div className="grid gap-5 md:grid-cols-2">
        {columns.map(({ Icon, who, items }) => (
          <div key={who} className="rounded-lg border border-line bg-surface p-6 shadow-card lg:p-8">
            <h3 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-muted text-accent-text">
                <Icon size={19} aria-hidden />
              </span>
              {who}
            </h3>
            <ul className="mt-5 space-y-4">
              {items.map((t) => (
                <li key={t} className="flex gap-3 text-lg leading-snug text-text-primary">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-danger-surface text-danger">
                    <Minus size={12} strokeWidth={3} aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* 3–4. Для кандидатов и работодателей --------------------------------------- */

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 space-y-5">
      {items.map((t) => (
        <li key={t} className="flex gap-3.5 text-lg leading-relaxed text-text-primary">
          <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-strong text-on-accent dark:bg-accent">
            <Check size={14} strokeWidth={3} aria-hidden />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Portrait({ src, alt, line }: { src: string; alt: string; line: string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm pb-10">
      <Image
        src={src}
        alt={alt}
        width={720}
        height={1209}
        unoptimized
        className="photo-calm photo-fade-soft aspect-[4/5] w-full rounded-lg object-cover object-top"
      />
      <Bubble className="absolute -bottom-2 left-4 right-4 sm:-left-8 sm:right-10">{line}</Bubble>
    </div>
  );
}

function ForCandidates() {
  return (
    <section id="candidates" className="scroll-mt-20 bg-surface-muted">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-24">
        <Portrait
          src="/landing/recruiter.webp"
          alt="A HorecaPass recruiter"
          line="Perfect — let's build your profile so employers come to you, not the other way around."
        />
        <div>
          <Eyebrow>For candidates</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-heading lg:text-[2.75rem]">
            One profile. Real jobs. No agent fees.
          </h2>
          <Points
            items={[
              'Fill in your profile once — the platform shows you where you actually fit.',
              'Chat with employers directly. No phone numbers, no middlemen, no chasing WhatsApp groups.',
              'Get Verified with a short qualification and stand out from every other applicant.',
            ]}
          />
          <SectionCta role="applicant" label="Find a job" />
        </div>
      </div>
    </section>
  );
}

function ForEmployers() {
  return (
    <section id="employers" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-24">
        <div className="lg:order-2">
          <Portrait
            src="/landing/kitchen.webp"
            alt="A restaurant team at work in the kitchen"
            line="Got it — let's set you up to start receiving matched candidates."
          />
        </div>
        <div>
          <Eyebrow>For employers</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-heading lg:text-[2.75rem]">
            Candidates arrive ranked and ready to review.
          </h2>
          <Points
            items={[
              'Every candidate arrives with a match score and a short summary — no more opening fifty CVs to find three worth calling.',
              'Smart drafts your job post from similar hospitality roles — you review and publish in minutes.',
              'Move candidates through stages in one place. Nobody gets lost in email.',
            ]}
          />
          <SectionCta role="company" label="Post a role" />
        </div>
      </div>
    </section>
  );
}

/* Видео-презентация ---------------------------------------------------------- */

function PromoVideo() {
  return (
    <section id="video" className="scroll-mt-20 bg-surface-muted">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="text-center">
          <Eyebrow>Video</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-heading lg:text-[2.75rem]">
            See how it works
          </h2>
        </div>

        <div className="relative mt-10 aspect-video overflow-hidden rounded-lg bg-ink shadow-lift">
          {PROMO_VIDEO_URL ? (
            <video
              src={PROMO_VIDEO_URL}
              poster="/landing/lobby.webp"
              controls
              preload="none"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <Image src="/landing/lobby.webp" alt="" fill unoptimized className="photo-calm object-cover" />
              <div aria-hidden className="absolute inset-0 bg-ink opacity-30" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-4">
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-surface text-accent-strong shadow-lift">
                    <Play size={30} aria-hidden className="translate-x-0.5" fill="currentColor" />
                  </span>
                  <span className="rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white">
                    Video coming soon
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* 6. Как это работает -------------------------------------------------------- */

function HowItWorks() {
  // Голосовое 23.09: «чтобы был не только текст, а разбавлялось картинками
  // и элементами — людям тяжело читать весь текст». Отсюда иконки у шагов.
  const steps = [
    [Mail, 'Sign up with a code', 'Your email and a six-digit code. No password to invent.'],
    [FileText, 'Profile or job post', 'Candidates fill in a profile, employers post a role.'],
    [MessageSquare, 'Apply and chat', 'One-click apply, then a direct chat and interview invite.'],
    [BadgeCheck, 'Start work', 'Both sides track every stage, all the way to the offer.'],
  ] as const;

  return (
    <Section id="how" eyebrow="How it works" title="Four steps from sign-up to your first day">
      <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* Линия, связывающая шаги, — только когда они стоят в один ряд. */}
        <span aria-hidden className="absolute left-6 right-6 top-6 hidden h-px bg-line-strong lg:block" />
        {steps.map(([Icon, title, text], i) => (
          <li key={title} className="relative">
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-accent-strong text-on-accent ring-8 ring-background dark:bg-accent">
              <Icon size={20} aria-hidden />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-surface text-[11px] font-bold text-heading shadow">
                {i + 1}
              </span>
            </span>
            <h3 className="mt-5 text-lg font-semibold text-heading">{title}</h3>
            <p className="mt-1.5 leading-relaxed text-text-secondary">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* 7. Мобильное приложение ---------------------------------------------------- */

function MobileApp() {
  return (
    <Section id="app" eyebrow="Mobile app" title="The same account, in your pocket." className="bg-surface-muted">
      <AppDownload />
    </Section>
  );
}

/* 8. Доверие ------------------------------------------------------------------ */

function Trust() {
  // Приглушённое чёрно-белое фото зала — заказчица: «фоном можно использовать
  // приглушённые чёрно-белые фотографии команды, особенно там, где продажи».
  return (
    <section className="relative overflow-hidden bg-ink">
      <Image src="/landing/restaurant.webp" alt="" fill unoptimized className="object-cover grayscale" />
      <div aria-hidden className="absolute inset-0 bg-ink opacity-75" />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:px-10 lg:py-32">
        <p className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
          Built by recruiters who&apos;ve placed 1,000+ hospitality professionals across the GCC.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
          After years of doing this by hand — CVs, WhatsApp, spreadsheets — we built the tool we needed
          ourselves.
        </p>
      </div>
    </section>
  );
}

/* 9. FAQ ---------------------------------------------------------------------- */

function Faq() {
  const items = [
    // В документе пометка: «требует подтверждения как факта перед публикацией».
    // Созвон 29.09: кандидат не платит за профиль и отклики — только за
    // скачивание своего резюме в PDF ($8), по желанию.
    [
      'Is it really free for candidates?',
      'Yes — your profile, applications and chats are free. You only pay $8 if you want to download your CV as a PDF.',
    ],
    [
      'How is this different from a general job board?',
      'Built specifically for hospitality — qualification and verification are part of the profile, not an afterthought.',
    ],
    [
      'Do I need everything ready before I sign up?',
      'No. Start with your email, build your profile at your own pace.',
    ],
    [
      "What does 'Verified' actually mean?",
      'Completed a short role-specific qualification and, where required, a video introduction.',
    ],
  ];

  return (
    <Section id="faq" eyebrow="FAQ" title="Before you sign up">
      <div className="max-w-3xl divide-y divide-line border-y border-line">
        {items.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold text-heading focus-ring [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                size={20}
                aria-hidden
                className="shrink-0 text-accent-text transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="-mt-1 pb-5 text-lg leading-relaxed text-text-secondary">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
