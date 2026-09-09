import type { Metadata } from 'next';
import { Raleway } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import './globals.css';

const raleway = Raleway({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-raleway',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'HorecaPass', template: '%s · HorecaPass' },
  description: 'Работа в отелях и ресторанах: вакансии, отклики, подбор персонала.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={raleway.variable} suppressHydrationWarning>
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
