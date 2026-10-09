import { API } from './endpoints';
import { ApiError, chatSocketUrl, http } from './client';

/**
 * Чаты. Модели повторяют chat_models.dart мобилки, вплоть до того, что
 * список комнат и сообщения сервер отдаёт голыми массивами, а не страницами.
 *
 * История берётся по REST, живые сообщения приходят вебсокетом — тот же
 * порядок, что в chat_repository.dart.
 */

export interface ChatUser {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
  displayName: string;
}

export interface ChatMessage {
  id: number;
  room: number;
  sender: ChatUser;
  text: string;
  createdAt: Date;
  suggestions: string[];
  audioUrl: string | null;
  audioDuration: number | null;
  isVoice: boolean;
}

export interface ChatApplicationSummary {
  applicationId: number | null;
  vacancyId: number | null;
  vacancyTitle: string;
  companyId: number | null;
  companyName: string;
  companyLogoUrl: string | null;
}

export interface ChatRoom {
  id: number;
  chatType: string;
  unreadCount: number;
  participants: ChatUser[];
  peer: ChatUser | null;
  applicationSummary: ChatApplicationSummary | null;
  lastMessage: ChatMessage | null;
}

export interface QuickReplyTemplate {
  id: number;
  title: string;
  text: string;
  label: string;
}

type Json = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string => (v == null ? fallback : String(v));

function parseUser(json: unknown): ChatUser {
  const j = (json ?? {}) as Json;
  const firstName = str(j.first_name);
  const lastName = str(j.last_name);
  const full = `${firstName} ${lastName}`.trim();
  return {
    id: Number(j.id ?? 0),
    firstName,
    lastName,
    role: str(j.role),
    avatar: str(j.avatar) || null,
    // Имя в профиле могут не заполнить (на проде так у свежих аккаунтов) —
    // тогда хотя бы роль, а не «Unknown user».
    displayName: full || (/COMPANY/.test(str(j.role)) ? 'Employer' : str(j.role) === 'APPLICANT' ? 'Candidate' : 'Unknown user'),
  };
}

export function parseMessage(json: Json): ChatMessage {
  const audioUrl = str(json.audio_url) || null;
  return {
    id: Number(json.id ?? 0),
    room: Number(json.room ?? 0),
    sender: parseUser(json.sender),
    // Тот же подмен текста, что в мобилке: сервер шлёт русскую подпись
    // автосообщения об отклике.
    text: str(json.text),
    createdAt: new Date(str(json.created_at) || Date.now()),
    suggestions: Array.isArray(json.suggestions) ? json.suggestions.map(String) : [],
    audioUrl,
    audioDuration: json.audio_duration == null ? null : Number(json.audio_duration),
    isVoice: !!audioUrl,
  };
}

function parseRoom(json: Json): ChatRoom {
  return {
    id: Number(json.id),
    chatType: str(json.chat_type, 'DIRECT'),
    unreadCount: Number(json.unread_count ?? 0),
    participants: Array.isArray(json.participants) ? json.participants.map(parseUser) : [],
    peer: json.peer ? parseUser(json.peer) : null,
    applicationSummary: json.application_summary
      ? (() => {
          const s = json.application_summary as Json;
          return {
            applicationId: s.application_id == null ? null : Number(s.application_id),
            vacancyId: s.vacancy_id == null ? null : Number(s.vacancy_id),
            vacancyTitle: str(s.vacancy_title),
            companyId: s.company_id == null ? null : Number(s.company_id),
            companyName: str(s.company_name),
            companyLogoUrl: str(s.company_logo) || null,
          };
        })()
      : null,
    lastMessage: json.last_message ? parseMessage(json.last_message as Json) : null,
  };
}

function unwrapList(data: unknown): Json[] {
  if (Array.isArray(data)) return data as Json[];
  if (data && typeof data === 'object' && Array.isArray((data as Json).results)) {
    return (data as { results: Json[] }).results;
  }
  return [];
}

let templatesMissing = false;

