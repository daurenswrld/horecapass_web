import type { Answers } from '@/lib/professions';

/**
 * Хранилище демонстрационных разделов.
 *
 * Это разделы, которые заказчица просила переделать: профиль-резюме, анкета
 * по профессии, корзина кандидатов. Эндпоинтов под них на бэкенде нет, поэтому
 * данные лежат в браузере — показать замысел они позволяют, работать
 * по-настоящему нет.
 *
 * Каждый такой экран обязан нести плашку DemoNotice. Заказчица уже получала
 * демо, которое выглядело рабочим, и отдельно на это указала: «это не рабочий
 * сайт, где ты реально можешь что-то технически поделать». Второй раз выдавать
 * заглушку за функцию нельзя.
 */

const DRAFT_KEY = 'hp_demo_profile';
const BASKET_KEY = 'hp_demo_basket';
const scoped = (key: string, accountId?: number) => accountId ? `${key}:${accountId}` : key;

export interface ProfileDraft {
  professionId: string | null;
  answers: Answers;
  updatedAt: string;
}

const EMPTY: ProfileDraft = { professionId: null, answers: {}, updatedAt: '' };

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    // Форма могла измениться между версиями — не доверяем содержимому вслепую.
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим или переполнено — черновик не переживёт перезагрузку */
  }
}

/** Черновик анкеты. Станет GET/PUT /api/resumes/my/<id>/profession-profile/. */
export const profileDraft = {
  load(accountId?: number): ProfileDraft {
    const d = read<ProfileDraft>(scoped(DRAFT_KEY, accountId), EMPTY);
    return { professionId: d.professionId ?? null, answers: d.answers ?? {}, updatedAt: d.updatedAt ?? '' };
  },
  save(professionId: string | null, answers: Answers, accountId?: number): ProfileDraft {
    const next: ProfileDraft = { professionId, answers, updatedAt: new Date().toISOString() };
    write(scoped(DRAFT_KEY, accountId), next);
    return next;
  },
  clear(accountId?: number) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(scoped(DRAFT_KEY, accountId));
  },
};

/** Корзина кандидатов работодателя. Станет POST /api/applications/company/bulk/. */
export const basket = {
  load(): number[] {
    const v = read<number[]>(BASKET_KEY, []);
    return Array.isArray(v) ? v : [];
  },
  save(ids: number[]) {
    write(BASKET_KEY, ids);
  },
};

/**
 * Распознавание речи.
 * Станет POST /api/ai/transcribe/.
 *
 * Пока сервера нет — пробуем Web Speech API прямо в браузере. Он есть
 * в Chrome и Safari и решает задачу для показа, но не для продакшна:
 * в Firefox его нет, а в Chrome распознавание уходит в Google, что для
 * персональных данных кандидата не годится.
 */
export function speechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

const CONSENT_KEY = 'hp_demo_cv_consent';

/**
 * Согласие кандидата на публикацию резюме — заказчица 17.09: «перед
 * публикацией резюме он должен согласиться и именно рукой подписать, что
 * согласен, что его данные будут опубликованы на платформе в публичном
 * доступе: имя, номер телефона, почта и опыт работы». Станет
 * POST /api/resumes/my/<id>/publish-consent/.
 */
export interface CvConsent {
  agreed: boolean;
  signer: string;
  signature: string | null;
  signedAt: string | null;
}

export const EMPTY_CONSENT: CvConsent = { agreed: false, signer: '', signature: null, signedAt: null };

export const cvConsent = {
  load(accountId?: number): CvConsent {
    return { ...EMPTY_CONSENT, ...read<Partial<CvConsent>>(scoped(CONSENT_KEY, accountId), {}) };
  },
  save(value: CvConsent, accountId?: number) {
    write(scoped(CONSENT_KEY, accountId), value);
  },
  clear(accountId?: number) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(scoped(CONSENT_KEY, accountId));
  },
};

const BRAND_KEY = 'hp_demo_company_brand';

/** HR-бренд компании. Станет полями в /users/api/users/me/company/. */
export interface CompanyBrand {
  whoWeAre: string;
  whyUs: string;
  about: string;
  projects: string;
  achievements: string;
  offer: string[];
  culture: string;
  hiringSteps: string[];
}

export const EMPTY_BRAND: CompanyBrand = {
  whoWeAre: '',
  whyUs: '',
  about: '',
  projects: '',
  achievements: '',
  offer: [],
  culture: '',
  hiringSteps: [],
};

export const companyBrand = {
  load(): CompanyBrand {
    return { ...EMPTY_BRAND, ...read<Partial<CompanyBrand>>(BRAND_KEY, {}) };
  },
  save(value: CompanyBrand) {
    write(BRAND_KEY, value);
  },
};
