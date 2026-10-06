/**
 * Онбординг кандидата — демо по брифу кандидата (HorecaPass_Candidate_Brief_RU,
 * 21 стр., 22.09.2026, подготовила Olga Zvarych), пункты 1–8 и 12:
 *
 * Tell us where you're based → Create your CV or upload it → Preferred work
 * location → Smart-проверка профиля → предложение CV upgrade → согласие
 * с подписью → квалификация (8 вопросов, кухня пропускает) → видео-визитка.
 *
 * Бэкенда под это нет, поэтому черновик живёт в браузере и сохраняется после
 * каждого действия, как и онбординг работодателя. Каждый экран несёт DemoNotice.
 */

export type CStep =
  | 'based'
  | 'materials'
  | 'countries'
  | 'check'
  | 'upgrade'
  | 'consent'
  | 'qualification'
  | 'video'
  | 'done';

export const C_STEP_INDEX: Record<CStep, number> = {
  materials: 1,
  based: 2,
  countries: 3,
  check: 4,
  upgrade: 4,
  consent: 5,
  qualification: 6,
  video: 6,
  done: 6,
};
export const C_STEP_TOTAL = 6;
export const C_STEP_TITLE: Record<number, string> = {
  1: 'Your CV',
  2: 'Where you are based',
  3: 'Where you want to work',
  4: 'Profile check',
  5: 'Consent',
  6: 'Get Verified',
};

export const CERT_TYPES = ['HACCP', 'Food Safety', 'Bartending', 'Barista', 'Language', 'Other'] as const;

export interface CandidateDraft {
  step: CStep;
  nationality: string;
  location: string;
  cvFile: string | null;
  coverLetterFile: string | null;
  coverLetterText: string;
  certificates: { name: string; type: (typeof CERT_TYPES)[number] }[];
  portfolio: string[];
  countries: string[];
  /** Ответы на вопросы Smart-проверки; пропущенные просто отсутствуют. */
  check: Record<string, string>;
  checkDone: string[];
  upgrade: 'yes' | 'no' | null;
  role: string | null;
  /** Desired positions, including a candidate's own job title. */
  targetRoles: string[];
  years: number | null;
  /** Кандидат запросил квалификацию — вопросы генерирует сервер. */
  qualRequested: boolean;
  video: 'added' | 'later' | null;
  /** Резюме собрано в Smart CV builder и сохранено на сервере. */
  cvBuilt?: boolean;
  videoFile: string | null;
  references: string[];
  updatedAt: string;
}

export function emptyCandidate(): CandidateDraft {
  return {
    step: 'materials',
    nationality: '',
    location: '',
    cvFile: null,
    coverLetterFile: null,
    coverLetterText: '',
    certificates: [],
    portfolio: [],
    countries: [],
    check: {},
    checkDone: [],
    upgrade: null,
    role: null,
    targetRoles: [],
    years: null,
    qualRequested: false,
    video: null,
    videoFile: null,
    references: [],
    updatedAt: '',
  };
}

const KEY = 'hp_demo_candidate_onboarding';

export const candidateDraft = {
  load(accountId?: number): CandidateDraft {
    const base = emptyCandidate();
    if (typeof window === 'undefined') return base;
    try {
      const raw = window.localStorage.getItem(accountId ? `${KEY}:${accountId}` : KEY);
      if (!raw) return base;
      const d = JSON.parse(raw) as Partial<CandidateDraft>;
      return {
        ...base,
        ...d,
        targetRoles: Array.isArray(d.targetRoles) ? d.targetRoles.filter((r): r is string => typeof r === 'string' && !!r.trim()).slice(0, 10) : [],
        certificates: Array.isArray(d.certificates) ? d.certificates : [],
        portfolio: Array.isArray(d.portfolio) ? d.portfolio : [],
        countries: Array.isArray(d.countries) ? d.countries : [],
        references: Array.isArray(d.references) ? d.references : [],
        checkDone: Array.isArray(d.checkDone) ? d.checkDone : [],
        check: d.check && typeof d.check === 'object' ? d.check : {},
        step: d.step && d.step in C_STEP_INDEX ? d.step : 'materials',
      };
    } catch {
      return base;
    }
  },
  save(d: CandidateDraft, accountId?: number): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(accountId ? `${KEY}:${accountId}` : KEY, JSON.stringify({ ...d, updatedAt: new Date().toISOString() }));
      return true;
    } catch {
      return false;
    }
  },
  clear(accountId?: number) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(accountId ? `${KEY}:${accountId}` : KEY);
  },
};

