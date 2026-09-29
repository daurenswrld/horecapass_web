import * as React from 'react';
import type { CurrentUser } from '@/lib/api/auth';

/**
 * Демо-вход — чтобы пройти разделы после входа без аккаунта на боевом сервере.
 *
 * Включён только при `next dev`, либо явно переменной NEXT_PUBLIC_DEMO_AUTH=1
 * (например, на превью-деплое для показа заказчице). В обычной сборке кнопок
 * нет, и request() ведёт себя как раньше.
 *
 * В демо-сессии токенов нет вовсе: запросы, которым нужен вход, отвечаются
 * здесь же (пустыми списками — экраны сами показывают образцы), а публичные
 * списки вакансий идут на настоящий сервер анонимно. Ничего не записывается
 * на сервер: отклик, избранное и публикация «проходят» только в браузере.
 */

export const DEMO_AUTH_ENABLED =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEMO_AUTH === '1';

export type DemoRole = 'applicant' | 'company';

const KEY = 'hp_demo_session';

export const DEMO_USERS: Record<DemoRole, CurrentUser> = {
  applicant: {
    id: -1,
    email: 'demo.candidate@horecapass.test',
    first_name: 'Sara',
    last_name: 'Khan',
    role: 'APPLICANT',
  },
  company: {
    id: -2,
    email: 'demo.employer@horecapass.test',
    first_name: 'Aigerim',
    last_name: 'S.',
    role: 'COMPANY_OWNER',
    company: -1,
    company_name: 'Steppe Garden Hotel',
  },
};

/**
 * Демо-вход ли это (кнопки «As a candidate / As an employer»). До гидрации —
 * false, чтобы сервер и браузер нарисовали одно и то же.
 */
export function useIsDemo(): boolean {
  const [demo, setDemo] = React.useState(false);
  React.useEffect(() => setDemo(!!demoSession.get()), []);
  return demo;
}

export const demoSession = {
  get(): DemoRole | null {
    if (!DEMO_AUTH_ENABLED || typeof window === 'undefined') return null;
    const v = window.localStorage.getItem(KEY);
    return v === 'applicant' || v === 'company' ? v : null;
  },
  start(role: DemoRole) {
    window.localStorage.setItem(KEY, role);
  },
  end() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  },
  user(): CurrentUser | null {
    const r = demoSession.get();
    return r ? DEMO_USERS[r] : null;
  },
};

/** Публичные GET, которые можно честно взять с настоящего сервера без токена. */
const PUBLIC_GET = [/^\/api\/vacancies\/(\?|$)/, /^\/api\/vacancies\/\d+\/$/, /^\/api\/vacancies\/cities\/$/];

/**
 * Ответ на запрос в демо-сессии. `undefined` — пропустить на сервер анонимно.
 */
export function demoResponse(path: string, method: string): { value: unknown } | undefined {
  const user = demoSession.user();
  if (!user) return undefined;
  const p = path.split('?')[0];
  if (method === 'GET' && PUBLIC_GET.some((re) => re.test(path))) return undefined;
  // «Для вас» без профиля на сервере не посчитать — показываем общий список.
  if (method === 'GET' && p === '/api/vacancies/matches/') return undefined;
  if (p === '/users/api/users/me/') return { value: user };
  return { value: method === 'GET' ? [] : {} };
}
