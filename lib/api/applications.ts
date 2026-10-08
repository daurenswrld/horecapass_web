import { API } from './endpoints';
import { ApiError, BASE_URL, http, refreshTokens, tokens } from './client';
import type { CandidateMaterial } from './materials';

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
  // Этапы расширенного конвейера бэкенда (AI_SHORTLISTED, INTERVIEW, TEST_TASK):
  // прод ещё на старой схеме, но когда обновится, веб уже умеет их показать.
  | 'AI_SHORTLISTED'
  | 'INTERVIEW'
  | 'TEST_TASK'
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
    status: parseStatus(json.status),
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
  AI_SHORTLISTED: 'Shortlisted by Smart',
  INTERVIEW: 'Interview',
  TEST_TASK: 'Test task',
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
  AI_SHORTLISTED: 'bg-info-surface text-on-info-surface',
  INTERVIEW: 'bg-info-surface text-on-info-surface',
  TEST_TASK: 'bg-info-surface text-on-info-surface',
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

/** Статус, который не знаем, считаем новым — лучше «Not reviewed», чем «undefined». */
export function parseStatus(v: unknown): ApplicationStatus {
  const s = String(v ?? 'NEW').toUpperCase();
  return s in STATUS_LABEL ? (s as ApplicationStatus) : 'NEW';
}

/** К какому шагу основной полосы относится расширенный этап. */
export function funnelStage(status: ApplicationStatus): ApplicationStatus {
  switch (status) {
    case 'AI_SHORTLISTED':
      return 'REVIEWED';
    case 'INTERVIEW':
    case 'TEST_TASK':
      return 'INVITED';
    default:
      return status;
  }
}

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

export interface ApplicantExperience {
  position: string;
  company: string;
  period: string;
  description: string;
  /** Тип заведения, его уровень и кухня — то, что работодатель из Залива иначе не узнает. */
  venueType: string;
  venueLevel: string;
  cuisine: string;
}

/** Карточка кандидата из `applicant_profile` — только то, что прислал сервер. */
export interface ApplicantProfile {
  email: string | null;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  location: string | null;
  position: string | null;
  positionLevel: string | null;
  visaStatus: string | null;
  targetCountry: string | null;
  desiredSalary: string | null;
  availableFrom: string | null;
  relocationReady: boolean;
  languages: string[];
  skills: string[];
  experiences: ApplicantExperience[];
  educations: string[];
  /** Сертификаты со ссылкой на файл, если кандидат его загрузил. */
  certificates: { title: string; url: string | null }[];
}

export interface CompanyApplication {
  id: number;
  vacancyId: number | null;
  applicant: string;
  vacancyTitle: string;
  status: ApplicationStatus;
  createdAt: Date;
  avatarUrl: string | null;
  matchScore: number | null;
  requiresVideoGreeting: boolean;
  videoGreetingUrl: string | null;
  coverLetter: string | null;
  relocationStep: RelocationStep | null;
  details: ApplicantProfile;
  /** Сырой `applicant_profile` — из него открывается карточка кандидата. */
  profile: Record<string, unknown>;
}

/** Элемент списка в строку: сервер шлёт то строки, то объекты ({name, level}). */
function label(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return nonEmpty(v);
  if (typeof v === 'object') {
    const o = v as Json;
    const main = nonEmpty(o.name ?? o.title ?? o.language ?? o.degree ?? o.institution);
    const extra = nonEmpty(o.level ?? o.issuer ?? o.institution ?? o.year);
    if (!main) return null;
    return extra && extra !== main ? `${main} — ${extra}` : main;
  }
  return null;
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v : []).map(label).filter((x): x is string => !!x);

