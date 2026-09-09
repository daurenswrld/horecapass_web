import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Wordmark } from '@/components/brand';
import { FooterAccountLink } from '@/components/landing/cta';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/lib/legal';
import { GOOGLE_PLAY_URL, APP_STORE_URL } from '@/lib/stores';

/**
 * Подвал.
 *
 * Раскладка в колонки, а не одна строка: в подвал приходят за конкретным —
 * правовыми документами, поддержкой, входом. Плоский список ссылок заставляет
 * читать всё подряд, разделы по смыслу — нет.
 */

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded text-sm text-text-secondary transition-colors hover:text-text-primary focus-ring"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="rounded text-sm text-text-secondary transition-colors hover:text-text-primary focus-ring"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  // Год в копирайте берётся при отрисовке, а не вбивается руками: иначе
  // в январе на сайте висит прошлогодний.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark height={26} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              Платформа найма для отелей, ресторанов и кейтеринга. Веб и мобильное приложение
              с общим аккаунтом.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-2 rounded text-sm text-text-secondary transition-colors hover:text-text-primary focus-ring"
            >
              <Mail size={15} />
              {SUPPORT_EMAIL}
            </a>
          </div>

          <Column
            title="Соискателям"
            links={[
              { label: 'Открытые вакансии', href: '#vacancies' },
              { label: 'Как это работает', href: '#how' },
              { label: 'Что даёт платформа', href: '#candidates' },
              { label: 'Создать профиль', href: '/register?role=applicant' },
            ]}
          />

          <Column
            title="Работодателям"
            links={[
              { label: 'Возможности подбора', href: '#employers' },
              { label: 'Этапы найма', href: '#how' },
              { label: 'Зарегистрировать компанию', href: '/register?role=company' },
            ]}
          />

          <Column
            title="Приложение и документы"
            links={[
              // App Store появится в списке, когда будет ссылка (lib/stores.ts).
              ...(APP_STORE_URL ? [{ label: 'App Store', href: APP_STORE_URL, external: true }] : []),
              { label: 'Google Play', href: GOOGLE_PLAY_URL, external: true },
              { label: 'Политика конфиденциальности', href: PRIVACY_URL, external: true },
              { label: 'Пользовательское соглашение', href: TERMS_URL, external: true },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">© {year} HorecaPass</p>
          <div className="flex items-center gap-5 text-sm">
            <FooterAccountLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
