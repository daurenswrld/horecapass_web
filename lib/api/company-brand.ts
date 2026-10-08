import { API } from './endpoints';
import { http } from './client';
import { EMPTY_BRAND, type CompanyBrand } from '@/lib/demo/storage';

/**
 * HR-бренд компании: то, что кандидат читает перед откликом. Живёт на сервере
 * (`brand` у компании, PATCH /users/api/users/me/company/), а кандидат получает
 * его вместе с вакансией (`company_brand`).
 */

type Json = Record<string, unknown>;

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []);

export function parseBrand(json: unknown): CompanyBrand {
  const j = (json && typeof json === 'object' ? json : {}) as Json;
  return {
    ...EMPTY_BRAND,
    whoWeAre: text(j.who_we_are),
    whyUs: text(j.why_us),
    about: text(j.about),
    projects: text(j.projects),
    achievements: text(j.achievements),
    culture: text(j.culture),
    offer: list(j.offer),
    hiringSteps: list(j.hiring_steps),
  };
}

export function brandToServer(b: CompanyBrand) {
  return {
    who_we_are: b.whoWeAre,
    why_us: b.whyUs,
    about: b.about,
    projects: b.projects,
    achievements: b.achievements,
    culture: b.culture,
    offer: b.offer,
    hiring_steps: b.hiringSteps,
  };
}

export function brandIsEmpty(b: CompanyBrand): boolean {
  return (
    !b.whoWeAre.trim() &&
    !b.whyUs.trim() &&
    !b.about.trim() &&
    !b.projects.trim() &&
    !b.achievements.trim() &&
    !b.culture.trim() &&
    b.offer.length === 0 &&
    b.hiringSteps.length === 0
  );
}

/**
 * Сервер без поддержки `brand` не ругается, а молча пропускает неизвестное поле. Тогда ответ
 * приходит без `brand`, и «Saved» было бы враньём (веб на Vercel может выйти раньше бэкенда).
 */
export class BrandNotSupportedError extends Error {}

export const companyBrandApi = {
  async load(): Promise<CompanyBrand> {
    const d = await http.get<Json>(API.company.mine);
    if (!('brand' in d)) throw new BrandNotSupportedError();
    return parseBrand(d.brand);
  },
  async save(b: CompanyBrand): Promise<CompanyBrand> {
    const d = await http.patch<Json>(API.company.mine, { brand: brandToServer(b) });
    if (!('brand' in d)) throw new BrandNotSupportedError();
    return parseBrand(d.brand);
  },
};
