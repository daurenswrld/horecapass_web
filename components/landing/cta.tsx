'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, LayoutDashboard, Search, UserSearch } from 'lucide-react';
import { isCompany } from '@/lib/api/auth';
import { homeFor, useAuth } from '@/lib/auth/context';

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
 */

const PRIMARY =
  'inline-flex h-13 items-center justify-center gap-2 rounded-full bg-accent-strong px-7 text-base font-semibold text-on-accent transition-colors hover:brightness-95 focus-ring';
const SECONDARY =
  'inline-flex h-13 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-7 text-base font-semibold text-text-primary transition-colors hover:bg-surface-muted focus-ring';

/** Кнопки под заголовком первого экрана. */
export function HeroCta() {
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/register?role=applicant" className={PRIMARY}>
            <Search size={18} />Я ищу работу
          </Link>
          <Link href="/register?role=company" className={SECONDARY}>
            <Briefcase size={18} />Я нанимаю
          </Link>
        </div>
        <p className="mt-5 text-sm text-text-secondary">
          Регистрация без пароля — по коду из письма.{' '}
          <Link href="/login" className="font-semibold text-accent-text underline-offset-4 hover:underline">
            У меня уже есть аккаунт
          </Link>
        </p>
      </>
    );
  }

  const company = isCompany(user.role);
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.company_name;

  return (
    <>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href={homeFor(user)} className={PRIMARY}>
          <LayoutDashboard size={18} />
          {company ? 'Мои вакансии' : 'Смотреть вакансии'}
        </Link>
        <Link href={company ? '/company/selection' : '/responses'} className={SECONDARY}>
          {company ? <UserSearch size={18} /> : <Search size={18} />}
          {company ? 'Подбор кандидатов' : 'Мои отклики'}
        </Link>
      </div>
      <p className="mt-5 text-sm text-text-secondary">
        {name ? `Вы вошли как ${name}.` : 'Вы вошли в аккаунт.'} Сессия та же, что в мобильном приложении.
      </p>
    </>
  );
}

/** Ссылка под списком вакансий. */
export function AllVacanciesLink() {
  const { user } = useAuth();

  return (
    <Link
      href={user ? homeFor(user) : '/register?role=applicant'}
      className="mt-8 inline-flex items-center gap-1.5 font-semibold text-accent-text underline-offset-4 hover:underline focus-ring"
    >
      Смотреть все вакансии
      <ArrowRight size={16} />
    </Link>
  );
}

/** Блок в конце страницы. Вошедшего звать регистрироваться незачем. */
export function FinalCta() {
  const { user } = useAuth();
  const company = user ? isCompany(user.role) : false;

  return (
    <section className="border-t border-line bg-surface-muted">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:px-10 lg:py-20">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
          {user ? 'Продолжим с того же места' : 'Начните с бесплатной регистрации'}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
          {user
            ? company
              ? 'Ваши вакансии и отклики кандидатов ждут в кабинете.'
              : 'Подходящие вакансии и статусы ваших откликов — в кабинете.'
            : 'Займёт минуту: почта и код из письма. Дальше — вакансии или ваша первая публикация.'}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {user ? (
            <Link href={homeFor(user)} className={PRIMARY}>
              <LayoutDashboard size={18} />
              Перейти в кабинет
            </Link>
          ) : (
            <>
              <Link href="/register?role=applicant" className={PRIMARY}>
                Я ищу работу
              </Link>
              <Link href="/register?role=company" className={SECONDARY}>
                Я нанимаю
              </Link>
            </>
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
      {user ? 'В кабинет' : 'Войти'}
    </Link>
  );
}
