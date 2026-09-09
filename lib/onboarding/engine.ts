import {
  activeQuestions,
  completeness,
  isBlank,
  missing,
  type Answers,
  type Profession,
  type Question,
} from "@/lib/professions";
import { plural } from "@/lib/utils";

/**
 * Логика диалогового онбординга.
 *
 * Заказчица: «заполнение анкеты кандидата должно выглядеть как переписка
 * с чатом GPT, где на этапе формирования профайла мы задаём определённые
 * вопросы, и кандидат может либо начитывать, либо печатать».
 *
 * Поэтому здесь не форма с шагами, а лента реплик. Порядок вопросов берётся
 * из описания профессии, но задаются они по одному и с человеческими связками
 * между ними — иначе получается та же анкета, только длиннее.
 *
 * Состояние держится отдельно от React: так его можно проверить тестом
 * и позже отдать на сервер, когда появится /api/ai/cv-builder/chat/.
 */

export type Speaker = "assistant" | "candidate";

export interface Message {
  id: string;
  from: Speaker;
  text: string;
  /** К какому вопросу относится реплика — по нему рисуется поле ответа. */
  questionId?: string;
  /** Ответ был надиктован, а не напечатан. */
  byVoice?: boolean;
}

export interface OnboardingState {
  profession: Profession;
  answers: Answers;
  messages: Message[];
  /** Вопрос, на который сейчас ждём ответ. null — анкета пройдена. */
  current: Question | null;
  progress: number;
}

let seq = 0;
const nextId = () => `m${++seq}`;

/** Связки между вопросами. Без них ассистент читается как робот, который
 *  зачитывает поля формы. Индекс берётся по счётчику отвеченных, чтобы
 *  фразы не повторялись подряд. */
const BRIDGES = [
  "Понял.",
  "Записал.",
  "Хорошо.",
  "Отлично.",
  "Принято.",
  "Так, дальше.",
];

const bridge = (n: number) => BRIDGES[n % BRIDGES.length];

/** Первая реплика: объясняем правила игры, а не просто спрашиваем.
 *  Считаем по активным вопросам, а не по всем: часть появится или не появится
 *  в зависимости от ответов, и обещать точное число нечестно. */
export function greeting(p: Profession): string {
  const total = activeQuestions(p, {}).length;
  return (
    `Отлично — ${p.title}. Я задам около ${total} ${plural(total, "вопроса", "вопросов", "вопросов")} ` +
    `и соберу из ответов готовое резюме. Отвечать можно голосом или текстом, как удобнее. ` +
    `Если что-то не помните точно — скажите примерно, это нормально.`
  );
}

export function start(
  profession: Profession,
  answers: Answers = {},
): OnboardingState {
  const first = nextQuestion(profession, answers);
  const messages: Message[] = [
    { id: nextId(), from: "assistant", text: greeting(profession) },
  ];
  if (first) {
    messages.push({
      id: nextId(),
      from: "assistant",
      text: first.ask,
      questionId: first.id,
    });
  }
  return {
    profession,
    answers,
    messages,
    current: first,
    progress: completeness(profession, answers),
  };
}

/** Следующий неотвеченный вопрос с учётом showIf. */
export function nextQuestion(p: Profession, a: Answers): Question | null {
  return activeQuestions(p, a).find((q) => isBlank(a[q.id])) ?? null;
}

/** Как ответ кандидата выглядит в ленте. */
export function renderAnswer(q: Question, value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (q.kind === "scale") return `${value} из ${q.max ?? 5}`;
  if (q.unit) return `${value} ${q.unit}`;
  return String(value);
}

export interface AnswerInput {
  value: unknown;
  byVoice?: boolean;
}

/** Принять ответ и перейти к следующему вопросу. */
export function answer(
  state: OnboardingState,
  input: AnswerInput,
): OnboardingState {
  if (!state.current) return state;

  const q = state.current;
  const answers: Answers = {
    ...state.answers,
    [q.id]: input.value as Answers[string],
  };
  const answeredCount = Object.keys(answers).filter(
    (k) => !isBlank(answers[k]),
  ).length;

  const messages: Message[] = [
    ...state.messages,
    {
      id: nextId(),
      from: "candidate",
      text: renderAnswer(q, input.value),
      questionId: q.id,
      byVoice: input.byVoice,
    },
  ];

  const next = nextQuestion(state.profession, answers);

  if (next) {
    // Связка и вопрос — одной репликой: два пузыря подряд от ассистента
    // читаются как заминка.
    messages.push({
      id: nextId(),
      from: "assistant",
      text: `${bridge(answeredCount)} ${next.ask}`,
      questionId: next.id,
    });
  } else {
    messages.push({
      id: nextId(),
      from: "assistant",
      text: "Всё, анкета собрана. Смотрите, что получилось — это уже готовое резюме, его можно править вручную в любой момент.",
    });
  }

  return {
    ...state,
    answers,
    messages,
    current: next,
    progress: completeness(state.profession, answers),
  };
}

/** Пропустить необязательный вопрос. */
export function skip(state: OnboardingState): OnboardingState {
  if (!state.current || state.current.required) return state;

  const skipped = state.current;
  // Помечаем пустой строкой: вопрос считается заданным и не всплывёт снова,
  // но в подсказках ассистента останется как «можно дополнить».
  const answers: Answers = { ...state.answers, [skipped.id]: "" };
  const next = nextQuestion(state.profession, answers);

  const messages: Message[] = [
    ...state.messages,
    { id: nextId(), from: "candidate", text: "Пропустить" },
  ];
  if (next) {
    messages.push({
      id: nextId(),
      from: "assistant",
      text: `Хорошо, вернёмся к этому позже. ${next.ask}`,
      questionId: next.id,
    });
  }

  return {
    ...state,
    answers,
    messages,
    current: next,
    progress: completeness(state.profession, answers),
  };
}

/**
 * Подсказка ассистента — то самое «Your profile is 75% complete. We still need
 * information about...» из документа и «маленький человечек, который выходит
 * и говорит: если ты вот это добавишь, будет лучше» из голосового.
 */
export function nudge(p: Profession, a: Answers): string | null {
  const gaps = missing(p, a);
  if (gaps.length === 0) return null;

  const pct = completeness(p, a);
  const required = gaps.filter((q) => q.required);

  if (required.length > 0) {
    const names = required
      .slice(0, 2)
      .map((q) => q.label.toLowerCase())
      .join(" и ");
    return `Профиль заполнен на ${pct}%. Без ${names} работодатель не увидит вас в подборке.`;
  }

  const names = gaps
    .slice(0, 2)
    .map((q) => q.label.toLowerCase())
    .join(" и ");
  return `Профиль заполнен на ${pct}%. Добавьте ${names} — такие резюме открывают заметно чаще.`;
}
