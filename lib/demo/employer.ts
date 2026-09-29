/**
 * Онбординг работодателя — демо.
 *
 * Флоу из утверждённого редизайна (Figma, экраны 22–31) и брифа заказчицы
 * (17-страничная версия от 15.09, пункты 4–14):
 * мостик → Setup your company → Complete your company profile → мостик →
 * (pre-opening: разговор о проекте) → Create your first vacancy → Smart
 * vacancy → детали (What you offer / Responsibilities / Hiring process) →
 * Vacancy preview + Smart vacancy review → Company profile preview →
 * Agreement & Policies → оплата (пейволл, пункт 14) → готово.
 *
 * Бэкенда под это нет: ни полей HR-бренда у компании, ни AI-разбора сайта,
 * ни хранения соглашений и подписи. Поэтому весь черновик живёт в браузере
 * и сохраняется после каждого действия — бриф требует автосохранения
 * («при возврате продолжить с того же места»). Каждый экран несёт DemoNotice
 * с тем, какой эндпоинт нужен.
 *
 * Правила письма вакансии — из «HorecaPass Vacancy Prompt» заказчицы:
 * спрашивать только недостающее и сразу называть, сколько вопросов;
 * ничего не выдумывать; ключевые поля не опускать молча, а писать
 * «To be confirmed»; чаевые и прочие «обогащающие» — опускать, если ответа
 * нет; отсутствие страховки — только по явному согласию работодателя;
 * вместо национальности — требование к языку.
 */

export type Step =
  | 'intro'
  | 'company'
  | 'sources'
  | 'bridge'
  | 'project'
  | 'vacancy-intro'
  | 'vacancy'
  | 'vacancy-details'
  | 'vacancy-preview'
  | 'company-preview'
  | 'agreement'
  | 'payment'
  | 'done';

/** Номер шага для «Step X of Y». Мостики — не шаги, они часть соседнего. */
export const STEP_INDEX: Record<Step, number> = {
  intro: 1,
  company: 1,
  sources: 2,
  bridge: 2,
  project: 2,
  'vacancy-intro': 3,
  vacancy: 3,
  'vacancy-details': 3,
  'vacancy-preview': 4,
  'company-preview': 4,
  agreement: 5,
  payment: 6,
  done: 6,
};
export const STEP_TOTAL = 6;
export const STEP_TITLE: Record<number, string> = {
  1: 'Your company',
  2: 'Company profile',
  3: 'First vacancy',
  4: 'Preview',
  5: 'Agreement',
  6: 'Publish',
};

export interface ChatMessage {
  id: string;
  from: 'assistant' | 'user';
  text: string;
  /** Карточка «Draft ready» в конце разговора о вакансии. */
  draft?: boolean;
  /** Файл, приложенный к сообщению (хранится только имя). */
  file?: string;
}

export interface CompanyDraft {
  name: string;
  website: string;
  about: string;
  /** Текст «About» пришёл из черновика, а не написан руками. */
  aboutDrafted: boolean;
  size: string | null;
  /** Уменьшенный логотип как data URL — в localStorage места мало. */
  logo: string | null;
  hideName: boolean;
  /** Встреча 15.09: «нужно взять email, телефон, WhatsApp». */
  phone: string;
  whatsapp: string;
  email: string;
  linkedin: string;
  pdfName: string | null;
  manual: string;
  preOpening: boolean;
  city: string;
  /** Фото заведения и жилья для сотрудников — бриф, пункт 13.1 и 13.9. */
  photos: string[];
}

export interface VacancyDraft {
  title: string | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryBasis: 'fixed' | 'experience' | 'interview' | null;
  /** Бриф, пункт 9: основное деление — Permanent или Part-time. */
  employment: 'Permanent' | 'Part-time' | null;
  /** Для Permanent: офисная/административная роль — 5/2, иначе 6/1. */
  adminRole: boolean | null;
  partTimeDays: string[];
  shiftHours: string | null;
  accommodation: boolean | null;
  meals: boolean | null;
  transport: boolean | null;
  visa: boolean | null;
  insurance: boolean | null;
  /** Показывать ли «insurance not provided» — только по согласию работодателя. */
  showNoInsurance: boolean;
  joiningTicket: boolean | null;
  tips: boolean | null;
  experience: string | null;
  start: string | null;
  /** Работодатель назвал национальность — уточняем, не о языке ли речь. */
  mentionsNationality: boolean;
  language: string | null;
  perks: string[];
  customOffers: string[];
  responsibilities: string[];
  /** 'employer' — из его слов; 'suggested' — по названию должности, требует проверки. */
  responsibilitiesSource: 'employer' | 'suggested' | null;
  hiringSteps: string[];
  /** Бриф, пункт 12: «Prefer an English video intro» — пожелание, не фильтр. */
  preferVideoIntro: boolean;
  /** Файл job description прикладывается к вакансии, а не переписывается. */
  jdFile: string | null;
}

