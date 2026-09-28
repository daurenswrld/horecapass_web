import { API } from './endpoints';
import { http } from './client';

/**
 * Вакансии. Модель повторяет Vacancy мобилки
 * (lib/features/vacancies/domain/vacancy.dart), включая мелочи вроде того,
 * что «сохранено» приходит с сервера полем is_favorite, а не is_saved.
 */

export interface Skill {
  id?: number;
  name: string;
}

export interface Vacancy {
  id: number;
  title: string;
  companyId: number | null;
  companyName: string;
  companyLogoUrl: string | null;
  description: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  currency: string;
  requirements: string | null;
  skills: string[];
  isActive: boolean;
  /** Статус на сервере: черновик, активна или в архиве (бриф, пункт 8). */
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  address: string | null;
  companyImages: string[];
  isVerified: boolean;
  isSaved: boolean;
  isApplied: boolean;
  requiresVideoGreeting: boolean;
  department: string | null;
  venueType: string | null;
  venueLevel: string | null;
  schedule: string | null;
  hours: string | null;
  employmentType: string | null;
  paymentSchedule: string | null;
  salaryType: string | null;
  hiringSteps: string[];
  benefits: string[];
  responsibilities: string[];
  /** Есть только в ленте «Для вас» (/api/vacancies/matches/). */
  matchScore: number | null;
}

type Json = Record<string, unknown>;

const nonEmpty = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};

const stringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => x != null && String(x).trim() !== '').map(String) : [];

export function parseVacancy(json: Json): Vacancy {
  return {
    id: Number(json.id),
    title: String(json.title ?? ''),
    companyId: json.company == null ? null : Number(json.company),
    companyName: String(json.company_name ?? ''),
    companyLogoUrl: nonEmpty(json.company_logo),
    description: nonEmpty(json.description),
    salaryMin: json.salary_min == null ? null : String(json.salary_min),
    salaryMax: json.salary_max == null ? null : String(json.salary_max),
    currency: String(json.currency ?? 'KZT'),
    requirements: nonEmpty(json.requirements),
    skills: Array.isArray(json.skills)
      ? (json.skills as Json[]).map((s) => String(s?.name ?? '')).filter(Boolean)
      : [],
    isActive: json.is_active !== false,
    status: json.status === 'DRAFT' || json.status === 'ARCHIVED' ? json.status : json.is_active === false ? 'ARCHIVED' : 'ACTIVE',
    address: nonEmpty(json.address),
    companyImages: Array.isArray(json.company_images)
      ? (json.company_images as Json[]).map((i) => String(i?.image ?? '')).filter(Boolean)
      : [],
    isVerified: json.is_verified === true,
    // Сервер называет это is_favorite — см. комментарий в модели мобилки.
    isSaved: json.is_favorite === true,
    isApplied: json.is_applied === true,
    requiresVideoGreeting: json.requires_video_greeting === true,
    department: nonEmpty(json.department),
    venueType: nonEmpty(json.venue_type),
    venueLevel: nonEmpty(json.venue_level),
    schedule: nonEmpty(json.schedule),
    hours: nonEmpty(json.hours),
    employmentType: nonEmpty(json.employment_type),
    paymentSchedule: nonEmpty(json.payment_schedule),
    salaryType: nonEmpty(json.salary_type),
    hiringSteps: stringList(json.hiring_steps),
    benefits: stringList(json.benefits),
    responsibilities: stringList(json.responsibilities),
    matchScore: json.match_score == null ? null : Number(json.match_score),
  };
}

/** DRF отдаёт то голый список, то страницу с results — принимаем оба вида. */
function unwrapList(data: unknown): Json[] {
  if (Array.isArray(data)) return data as Json[];
  if (data && typeof data === 'object' && Array.isArray((data as Json).results)) {
    return (data as { results: Json[] }).results;
  }
  return [];
}

export interface VacancyFilters {
  /** Индексная сигнатура: фильтры уходят в query-строку как есть. */
  [key: string]: string | number | undefined;
  search?: string;
  city?: string;
  salary_min?: number;
  venue_type?: string;
  page?: number;
}

export const vacanciesApi = {
  async list(filters: VacancyFilters = {}): Promise<Vacancy[]> {
    const data = await http.get<unknown>(API.vacancies.list, { query: filters });
    return unwrapList(data).map(parseVacancy);
  },

  async matches(): Promise<Vacancy[]> {
    const data = await http.get<unknown>(API.vacancies.matches);
    return unwrapList(data).map(parseVacancy);
  },

  async detail(id: number | string): Promise<Vacancy> {
    const data = await http.get<Json>(API.vacancies.detail(id));
    return parseVacancy(data);
  },

  async mine(): Promise<Vacancy[]> {
    const data = await http.get<unknown>(API.vacancies.mine);
    return unwrapList(data).map(parseVacancy);
  },

  /** Создание вакансии компании (status DRAFT — черновик, ACTIVE — сразу видна). */
  async create(data: Record<string, unknown>): Promise<Vacancy> {
    // Создание — POST /api/vacancies/my/ (CompanyVacancyListCreateView).
    // /api/vacancies/ — публичный список только для чтения: раньше форма
    // отправляла туда и получала 405, вакансия не публиковалась вовсе.
    const json = await http.post<Json>(API.vacancies.mine, data);
    return parseVacancy(json);
  },

  /** Правка своей вакансии — PATCH /api/vacancies/my/<id>/. */
  async update(id: number, data: Record<string, unknown>): Promise<Vacancy> {
    return parseVacancy(await http.patch<Json>(API.vacancies.mineDetail(id), data));
  },

  cities(): Promise<string[]> {
    return http.get<string[]>(API.vacancies.cities);
  },

  apply(id: number | string) {
    return http.post<unknown>(API.vacancies.apply(id));
  },

  toggleFavorite(id: number | string) {
    return http.post<unknown>(API.vacancies.favorite(id));
  },
};

/** «от 250 000 до 400 000 ₸» — как в карточке мобилки. */
export function formatSalary(v: Pick<Vacancy, 'salaryMin' | 'salaryMax' | 'currency'>): string | null {
  const sign = CURRENCY_SIGNS[v.currency] ?? v.currency;
  const num = (s: string) => Number(s).toLocaleString('en-US');
  // Фиксированная сумма — одно число, а не «4,000 – 4,000 SAR»: заказчица
  // отметила этот баг в обоих брифах (работодателя 13.2, кандидата 9 и 10).
  if (v.salaryMin && v.salaryMax && Number(v.salaryMin) === Number(v.salaryMax)) return `${num(v.salaryMin)} ${sign}`;
  if (v.salaryMin && v.salaryMax) return `${num(v.salaryMin)} – ${num(v.salaryMax)} ${sign}`;
  if (v.salaryMin) return `from ${num(v.salaryMin)} ${sign}`;
  if (v.salaryMax) return `up to ${num(v.salaryMax)} ${sign}`;
  return null;
}

const CURRENCY_SIGNS: Record<string, string> = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  AED: 'AED',
  SAR: 'SAR',
};