export function parseApplicantProfile(p: Record<string, unknown>): ApplicantProfile {
  const salary = nonEmpty(p.desired_salary)?.replace(/\.0+$/, '') ?? null;
  const period = nonEmpty(p.salary_period)?.toLowerCase() ?? null;
  const salaryTail = [nonEmpty(p.salary_currency), period].filter(Boolean).join(' / ');
  return {
    email: nonEmpty(p.email),
    phone: nonEmpty(p.phone),
    age: typeof p.age === 'number' ? p.age : null,
    nationality: nonEmpty(p.nationality),
    location: nonEmpty(p.location),
    position: nonEmpty(p.position),
    positionLevel: nonEmpty(p.position_level),
    visaStatus: nonEmpty(p.visa_status),
    targetCountry: nonEmpty(p.target_country),
    desiredSalary: salary ? [salary.replace(/\.00$/, ''), salaryTail].filter(Boolean).join(' ') : null,
    availableFrom: nonEmpty(p.available_from),
    relocationReady: p.relocation_ready === true,
    languages: list(p.languages),
    skills: list(p.skills),
    // Прод отдаёт опыт как company_name + start_date/end_date, код бэкенда — company + period.
    experiences: (Array.isArray(p.experiences) ? p.experiences : []).map((e) => {
      const x = (e ?? {}) as Json;
      const month = (v: unknown) => {
        const m = /^(\d{4})-(\d{2})/.exec(String(v ?? ''));
        return m ? `${m[2]}/${m[1]}` : null;
      };
      const period =
        String(x.period ?? '').trim() ||
        (x.start_date ? `${month(x.start_date)} — ${month(x.end_date) ?? 'Now'}` : '');
      return {
        position: String(x.position ?? '').trim(),
        company: String(x.company ?? x.company_name ?? '').trim(),
        period,
        description: String(x.description ?? '').trim(),
        venueType: String(x.venue_type ?? '').trim(),
        venueLevel: String(x.venue_level ?? '').trim(),
        cuisine: String(x.cuisine ?? '').trim(),
      };
    }),
    educations: list(p.educations),
    certificates: (Array.isArray(p.certificates) ? p.certificates : [])
      .map((c) => {
        const x = (typeof c === 'object' && c ? c : { title: c }) as Json;
        const title = label(x) ?? 'Certificate';
        return { title, url: nonEmpty(x.file) };
      })
      .filter((c) => c.title || c.url),
  };
}

export function parseCompanyApplication(json: Json): CompanyApplication {
  const profile = (json.applicant_profile ?? {}) as Record<string, unknown>;
  const fromProfile = String(profile.name ?? '').trim();
  const fromRoot = String(json.applicant_name ?? '').trim();
  return {
    id: Number(json.id),
    vacancyId: json.vacancy == null ? null : Number(json.vacancy),
    applicant: fromProfile || fromRoot || 'Candidate',
    vacancyTitle: String(json.vacancy_title ?? 'Job'),
    status: parseStatus(json.status),
    createdAt: date(json.created_at) ?? new Date(),
    avatarUrl: nonEmpty(profile.avatar),
    matchScore: json.match_score == null ? null : Math.round(Number(json.match_score)),
    requiresVideoGreeting: json.requires_video_greeting === true,
    videoGreetingUrl: nonEmpty(json.video_greeting_url),
    coverLetter: nonEmpty(json.cover_letter),
    relocationStep: json.relocation_step ? (String(json.relocation_step) as RelocationStep) : null,
    details: parseApplicantProfile(profile),
    profile,
  };
}

/** Разбор кандидата под вакансию: GET /api/applications/company/<id>/ai-summary/. */
export interface CandidateSummary {
  fitScore: number | null;
  verdict: string;
  strengths: string[];
  gaps: string[];
  interviewQuestions: string[];
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

  /** Сервер спрашивает Gemini и кэширует ответ — повторный запрос дешёвый. */
  async aiSummary(applicationId: number): Promise<CandidateSummary> {
    const d = (await http.get<Json>(API.applications.aiSummary(applicationId))) ?? {};
    const strs = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
    return {
      fitScore: typeof d.fit_score === 'number' ? Math.round(d.fit_score) : null,
      verdict: String(d.verdict ?? '').trim(),
      strengths: strs(d.strengths),
      gaps: strs(d.gaps),
      interviewQuestions: strs(d.interview_questions),
    };
  },

  /** Портфолио/сопроводительное письмо, которые кандидат прикрепил к профилю. */
  materials(applicationId: number) {
    return http.get<CandidateMaterial[]>(API.applications.materials(applicationId));
  },

  /** Скачивание одного файла — тот же паттерн, что и materialsApi.download для кандидата. */
  async downloadMaterial(applicationId: number, item: CandidateMaterial) {
    const url = `${BASE_URL}${API.applications.materialDownload(applicationId, item.id)}`;
    const send = () => fetch(url, { headers: { Authorization: `Bearer ${tokens.access ?? ''}` } });
    let response = await send();
    if (response.status === 401 && (await refreshTokens())) response = await send();
    if (!response.ok) throw new ApiError(response.status, null);
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
  },
};