/* Пункт 1 — национальность: автокомплит по полному списку ------------------------------ */

export const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan', 'Argentine', 'Armenian', 'Australian',
  'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean',
  'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Botswanan', 'Brazilian', 'British', 'Bruneian', 'Bulgarian', 'Burkinabe',
  'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African', 'Chadian', 'Chilean',
  'Chinese', 'Colombian', 'Comorian', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish',
  'Djiboutian', 'Dominican', 'Dutch', 'East Timorese', 'Ecuadorian', 'Egyptian', 'Emirati', 'Equatorial Guinean', 'Eritrean',
  'Estonian', 'Eswatini', 'Ethiopian', 'Fijian', 'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian',
  'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian',
  'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese',
  'Jordanian', 'Kazakh', 'Kenyan', 'Kiribati', 'Kosovar', 'Kuwaiti', 'Kyrgyz', 'Lao', 'Latvian', 'Lebanese', 'Liberian',
  'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourgish', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivian', 'Malian',
  'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan', 'Monegasque', 'Mongolian',
  'Montenegrin', 'Moroccan', 'Mozambican', 'Namibian', 'Nauruan', 'Nepali', 'New Zealander', 'Nicaraguan', 'Nigerian',
  'Nigerien', 'North Korean', 'North Macedonian', 'Norwegian', 'Omani', 'Pakistani', 'Palauan', 'Palestinian', 'Panamanian',
  'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan',
  'Saint Lucian', 'Salvadoran', 'Samoan', 'Sammarinese', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean',
  'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander', 'Somali', 'South African', 'South Korean', 'South Sudanese',
  'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian',
  'Thai', 'Togolese', 'Tongan', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Tuvaluan', 'Ugandan', 'Ukrainian',
  'Uruguayan', 'Uzbek', 'Vanuatuan', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
];

/** Совпадения с первого символа: сначала «начинается с», потом «содержит». */
export function matchNationality(q: string, limit = 7): string[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const starts = NATIONALITIES.filter((n) => n.toLowerCase().startsWith(s));
  const has = NATIONALITIES.filter((n) => !n.toLowerCase().startsWith(s) && n.toLowerCase().includes(s));
  return [...starts, ...has].slice(0, limit);
}

/* Пункт 3 — страны: множественный выбор -------------------------------------------------- */

export const GCC_COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];

/* Пункт 4 — Smart-проверка профиля ------------------------------------------------------- */

export interface Gap {
  key: string;
  question: string;
  suggestion: string;
}

/**
 * До 3–4 конкретных пробелов именно этого профиля (промт «Candidate Profile
 * Gap Assistant»), по одному вопросу; пропущенный вопрос тихо выпадает.
 * Правила вместо модели: смотрим на то, что кандидат уже дал в онбординге.
 */
export function profileGaps(d: CandidateDraft): Gap[] {
  const gaps: Gap[] = [];
  if (!d.certificates.length && !d.check.certs)
    gaps.push({ key: 'certs', question: 'What certifications do you have, if any?', suggestion: 'HACCP Level 2 and a barista course.' });
  if (d.years === null)
    gaps.push({
      key: 'years',
      question: "Can you tell me roughly how many years you've worked in this role?",
      suggestion: 'About 4 years.',
    });
  if (!d.check.languages) gaps.push({
    key: 'languages',
    question: 'Which languages do you speak, and how well?',
    suggestion: 'English fluent, Arabic conversational, Hindi native.',
  });
  if (!d.check.achievement) gaps.push({
    key: 'achievement',
    question: "What's one result from work you're proud of? A number helps — covers per shift, a rating, a team you trained.",
    suggestion: 'I served up to 120 covers a shift and trained 3 new waiters.',
  });
  return gaps.slice(0, 4);
}

