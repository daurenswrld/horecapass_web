import { API } from './endpoints';
import { http } from './client';

/**
 * Отклики соискателя.
 *
 * Модель повторяет ApplicantApplication мобилки
 * (features/home/application/applications_repository.dart), включая то, что
 * визовый этап живёт отдельно от статуса отклика: статус говорит, где кандидат
 * в воронке, relocation_step — что сейчас с документами.
 */

export type ApplicationStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'INVITED'
  | 'VISA'
  | 'ONBOARDING'
  | 'HIRED'
  | 'REJECTED';

export type RelocationStep =
  | 'NOT_STARTED'
  | 'DOCUMENTS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REFUSED'
  | 'TICKETS'
  | 'ARRIVED';

export interface ApplicantApplication {
  id: number;
  vacancyId: number;
  vacancyTitle: string;
  companyId: number | null;
  companyName: string;
  companyLogoUrl: string | null;
  status: ApplicationStatus;
  createdAt: Date;
  coverLetter: string;
  salaryMin: string | null;
  salaryMax: string | null;
  currency: string;
  address: string | null;
  requiresVideoGreeting: boolean;
  videoGreetingUrl: string | null;
  relocationStep: RelocationStep;
  relocationNote: string;
  expectedArrival: Date | null;
}

type Json = Record<string, unknown>;

const nonEmpty = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};

const date = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function parseApplication(json: Json): ApplicantApplication {
  return {
    id: Number(json.id),
    vacancyId: Number(json.vacancy ?? 0),
    vacancyTitle: String(json.vacancy_title ?? 'Job'),
    companyId: json.company_id == null ? null : Number(json.company_id),
    companyName: String(json.company_name ?? 'Company'),
    companyLogoUrl: nonEmpty(json.company_logo),
    status: (String(json.status ?? 'NEW').toUpperCase() as ApplicationStatus) ?? 'NEW',
    createdAt: date(json.created_at) ?? new Date(),
    coverLetter: String(json.cover_letter ?? ''),
    salaryMin: json.salary_min == null ? null : String(json.salary_min),
    salaryMax: json.salary_max == null ? null : String(json.salary_max),
    currency: String(json.currency ?? 'KZT'),
    address: nonEmpty(json.address),
    requiresVideoGreeting: json.requires_video_greeting === true,
    videoGreetingUrl: nonEmpty(json.video_greeting_url),
    relocationStep: (String(json.relocation_step ?? 'NOT_STARTED') as RelocationStep) ?? 'NOT_STARTED',
    relocationNote: String(json.relocation_note ?? '').trim(),
    expectedArrival: date(json.expected_arrival),
  };
}

function unwrapList(data: unknown): Json[] {
  if (Array.isArray(data)) return data as Json[];
  if (data && typeof data === 'object' && Array.isArray((data as Json).results)) {
    return (data as { results: Json[] }).results;
  }
  return [];
}

export const applicationsApi = {
  async mine(): Promise<ApplicantApplication[]> {
    const data = await http.get<unknown>(API.applications.mine);
    return unwrapList(data).map(parseApplication);
  },
};

/** Подписи статусов — те же, что видит человек в приложении. */
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: 'Not reviewed',
  REVIEWED: 'Reviewed',
  INVITED: 'Invited',
  VISA: 'Visa',
  ONBOARDING: 'Relocation',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

/** Цвет статуса. Смысловые токены, а не произвольные цвета. */
export const STATUS_TONE: Record<ApplicationStatus, string> = {
  NEW: 'bg-surface-muted text-text-secondary',
  REVIEWED: 'bg-info-surface text-on-info-surface',
  INVITED: 'bg-info-surface text-on-info-surface',
  VISA: 'bg-accent-muted text-text-primary',
  ONBOARDING: 'bg-accent-muted text-text-primary',
  HIRED: 'bg-surface-alt text-success',
  REJECTED: 'bg-danger-surface text-danger',
};

export const RELOCATION_LABEL: Record<RelocationStep, string> = {
  NOT_STARTED: 'Not started',
  DOCUMENTS: 'Collecting documents',
  SUBMITTED: 'Documents submitted',
  APPROVED: 'Visa approved',
  REFUSED: 'Visa refused',
  TICKETS: 'Tickets',
  ARRIVED: 'Arrived',
};

/** Порядок воронки — по нему рисуется полоса прогресса. Отказ вне порядка. */
export const FUNNEL: readonly ApplicationStatus[] = [
  'NEW',
  'REVIEWED',
  'INVITED',
  'VISA',
  'ONBOARDING',
  'HIRED',
];

export function salaryLabel(a: Pick<ApplicantApplication, 'salaryMin' | 'salaryMax' | 'currency'>): string {
  if (!a.salaryMin && !a.salaryMax) return 'Salary negotiable';
  // Знак валюты один на диапазон: «450 000 ₸ – 650 000 ₸» читается тяжелее
  // и расходится с карточкой вакансии, где формат уже такой.
  const sign = CURRENCY_SIGNS[a.currency] ?? a.currency;
  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : v;
  };
  if (a.salaryMin && a.salaryMax) return `${num(a.salaryMin)} – ${num(a.salaryMax)} ${sign}`;
  if (a.salaryMin) return `from ${num(a.salaryMin)} ${sign}`;
  return `up to ${num(a.salaryMax!)} ${sign}`;
}

const CURRENCY_SIGNS: Record<string, string> = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  AED: 'AED',
  SAR: 'SAR',
};

/* ─────────────── Сторона работодателя ─────────────── */

export interface CompanyApplication {
  id: number;
  applicant: string;
  vacancyTitle: string;
  status: ApplicationStatus;
  createdAt: Date;
  avatarUrl: string | null;
  matchScore: number | null;
  requiresVideoGreeting: boolean;
  videoGreetingUrl: string | null;
  /** Сырой `applicant_profile` — из него открывается карточка кандидата. */
  profile: Record<string, unknown>;
}

export function parseCompanyApplication(json: Json): CompanyApplication {
  const profile = (json.applicant_profile ?? {}) as Record<string, unknown>;
  const fromProfile = String(profile.name ?? '').trim();
  const fromRoot = String(json.applicant_name ?? '').trim();
  return {
    id: Number(json.id),
    applicant: fromProfile || fromRoot || 'Candidate',
    vacancyTitle: String(json.vacancy_title ?? 'Job'),
    status: (String(json.status ?? 'NEW').toUpperCase() as ApplicationStatus) ?? 'NEW',
    createdAt: date(json.created_at) ?? new Date(),
    avatarUrl: nonEmpty(profile.avatar),
    matchScore: json.match_score == null ? null : Math.round(Number(json.match_score)),
    requiresVideoGreeting: json.requires_video_greeting === true,
    videoGreetingUrl: nonEmpty(json.video_greeting_url),
    profile,
  };
}

export const companyApplicationsApi = {
  async list(params: { search?: string; vacancy?: number } = {}): Promise<CompanyApplication[]> {
    const data = await http.get<unknown>(API.applications.company, { query: params });
    return unwrapList(data).map(parseCompanyApplication);
  },

  /** Перевод кандидата на другой этап. Эндпоинт есть и работает. */
  setStatus(applicationId: number, status: ApplicationStatus) {
    return http.patch<unknown>(API.applications.status(applicationId), { status });
  },
};
