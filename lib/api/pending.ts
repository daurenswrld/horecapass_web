import type { Answers } from "@/lib/professions";

/**
 * Заглушки для функций, которых на бэкенде ещё нет (список — в endpoints.ts,
 * константа MISSING_ON_BACKEND).
 *
 * Правила, по которым это написано:
 *
 *  • Сигнатуры совпадают с тем, какими будут настоящие вызовы. Замена
 *    заглушки на http.post — правка тела одной функции.
 *  • Каждая возвращает pending: true. Интерфейс обязан это показывать —
 *    заказчица уже один раз получила демо, которое выглядело рабочим, и
 *    отдельно на это указала: «это не рабочий сайт, где ты реально можешь
 *    что-то технически поделать». Второй раз выдавать заглушку за функцию
 *    нельзя.
 *  • Данные лежат в localStorage. Это черновик кандидата на его устройстве,
 *    а не «база»: как только появится эндпоинт, черновик уедет на сервер.
 */

export interface Pending<T> {
  data: T;
  pending: true;
  /** Что показать пользователю рядом с функцией. */
  note: string;
}

const DRAFT_KEY = "hp_profile_draft";

export interface ProfileDraft {
  professionId: string | null;
  answers: Answers;
  updatedAt: string;
}

const EMPTY: ProfileDraft = { professionId: null, answers: {}, updatedAt: "" };

/** Черновик анкеты. Станет GET/PUT /api/resumes/my/<id>/profession-profile/. */
export const draft = {
  load(): ProfileDraft {
    if (typeof window === "undefined") return EMPTY;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return EMPTY;
      const parsed = JSON.parse(raw) as ProfileDraft;
      // Форма могла измениться между релизами — не доверяем содержимому вслепую.
      if (typeof parsed !== "object" || parsed === null) return EMPTY;
      return {
        professionId: parsed.professionId ?? null,
        answers: parsed.answers ?? {},
        updatedAt: parsed.updatedAt ?? "",
      };
    } catch {
      return EMPTY;
    }
  },

  save(professionId: string | null, answers: Answers): ProfileDraft {
    const next: ProfileDraft = {
      professionId,
      answers,
      updatedAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* приватный режим или переполнено — черновик просто не переживёт перезагрузку */
      }
    }
    return next;
  },

  clear() {
    if (typeof window !== "undefined")
      window.localStorage.removeItem(DRAFT_KEY);
  },
};

/**
 * Распознавание голосового ответа.
 * Станет POST /api/ai/transcribe/.
 *
 * Пока сервера нет — пробуем Web Speech API прямо в браузере. Он есть
 * в Chrome и Safari и решает задачу для показа, но не для продакшна:
 * в Firefox его нет, а в Chrome распознавание уходит в Google.
 */
export function speechRecognitionAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Разбор загруженного CV.
 * Станет POST /api/ai/cv-parse/.
 */
export async function parseCv(
  file: File,
): Promise<Pending<{ filled: Answers; missingIds: string[] }>> {
  return {
    data: { filled: {}, missingIds: [] },
    pending: true,
    note: `Файл «${file.name}» принят, но разбор резюме делается на сервере — эндпоинт /api/ai/cv-parse/ ещё не готов. Пока заполним профиль вопросами.`,
  };
}

/**
 * Сборка сертификатов в один файл.
 * Станет GET /api/resumes/my/<id>/attachments.zip.
 */
export async function downloadAttachments(
  count: number,
): Promise<Pending<null>> {
  return {
    data: null,
    pending: true,
    note: `Файлов к выгрузке: ${count}. Собирать их в один архив с пересжатием должен сервер — эндпоинта пока нет.`,
  };
}
