import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

/** Raleway — Вариант 1 брендбука. Подключаем через next/font: шрифт уезжает
 *  в сборку, без обращения к серверам Google из браузера пользователя. */
const raleway = Raleway({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HorecaPass — работа в отелях и ресторанах",
    template: "%s · HorecaPass",
  },
  description:
    "Платформа найма для HoReCa: профиль кандидата собирается как профессиональное резюме, работодатель видит подходящих людей, а не поток откликов.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={raleway.variable} suppressHydrationWarning>
      <head>
        {/* Тема применяется до первого кадра, иначе страница моргает светлым
            у тех, кто выбрал тёмную. Ключ и логика — те же, что
            в components/ui/theme-toggle.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('hp_theme');if(t==='dark'||t==='light')document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
