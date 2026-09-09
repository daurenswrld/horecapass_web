import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BadgeCheck,
  Bot,
  PenLine,
  Briefcase,
  CalendarClock,
  FileText,
  MessageSquare,
  Search,
  Users,
  Video,
} from 'lucide-react';
import { AppDownload } from '@/components/landing/app-download';
import { Footer } from '@/components/landing/footer';
import { AllVacanciesLink, FinalCta, HeroCta } from '@/components/landing/cta';
import { LandingHeader } from '@/components/landing/header';
import { Card, Chip } from '@/components/ui/primitives';
import { fetchPublicVacancies } from '@/lib/api/server';
import { formatSalary, type Vacancy } from '@/lib/api/vacancies';
import { plural } from '@/lib/utils';

/**
 * Лендинг.
 *
 * Серверная страница: вакансии подгружаются на сервере и попадают в HTML.
 * Так они индексируются поисковиками (SEO — пункт 3.6 договора) и страница
 * читается даже с выключенным JavaScript. Клиентская часть здесь только одна —
 * шапка, которой нужно знать, вошёл ли посетитель.
 */

export const metadata: Metadata = {
  title: 'HorecaPass, hospitality jobs',
  description:
    'A hiring platform built for hospitality: candidates find work in hotels and restaurants, companies post jobs and move candidates through the pipeline.',
  openGraph: {
    title: 'HorecaPass, hospitality jobs',
    description:
      'Hotel and restaurant jobs, applications, video interviews and direct chat with employers. Web and mobile app share one account.',
    type: 'website',
  },
};

// Список вакансий меняется нечасто — страницу можно держать в кэше.
export const revalidate = 300;

export default async function LandingPage() {
  const vacancies = await fetchPublicVacancies(6);

  return (
    <div className="min-h-[100dvh]">
      <LandingHeader />

      <main>
        <Hero vacancies={vacancies} />
        <Vacancies vacancies={vacancies} />
        <ForCandidates />
        <ForEmployers />
        <HowItWorks />
        <MobileApp />
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
  muted,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section id={id} className={muted ? 'bg-surface-muted' : undefined}>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-text">{eyebrow}</p>
        )}
        <h2 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-text-primary lg:text-4xl">
          {title}
        </h2>
        {lead && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">{lead}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Hero({ vacancies }: { vacancies: Vacancy[] }) {
  // Настоящие цифры вместо рекламной строки. Пустой список — строки нет:
  // «0 вакансий» на первом экране лучше не показывать.
  const companies = new Set(vacancies.map((v) => v.companyName).filter(Boolean)).size;

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-28">
        <h1 className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-text-primary lg:text-6xl">
          Hospitality jobs without CVs by email and hiring over messengers
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary lg:text-xl">
          Candidates fill in their profile once and see the jobs that fit. Employers get
          applications already sorted and move candidates through stages without losing anyone.
        </p>

        {vacancies.length > 0 && (
          <p className="mt-6 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {vacancies.length} {plural(vacancies.length, 'job')}
            </span>{' '}
            open right now
            {companies > 0 && (
              <>
                {' at '}
                <span className="font-semibold text-text-primary">
                  {companies} {plural(companies, 'company', 'companies')}
                </span>
              </>
            )}
          </p>
        )}

        <HeroCta />
      </div>
    </section>
  );
}

