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
  load(): ProfileDraft {
    const d = read<ProfileDraft>(DRAFT_KEY, EMPTY);
    return { professionId: d.professionId ?? null, answers: d.answers ?? {}, updatedAt: d.updatedAt ?? '' };
  },
  save(professionId: string | null, answers: Answers): ProfileDraft {
    const next: ProfileDraft = { professionId, answers, updatedAt: new Date().toISOString() };
    write(DRAFT_KEY, next);
    return next;
  },
  clear() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_KEY);
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
