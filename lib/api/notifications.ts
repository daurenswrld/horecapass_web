import { API } from './endpoints';
import { http } from './client';

/**
 * Уведомления. Их создаёт сервер: новый отклик (работодателю), смена этапа
 * (кандидату), назначенная встреча, системные. Мобилка их уже показывает,
 * вебу они были не нужны, пока не стало понятно, что без них работодатель
 * узнаёт об отклике только зайдя в раздел Candidates.
 */

export type NotificationType = 'APPLICATION_RECEIVED' | 'STATUS_CHANGED' | 'MEETING_SCHEDULED' | 'SYSTEM';

export interface AppNotification {
  id: number;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

type Json = Record<string, unknown>;

function parse(j: Json): AppNotification {
  return {
    id: Number(j.id),
    type: String(j.type ?? 'SYSTEM'),
    title: String(j.title ?? ''),
    message: String(j.message ?? ''),
    isRead: Boolean(j.is_read),
    createdAt: new Date(String(j.created_at ?? Date.now())),
  };
}

function unwrap(data: unknown): Json[] {
  if (Array.isArray(data)) return data as Json[];
  const results = (data as { results?: unknown } | null)?.results;
  return Array.isArray(results) ? (results as Json[]) : [];
}

export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    return unwrap(await http.get<unknown>(API.misc.notifications)).map(parse);
  },
  markRead(id: number) {
    return http.post<unknown>(API.misc.notificationRead(id));
  },
  markAllRead() {
    return http.post<unknown>(API.misc.notificationsReadAll);
  },
};
