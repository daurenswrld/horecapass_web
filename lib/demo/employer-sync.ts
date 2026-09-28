/**
 * Сохранение онбординга работодателя на настоящий сервер.
 *
 * Черновик по-прежнему автосохраняется в браузере после каждого действия
 * (бриф, пункт 7). Когда пользователь вошёл по-настоящему (не демо), то,
 * что на сервере уже можно хранить, дополнительно уходит туда:
 *   • профиль компании — PATCH /users/api/users/me/company/;
 *   • вакансия — черновиком (status DRAFT) на /api/vacancies/my/.
 * Публикация остаётся за работодателем: вакансия становится видна
 * кандидатам только после оплаты (бриф, пункт 14), а оплата не подключена.
 *
 * Чего на сервере пока нет и что остаётся в браузере: загрузка фото
 * заведения, PDF, подпись соглашения и лицензия.
 */

import { companyApi, dataUrlToFile, type CompanyProfile } from '@/lib/api/company';
import { tokens } from '@/lib/api/client';
import { vacanciesApi } from '@/lib/api/vacancies';
import { demoSession } from './session';
import {
  benefitChips,
  scheduleLine,
  vacancyText,
  type CompanyDraft,
  type EmployerDraft,
} from './employer';

/** Настоящая сессия: есть токен и это не демо-вход. */
export function canSyncToServer(): boolean {
  return typeof window !== 'undefined' && !demoSession.get() && !!tokens.access;
}

const url = (v: string) => {
  const s = v.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

/** Поля компании в формате сервера. */
export function companyPayload(c: CompanyDraft, project: string[]) {
  return {
    name: c.name.trim(),
    description: c.about.trim(),
    address: c.city.trim() || null,
    phone_number: c.phone.trim() || null,
    email: c.email.trim() || null,
    website: url(c.website),
    linkedin: url(c.linkedin),
    whatsapp: c.whatsapp.trim() || null,
    size: c.size,
    is_pre_opening: c.preOpening,
    pre_opening_answers: c.preOpening ? project : [],
    hide_name: c.hideName,
  };
}

/** Логотип отправляем, только если он сменился — это файл, а не поле. */
let lastLogo: string | null = null;

export async function saveCompany(d: EmployerDraft): Promise<CompanyProfile> {
  const saved = await companyApi.patch(companyPayload(d.company, d.project));
  if (d.company.logo && d.company.logo !== lastLogo) {
    const fd = new FormData();
    fd.set('logo', await dataUrlToFile(d.company.logo, 'logo.jpg'));
    await companyApi.patch(fd);
    lastLogo = d.company.logo;
  }
  return saved;
}

/** Вакансия черновиком. Возвращает её id на сервере. */
export async function saveVacancyDraft(d: EmployerDraft): Promise<number> {
  const v = d.vacancy;
  const opening = d.company.preOpening ? d.project[3] : undefined;
  const payload = {
    title: v.title ?? 'Open role',
    description: vacancyText(v, d.company, opening),
    salary_min: v.salaryMin,
    salary_max: v.salaryMax,
    currency: v.currency ?? 'AED',
    salary_type: v.salaryBasis === 'interview' ? 'Based on interview performance' : v.salaryBasis === 'experience' ? 'Depends on experience' : null,
    city: v.city,
    address: v.city,
    employment_type: v.employment,
    schedule: scheduleLine(v),
    hours: v.shiftHours,
    requirements: [v.experience, v.language].filter(Boolean).join('\n') || null,
    benefits: benefitChips(v),
    responsibilities: v.responsibilities,
    hiring_steps: v.hiringSteps,
    status: 'DRAFT',
  };
  const saved = d.serverVacancyId
    ? await vacanciesApi.update(d.serverVacancyId, payload)
    : await vacanciesApi.create(payload);
  return saved.id;
}

/** Текст ошибки сервера для строки «не сохранено». */
export function syncError(e: unknown): string {
  const p = (e as { payload?: unknown })?.payload;
  if (p && typeof p === 'object') {
    const first = Object.entries(p as Record<string, unknown>)[0];
    if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(', ') : String(first[1])}`;
  }
  return 'the server did not respond';
}
