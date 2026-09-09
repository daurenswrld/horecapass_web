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
  title: 'HorecaPass — работа в отелях и ресторанах',
  description:
    'Платформа найма для HoReCa: соискатели находят работу в отелях и ресторанах, компании публикуют вакансии и ведут кандидатов по воронке подбора.',
  openGraph: {
    title: 'HorecaPass — работа в отелях и ресторанах',
    description:
      'Вакансии в отелях и ресторанах, отклики, видео-интервью и переписка с работодателем. Веб и мобильное приложение с общим аккаунтом.',
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
          Работа в отелях и ресторанах — без резюме в почте и переписки в мессенджерах
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary lg:text-xl">
          Соискатель заполняет профиль один раз и видит подходящие вакансии. Работодатель получает
          отклики уже отсортированными и ведёт кандидатов по этапам, не теряя никого в таблицах.
        </p>

        {vacancies.length > 0 && (
          <p className="mt-6 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {vacancies.length} {plural(vacancies.length, 'вакансия', 'вакансии', 'вакансий')}
            </span>{' '}
            открыто прямо сейчас
            {companies > 0 && (
              <>
                {' в '}
                <span className="font-semibold text-text-primary">
                  {companies} {plural(companies, 'компании', 'компаниях', 'компаниях')}
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
      eyebrow="Открытые вакансии"
      title="Кого ищут прямо сейчас"
      lead="Живой список с платформы. Чтобы откликнуться и переписываться с работодателем, нужен аккаунт."
    >
      {vacancies.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium text-text-primary">Список вакансий сейчас недоступен</p>
          <p className="mt-1 text-sm text-text-secondary">
            Загляните чуть позже или{' '}
            <Link href="/register?role=applicant" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              заведите профиль
            </Link>
            {' '}— пришлём подходящие, как только появятся.
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
                      <BadgeCheck size={16} className="mt-0.5 shrink-0 text-info" aria-label="Проверенная компания" />
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
      eyebrow="Соискателям"
      title="Один профиль вместо десяти писем с резюме"
      lead="Заполняете профиль один раз — дальше платформа сама показывает, где вы подходите, и держит вас в курсе по каждому отклику."
    >
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          Icon={Bot}
          title="Подбор под ваш опыт"
          text="Вакансии сортируются по совпадению с профилем: должность, город, зарплатные ожидания, навыки."
        />
        <Feature
          Icon={FileText}
          title="Резюме и сертификаты"
          text="Резюме собирается внутри платформы, выгружается в PDF. Можно перенести данные из LinkedIn."
        />
        <Feature
          Icon={Video}
          title="Видео-презентация"
          text="Часть работодателей просит короткое видео вместо первого созвона. Записывается в мобильном приложении."
        />
        <Feature
          Icon={MessageSquare}
          title="Переписка напрямую"
          text="Чат с работодателем внутри платформы — без обмена номерами и поиска сообщения в мессенджерах."
        />
        <Feature
          Icon={CalendarClock}
          title="Понятный статус"
          text="Видно, на каком этапе ваш отклик: рассмотрение, шорт-лист, интервью, предложение."
        />
        <Feature
          Icon={BadgeCheck}
          title="Проверенные компании"
          text="У части работодателей пройдена верификация — значок стоит прямо в карточке вакансии."
        />
      </div>
    </Section>
  );
}

function ForEmployers() {
  return (
    <Section
      id="employers"
      eyebrow="Работодателям"
      title="Отклики приходят разобранными, а не кучей"
      lead="Вместо папки с письмами — список кандидатов по каждой вакансии, с оценкой соответствия и этапами подбора."
    >
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          Icon={PenLine}
          title="Публикация с помощью ИИ"
          text="Описание вакансии и требования можно не писать с нуля — платформа предложит черновик."
        />
        <Feature
          Icon={Users}
          title="Кандидаты по этапам"
          text="Отклик, шорт-лист, интервью, предложение. Видно, кто где, и никто не теряется."
        />
        <Feature
          Icon={Bot}
          title="Оценка соответствия"
          text="Каждому отклику считается совпадение с вакансией, к нему есть краткая сводка по кандидату."
        />
        <Feature
          Icon={MessageSquare}
          title="Чат с шаблонами"
          text="Переписка с кандидатом и заготовки частых ответов, чтобы не печатать одно и то же."
        />
        <Feature
          Icon={CalendarClock}
          title="Назначение встреч"
          text="Интервью планируются внутри платформы, с проверкой занятости по календарю."
        />
        <Feature
          Icon={Briefcase}
          title="Команда рекрутеров"
          text="Коллег можно пригласить в компанию и работать над подбором вместе."
        />
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    ['Регистрация по коду', 'Вводите почту и получаете шестизначный код. Пароль придумывать не нужно.'],
    ['Профиль или вакансия', 'Соискатель заполняет профиль, работодатель публикует вакансию.'],
    ['Отклик и переписка', 'Отклик уходит в один клик, дальше — чат и приглашение на интервью.'],
    ['Выход на работу', 'Обе стороны видят этап подбора, вплоть до предложения о работе.'],
  ];

  return (
    <Section id="how" muted eyebrow="Как это работает" title="Четыре шага от регистрации до выхода на работу">
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
      eyebrow="Приложение"
      title="Тот же аккаунт в телефоне"
      lead="HorecaPass для iOS и Android. Отсканируйте код камерой — откроется страница приложения в магазине."
    >
      <AppDownload />
    </Section>
  );
}
