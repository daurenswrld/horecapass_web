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
    ask: "Upload a portrait photo: it is the first thing an employer sees.",
    label: "Portrait",
    kind: "photos",
    slot: "summary",
    required: true,
    hint: "Face close up, neutral background, no filters.",
  },
  {
    id: "photo_full_length",
    ask: "Now a full-length photo.",
    label: "Full length",
    kind: "photos",
    slot: "summary",
    required: true,
    hint: "Standard in hospitality: employers want to see how you look in uniform.",
  },
  {
    id: "height_cm",
    ask: "How tall are you?",
    label: "Height",
    kind: "number",
    slot: "summary",
    unit: "cm",
    min: 130,
    max: 230,
    required: true,
  },
  {
    id: "weight_kg",
    ask: "And your weight?",
    label: "Weight",
    kind: "number",
    slot: "summary",
    unit: "kg",
    min: 35,
    max: 200,
    required: true,
  },
] as const;

export const COMMON_TAIL: readonly Question[] = [
  {
    id: "languages",
    ask: "Which languages do you use with guests?",
    label: "Languages",
    kind: "multi",
    slot: "languages",
    options: LANGUAGES,
    required: true,
  },
  {
    id: "visa_status",
    ask: "What is your visa status: where can you work without paperwork?",
    label: "Visa status",
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
    hint: "This decides which jobs you are shown at all.",
  },
  {
    id: "relocation",
    ask: "Would you relocate for a job?",
    label: "Relocation",
    kind: "single",
    slot: "summary",
    options: [
      "Yes, anywhere",
      "Yes, within the region",
      "Within the country only",
      "No",
    ],
    required: true,
  },
  {
    id: "certificates",
    ask: "Any certificates, diplomas or letters of recommendation? Upload them and we will attach them to your CV as one file.",
    label: "Certificates and letters",
    kind: "photos",
    slot: "portfolio",
    hint: "HACCP, bartending courses, awards, references.",
  },
] as const;