export interface AgreementDraft {
  terms: boolean;
  marketing: boolean;
  signer: string;
  position: string;
  signature: string | null;
  licenseName: string | null;
  submittedAt: string | null;
}

export type NextTurn =
  | { kind: 'text'; key: string; text: string; suggestion?: string }
  | { kind: 'single'; key: string; text: string; options: string[] }
  | { kind: 'multi'; key: string; text: string; options: string[] }
  | { kind: 'draft' };

export interface EmployerDraft {
  step: Step;
  company: CompanyDraft;
  project: string[];
  vacancyChat: ChatMessage[];
  /** Вопрос, на который ассистент сейчас ждёт ответа. */
  turn: NextTurn | null;
  /** Какие уточнения ассистент уже задал — чтобы не спрашивать по кругу. */
  asked: string[];
  vacancy: VacancyDraft;
  agreement: AgreementDraft;
  plan: string | null;
  /** id черновика вакансии на сервере — чтобы обновлять его, а не плодить новые. */
  serverVacancyId: number | null;
  updatedAt: string;
}

export const EMPTY_VACANCY: VacancyDraft = {
  title: null,
  city: null,
  salaryMin: null,
  salaryMax: null,
  currency: null,
  salaryBasis: null,
  employment: null,
  adminRole: null,
  partTimeDays: [],
  shiftHours: null,
  accommodation: null,
  meals: null,
  transport: null,
  visa: null,
  insurance: null,
  showNoInsurance: false,
  joiningTicket: null,
  tips: null,
  experience: null,
  start: null,
  mentionsNationality: false,
  language: null,
  perks: [],
  customOffers: [],
  responsibilities: [],
  responsibilitiesSource: null,
  hiringSteps: [],
  preferVideoIntro: false,
  jdFile: null,
};

export function emptyDraft(): EmployerDraft {
  return {
    step: 'intro',
    company: {
      name: '',
      website: '',
      about: '',
      aboutDrafted: false,
      size: null,
      logo: null,
      hideName: false,
      phone: '',
      whatsapp: '',
      email: '',
      linkedin: '',
      pdfName: null,
      manual: '',
      preOpening: false,
      city: '',
      photos: [],
    },
    project: [],
    vacancyChat: [],
    turn: null,
    asked: [],
    vacancy: { ...EMPTY_VACANCY },
    agreement: {
      terms: false,
      marketing: false,
      signer: '',
      position: '',
      signature: null,
      licenseName: null,
      submittedAt: null,
    },
    plan: null,
    serverVacancyId: null,
    updatedAt: '',
  };
}

/* Хранилище ------------------------------------------------------------------ */

const KEY = 'hp_demo_employer_onboarding';

export const employerDraft = {
  load(): EmployerDraft {
    const base = emptyDraft();
    if (typeof window === 'undefined') return base;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return base;
      const d = JSON.parse(raw) as Partial<EmployerDraft>;
      // Форма черновика может поменяться между версиями — сливаем с пустым,
      // а не доверяем сохранённому целиком.
      return {
        ...base,
        ...d,
        company: { ...base.company, ...d.company },
        vacancy: { ...base.vacancy, ...d.vacancy },
        agreement: { ...base.agreement, ...d.agreement },
        project: Array.isArray(d.project) ? d.project : [],
        vacancyChat: Array.isArray(d.vacancyChat) ? d.vacancyChat : [],
        asked: Array.isArray(d.asked) ? d.asked : [],
        step: d.step && d.step in STEP_INDEX ? d.step : 'intro',
      };
    } catch {
      return base;
    }
  },
  /** false — браузер отказал (приватный режим, переполнено). */
  save(d: EmployerDraft): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...d, updatedAt: new Date().toISOString() }));
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  },
  /** Начат ли, но не закончен онбординг — для приглашения на экране Jobs. */
  status(): 'none' | 'started' | 'done' {
    const d = employerDraft.load();
    if (d.step === 'done') return 'done';
    return d.updatedAt ? 'started' : 'none';
  },
};

/* Изображения ------------------------------------------------------------------ */

/**
 * Уменьшает картинку до `max` по длинной стороне и отдаёт data URL.
 * Оригинал с телефона весит мегабайты и в localStorage не поместится.
 */
export function shrinkImage(file: File, max: number, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}

/* Черновик описания компании ------------------------------------------------------ */

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

/**
 * Образец текста «About» вместо настоящего разбора сайта.
 * Настоящий — POST /api/ai/company-brand/draft/ (ссылка → текст). Экран
 * прямо пишет, что это образец. Фактов о компании не выдумывает: только
 * то, что работодатель уже ввёл.
 */
