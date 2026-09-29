import { API } from './endpoints';
import { BASE_URL, refreshTokens, tokens } from './client';

/**
 * Серверный ИИ со стримингом ответа (SSE). Тот же, что в мобилке.
 *
 * Сервер шлёт события `data: {"type":"delta","text":…}` по мере генерации и
 * в конце одно `{"type":"done","reply":…,"suggestions":[…],"vacancy_id":…}`.
 * Обычный http-клиент ждёт JSON целиком, поэтому здесь свой fetch — с тем же
 * Bearer-токеном и одной попыткой обновить его на 401.
 */

export interface AiMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AiDone {
  reply: string;
  suggestions: string[];
  /** Сервер создаёт вакансию, только если рекрутёр прямо попросил опубликовать. */
  vacancyId: number | null;
}

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  const send = () =>
    fetch(BASE_URL + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  let res = await send();
  if (res.status === 401 && (await refreshTokens())) res = await send();
  return res;
}

async function stream(
  path: string,
  body: unknown,
  onDelta: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<AiDone> {
  const res = await post(path, body, signal);
  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let done: AiDone | null = null;

  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buffer += decoder.decode(value, { stream: true });
    // События разделены пустой строкой; последнее может прийти не целиком.
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
          suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String).filter(Boolean) : [],
          vacancyId: data.vacancy_id == null ? null : Number(data.vacancy_id),
        };
      }
    }
  }
  return done ?? { reply: text, suggestions: [], vacancyId: null };
}

export const aiApi = {
  /** Конструктор вакансии: вопросы, варианты ответа, черновик. */
  vacancyBuilder(messages: AiMessage[], onDelta: (text: string) => void, signal?: AbortSignal) {
    return stream(API.ai.vacancyBuilderStream, { messages }, onDelta, signal);
  },
};