export const CHECK_INTRO =
  "I looked at your profile — a few small additions could make it much stronger. Want to fix them together? Takes about 2 minutes.";

/* Пункт 8 — квалификация -------------------------------------------------------------------- */

/**
 * Роли, для которых есть квалификация (бриф кандидата, пункт 8). Сами вопросы
 * на вебе не хранятся: по брифу их генерирует Smart на сервере под роль
 * и уровень, чтобы их нельзя было выучить. Банк заказчицы — калибровочные
 * данные для сервера, в код сайта он намеренно не входит.
 */
export const QUALIFIED_ROLES = [
  'Waiter / Waitress',
  'Hostess',
  'Guest Relations / Reception',
  'Barista',
  'Bartender (with alcohol)',
  'Supervisor (F&B / Floor)',
  'Assistant Manager',
  'Floor Manager',
  'Restaurant Manager',
  'Operations Manager',
  'General Manager / Director',
];

/** Кухонная лестница: квалификацию не проходит — её закрывают портфолио и опыт. */
export const KITCHEN_ROLES = [
  'Commis Chef',
  'Demi Chef de Partie',
  'Chef de Partie',
  'Sous Chef',
  'Head Chef',
  'Chef de Cuisine',
  'Executive Chef',
];

export function isKitchen(role: string | null): boolean {
  return !!role && KITCHEN_ROLES.includes(role);
}

/** Годы из свободного ответа: «About 4 years», «5+», «six months». */
export function parseYears(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  if (m) return Math.round(Number(m[1].replace(',', '.')));
  if (/month|less than a year|no experience|first job/i.test(s)) return 0;
  return null;
}

/* Пункт 12 — прогресс профиля ------------------------------------------------------------------ */

export interface ProgressItem {
  key: string;
  label: string;
  done: boolean;
  weight: number;
  action: string;
}

/**
 * Прогресс готовности профиля — тот же расчёт в ленте вакансий и в профиле
 * (бриф кандидата, пункты 9 и 12), с конкретным следующим действием.
 */
export function profileProgress(d: CandidateDraft, consentSigned: boolean, qualificationComplete = false): { pct: number; next: ProgressItem | null; items: ProgressItem[] } {
  const items: ProgressItem[] = [
    { key: 'cv', label: 'Resume / CV', done: !!d.cvFile || !!d.cvBuilt, weight: 20, action: 'Upload or create your CV' },
    { key: 'based', label: 'Nationality and location', done: !!d.nationality && !!d.location, weight: 10, action: 'Tell us where you are based' },
    { key: 'countries', label: 'Where you want to work', done: d.countries.length > 0, weight: 10, action: 'Choose the countries you are open to' },
    { key: 'consent', label: 'Consent', done: consentSigned, weight: 15, action: 'Sign your consent so employers can see you' },
    {
      key: 'qualification',
      label: 'Qualification',
      done: isKitchen(d.role) && !(d.targetRoles ?? []).some((r) => !isKitchen(r)) || qualificationComplete,
      weight: 20,
      action: 'Complete your qualification answers',
    },
    { key: 'video', label: 'Video intro', done: d.video === 'added', weight: 10, action: 'Add your video introduction' },
    { key: 'certificates', label: 'Certificates', done: d.certificates.length > 0, weight: 5, action: 'Add your certificates' },
    { key: 'portfolio', label: 'Portfolio', done: d.portfolio.length > 0, weight: 5, action: 'Add photos of your work' },
    { key: 'references', label: 'References', done: d.references.length > 0, weight: 5, action: 'Add a reference from a past job' },
  ];
  const pct = Math.round(items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0));
  return { pct, next: items.find((i) => !i.done) ?? null, items };
}

/**
 * «Verified» выставляет сервер после 8 вопросов и видео-визитки (бриф,
 * пункт 12). В браузере его не выдаём — только «ждёт проверки».
 */
export function qualificationStatus(d: CandidateDraft): 'not-started' | 'not-needed' | 'pending' {
  if (isKitchen(d.role)) return 'not-needed';
  return d.qualRequested ? 'pending' : 'not-started';
}