export function sampleAbout(c: CompanyDraft): string {
  // Без названия — «We are», а не «We is».
  const who = c.name.trim() ? `${c.name.trim()} is` : 'We are';
  const where = c.city.trim() ? ` in ${c.city.trim()}` : '';
  const size = c.size ? ` with a team of ${c.size} people` : '';
  return `${who} a hospitality business${where}${size}. Tell candidates what a day here is like, what you offer, and why people stay.`;
}

/* Разговор о pre-opening проекте ---------------------------------------------------- */

/** Вступление — из HR Brand Prompts v2, Prompt 2. */
export const PROJECT_INTRO = "I have 7 quick questions to help build your project's profile for candidates.";

/** Вопросы — дословно из брифа (пункт 6). */
export const PROJECT_QUESTIONS = [
  'Who is the managing or operating company behind this project?',
  "What's the concept — luxury resort, boutique hotel, fine dining, casual F&B?",
  'Where is it located?',
  'When is the planned opening?',
  'Tell us about this project — what makes it exciting or different?',
  "Who's behind it? Founders, group, ownership story.",
  "What's the story so far — why this project, why now?",
];

/** Подсказки «Suggest reply» — первые два ответа взяты из макета. */
export const PROJECT_SUGGESTIONS = [
  'Steppe Hospitality Group, independent operator.',
  'Boutique hotel, 60 rooms, with a rooftop restaurant.',
  'Dubai Marina.',
  'Spring 2027.',
  'A rooftop with the best sunset view in the Marina and a chef-led restaurant.',
  'A group of hoteliers with 20 years in the GCC.',
  'The Marina lacks small hotels with character. We want to be the one people come back to.',
];

/**
 * Черновик HR-портрета проекта из ответов — склейка, а не генерация.
 * Промт: культуру честно подавать как «команду, которая собирается с нуля».
 */
export function projectStory(answers: string[]): string {
  const [operator, concept, location, opening, exciting, behind, story] = answers.map((a) => a?.trim() ?? '');
  const parts = [
    concept && `${concept.replace(/\.$/, '')}${location ? ` in ${location.replace(/\.$/, '')}` : ''}${opening ? `, opening ${opening.replace(/\.$/, '')}` : ''}.`,
    operator && `Operated by ${operator.replace(/\.$/, '')}.`,
    exciting,
    behind,
    story,
    'The team is being built from scratch — join at the start and grow with the project.',
  ].filter(Boolean);
  return parts.join(' ');
}

/* Разбор описания вакансии ---------------------------------------------------------- */

const ROLES = [
  'banquet supervisor',
  'restaurant manager',
  'assistant manager',
  'f&b manager',
  'guest relations agent',
  'guest relations',
  'front office agent',
  'chef de partie',
  'executive chef',
  'sous chef',
  'pastry chef',
  'commis chef',
  'head waiter',
  'bartender',
  'barista',
  'waitress',
  'waiter',
  'hostess',
  'host',
  'receptionist',
  'housekeeper',
  'room attendant',
  'supervisor',
  'cook',
  'chef',
  'steward',
  'cashier',
  'manager',
];

const CITIES = [
  'Dubai Marina',
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Al Ain',
  'Riyadh',
  'Jeddah',
  'Dammam',
  'Al Khobar',
  'Mecca',
  'Medina',
  'NEOM',
  'AlUla',
  'Doha',
  'Lusail',
  'Kuwait City',
  'Kuwait',
  'Manama',
  'Muscat',
  'Salalah',
];

const CURRENCY: Record<string, string> = {
  aed: 'AED',
  dirham: 'AED',
  dirhams: 'AED',
  sar: 'SAR',
  riyal: 'SAR',
  riyals: 'SAR',
  qar: 'QAR',
  kwd: 'KWD',
  bhd: 'BHD',
  omr: 'OMR',
  usd: 'USD',
  $: 'USD',
};

/** Слова о происхождении кандидата — повод спросить про язык (заметка к Vacancy Prompt). */
const NATIONALITY = /\b(filipino|filipina|philippin\w*|indian|nepali|nepalese|pakistani|bangladeshi|sri lankan|kenyan|ugandan|egyptian|lebanese|arab|european|russian|kazakh|uzbek|african|asian)s?\b/i;
const LANGUAGES = ['Arabic', 'English', 'Tagalog', 'Hindi', 'Urdu', 'Russian', 'French', 'Italian', 'Mandarin', 'Nepali'];

const title = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bF&b\b/, 'F&B');

function toNumber(raw: string, k?: string): number {
  const n = Number(raw.replace(/[\s,]/g, ''));
  return k ? n * 1000 : n;
}

/** Есть ли в той же части фразы отрицание: «no transport», «visa not included». */
function flag(text: string, re: RegExp): boolean | null {
  for (const clause of text.split(/[.;,\n]|\band\b|\bbut\b/i)) {
    if (re.test(clause)) return !/\b(no|not|without|isn'?t|aren'?t|excluded)\b/i.test(clause);
  }
  return null;
}

