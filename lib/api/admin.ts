import { API } from './endpoints';
import { http } from './client';

/**
 * Клиент админ-панели. Типы повторяют ответы приложения adminpanel на бэкенде.
 *
 * Поле `available: false` и `count: null` значат «сервер этого пока не
 * считает» (квалификация, платежи, канал регистрации): панель показывает
 * «not tracked yet», а не нарисованный ноль.
 */

export type StaffLevel = 'VIEWER' | 'OPERATOR' | 'MODERATOR' | 'FULL';

export const LEVEL_LABEL: Record<StaffLevel, string> = {
  VIEWER: 'View only',
  OPERATOR: 'Candidates & employers',
  MODERATOR: 'Vacancies & moderation',
  FULL: 'Full access',
};

export interface StaffMe {
  id: number;
  name: string;
  email: string;
  level: StaffLevel;
  can: { view: boolean; operate: boolean; moderate: boolean; manage_staff: boolean };
}

export interface RoleCityRow {
  role: string;
  city: string;
  vacancies: number;
  applications: number;
  applications_per_vacancy: number;
}

export interface Overview {
  window_days: number;
  stale_days: number;
  candidates_total: number;
  candidates_active: number;
  employers_total: number;
  employers_active: number;
  vacancies_open: number;
  vacancies_without_applications: number;
  candidates_per_vacancy: number | null;
  by_role_city: RoleCityRow[];
}

export interface QuizOptionStat {
  id: string;
  count: number;
  share: number | null;
}

export interface QuizRoleStats {
  started: number;
  completed: number;
  completion: number | null;
  questions: Record<string, { answered: number; options: QuizOptionStat[] }>;
}

export interface QuizSummary {
  days: number;
  total: number;
  roles: { applicant: QuizRoleStats; company: QuizRoleStats };
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number | null;
  available: boolean;
  conversion: number | null;
}

export interface CandidateFunnel {
  window_days: number;
  steps: FunnelStep[];
}

export interface EmployerFunnel {
  window_days: number;
  steps: FunnelStep[];
  metrics: {
    hours_to_first_application: number | null;
    hours_to_first_qualified_application: number | null;
    avg_applications_per_vacancy: number | null;
    days_to_hire: number | null;
    hires: number;
    repeat_posting_rate: number | null;
  };
}

export interface FeedRow {
  id: number;
  name: string;
  email: string;
  registered_at: string;
  last_activity: string | null;
  channel: string | null;
  stage: string;
  stage_label: string;
  stuck_at: string | null;
  missing?: string[];
  company_id?: number | null;
  contact?: string;
}

export interface AbandonedDraft {
  vacancy_id: number;
  title: string;
  company_id: number;
  company: string;
  updated_at: string;
}

export interface Feed {
  hours: number;
  channel_tracked: boolean;
  count: number;
  results: FeedRow[];
  abandoned_drafts?: AbandonedDraft[];
}

export interface VacancyMonth {
  month: string;
  active_now: number;
  submitted: number;
  by_status: { active: number; draft: number; archived: number };
  on_moderation: number | null;
  blocked: number;
}

export interface AdminVacancy {
  id: number;
  title: string;
  company_id: number;
  company: string;
  city: string | null;
  country: string | null;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  created_at: string;
  applications: number | null;
  blocked: boolean;
  block_reason: string;
}

export interface Page<T> {
  count: number;
  limit: number;
  offset: number;
  results: T[];
}

export interface Trust {
  employers_verified: number;
  employers_total: number;
  employers_verified_pct: number | null;
  candidates_verified_pct: number | null;
}

export interface Revenue {
  available: boolean;
  last_24h: number | null;
  this_month: number | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  joined: string;
  last_login: string | null;
  company_id: number | null;
  company: string | null;
  company_verified: boolean | null;
}

