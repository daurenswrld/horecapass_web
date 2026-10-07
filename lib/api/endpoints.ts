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
  /** Ассистент на сайте (чат: вопросы о платформе и подбор вакансий). */
  assistant: {
    status: "/api/assistant/status/",
    stream: "/api/assistant/stream/",
  },

  /** Админ-панель (только сотрудники). Серверная часть: приложение adminpanel. */
  admin: {
    me: "/api/admin/me/",
    overview: "/api/admin/overview/",
    candidateFunnel: "/api/admin/funnels/candidates/",
    employerFunnel: "/api/admin/funnels/employers/",
    candidateFeed: "/api/admin/feeds/candidates/",
    employerFeed: "/api/admin/feeds/employers/",
    vacanciesMonth: "/api/admin/vacancies/month/",
    vacancies: "/api/admin/vacancies/",
    vacancyBlock: (id: number) => `/api/admin/vacancies/${id}/block/`,
    vacancyUnblock: (id: number) => `/api/admin/vacancies/${id}/unblock/`,
    revenue: "/api/admin/revenue/",
    trust: "/api/admin/trust/",
    users: "/api/admin/users/",
    companyVerify: (id: number) => `/api/admin/companies/${id}/verify/`,
    managers: "/api/admin/managers/",
    manager: (id: number) => `/api/admin/managers/${id}/`,
    tickets: "/api/admin/tickets/",
    ticket: (id: number) => `/api/admin/tickets/${id}/`,
    auditLog: "/api/admin/audit-log/",
  },

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
    materials: (id: string | number) =>
      `/api/applications/company/${id}/materials/`,
    materialDownload: (id: string | number, materialId: string | number) =>
      `/api/applications/company/${id}/materials/${materialId}/`,
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
    need: "Профиль компании для онбординга работодателя: контакты, источники, pre-opening, инкогнито",
    proposed:
      "Поля в /users/api/users/me/company/: website, linkedin, whatsapp, contact_email, size, is_pre_opening, pre_opening_answers, hide_name, photos",
    why: "Бриф, пункты 4 и 6; встреча 15.09: «взять email, телефон, WhatsApp»; инкогнито для Premium.",
  },
  {
    need: "Черновик HR-описания компании по ссылке, PDF или ответам pre-opening",
    proposed: "POST /api/ai/company-brand/draft/ (website | instagram | linkedin | pdf | answers → текст)",
    why: "Бриф, пункт 4: работодатель правит и утверждает текст, а не пишет с нуля.",
  },
  {
    need: "Соглашение работодателя с подписью от руки и копией лицензии",
    proposed:
      "POST /users/api/users/me/company/agreement/ (signer, position, signature png, license file, accepted_at)",
    why: "Заказчица 17.09: перед оплатой — соглашение, роспись и лицензия (due diligence). Текст соглашения готовит адвокат.",
  },
  {
    need: "Согласие кандидата на публикацию резюме с подписью от руки",
    proposed: "POST /api/resumes/my/<id>/publish-consent/ (full name, signature png, signed_at)",
    why: "Заказчица 17.09: без согласия на публикацию имени, телефона, почты и опыта «никого пускать на платформу нельзя».",
  },
  {
    need: "Оплата публикации: Single post 149 SAR, 5-post bundle 449 SAR, Premium 699 SAR/мес",
    proposed: "POST /api/billing/checkout/ (plan) → публикация вакансии после оплаты; лимиты и срок жизни постов",
    why: "Бриф работодателя, пункт 14: пейволл после Smart vacancy review и до публикации. Голосовое 25.09: превью → условия → оплата → публикация.",
  },
  {
    need: "Модель вакансии под композер: Permanent / Part-time, дни и часы смены, joining ticket, tips, язык, обязанности, этапы, видео по желанию, файл JD",
    proposed:
      "Поля в /api/vacancies/: employment_type (permanent | part_time), is_admin_role, part_time_days[], shift_hours, joining_ticket, tips, language_requirement, responsibilities[], hiring_steps[], prefer_video_intro, jd_file, show_no_insurance",
    why: "Бриф работодателя, пункты 9–12, и Vacancy Prompt: ручная форма и композер пишут в одну модель. Национальность не хранить — только язык.",
  },
  {
    need: "Smart vacancy review на черновике, до публикации",
    proposed: "POST /api/vacancies/my/<id>/ai-score/ — уже есть; нужен запуск на неопубликованном черновике",
    why: "Бриф работодателя, пункт 13.7: ревью должно быть actionable до публикации, а не после.",
  },
  {
    need: "Профиль кандидата: национальность, текущая локация, страны работы (массив), cover letter, тип сертификата, references",
    proposed: "Поля в /api/resumes/my/<id>/: nationality, current_location, target_countries[], cover_letter (file|text), certificates[].type, references[]",
    why: "Бриф кандидата, пункты 1–3 и 12: страны — множественный выбор, локация — свободный текст.",
  },
  {
    need: "Smart-анализ профиля и платный CV upgrade",
    proposed: "POST /api/resumes/my/<id>/gaps/ (вопросы по одному), POST /api/resumes/my/<id>/upgrade/ (превью до оплаты) + оплата",
    why: "Бриф кандидата, пункт 4: сначала показать результат, потом предложить апгрейд; отказ не блокирует.",
  },
  {
    need: "Квалификация кандидата и флаг Verified",
    proposed: "POST /api/qualification/generate/ (роль, уровень → 8 вопросов), /api/qualification/answers/, is_verified у профиля",
    why: "Бриф кандидата, пункты 7, 8, 12: Verified = 8 вопросов + видео-визитка; кухня квалификацию пропускает.",
  },
  {
    need: "Communities: кличи и групповые чаты",
    proposed: "/api/community/calls/ (создать, вступить, премодерация, жалоба), групповой чат от 2 участников",
    why: "Бриф кандидата, пункт 13: таргетинг по национальности и стране, один активный клич, фильтр ссылок и телефонов.",
  },
  {
    need: "Find Your People",
    proposed: "GET /api/community/ — поиск коллег по профессии, языку, стране",
    why: "Документ, раздел 10: раздел был в изначальной концепции и потерян.",
  },
] as const;