/**
 * Достаёт из свободного текста то, что получилось, и дописывает к черновику.
 * Уже известное не затирается пустым: следующий ответ только уточняет.
 */
export function parseVacancy(text: string, prev: VacancyDraft): VacancyDraft {
  const t = ` ${text} `;
  const low = t.toLowerCase();
  const next: VacancyDraft = { ...prev, perks: [...prev.perks] };

  if (!next.title) {
    const role = ROLES.find((r) => low.includes(` ${r}`));
    if (role) next.title = title(role);
  }

  const city = CITIES.find((c) => low.includes(c.toLowerCase()));
  if (city) next.city = city;

  const money =
    t.match(/(\d[\d,\s]*\d|\d)\s*(k)?\s*(?:[-–—]|to)\s*(\d[\d,\s]*\d|\d)\s*(k)?\s*(aed|sar|qar|kwd|bhd|omr|usd|dirhams?|riyals?)/i) ??
    t.match(/(aed|sar|qar|kwd|bhd|omr|usd|\$)\s*(\d[\d,\s]*\d|\d)\s*(k)?(?:\s*(?:[-–—]|to)\s*(\d[\d,\s]*\d|\d)\s*(k)?)?/i) ??
    t.match(/(\d[\d,\s]*\d|\d)\s*(k)?\s*(aed|sar|qar|kwd|bhd|omr|usd|dirhams?|riyals?)/i) ??
    // Без валюты: «salary around 6000-8000» — валюту спросим/поставим по умолчанию.
    t.match(/salary\D{0,20}?(\d[\d,]*\d|\d)\s*(k)?(?:\s*(?:[-–—]|to)\s*(\d[\d,]*\d|\d)\s*(k)?)?/i);
  if (money) {
    const cur = money.slice(1).find((g) => g && CURRENCY[g.toLowerCase()]);
    const nums = money
      .slice(1)
      .map((g, i, all) => (g && /^\d/.test(g) ? toNumber(g, all[i + 1]?.toLowerCase() === 'k' ? 'k' : undefined) : null))
      .filter((n): n is number => n !== null);
    if (nums.length) {
      next.salaryMin = Math.min(...nums);
      // Фиксированная сумма остаётся одним числом — бриф, пункт 13.2.
      next.salaryMax = nums.length > 1 && Math.max(...nums) !== next.salaryMin ? Math.max(...nums) : null;
      next.salaryBasis = next.salaryBasis ?? 'fixed';
    }
    if (cur) next.currency = CURRENCY[cur.toLowerCase()];
  }
  if (/depend\w* on (the )?experience|based on experience|\bdoe\b/i.test(t)) next.salaryBasis = 'experience';
  if (/interview performance|based on (the )?interview|negotiable|not (fixed|specified)|to be discussed/i.test(t))
    next.salaryBasis = 'interview';

  if (/part[- ]?time/i.test(t)) next.employment = 'Part-time';
  else if (/full[- ]?time|permanent/i.test(t)) next.employment = 'Permanent';

  // «6 days a week» или «6/1» для Permanent — это обычная шестидневка.
  if (/\b6\s*days?\s*(a|per|\/)\s*week\b|\b6\s*\/\s*1\b/i.test(t)) {
    next.employment ??= 'Permanent';
    next.adminRole ??= false;
  }
  if (/\b5\s*days?\s*(a|per|\/)\s*week\b|\b5\s*\/\s*2\b|office[- ]based|admin(istrative)? role/i.test(t)) {
    next.employment ??= 'Permanent';
    next.adminRole ??= true;
  }

  const pairs: [keyof VacancyDraft, RegExp][] = [
    // Не «room»: «60 rooms» — про отель, а не про жильё сотрудника.
    ['accommodation', /accommodation|housing/i],
    ['meals', /meals?|\bfood\b/i],
    ['transport', /transport(ation)?|\bbus\b|pick[- ]?up/i],
    ['visa', /\bvisa\b/i],
    ['insurance', /insurance|medical/i],
    ['joiningTicket', /joining ticket|flights?|air ?tickets?|\btickets?\b/i],
    ['tips', /\btips?\b|gratuit/i],
  ];
  for (const [key, re] of pairs) {
    const v = flag(t, re);
    if (v !== null) (next[key] as boolean | null) = v;
  }
  if (/\b(both|all)( are)? (included|provided|yes)\b|\byes,? both\b/i.test(t)) {
    next.transport ??= true;
    next.visa ??= true;
  }

  const years = t.match(/(\d+)\+?\s*years?/i);
  if (years) next.experience = `${years[1]}+ years in a similar role`;
  if (/no (prior )?experience|entry[- ]level/i.test(t)) next.experience = 'Entry-level welcome, no prior experience required';

  if (/immediate|asap|urgent|right away/i.test(t)) next.start = 'Immediate / urgent hire';
  else {
    const start = t.match(/\b(?:start(?:ing)?|from)\s+((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{1,2})?|next month|\d{1,2}\s+\w+)/i);
    if (start) next.start = title(start[1]);
  }

  if (NATIONALITY.test(t)) next.mentionsNationality = true;
  const langs = LANGUAGES.filter((l) => new RegExp(`\\b${l}\\b`, 'i').test(t));
  if (langs.length) next.language = `${langs.join(' / ')} speaking preferred`;

  return next;
}

