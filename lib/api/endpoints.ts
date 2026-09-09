/**
 * Реальные адреса бэкенда.
 *
 * Выписаны из мобильного приложения (horeca_pass_mobile, lib/features/**\/application/*.dart),
 * а не из документации: OpenAPI-схема на сервере устарела и не показывает часть
 * выкаченных маршрутов — об этом прямо предупреждает feature_flags.dart мобилки.
 *
 * Прошлая версия веба ходила на выдуманные адреса (/auth/otp/send/, /vacancies/),
 * ни один из которых на сервере не существует. Поэтому здесь один файл-источник:
 * если сервер переедет, правится он, а не десять мест в компонентах.
 */

export const API = {
  auth: {
    sendCode: "/users/api/auth/send-code/",
    verifyCode: "/users/api/auth/verify-code/",
    refresh: "/users/api/token/refresh/",
    me: "/users/api/users/me/",
  },

  company: {
    mine: "/users/api/users/me/company/",
    team: "/users/api/users/me/company/team/",
    invitations: "/users/api/users/me/company/invitations/",
    invitation: (id: string | number) =>
      `/users/api/users/me/company/invitations/${id}/`,
    verification: "/users/api/users/me/company/verification/",
    byId: (id: string | number) => `/users/api/companies/${id}/`,
    favorite: (id: string | number) => `/users/api/companies/${id}/favorite/`,
    favorites: "/users/api/favorites/companies/",
  },

  vacancies: {
    list: "/api/vacancies/",
    detail: (id: string | number) => `/api/vacancies/${id}/`,
    apply: (id: string | number) => `/api/vacancies/${id}/apply/`,
    favorite: (id: string | number) => `/api/vacancies/${id}/favorite/`,
    match: (id: string | number) => `/api/vacancies/${id}/match/`,
    interviewPrep: (id: string | number) =>
      `/api/vacancies/${id}/interview-prep/`,
    interviewQuestions: (id: string | number) =>
      `/api/vacancies/${id}/interview/questions/`,
    cities: "/api/vacancies/cities/",
    matches: "/api/vacancies/matches/",
    mine: "/api/vacancies/my/",
    mineDetail: (id: string | number) => `/api/vacancies/my/${id}/`,
    aiScore: (id: string | number) => `/api/vacancies/my/${id}/ai-score/`,
  },

  applications: {
    mine: "/api/applications/my/",
    company: "/api/applications/company/",
    companyDetail: (id: string | number) => `/api/applications/company/${id}/`,
    aiSummary: (id: string | number) =>
      `/api/applications/company/${id}/ai-summary/`,
    status: (id: string | number) => `/api/applications/${id}/status/`,
    interview: (id: string | number) => `/api/applications/${id}/interview/`,
    interviewAnswers: (id: string | number) =>
      `/api/applications/${id}/interview/answers/`,
    relocation: (id: string | number) => `/api/applications/${id}/relocation/`,
  },

  resumes: {
    mine: "/api/resumes/my/",
    detail: (id: string | number) => `/api/resumes/my/${id}/`,
    pdf: (id: string | number) => `/api/resumes/my/${id}/pdf/`,
    certificates: "/api/resumes/my/certificates/",
    certificate: (id: string | number) => `/api/resumes/my/certificates/${id}/`,
    importLinkedin: "/api/resumes/import/linkedin/",
    importLinkedinApply: "/api/resumes/import/linkedin/apply/",
  },

  ai: {
    cvBuilderChat: "/api/ai/cv-builder/chat/",
    cvBuilderStream: "/api/ai/cv-builder/stream/",
    cvBuilderHistory: "/api/ai/cv-builder/history/",
    vacancyBuilderStream: "/api/ai/vacancy-builder/stream/",
  },

  chats: {
    list: "/api/chats/",
    detail: (id: string | number) => `/api/chats/${id}/`,
    messages: (id: string | number) => `/api/chats/${id}/messages/`,
    read: (id: string | number) => `/api/chats/${id}/read/`,
    replySuggestions: (id: string | number) =>
      `/api/chats/${id}/reply-suggestions/`,
    templates: "/api/chats/templates/",
    startForApplication: (id: string | number) =>
      `/api/chats/applications/${id}/start/`,
    startSupport: "/api/chats/support/start/",
    startAssistant: "/api/chats/assistant/start/",
    /** Вебсокет чата — тот же, что слушает мобилка. */
    socket: (id: string | number) => `/ws/chats/${id}/`,
  },

  misc: {
    skills: "/api/skills/",
    faq: "/api/faq/",
    articles: "/api/articles/",
    banners: "/api/banners/",
    favorites: "/api/favorites/",
    careerScore: "/api/career-score/",
    careerScoreActions: "/api/career-score/actions/",
    notifications: "/api/notifications/",
    notificationRead: (id: string | number) => `/api/notifications/${id}/read/`,
    notificationsReadAll: "/api/notifications/read-all/",
    meetings: "/api/meetings/",
    meeting: (id: string | number) => `/api/meetings/${id}/`,
    googleStatus: "/api/google/status/",
    googleConnect: "/api/google/connect/",
    googleFreebusy: "/api/google/freebusy/",
  },
} as const;