function Vacancies({ vacancies }: { vacancies: Awaited<ReturnType<typeof fetchPublicVacancies>> }) {
  return (
    <Section
      id="vacancies"
      eyebrow="Open jobs"
      title="Who is hiring right now"
      lead="A live list from the platform. You need an account to apply and chat with the employer."
    >
      {vacancies.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium text-text-primary">The job list is unavailable right now</p>
          <p className="mt-1 text-sm text-text-secondary">
            Check back a little later, or{' '}
            <Link href="/register?role=applicant" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              create a profile
            </Link>
            {' '}and we will send matching ones as soon as they appear.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.map((v) => {
              const salary = formatSalary(v);
              return (
                <Card key={v.id} className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-snug text-text-primary">{v.title}</h3>
                    {v.isVerified && (
                      <BadgeCheck size={16} className="mt-0.5 shrink-0 text-info" aria-label="Verified company" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{v.companyName}</p>
                  {salary && <p className="mt-3 font-semibold text-text-primary">{salary}</p>}
                  {v.address && <p className="mt-1 text-sm text-text-secondary">{v.address}</p>}
                  {v.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {v.skills.slice(0, 3).map((s) => (
                        <Chip key={s}>{s}</Chip>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <AllVacanciesLink />
        </>
      )}
    </Section>
  );
}

function Feature({
  Icon,
  title,
  text,
}: {
  Icon: typeof Search;
  title: string;
  text: string;
}) {
  return (
    <div>
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent-muted">
        <Icon size={20} className="text-accent-text" />
      </span>
      <h3 className="mt-4 font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

function ForCandidates() {
  return (
    <Section
      id="candidates"
      muted
      eyebrow="For candidates"
      title="One profile instead of ten emails with a CV"
      lead="Fill in your profile once. The platform then shows where you fit and keeps you posted on every application."
    >
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          Icon={Bot}
          title="Matched to your experience"
          text="Jobs are ranked by how well they match your profile: position, city, salary expectations, skills."
        />
        <Feature
          Icon={FileText}
          title="CV and certificates"
          text="Your CV is built inside the platform and exports to PDF. You can import data from LinkedIn."
        />
        <Feature
          Icon={Video}
          title="Video intro"
          text="Some employers ask for a short video instead of a first call. Recorded in the mobile app."
        />
        <Feature
          Icon={MessageSquare}
          title="Chat directly"
          text="Chat with the employer inside the platform, with no swapping phone numbers and no digging through messengers."
        />
        <Feature
          Icon={CalendarClock}
          title="A clear status"
          text="You can see where your application stands: review, shortlist, interview, offer."
        />
        <Feature
          Icon={BadgeCheck}
          title="Verified companies"
          text="Some employers are verified, and the badge sits right on the job card."
        />
      </div>
    </Section>
  );
}

function ForEmployers() {
  return (
    <Section
      id="employers"
      eyebrow="For employers"
      title="Applications arrive sorted, not in a pile"
      lead="Instead of a folder of emails, a candidate list for every job, with a match score and hiring stages."
    >
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          Icon={PenLine}
          title="AI-assisted posting"
          text="No need to write the description and requirements from scratch: the platform drafts them for you."
        />
        <Feature
          Icon={Users}
          title="Candidates by stage"
          text="Applied, shortlisted, interview, offer. You see who is where, and nobody gets lost."
        />
        <Feature
          Icon={Bot}
          title="Match score"
          text="Every application gets a match score against the job, with a short summary of the candidate."
        />
        <Feature
          Icon={MessageSquare}
          title="Chat with templates"
          text="Chat with the candidate plus saved replies, so you do not retype the same things."
        />
        <Feature
          Icon={CalendarClock}
          title="Interview scheduling"
          text="Interviews are scheduled inside the platform, with calendar availability checked."
        />
        <Feature
          Icon={Briefcase}
          title="Recruiting team"
          text="Invite colleagues to the company and hire together."
        />
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    ['Sign up with a code', 'Enter your email and get a six-digit code. No password to invent.'],
    ['Profile or job post', 'Candidates fill in a profile, employers post a job.'],
    ['Apply and chat', 'Applying takes one click, then comes the chat and an interview invitation.'],
    ['Start work', 'Both sides see the hiring stage, all the way to the offer.'],
  ];

  return (
    <Section id="how" muted eyebrow="How it works" title="Four steps from sign-up to your first day">
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([title, text], i) => (
          <li key={title}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-strong text-sm font-bold text-on-accent">
              {i + 1}
            </span>
            <h3 className="mt-4 font-semibold text-text-primary">{title}</h3>
            <p className="mt-1.5 leading-relaxed text-text-secondary">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function MobileApp() {
  return (
    <Section
      eyebrow="Mobile app"
      title="The same account on your phone"
      lead="HorecaPass for iOS and Android. Scan the code with your camera to open the app in the store."
    >
      <AppDownload />
    </Section>
  );
}
