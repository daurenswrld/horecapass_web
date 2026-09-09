import { parseVacancy, type Vacancy } from './vacancies';

/**
 * Запросы, которые делает сам сервер при отрисовке страницы.
 *
 * Отдельно от браузерного клиента по двум причинам: здесь не нужен и недоступен
 * токен из localStorage, и ходить надо прямо на бэкенд, а не через собственный
 * прокси — иначе сервер запросил бы сам себя.
 *
 * Используется только для публичных данных. Лендинг должен открываться
 * и без авторизации, и с выключенным JavaScript — иначе вакансии не попадут
 * в поисковую выдачу (SEO — пункт 3.6 договора).
 */

const API_ORIGIN = process.env.API_ORIGIN ?? 'https://api.horecapass.com';

/**
 * Открытые вакансии для лендинга.
 *
 * Если бэкенд недоступен, возвращаем пустой список, а не роняем страницу:
 * лендинг — это ещё и витрина, он обязан открываться всегда.
 */
export async function fetchPublicVacancies(limit = 6): Promise<Vacancy[]> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/vacancies/`, {
      headers: { Accept: 'application/json' },
      // Список меняется нечасто; пять минут кэша снимают нагрузку с бэкенда
      // и заметно ускоряют первую отрисовку.
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data: unknown = await res.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as { results?: unknown }).results)
        ? (data as { results: unknown[] }).results
        : [];

    return list
      .map((x) => parseVacancy(x as Record<string, unknown>))
      .filter((v) => v.isActive)
      .slice(0, limit);
  } catch {
    return [];
  }
}