/* Сценарий ассистента ------------------------------------------------------------------ */

export const VACANCY_GREETING =
  "Tell me about the role — type it, speak it, or upload a job description. I'll draft the vacancy for you.";

/** Пример первого сообщения — из макета «Smart vacancy». */
export const VACANCY_FIRST_SUGGESTION =
  'Need a banquet supervisor, full time, 6 days a week. Accommodation and meals included, salary around 6000–8000 AED.';

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Нематериальное — бриф, пункт 7: AI должен собирать не только зарплату,
 * но и обучение, тимбилдинги, staff parties, Employee of the month, бонусы,
 * карьерный рост — «то, что часто решает выбор не меньше цифры».
 */
export const PERK_OPTIONS = [
  'Training',
  'Career growth',
  'Team building',
  'Staff parties',
  'Employee of the month',
  'Bonuses',
  'Uniform',
];

/** Вопросы по порядку. Каждый задаётся один раз — если ответ не разобрался, идём дальше. */
function plan(v: VacancyDraft, was: (k: string) => boolean): NextTurn[] {
  const turns: NextTurn[] = [];

  const basics: [string, string, string][] = [];
  if (!v.title && !was('title')) basics.push(['title', '— What is the position called?', 'Banquet supervisor.']);
  if (!v.city && !was('city')) basics.push(['city', '— Where is the job located?', 'Dubai Marina.']);
  if (v.salaryMin === null && v.salaryBasis !== 'interview' && !was('salary'))
    basics.push(['salary', '— What is the salary — a range or a fixed amount?', 'Salary is 6000–8000 AED depending on experience.']);
  if (basics.length)
    turns.push({
      kind: 'text',
      key: basics.map((b) => b[0]).join('+'),
      text: basics.map((b) => b[1]).join('\n'),
      suggestion: basics.map((b) => b[2]).slice(0, 2).join(' '),
    });

  if (!v.employment && !was('employment'))
    turns.push({ kind: 'single', key: 'employment', text: 'Is this a permanent or a part-time role?', options: ['Permanent', 'Part-time'] });

  // Голосовое 15.09: «на Ближнем Востоке по закону шестидневка с одним
  // выходным; у офисных — 5/2; вместо Flexible — Part-time с днями и временем».
  if (v.employment === 'Permanent' && v.adminRole === null && !was('admin'))
    turns.push({
      kind: 'single',
      key: 'admin',
      text: "Permanent roles in hospitality are usually 6 days a week, 1 day off — I've set that as the standard. Is this an office-based / admin role instead?",
      options: ['No — 6 days / 1 day off', 'Yes — 5 days / 2 days off'],
    });
  if (v.employment === 'Part-time' && !v.partTimeDays.length && !was('days'))
    turns.push({ kind: 'multi', key: 'days', text: 'Which days do you need them?', options: WEEK_DAYS });
  if (v.employment === 'Part-time' && !v.shiftHours && !was('hours'))
    turns.push({ kind: 'text', key: 'hours', text: 'And what time does the shift start and end?', suggestion: '18:00 to 23:00.' });

  if (v.mentionsNationality && !v.language && !was('language'))
    turns.push({
      kind: 'text',
      key: 'language',
      text: "Is the real need a language? For example, should the candidate speak Arabic, Tagalog or Hindi? We list language requirements in the vacancy, not nationalities.",
      suggestion: 'Yes — Arabic speaking preferred.',
    });

  if (!v.experience && !was('experience'))
    turns.push({ kind: 'text', key: 'experience', text: 'What experience do you need for this role?', suggestion: 'At least 2 years in a similar role.' });

  // Встреча 15.09: «зарплата, жильё, питание, страховка, билеты».
  const benefits = [
    (v.accommodation === null || v.meals === null) && ['— Are accommodation and meals provided?', 'Accommodation and meals are provided.'],
    (v.transport === null || v.visa === null) && ['— Is transport or a visa included?', 'Transport and visa are included.'],
    // Спрашиваем только то, чего не знаем: про страховку уже могли сказать.
    v.insurance === null && v.joiningTicket === null && [
      '— Any health insurance? And if you hire from abroad, is a joining ticket covered?',
      'Health insurance too, and a joining ticket.',
    ],
    v.insurance === null && v.joiningTicket !== null && ['— Any health insurance for this role?', 'Health insurance is provided.'],
    v.insurance !== null && v.joiningTicket === null && [
      '— If you hire from abroad, is a joining ticket covered?',
      'Yes, a joining ticket is covered.',
    ],
  ].filter(Boolean) as [string, string][];
  if (benefits.length && !was('benefits'))
    turns.push({ kind: 'text', key: 'benefits', text: benefits.map((b) => b[0]).join('\n'), suggestion: benefits.map((b) => b[1]).join(' ') });

  if (v.insurance === false && !was('insurance-show'))
    turns.push({
      kind: 'single',
      key: 'insurance-show',
      text: "Noted — no health insurance. Should the listing say so? Some employers prefer to be upfront; otherwise I'll leave it out.",
      options: ['Yes, say it', 'No, leave it out'],
    });

  if (!was('perks'))
    turns.push({
      kind: 'multi',
      key: 'perks',
      text: 'Candidates choose on more than salary. What else makes it a good place to work? Pick anything that applies.',
      options: PERK_OPTIONS,
    });

  return turns;
}

