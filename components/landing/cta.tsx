'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BUTTON } from '@/components/landing/buttons';
import { homeFor, useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Кнопки лендинга.
 *
 * Пока сессия неизвестна, рисуется гостевой вариант — он же попадает
 * в серверную разметку: поисковик видит ссылки на регистрацию, а на месте
 * кнопки не зияет дырка. Вошедшему та же кнопка ведёт в его раздел.
 *
 * Гость сначала попадает в приветственный квиз (/welcome), из него — на регистрацию.
 */

export function JoinButton({
  role,
  children,
  variant = 'solid',
  arrow,
  className,
}: {
  role: 'applicant' | 'company';
  children: React.ReactNode;
  variant?: keyof typeof BUTTON;
  arrow?: boolean;
  className?: string;
}) {
  const { user } = useAuth();
  return (
    <Link href={user ? homeFor(user) : `/welcome?role=${role}`} className={cn(BUTTON[variant], className)}>
      {user ? 'Open dashboard' : children}
      {arrow && <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-0.5" />}
    </Link>
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
