import type { Config } from 'tailwindcss';

/** Каждый цвет — ссылка в app/globals.css. Хардкод hex в компонентах запрещён:
 *  из-за него прошлую версию и пришлось перекрашивать вручную. */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: rgb('--primary-50'),
          100: rgb('--primary-100'),
          200: rgb('--primary-200'),
          300: rgb('--primary-300'),
          400: rgb('--primary-400'),
          500: rgb('--primary-500'),
          600: rgb('--primary-600'),
          700: rgb('--primary-700'),
          800: rgb('--primary-800'),
          900: rgb('--primary-900'),
          DEFAULT: rgb('--primary-500'),
        },
        ink: {
          50: rgb('--ink-50'),
          100: rgb('--ink-100'),
          200: rgb('--ink-200'),
          300: rgb('--ink-300'),
          400: rgb('--ink-400'),
          500: rgb('--ink-500'),
          600: rgb('--ink-600'),
          700: rgb('--ink-700'),
          800: rgb('--ink-800'),
          900: rgb('--ink-900'),
        },
        accent: {
          50: rgb('--accent-50'),
          100: rgb('--accent-100'),
          300: rgb('--accent-300'),
          500: rgb('--accent-500'),
          600: rgb('--accent-600'),
          700: rgb('--accent-700'),
          DEFAULT: rgb('--accent-500'),
        },
        success: rgb('--success'),
        warning: rgb('--warning'),
        danger: rgb('--danger'),
        bg: rgb('--bg'),
        surface: { DEFAULT: rgb('--surface'), 2: rgb('--surface-2'), 3: rgb('--surface-3') },
        line: { DEFAULT: rgb('--border'), strong: rgb('--border-strong') },
        fg: { DEFAULT: rgb('--fg'), muted: rgb('--fg-muted'), subtle: rgb('--fg-subtle') },
        'on-primary': rgb('--on-primary'),
      },
      fontFamily: {
        // Raleway — Вариант 1 брендбука. Подключается через next/font в layout.
        sans: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        // Тени тёплые: серая тень на #F1EBE5 выглядит грязной.
        card: '0 1px 2px rgb(77 64 58 / 0.04), 0 8px 24px -12px rgb(77 64 58 / 0.12)',
        lift: '0 2px 4px rgb(77 64 58 / 0.06), 0 16px 40px -16px rgb(77 64 58 / 0.20)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        typing: { '0%, 60%, 100%': { opacity: '0.25' }, '30%': { opacity: '1' } },
      },
      animation: {
        'fade-up': 'fade-up 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        typing: 'typing 1.2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