/**
 * Что спросить дальше. Уточнения — разговорным тоном (бриф, пункт 8),
 * и в первом же уточнении ассистент говорит, сколько их всего (Vacancy
 * Prompt, шаг 2: «I just need [N] more details to finish this posting»).
 */
export function nextTurn(v: VacancyDraft, asked: string[]): NextTurn {
  const was = (k: string) => asked.includes(k);
  const turns = plan(v, was);
  if (!turns.length) return { kind: 'draft' };
  const first = turns[0];
  if (first.kind === 'draft') return first;
  const intro = asked.length === 0
    ? `Got it — I just need ${turns.length} more ${turns.length === 1 ? 'detail' : 'details'} to finish this posting.\n`
    : 'Got it. ';
  return { ...first, text: `${intro}${first.text}` };
}

/** Применяет ответ на вопрос с вариантами к черновику. */
export function applyChoice(v: VacancyDraft, key: string, answer: string): VacancyDraft {
  switch (key) {
    case 'employment':
      return { ...v, employment: answer === 'Part-time' ? 'Part-time' : 'Permanent' };
    case 'admin':
      return { ...v, adminRole: answer.startsWith('Yes') };
    case 'days':
      return { ...v, partTimeDays: WEEK_DAYS.filter((d) => answer.includes(d)) };
    case 'insurance-show':
      return { ...v, showNoInsurance: answer.startsWith('Yes') };
    case 'perks':
      return { ...v, perks: answer.split(',').map((s) => s.trim()).filter((s) => PERK_OPTIONS.includes(s)) };
    default:
      return v;
  }
}

/* Обязанности --------------------------------------------------------------------------- */

/**
 * Стартовый список обязанностей по должности — третий, самый слабый источник
 * из промта «Responsibilities» (бриф, пункт 11): только когда нет ни файла
 * job description, ни обязанностей в словах работодателя. На экране он
 * помечен как предложение, которое нужно проверить перед публикацией.
 */
const RESPONSIBILITIES: Record<string, string[]> = {
  waiter: [
    'Take orders and serve food and drinks to the venue’s standard.',
    'Know the menu well enough to recommend dishes and pairings.',
    'Set up and reset tables between seatings.',
    'Handle bills and payments at the table.',
  ],
  supervisor: [
    'Run the floor during the shift and brief the team before service.',
    'Check service quality and handle guest complaints.',
    'Coordinate with the kitchen on timing and special requests.',
    'Handle cash-up and the shift report at close.',
  ],
  bartender: [
    'Prepare classic and signature drinks to recipe.',
    'Keep the bar stocked and run daily stock counts.',
    'Follow responsible-serving rules and local alcohol regulations.',
    'Keep the bar area clean and ready for service.',
  ],
  chef: [
    'Run your section and prepare dishes to the recipe and plating standard.',
    'Handle prep, stock rotation and ordering for the section.',
    'Follow HACCP and food safety standards.',
    'Train and guide junior kitchen staff.',
  ],
  host: [
    'Greet guests and manage the reservation book.',
    'Seat guests and balance the floor between sections.',
    'Manage the waiting list and keep guests informed at peak times.',
  ],
  manager: [
    'Run daily operations and staff scheduling.',
    'Control costs, payroll and revenue targets.',
    'Recruit, train and develop the team.',
    'Report to the owners or head office on results.',
  ],
};

