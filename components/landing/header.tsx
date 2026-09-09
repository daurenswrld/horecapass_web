"use client";

import * as React from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { homeFor, useAuth } from "@/lib/auth/context";

/**
 * Шапка лендинга.
 *
 * Единственная часть страницы, которой нужно знать, вошёл ли человек:
 * вошедшему вместо «Войти» показываем ссылку в его раздел. Всё остальное
 * на странице статично и рисуется сервером.
 */
export function LandingHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5 lg:px-10">
        <Link href="/" className="rounded focus-ring">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-text-secondary md:flex">
          <a
            href="#vacancies"
            className="rounded transition-colors hover:text-text-primary focus-ring"
          >
            Вакансии
          </a>
          <a
            href="#candidates"
            className="rounded transition-colors hover:text-text-primary focus-ring"
          >
            Соискателям
          </a>
          <a
            href="#employers"
            className="rounded transition-colors hover:text-text-primary focus-ring"
          >
            Работодателям
          </a>
          <a
            href="#how"
            className="rounded transition-colors hover:text-text-primary focus-ring"
          >
            Как это работает
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Пока сессия неизвестна, показываем гостевой вариант — он же
              уходит в серверную разметку. Прятать кнопку до ответа сервера
              нельзя: на её месте зияет дырка, и шапка дёргается. */}
          {user ? (
            <Link
              href={homeFor(user)}
              className="rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:brightness-95 focus-ring"
            >
              В кабинет
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted focus-ring"
              >
                Войти
              </Link>
              <Link
                href="/register?role=applicant"
                className="hidden rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:brightness-95 focus-ring sm:inline-flex"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
