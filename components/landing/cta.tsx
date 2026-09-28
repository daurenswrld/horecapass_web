'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, LayoutDashboard, Search, UserSearch, Users } from 'lucide-react';
import { isCompany } from '@/lib/api/auth';
import { homeFor, useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Призывы к действию на лендинге.
 *
 * Пока сессия неизвестна, рисуется гостевой вариант — он же попадает
 * в серверную разметку. Так поисковик видит ссылки на регистрацию, страница
 * не «прыгает» пустотой на месте кнопок, а вошедшему подписи заменяются, как
 * только вернётся ответ от /users/api/users/me/.
 *
 * Специально не по `loading`: ждать ответа, показывая дырку вместо главной
 * кнопки, хуже, чем на мгновение показать гостевую надпись.
 *
 * Кнопки ролей равны по весу. Заказчица (голосовое 15.09): «мне не нужно,
 * чтобы какая-то из этих ролей была выделена» — сайт одинаково для кандидата
 * и для работодателя, залитая кнопка у одной из ролей читается как «главная».
 */

const ROLE_BUTTON =
  'inline-flex h-13 items-center justify-center gap-2 rounded-full border-[1.5px] border-accent-strong bg-surface px-7 text-base font-semibold text-heading transition-colors hover:bg-accent-muted focus-ring dark:border-accent';

const ROLES = [
  {
    href: '/register?role=applicant',
    Icon: Briefcase,
    title: 'I am looking for work',
    note: 'Real jobs, verified employers, no agent fees',
  },
  {
    href: '/register?role=company',
    Icon: Users,
    title: 'I am hiring',
    note: 'Qualified candidates, pre-screened and ready to interview',
  },
] as const;

/** Выбор роли на первом экране; вошедшему — ссылки в его разделы. */
export function HeroCta() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="grid max-w-lg gap-3">
        {ROLES.map(({ href, Icon, title, note }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-lg border-[1.5px] border-accent-strong bg-surface p-4 transition-colors hover:bg-accent-muted focus-ring dark:border-accent"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-accent-muted text-accent-text">
              <Icon size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-heading">{title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-text-secondary">{note}</span>
            </span>
            <ArrowRight
              size={18}
              aria-hidden
              className="shrink-0 text-accent-text transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    );
  }

  const company = isCompany(user.role);
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.company_name;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={homeFor(user)} className={ROLE_BUTTON}>
          <LayoutDashboard size={18} />
          {company ? 'My jobs' : 'Browse jobs'}
        </Link>
        <Link href={company ? '/company/selection' : '/responses'} className={ROLE_BUTTON}>
          {company ? <UserSearch size={18} /> : <Search size={18} />}
          {company ? 'Find candidates' : 'My applications'}
        </Link>
      </div>
      <p className="mt-4 text-sm text-text-secondary">
        {name ? `Signed in as ${name}.` : 'You are signed in.'} Same session as in the mobile app.
      </p>
    </>
  );
}

/** Ссылка в конце блока «For candidates» / «For employers». */
export function SectionCta({ role, label }: { role: 'applicant' | 'company'; label: string }) {
  const { user } = useAuth();

  return (
    <Link
      href={user ? homeFor(user) : `/register?role=${role}`}
      className="group mt-8 inline-flex items-center gap-2 rounded-full bg-accent-strong px-6 py-3 font-semibold text-on-accent transition-colors hover:brightness-110 focus-ring"
    >
      {user ? 'Open dashboard' : label}
      <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Блок в конце страницы. Вошедшего звать регистрироваться незачем. */
export function FinalCta() {
  const { user } = useAuth();
  const company = user ? isCompany(user.role) : false;

  return (
    <section className="bg-gradient-to-b from-background to-peach-to">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center lg:px-10 lg:py-28">
        <h2 className="text-3xl font-bold tracking-tight text-heading lg:text-5xl">
          {user ? 'Pick up where you left off' : 'Start with a free account'}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
          {user
            ? company
              ? 'Your jobs and candidate applications are waiting in the dashboard.'
              : 'Matching jobs and your application statuses are in the dashboard.'
            : 'It takes a minute: your email and a code. Then jobs, or your first job post.'}
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {user ? (
            <Link href={homeFor(user)} className={ROLE_BUTTON}>
              <LayoutDashboard size={18} />
              Go to dashboard
            </Link>
          ) : (
            ROLES.map(({ href, Icon, title }) => (
              <Link key={href} href={href} className={cn(ROLE_BUTTON, 'sm:min-w-64')}>
                <Icon size={18} aria-hidden />
                {title}
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/** Ссылка в подвале: гостю — вход, вошедшему — его раздел. */
export function FooterAccountLink() {
  const { user } = useAuth();
  return (
    <Link
      href={user ? homeFor(user) : '/login'}
      className="rounded transition-colors hover:text-text-primary focus-ring"
    >
      {user ? 'Open dashboard' : 'Sign in'}
    </Link>
  );
}
