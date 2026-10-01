/**
 * Модель профессии.
 *
 * Заказчица: «У меня есть некий параметр, по которому все эти резюме должны
 * прогоняться. Если это хостес — один параметр, официант — другой, менеджер —
 * третий, шеф разного уровня — разные параметры. Это всё должно быть вшито
 * в платформу».
 *
 * Отсюда два следствия, которые определили модель:
 *
 * 1. Вопросы — данные, а не разметка. Один экран онбординга обслуживает любую
 *    профессию; добавить повара-кондитера — значит дописать файл в этой папке,
 *    а не новый экран.
 * 2. Один и тот же список вопросов работает трижды: как сценарий диалога
 *    с ИИ, как разделы готового CV и как поля матчинга с вакансией. Если бы
 *    это были три разных описания, они бы разошлись на второй неделе.
 */

export type FieldKind =
  | "single" // один вариант из списка
  | "multi" // несколько вариантов
  | "number" // число (covers, столы, размер команды)
  | "text" // свободный текст, его и разбирает ИИ
  | "scale" // уровень 1..5 (wine knowledge, языки)
  | "bool"
  | "photos"; // фото блюд — правка Алдияра

/** Куда вопрос попадает в готовом резюме. */
export type CvSlot =
  | "summary"
  | "experience"
  | "specifics" // профессиональная специфика — то, ради чего всё затевалось
  | "scale" // масштаб: covers, outlets, размер команды
  | "systems" // POS, PMS, reservation systems
  | "skills"
  | "languages"
  | "portfolio"; // фото блюд, сертификаты

export interface Question {
  id: string;
  /** Формулировка для диалога — как спросил бы живой рекрутёр. */
  ask: string;
  /** Подпись того же поля в готовом CV. Короткая. */
  label: string;
  kind: FieldKind;
  slot: CvSlot;
  options?: readonly string[];
  unit?: string;
  min?: number;
  max?: number;
  /** Без этого профиль не считается заполненным и не идёт в матчинг. */
  required?: boolean;
  /** Показывается под полем; в голосовом режиме зачитывается как пример. */
  hint?: string;
  /** Вопрос задаётся, только если раньше ответили так. Пример: секции кухни
   *  спрашиваем у горячего цеха, но не у кондитера. */
  showIf?: (a: Answers) => boolean;
}

export interface Profession {
  id: ProfessionId;
  /** Как называется в интерфейсе и в вакансии. */
  title: string;
  /** Семейство — по нему группируем в выборе и расширяем матчинг. */
  family: "service" | "kitchen" | "management";
  /** Одна строка, объясняющая кандидату, что здесь спросят. */
  blurb: string;
  /** Уровни позиции внутри профессии: «шеф разного уровня — разные параметры». */
  levels?: readonly string[];
  questions: readonly Question[];
}

export type ProfessionId = "hostess" | "waiter" | "manager" | "chef" | "bar";

export type AnswerValue = string | string[] | number | boolean | null;
export type Answers = Record<string, AnswerValue>;

/** Ответ «пустой» — вопрос считается незаданным. */
export function isBlank(v: AnswerValue | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Вопросы, актуальные при текущих ответах (с учётом showIf). */
export function activeQuestions(p: Profession, a: Answers): Question[] {
  return p.questions.filter((q) => !q.showIf || q.showIf(a));
}

/** Заполненность профиля в процентах — то самое «Your profile is 75% complete».
 *  Обязательные вопросы весят вдвое: без них профиль не выйдет в матчинг. */
export function completeness(p: Profession, a: Answers): number {
  const qs = activeQuestions(p, a);
  if (qs.length === 0) return 0;
  let got = 0;
  let total = 0;
  for (const q of qs) {
    const w = q.required ? 2 : 1;
    total += w;
    if (!isBlank(a[q.id])) got += w;
  }
  return Math.round((got / total) * 100);
}

/** Чего не хватает — этим ассистент подсказывает следующий шаг. */
export function missing(p: Profession, a: Answers): Question[] {
  return activeQuestions(p, a).filter((q) => isBlank(a[q.id]));
}