export function suggestResponsibilities(role: string | null): string[] {
  const r = (role ?? '').toLowerCase();
  const key = /waiter|waitress|server/.test(r)
    ? 'waiter'
    : /supervisor|head waiter|captain/.test(r)
      ? 'supervisor'
      : /bartender|barista|bar /.test(r)
        ? 'bartender'
        : /chef|cook|commis/.test(r)
          ? 'chef'
          : /host|reception|guest relations/.test(r)
            ? 'host'
            : /manager|director/.test(r)
              ? 'manager'
              : null;
  return key ? RESPONSIBILITIES[key] : [];
}

/* Этапы найма ---------------------------------------------------------------------------- */

/** Бриф, пункт 12. Food tasting — отдельный этап для кухни. */
export const HIRING_STAGES = [
  'Phone screening',
  'HR call',
  'Pre-screen interview',
  'Video interview',
  'Trial shift',
  'Food tasting',
  'Office meeting',
];

/* Тарифы --------------------------------------------------------------------------------- */

/** Бриф, пункт 14: публикация платная, пейволл — после Smart vacancy review. */
export const PLANS = [
  {
    id: 'single',
    name: 'Single post',
    price: 149,
    period: 'one-time',
    lines: ['1 vacancy', 'Active for 30 days', 'Smart vacancy review'],
  },
  {
    id: 'bundle',
    name: '5-post bundle',
    price: 449,
    period: 'one-time',
    lines: ['5 vacancies, use within 90 days', 'Each active for 30 days', 'Smart vacancy review', '~90 SAR per post'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 699,
    period: 'per month',
    lines: [
      'Unlimited vacancies',
      'Priority placement for candidates',
      'Incognito company mode',
      'Extended Smart vacancy review with analytics',
      'Priority support',
    ],
  },
] as const;

/* Текст вакансии ------------------------------------------------------------------------ */

const fmt = (n: number) => n.toLocaleString('en-US');

export function salaryLine(v: VacancyDraft): string | null {
  if (v.salaryBasis === 'interview' && v.salaryMin === null) return 'Based on interview performance';
  if (v.salaryMin === null) return null;
  // Фиксированная сумма — одним числом, без «4,000 – 4,000» (бриф, пункт 13.2).
  const range = v.salaryMax && v.salaryMax !== v.salaryMin ? `${fmt(v.salaryMin)} – ${fmt(v.salaryMax)}` : fmt(v.salaryMin);
  const basis = v.salaryBasis === 'experience' ? ', depending on experience' : '';
  return `${range} ${v.currency ?? 'AED'} / month${basis}`;
}

export function scheduleLine(v: VacancyDraft): string | null {
  if (v.employment === 'Part-time') {
    const days = v.partTimeDays.length ? v.partTimeDays.join(', ') : null;
    return [days, v.shiftHours].filter(Boolean).join(' · ') || null;
  }
  if (v.employment === 'Permanent') return v.adminRole ? '5 days a week, 2 days off' : '6 days a week, 1 day off';
  return null;
}

/** Все проверяемые плюсы — для чипов «What you offer» и карточки. */
export const OFFER_FACTS: { key: keyof VacancyDraft; label: string }[] = [
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'meals', label: 'Meals' },
  { key: 'transport', label: 'Transport' },
  { key: 'visa', label: 'Visa support' },
  { key: 'insurance', label: 'Health insurance' },
  { key: 'joiningTicket', label: 'Joining ticket' },
  { key: 'tips', label: 'Tips' },
];

export function benefitChips(v: VacancyDraft): string[] {
  return [...OFFER_FACTS.filter((f) => v[f.key] === true).map((f) => f.label), ...v.perks, ...v.customOffers];
}

export function companyLabel(c: CompanyDraft): string {
  return c.hideName ? 'Confidential employer' : c.name.trim() || 'Your company';
}

/** Первое предложение описания компании — «positioning line» карточки. */
export function tagline(about: string): string {
  const s = about.trim().match(/^.*?[.!?](\s|$)/)?.[0] ?? about.trim();
  return s.trim();
}

const TBC = 'To be confirmed';

/**
 * Готовый текст вакансии по структуре Vacancy Prompt (шаг 4): зацепка,
 * абзац о роли, блок фактов. Ключевые поля при отсутствии ответа — «To be
 * confirmed»; обогащающие (чаевые, перки) — просто опускаются.
 */
