import type { Config } from 'tailwindcss';

/** Имена совпадают с мобильными токенами (app_colors.dart), чтобы перенос
 *  экрана не требовал таблицы соответствий. Хардкод hex в компонентах запрещён.
 *
 *  Намеренно без `<alpha-value>`: с ним Tailwind печатает
 *  `rgb(var(--surface) / var(--tw-bg-opacity))`, и браузер не пересчитывает
 *  такой фон при смене класса темы на лету — карточки оставались белыми под
 *  светлым текстом до перезагрузки. Плата за это — модификаторы вида
 *  `bg-surface/50` на этих токенах не работают; мы их не используем. */
const rgb = (v: string) => `rgb(var(${v}))`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: rgb('--background'),
        surface: {
          DEFAULT: rgb('--surface'),
          muted: rgb('--surface-muted'),
          alt: rgb('--surface-alt'),
        },
        line: { DEFAULT: rgb('--border'), strong: rgb('--border-strong') },
        heading: rgb('--heading'),
        peach: { from: rgb('--peach-from'), to: rgb('--peach-to') },
        ink: rgb('--ink'),
        cv: { paper: rgb('--cv-paper'), ink: rgb('--cv-ink'), accent: rgb('--cv-accent') },
        text: {
          primary: rgb('--text-primary'),
          secondary: rgb('--text-secondary'),
          tertiary: rgb('--text-tertiary'),
        },
        accent: {
          DEFAULT: rgb('--accent'),
          muted: rgb('--accent-muted'),
          focus: rgb('--accent-focus'),
          text: rgb('--accent-text'),
          strong: rgb('--accent-strong'),
        },
        'on-accent': rgb('--on-accent'),
        'on-accent-muted': rgb('--on-accent-muted'),
        info: {
          DEFAULT: rgb('--info'),
          surface: rgb('--info-surface'),
        },
        'on-info-surface': rgb('--on-info-surface'),
        qr: { surface: rgb('--qr-surface'), ink: rgb('--qr-ink') },
        danger: { DEFAULT: rgb('--danger'), surface: rgb('--danger-surface') },
        warning: rgb('--warning'),
        success: rgb('--success'),
      },
      spacing: {
        // Высота крупной кнопки: 52px. В стандартной шкале Tailwind её нет,
        // а h-12 для главного действия на лендинге мелковата.
        13: '3.25rem',
      },
      fontFamily: {
        sans: ['Arial', 'var(--font-arimo)', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        // Тени тёплые: серая тень на #F8F4EE выглядит грязной.
        card: '0 1px 2px rgb(42 33 27 / 0.04), 0 8px 24px -12px rgb(42 33 27 / 0.12)',
        lift: '0 2px 4px rgb(42 33 27 / 0.06), 0 16px 40px -16px rgb(42 33 27 / 0.18)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
