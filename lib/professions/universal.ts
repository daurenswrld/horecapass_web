import type { Question } from "./types";

/**
 * Вопросы, общие для всех профессий.
 *
 * Значения намеренно на английском — они уходят на сервер и в матчинг, там же
 * их читает мобилка. Переводится подпись, а не данные. Тот же приём, что
 * в мобильном приложении (см. комментарии про «уровни образования, названия
 * языков, значения фильтров» в его README).
 */

export const VENUE_TYPES = [
  "Fine dining",
  "Casual dining",
  "Hotel",
  "Resort",
  "Catering",
  "Events",
  "QSR / Fast casual",
  "Bar / Nightlife",
  "Cafe / Bakery",
  "Cruise",
] as const;

export const LANGUAGES = [
  "English",
  "Russian",
  "Kazakh",
  "Arabic",
  "Turkish",
  "French",
  "Spanish",
  "Italian",
  "German",
  "Chinese",
  "Hindi",
  "Urdu",
] as const;

/** Требование Алдияра: «К каждому резюме нужно обязательно фото портретный
 *  и в полный рост, рост и вес». Обязательные — значит required. */
export const APPEARANCE: readonly Question[] = [
  {
    id: "photo_portrait",
    ask: "Загрузите портретное фото — его увидит работодатель первым.",
    label: "Портрет",
    kind: "photos",
    slot: "summary",
    required: true,
    hint: "Лицо крупно, нейтральный фон, без фильтров.",
  },
  {
    id: "photo_full_length",
    ask: "Теперь фото в полный рост.",
    label: "В полный рост",
    kind: "photos",
    slot: "summary",
    required: true,
    hint: "В HoReCa это стандарт: работодателю важен внешний вид в форме.",
  },
  {
    id: "height_cm",
    ask: "Ваш рост?",
    label: "Рост",
    kind: "number",
    slot: "summary",
    unit: "см",
    min: 130,
    max: 230,
    required: true,
  },
  {
    id: "weight_kg",
    ask: "Вес?",
    label: "Вес",
    kind: "number",
    slot: "summary",
    unit: "кг",
    min: 35,
    max: 200,
    required: true,
  },
] as const;

export const COMMON_TAIL: readonly Question[] = [
  {
    id: "languages",
    ask: "На каких языках вы работаете с гостем?",
    label: "Языки",
    kind: "multi",
    slot: "languages",
    options: LANGUAGES,
    required: true,
  },
  {
    id: "visa_status",
    ask: "Какой у вас визовый статус — где вы можете работать без оформления?",
    label: "Визовый статус",
    kind: "single",
    slot: "summary",
    options: [
      "Citizen / no permit needed",
      "Valid work permit",
      "Residence permit",
      "Iqama",
      "Need sponsorship",
      "Student visa",
    ],
    required: true,
    hint: "От этого зависит, какие вакансии вам вообще покажут.",
  },
  {
    id: "relocation",
    ask: "Готовы переехать ради работы?",
    label: "Релокация",
    kind: "single",
    slot: "summary",
    options: [
      "Да, куда угодно",
      "Да, в пределах региона",
      "Только внутри страны",
      "Нет",
    ],
    required: true,
  },
  {
    id: "certificates",
    ask: "Есть сертификаты, дипломы, благодарственные письма? Загрузите — соберём их в одно вложение к резюме.",
    label: "Сертификаты и письма",
    kind: "photos",
    slot: "portfolio",
    hint: "HACCP, барменские курсы, награды, рекомендации.",
  },
] as const;