export function vacancyText(v: VacancyDraft, c: CompanyDraft, opening?: string): string {
  const role = v.title ?? 'Open role';
  const lines: string[] = [];
  lines.push(v.city ? `${role} — ${v.city}` : role);
  lines.push(`Salary: ${salaryLine(v) ?? TBC}`);
  lines.push(companyLabel(c));
  lines.push('');
  if (c.about.trim()) lines.push(tagline(c.about), '');
  const exp = v.experience?.startsWith('Entry') ? ' No prior experience required — full training given.' : '';
  lines.push(`We're looking for a ${role.toLowerCase()} to join our team.${exp}`, '');

  if (v.responsibilities.length) {
    lines.push('What you will do:', ...v.responsibilities.map((r) => `• ${r}`), '');
  }

  const yn = (b: boolean | null, yes: string, no: string) => (b === null ? TBC : b ? yes : no);
  const rows: [string, string | null][] = [
    ['Employment type', v.employment ?? TBC],
    ['Schedule', scheduleLine(v) ?? (v.employment ? TBC : null)],
    ['Experience', v.experience ?? TBC],
    ['Accommodation', yn(v.accommodation, 'Provided', 'Not provided — candidates arrange their own housing')],
    ['Visa', yn(v.visa, 'Provided by the employer', 'Not provided')],
    ['Meals', yn(v.meals, 'Provided during shifts', 'Not provided')],
    ['Transport', yn(v.transport, 'Provided', 'Not provided')],
    // Страховка — «на усмотрение работодателя»: отсутствие только по согласию.
    ['Health insurance', v.insurance ? 'Provided' : v.insurance === false && v.showNoInsurance ? 'Not provided' : null],
    ['Joining ticket', v.joiningTicket === null ? null : v.joiningTicket ? 'Covered' : 'Not covered'],
    ['Tips', v.tips ? 'Yes' : null],
    ['Language', v.language],
    ['Location', v.city ?? TBC],
    ['Planned opening', c.preOpening && opening ? opening : null],
    ['Start', v.start],
  ];
  for (const [k, val] of rows) if (val) lines.push(`${k}: ${val}`);

  const extras = [...v.perks, ...v.customOffers];
  if (extras.length) lines.push('', `Why join us: ${extras.join(', ')}.`);
  if (v.hiringSteps.length) lines.push('', `Hiring process: ${v.hiringSteps.join(' → ')}.`);
  if (v.preferVideoIntro) lines.push('Optional: a short video greeting in English. Not speaking on camera won’t count against you.');
  if (v.jdFile) lines.push('', 'Full job description attached.');
  return lines.join('\n');
}

/* Smart vacancy review --------------------------------------------------------------------- */

export interface Review {
  score: number;
  summary: string;
  strengths: string[];
  improve: string[];
}

/**
 * «Второй экспертный взгляд» перед публикацией — бриф, пункт 13.7.
 * Здесь это правила, а не модель: каждый пункт ссылается на то, что реально
 * есть или реально отсутствует в этой вакансии, общих советов нет.
 */
export function smartReview(v: VacancyDraft, c: CompanyDraft): Review {
  const strengths: string[] = [];
  const improve: string[] = [];
  let score = 40;

  if (v.salaryMin !== null && v.salaryMax) {
    score += 12;
    strengths.push(`Salary is shown as a range (${salaryLine(v)}).`);
  } else if (v.salaryMin !== null) {
    score += 8;
    improve.push('Salary is a single figure — a range usually attracts more applicants.');
  } else improve.push('No salary figure — listings with a number get far more applications in the GCC.');

  const facts = OFFER_FACTS.filter((f) => v[f.key] === true).map((f) => f.label.toLowerCase());
  if (facts.length >= 3) {
    score += 14;
    strengths.push(`Clear benefits upfront: ${facts.slice(0, 4).join(', ')}.`);
  } else improve.push('Few confirmed benefits — say whether accommodation, meals and transport are provided.');

  if (v.perks.length) {
    score += 6;
    strengths.push(`Shows growth and culture, not only pay: ${v.perks.slice(0, 3).join(', ').toLowerCase()}.`);
  } else improve.push('Add what makes the place good to work at — training, career growth, staff events.');

  if (c.about.trim().length > 60) score += 8;
  else improve.push('The company description is thin — candidates open the company page before applying.');

  if (c.photos.length) score += 6;
  else improve.push('No photos of the venue or staff housing — photos sell the job better than a logo.');

  if (v.responsibilitiesSource === 'employer' || (v.responsibilities.length && v.responsibilitiesSource !== 'suggested')) score += 6;
  else if (v.responsibilities.length) improve.push('Responsibilities were suggested from the job title — check they match this role.');

  if (v.hiringSteps.length > 2) improve.push(`${v.hiringSteps.length} hiring stages — each one loses candidates; keep only what this role needs.`);
  else if (v.hiringSteps.length) score += 4;

  const summary =
    score >= 75
      ? `A strong ${(v.title ?? 'role').toLowerCase()} listing with transparent terms — expect good interest.`
      : score >= 55
        ? `A solid ${(v.title ?? 'role').toLowerCase()} listing; a couple of additions would lift response.`
        : `The basics are there, but candidates will miss key details about this ${(v.title ?? 'role').toLowerCase()} role.`;

  return { score: Math.min(98, score), summary, strengths: strengths.slice(0, 4), improve: improve.slice(0, 4) };
}

let seq = 0;
export const msgId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;
