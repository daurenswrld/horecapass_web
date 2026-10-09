import { API } from '@/lib/api/endpoints';
import { http } from '@/lib/api/client';
import type { QuizRole } from './content';

/**
 * Прогресс квиза в sessionStorage и отправка ответов на сервер.
 *
 * Квиз идёт до регистрации, поэтому ответы привязаны к случайному идентификатору
 * браузерной сессии, а не к человеку. Сервер получает их после каждого вопроса:
 * кто бросил на середине, всё равно попадает в статистику. Квиз ничего не
 * блокирует — любая ошибка сети молча игнорируется.
 */

const KEY = 'hp_quiz';

export type Answers = Record<string, string[]>;

export interface QuizProgress {
  session: string;
  role: QuizRole;
  index: number;
  answers: Answers;
  finished: boolean;
}

function newSession(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Старые браузеры без randomUUID: достаточно случайной строки в формате UUID v4.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

export function startProgress(role: QuizRole): QuizProgress {
  return { session: newSession(), role, index: 0, answers: {}, finished: false };
}

export function loadProgress(role: QuizRole): QuizProgress {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as QuizProgress;
      // Пройденный до конца квиз при новом заходе начинается заново.
      if (p && p.role === role && typeof p.session === 'string' && !p.finished && Number.isInteger(p.index) && p.answers && typeof p.answers === 'object') return p;
    }
  } catch {
    /* хранилище недоступно или повреждено — начинаем с начала */
  }
  return startProgress(role);
}

export function saveProgress(p: QuizProgress): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* приватное окно: квиз работает и без сохранения */
  }
}

export function sendProgress(p: QuizProgress): void {
  void http
    .post(API.quiz, { session: p.session, role: p.role, answers: p.answers, completed: p.finished })
    .catch(() => undefined);
}