export interface Manager {
  id: number;
  name: string;
  email: string;
  level: StaffLevel;
  is_superuser: boolean;
  added: string;
  last_login: string | null;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: number;
  subject: string;
  message: string;
  category: string;
  status: TicketStatus;
  user: string;
  email: string;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  at: string;
  actor: string | null;
  action: string;
  target_type: string;
  target_id: number | null;
  details: Record<string, unknown>;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export const adminApi = {
  me: () => http.get<StaffMe>(API.admin.me),
  overview: (query?: Query) => http.get<Overview>(API.admin.overview, { query }),
  candidateFunnel: (days: number) =>
    http.get<CandidateFunnel>(API.admin.candidateFunnel, { query: { days } }),
  employerFunnel: (days: number) =>
    http.get<EmployerFunnel>(API.admin.employerFunnel, { query: { days } }),
  quiz: (days: number) => http.get<QuizSummary>(API.admin.quiz, { query: { days } }),
  candidateFeed: (hours: number) => http.get<Feed>(API.admin.candidateFeed, { query: { hours } }),
  employerFeed: (hours: number) => http.get<Feed>(API.admin.employerFeed, { query: { hours } }),
  vacanciesMonth: (month?: string) =>
    http.get<VacancyMonth>(API.admin.vacanciesMonth, { query: { month } }),
  vacancies: (query: Query) => http.get<Page<AdminVacancy>>(API.admin.vacancies, { query }),
  blockVacancy: (id: number, reason: string) =>
    http.post<AdminVacancy>(API.admin.vacancyBlock(id), { reason }),
  unblockVacancy: (id: number) => http.post<AdminVacancy>(API.admin.vacancyUnblock(id)),
  revenue: () => http.get<Revenue>(API.admin.revenue),
  trust: () => http.get<Trust>(API.admin.trust),
  users: (query: Query) => http.get<Page<AdminUser>>(API.admin.users, { query }),
  verifyCompany: (id: number, verified: boolean) =>
    http.post<{ id: number; name: string; is_verified: boolean }>(API.admin.companyVerify(id), {
      verified,
    }),
  managers: () => http.get<{ results: Manager[] }>(API.admin.managers),
  addManager: (body: { email: string; level: StaffLevel; first_name?: string; last_name?: string }) =>
    http.post<Manager>(API.admin.managers, body),
  setManagerLevel: (id: number, level: StaffLevel) =>
    http.patch<Manager>(API.admin.manager(id), { level }),
  removeManager: (id: number) => http.delete<void>(API.admin.manager(id)),
  tickets: (query: Query) =>
    http.get<Page<Ticket> & { status_counts: Record<string, number> }>(API.admin.tickets, { query }),
  setTicketStatus: (id: number, status: TicketStatus) =>
    http.patch<Ticket>(API.admin.ticket(id), { status }),
  auditLog: (query: Query) => http.get<Page<AuditEntry>>(API.admin.auditLog, { query }),
};

/** Сообщение об ошибке из ответа бэкенда (detail или первая ошибка поля). */
export function errorText(e: unknown, fallback: string): string {
  const payload = (e as { payload?: unknown })?.payload;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.detail === 'string') return p.detail;
    const first = Object.values(p).flat()[0];
    if (typeof first === 'string') return first;
  }
  return fallback;
}

/* --- Ассистент: база знаний, вопросы без ответа, настройки ------------------ */

export interface KnowledgeDoc {
  id: number;
  title: string;
  chars: number;
  chunks: number;
  embedded: number;
  updated_at: string;
  content?: string;
  chunk_texts?: string[];
}

export interface UnansweredQuestion {
  id: number;
  text: string;
  asked_by: string | null;
  created_at: string;
  resolved: boolean;
}

export interface KnowledgeHit {
  id: number;
  document_id: number;
  title: string;
  text: string;
  score: number;
  method: 'vector' | 'keyword';
}

export interface SearchTest {
  query: string;
  knowledge: KnowledgeHit[];
  vacancies: { id: number; title: string; company: string; city: string; salary: string; score: number | null }[];
}

export interface AssistantSettings {
  active: boolean;
  extra_instructions: string;
  updated_at: string;
}

const K = '/api/admin/knowledge';

export const assistantAdminApi = {
  documents: () => http.get<{ results: KnowledgeDoc[] }>(`${K}/documents/`),
  document: (id: number) => http.get<KnowledgeDoc>(`${K}/documents/${id}/`),
  addDocument: (title: string, content: string) => http.post<KnowledgeDoc>(`${K}/documents/`, { title, content }),
  updateDocument: (id: number, title: string, content: string) =>
    http.put<KnowledgeDoc>(`${K}/documents/${id}/`, { title, content }),
  deleteDocument: (id: number) => http.delete<void>(`${K}/documents/${id}/`),
  reindex: (id: number) => http.post<KnowledgeDoc>(`${K}/documents/${id}/reindex/`),
  search: (q: string) => http.get<SearchTest>(`${K}/search/`, { query: { q } }),
  unanswered: (resolved: 'open' | 'all' | '1' = 'open') =>
    http.get<{ results: UnansweredQuestion[]; open: number }>(`${K}/unanswered/`, {
      query: { resolved: resolved === 'open' ? undefined : resolved },
    }),
  resolveQuestion: (id: number, resolved: boolean) =>
    http.patch<{ id: number; resolved: boolean }>(`${K}/unanswered/${id}/`, { resolved }),
  deleteQuestion: (id: number) => http.delete<void>(`${K}/unanswered/${id}/`),
  settings: () => http.get<AssistantSettings>(`${K}/settings/`),
  saveSettings: (active: boolean, extra_instructions: string) =>
    http.put<AssistantSettings>(`${K}/settings/`, { active, extra_instructions }),
};
