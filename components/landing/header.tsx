"use client";

import * as React from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { BUTTON } from "@/components/landing/buttons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { homeFor, useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

/**
 * Шапка лендинга: разделы и две кнопки ролей, как в утверждённом первом
 * экране (веб-прототип v2, L-01). «Sign in» в прототипе нет, но без неё
 * вернувшемуся человеку некуда нажать — оставлена текстовой ссылкой.
 */
const NAV = [
  ["#candidates", "For candidates"],
  ["#employers", "For employers"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
] as const;

export function LandingHeader() {
  const { user } = useAuth();
  const small = "h-10 px-4 text-sm shadow-none";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10">
        <Link href="/" className="rounded focus-ring">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-text-secondary lg:flex">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="rounded transition-colors hover:text-text-primary focus-ring">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <ThemeToggle />
          </span>
          {/* Пока сессия неизвестна, показываем гостевой вариант — он же
              уходит в серверную разметку, и шапка не дёргается. */}
          {user ? (
            <Link href={homeFor(user)} className={cn(BUTTON.solid, small)}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted focus-ring"
              >
                Sign in
              </Link>
              <Link href="/welcome?role=applicant" className={cn(BUTTON.solid, small)}>
                Find a job
              </Link>
              <Link href="/welcome?role=company" className={cn(BUTTON.outline, small, "hidden sm:inline-flex")}>
                Hire staff
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
