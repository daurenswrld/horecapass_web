import type { Metadata } from 'next';
import { Arimo } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import './globals.css';

// Шрифт — Arial, как в текстовых стилях макета (Figma → UI kit: H1/H2/Label/
// Text/Subtitle — все Arial). Aldi, 29.09: «шрифты берёт из палитры шрифтов».
// На Windows, macOS и iOS Arial системный; где его нет (Android, Linux), встаёт
// Arimo — метрически совместимая копия Arial. Без preload: где есть Arial,
// Arimo не скачивается вовсе.
const arimo = Arimo({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arimo',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: { default: 'HorecaPass', template: '%s · HorecaPass' },
  description: 'Hospitality jobs: vacancies, applications and hiring.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={arimo.variable} suppressHydrationWarning>
      <head>
        {/* Тема применяется до первого кадра, иначе страница моргает светлым. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('hp_theme');if(t==='dark'||t==='light')document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