/**
 * Чего на бэкенде ещё нет.
 *
 * Проверено по списку маршрутов, которые использует мобилка: ни одного из этих
 * адресов там не встречается. Пока их нет, соответствующие вызовы обслуживает
 * lib/api/pending.ts — он держит данные локально и помечает их как временные,
 * чтобы это не выглядело работающей функцией на демонстрации.
 *
 * Список нужен ещё и как готовое ТЗ бэкендеру.
 */
export const MISSING_ON_BACKEND = [
  {
    need: "Анкеты по профессиям: сохранение ответов и схема параметров позиции",
    proposed: "GET/PUT /api/resumes/my/<id>/profession-profile/",
    why: "Голосовое заказчицы: параметры хостес/официанта/менеджера/шефа должны быть вшиты в платформу и по ним прогоняются резюме.",
  },
  {
    need: "Рост, вес, портретное фото и фото в полный рост",
    proposed:
      "Поля height_cm, weight_kg, photo_portrait, photo_full_length в /api/resumes/my/<id>/",
    why: "Правка Алдияра: обязательны для каждого резюме.",
  },
  {
    need: "Фото блюд шефа, мультизагрузка",
    proposed:
      "POST /api/resumes/my/<id>/portfolio/ (multipart, несколько файлов за запрос)",
    why: "Правка Алдияра: много фото с телефона одним заходом.",
  },
  {
    need: "Выгрузка сертификатов и писем одним небольшим файлом",
    proposed:
      "GET /api/resumes/my/<id>/attachments.zip (с пересжатием изображений на сервере)",
    why: "Правка Алдияра: «чтоб скачивалось одним файлом небольшого размера».",
  },
  {
    need: "Распознавание речи для голосовых ответов в онбординге",
    proposed: "POST /api/ai/transcribe/ (audio/webm → текст)",
    why: "Заказчица: кандидат должен иметь возможность начитывать ответы, а не печатать.",
  },
  {
    need: "Разбор загруженного CV",
    proposed:
      "POST /api/ai/cv-parse/ (pdf/docx → заполненные поля + список недостающих)",
    why: "Документ, раздел 2: Option 1 — Upload your existing CV.",
  },
  {
    need: "Корзина кандидатов и массовые действия",
    proposed: "POST /api/applications/company/bulk/ (ids + action)",
    why: "Документ, разделы 15–16: Add to Basket и bulk actions.",
  },
  {
    need: "Единая база кандидатов вне вакансии",
    proposed: "GET /api/candidates/ с фасетными фильтрами",
    why: "Документ, раздел REBUILD: Kanban должен быть срезом общей базы, а не единственным входом.",
  },
  {
    need: "Шаблоны дизайна резюме",
    proposed: "GET /api/resumes/templates/ и параметр template в PDF-выгрузке",
    why: "Документ, раздел 7: несколько визуальных шаблонов, в перспективе платных.",
  },
  {
    need: "Find Your People",
    proposed: "GET /api/community/ — поиск коллег по профессии, языку, стране",
    why: "Документ, раздел 10: раздел был в изначальной концепции и потерян.",
  },
] as const;
