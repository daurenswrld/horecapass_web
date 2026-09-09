import Link from 'next/link';
import { Wordmark } from '@/components/brand';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/**
 * Разворот для входа и регистрации.
 *
 * На телефоне форма занимает экран целиком. На широком экране одна узкая
 * колонка посреди пустоты выглядит потерянной, поэтому слева — что даёт
 * платформа, справа — сама форма в карточке. Форма при этом остаётся узкой:
 * поле ввода во всю ширину монитора читается хуже, а не лучше.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="rounded focus-ring">
          <Wordmark />
        </Link>
        <ThemeToggle />
      </header>

      <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-2">
        <section className="hidden lg:block">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-primary">
            Одна учётная запись на приложение и сайт
          </h2>
          <ul className="mt-8 space-y-5">
            {[
              ['Без пароля', 'Вводите почту и шестизначный код из письма — придумывать и вспоминать нечего.'],
              ['Всё синхронно', 'Отклики, чаты и резюме те же, что в телефоне: сервер один.'],
              ['Удобнее за компьютером', 'Список вакансий и карточка открыты одновременно, ничего не теряется.'],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="font-semibold text-text-primary">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-7 shadow-card sm:p-9">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
