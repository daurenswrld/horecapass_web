import { API } from './endpoints';
import { BASE_URL, refreshTokens, tokens } from './client';

/**
 * Клиент ассистента HorecaPass (чат на сайте): отвечает про платформу и
 * подбирает вакансии. Работает и для гостя, и для вошедшего.
 *
 * Тот же SSE, что у остальных ИИ-ручек: события `delta` по ходу ответа и одно
 * `done` в конце. Свой fetch, потому что обычный клиент ждёт JSON целиком.
 */

export interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantVacancy {
  id: number;
  title: string;
  company: string;
  city: string;
  country: string;
  salary: string;
}

export interface AssistantDone {
  reply: string;
  suggestions: string[];
  vacancies: AssistantVacancy[];
  /** Ассистент не нашёл ответа: вопрос попал в список для команды. */
  unanswered: boolean;
  /** Выключен из админки. */
  disabled: boolean;
  /** Модель недоступна, ответ собран из базы знаний слово в слово. */
  degraded: boolean;
}

export class AssistantError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Включён ли ассистент. Нет ответа или 404 (сервер ещё без этой функции) значит «нет». */
export async function assistantActive(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL + API.assistant.status, { cache: 'no-store' });
    if (!res.ok) return false;
    return (await res.json())?.active === true;
  } catch {
    return false;
  }
}

async function send(messages: AssistantMessage[], signal?: AbortSignal): Promise<Response> {
  const go = () =>
    fetch(BASE_URL + API.assistant.stream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        // Токен нужен только для персонального подбора; гостю не нужен.
        ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
      },
      body: JSON.stringify({ messages }),
      signal,
    });
  let res = await go();
  if (res.status === 401 && (await refreshTokens())) res = await go();
  return res;
}

export async function askAssistant(
  messages: AssistantMessage[],
  onDelta: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<AssistantDone> {
  const res = await send(messages, signal);
  if (res.status === 429) throw new AssistantError(429, 'rate-limited');
  if (!res.ok || !res.body) throw new AssistantError(res.status, `request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let done: AssistantDone | null = null;

  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const ev of events) {
      const line = ev.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      if (data.type === 'delta') {
        text += String(data.text ?? '');
        onDelta(text);
      } else if (data.type === 'done') {
        done = {
          reply: String(data.reply ?? text),
          suggestions: Array.isArray(data.suggestions) ? (data.suggestions as string[]) : [],
          vacancies: Array.isArray(data.vacancies) ? (data.vacancies as AssistantVacancy[]) : [],
          unanswered: data.unanswered === true,
          disabled: data.disabled === true,
          degraded: data.degraded === true,
        };
      }
    }
  }
  if (!done) {
    // Поток оборвался до финального события: оставляем то, что успели показать.
    if (!text) throw new AssistantError(0, 'stream ended');
    done = { reply: text, suggestions: [], vacancies: [], unanswered: false, disabled: false, degraded: true };
  }
  return done;
}