export const chatsApi = {
  async rooms(): Promise<ChatRoom[]> {
    const data = await http.get<unknown>(API.chats.list);
    return unwrapList(data).map(parseRoom);
  },

  async messages(roomId: number, opts: { limit?: number; beforeId?: number } = {}): Promise<ChatMessage[]> {
    const data = await http.get<unknown>(API.chats.messages(roomId), {
      query: { limit: opts.limit ?? 50, before_id: opts.beforeId },
    });
    return unwrapList(data).map(parseMessage);
  },

  async send(roomId: number, text: string): Promise<ChatMessage> {
    const data = await http.post<Json>(API.chats.messages(roomId), { text });
    return parseMessage(data);
  },

  markRead(roomId: number) {
    return http.post<void>(API.chats.read(roomId));
  },

  async replySuggestions(roomId: number): Promise<string[]> {
    const data = await http.get<unknown>(API.chats.replySuggestions(roomId));
    if (Array.isArray(data)) return data.map(String);
    const obj = data as Json | null;
    if (obj && Array.isArray(obj.suggestions)) return obj.suggestions.map(String);
    return [];
  },

  async quickReplies(): Promise<QuickReplyTemplate[]> {
    // Сервер может не знать этой ручки (на проде её нет): после первого 404 больше не спрашиваем.
    if (templatesMissing) return [];
    let data: unknown;
    try {
      data = await http.get<unknown>(API.chats.templates);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        templatesMissing = true;
        return [];
      }
      throw e;
    }
    return unwrapList(data).map((j) => {
      const title = str(j.title).trim();
      const text = str(j.text).trim();
      return { id: Number(j.id ?? 0), title, text, label: title || text };
    });
  },

  startSupport(): Promise<Json> {
    return http.post<Json>(API.chats.startSupport);
  },

  /** Чат по отклику: сервер создаёт его или отдаёт уже существующий. */
  async startForApplication(applicationId: number): Promise<ChatRoom> {
    return parseRoom(await http.post<Json>(API.chats.startForApplication(applicationId)));
  },
};

/**
 * Готовые ответы рекрутёра. Серверных заготовок (/api/chats/templates/) на бэкенде
 * пока нет, и без них у работодателя не было ни одной кнопки быстрого ответа.
 * Id отрицательные, чтобы не пересечься с серверными.
 */
export const BUILT_IN_REPLIES: QuickReplyTemplate[] = [
  { id: -1, title: 'Invite to interview', text: 'Hello {name}, thank you for applying for {vacancy}. We would like to invite you to an interview. Which days and times suit you this week?' },
  { id: -2, title: 'Ask about availability', text: 'Hello {name}, thanks for your interest in {vacancy}. When would you be able to start, and are you currently in the country?' },
  { id: -3, title: 'Ask for documents', text: 'Hello {name}, to move forward with {vacancy} could you please send your updated CV, copies of your certificates and your visa status?' },
  { id: -4, title: 'Ask about last role', text: 'Hello {name}, we liked your profile for {vacancy}. Could you tell us a bit more about your last job and the kind of venue it was?' },
  { id: -5, title: 'Politely decline', text: 'Hello {name}, thank you for your time and interest in {vacancy}. We have decided to continue with other candidates and wish you every success.' },
].map((t) => ({ ...t, label: t.title }));

/** Как renderTemplate, но для встроенных: без имени пишем просто «Hello,», а не оставляем {name} в поле. */
export function renderBuiltIn(t: QuickReplyTemplate, vars: { name?: string; vacancy?: string }): string {
  const name = vars.name?.trim();
  const vacancy = vars.vacancy?.trim();
  return t.text
    .replace(/\s*\{\s*name\s*\}/gi, name ? ` ${name}` : '')
    .replace(/\{\s*vacancy\s*\}/gi, vacancy ? vacancy : 'the position');
}

/** Подставляет {name} и {vacancy} в заготовку ответа — как в мобилке.
 *  Пустое значение оставляет плейсхолдер: рекрутёр увидит его в поле
 *  и допишет сам, а не отправит «Здравствуйте, ,». */
export function renderTemplate(t: QuickReplyTemplate, vars: { name?: string; vacancy?: string }): string {
  let result = t.text;
  if (vars.name?.trim()) result = result.replace(/\{\s*name\s*\}/gi, vars.name.trim());
  if (vars.vacancy?.trim()) result = result.replace(/\{\s*vacancy\s*\}/gi, vars.vacancy.trim());
  return result;
}

/** Событие из вебсокета. Разбираем защитно: одна кривая рамка не должна
 *  ронять соединение. */
export type SocketEvent =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'typing'; userId: number | null; isTyping: boolean }
  | { kind: 'unknown' };

export function parseSocketEvent(raw: unknown): SocketEvent {
  let data: Json;
  try {
    data = JSON.parse(String(raw)) as Json;
  } catch {
    return { kind: 'unknown' };
  }

  if (data.type === 'chat.message' && data.message) {
    return { kind: 'message', message: parseMessage(data.message as Json) };
  }
  if (data.type === 'chat.typing') {
    return {
      kind: 'typing',
      userId: data.user_id == null ? null : Number(data.user_id),
      isTyping: data.is_typing === true,
    };
  }
  return { kind: 'unknown' };
}

export function openRoomSocket(roomId: number): WebSocket {
  return new WebSocket(chatSocketUrl(roomId));
}

export function sendSocketMessage(socket: WebSocket, text: string) {
  socket.send(JSON.stringify({ type: 'chat.message', text }));
}
