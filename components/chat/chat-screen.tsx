'use client';

import * as React from 'react';
import { MessageSquare, Mic, RefreshCw, Send } from 'lucide-react';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { DemoNotice } from '@/components/demo-notice';
import {
  chatsApi,
  openRoomSocket,
  parseSocketEvent,
  renderTemplate,
  sendSocketMessage,
  type ChatMessage,
  type ChatRoom,
  type QuickReplyTemplate,
} from '@/lib/api/chats';
import { isSample, SAMPLE_MESSAGES, SAMPLE_ROOMS } from '@/lib/demo/samples';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/**
 * Chats. Повторяет экраны *_chats_screen.dart и *_chat_conversation_live_screen.dart
 * мобилки: список комнат, история по REST, живые сообщения вебсокетом.
 *
 * На телефоне это два экрана, здесь — две колонки: переписка открывается
 * рядом со списком, как в любом настольном мессенджере.
 *
 * Раздел заказчица не правила, поэтому поведение перенесено как есть.
 * Голосовые сообщения только слушаются: запись оставлена приложению —
 * так же написано и на лендинге.
 */

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const DAY_FMT = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' });

function roomTitle(room: ChatRoom): string {
  if (room.chatType === 'SUPPORT') return 'Support';
  if (room.chatType === 'ASSISTANT') return 'Assistant';
  return room.peer?.displayName ?? room.applicationSummary?.companyName ?? 'Chat';
}

function roomSubtitle(room: ChatRoom): string | null {
  const s = room.applicationSummary;
  if (!s) return null;
  return [s.vacancyTitle, s.companyName].filter(Boolean).join(' · ') || null;
}

/** logo — вместо фото собеседника логотип компании: вписываем целиком, не обрезая. */
function Avatar({ name, url, size = 40, logo = false }: { name: string; url?: string | null; size?: number; logo?: boolean }) {
  const [broken, setBroken] = React.useState(false);
  if (url && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        onError={() => setBroken(true)}
        style={{ width: size, height: size, padding: logo ? size * 0.12 : undefined }}
        className={cn('shrink-0 rounded-full', logo ? 'border border-line bg-white object-contain' : 'object-cover')}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-surface-alt text-sm font-semibold text-text-secondary"
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function RoomRow({ room, active, onClick }: { room: ChatRoom; active: boolean; onClick: () => void }) {
  const last = room.lastMessage;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-[border-color,box-shadow] focus-ring',
        active ? 'border-accent bg-surface shadow-card' : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <Avatar name={roomTitle(room)} url={room.peer?.avatar ?? room.applicationSummary?.companyLogoUrl} logo={!room.peer?.avatar} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold text-text-primary">{roomTitle(room)}</span>
          {last && (
            <span className="shrink-0 text-xs text-text-secondary">{TIME_FMT.format(last.createdAt)}</span>
          )}
        </span>
        {roomSubtitle(room) && (
          <span className="mt-0.5 block truncate text-xs text-text-secondary">{roomSubtitle(room)}</span>
        )}
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-text-secondary">
            {last ? (last.isVoice ? 'Voice message' : last.text) : 'No messages yet'}
          </span>
          {room.unreadCount > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent-strong px-1.5 text-xs font-semibold text-on-accent">
              {room.unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function Bubble({ message, own }: { message: ChatMessage; own: boolean }) {
  return (
    <div className={cn('flex gap-2.5', own && 'justify-end')}>
      {!own && <Avatar name={message.sender.displayName} url={message.sender.avatar} size={30} />}
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
          own ? 'bg-accent-strong text-on-accent' : 'bg-surface text-text-primary shadow-card',
        )}
      >
        {message.isVoice ? (
          <span className="flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <Mic size={15} />
              Voice message
              {message.audioDuration ? ` · ${message.audioDuration}s` : ''}
            </span>
            {/* Слушать можно, записывать — нет: запись оставлена приложению. */}
            <audio controls preload="none" src={message.audioUrl ?? undefined} className="max-w-full" />
          </span>
        ) : (
          <span className="whitespace-pre-line">{message.text}</span>
        )}
        <span className={cn('mt-1 block text-[11px]', own ? 'opacity-70' : 'text-text-secondary')}>
          {TIME_FMT.format(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

/** Разделитель дня в ленте. */
function DayDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs text-text-secondary">{DAY_FMT.format(date)}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function Conversation({ room, onRead }: { room: ChatRoom; onRead: (roomId: number) => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [live, setLive] = React.useState(false);
  const [templates, setTemplates] = React.useState<QuickReplyTemplate[]>([]);
  const endRef = React.useRef<HTMLDivElement>(null);
  const socketRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessages([]);

    if (isSample(room.id)) {
      setMessages(SAMPLE_MESSAGES);
      setLoading(false);
      onRead(room.id);
      return;
    }

    chatsApi
      .messages(room.id)
      .then((list) => {
        if (cancelled) return;
        // Сервер отдаёт свежие первыми — в ленте нужен обратный порядок.
        setMessages([...list].reverse());
        void chatsApi.markRead(room.id).then(() => onRead(room.id)).catch(() => {});
      })
      .catch(() => !cancelled && setError('Could not load the conversation.'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [room.id, onRead]);

  // Живое соединение. Departmentьно от загрузки истории: если вебсокет не поднялся,
  // переписку всё равно можно читать и отправлять сообщения по REST.
  React.useEffect(() => {
    if (isSample(room.id)) return;

    let socket: WebSocket | null = null;
    try {
      socket = openRoomSocket(room.id);
    } catch {
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => setLive(true);
    socket.onclose = () => setLive(false);
    socket.onerror = () => setLive(false);
    socket.onmessage = (e) => {
      const event = parseSocketEvent(e.data);
      if (event.kind !== 'message') return;
      setMessages((prev) =>
        // Своё сообщение уже добавлено оптимистично — не задваиваем.
        prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message],
      );
    };

    return () => {
      socketRef.current = null;
      socket?.close();
    };
  }, [room.id]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  // Заготовки ответов есть только у компании; соискателю сервер вернёт 403.
  React.useEffect(() => {
    chatsApi.quickReplies().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText('');
    try {
      // Через вебсокет, если он поднят, иначе обычным запросом.
      if (isSample(room.id)) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), room: room.id, sender: { id: user?.id ?? 0, firstName: 'You', lastName: '', role: '', avatar: null, displayName: 'You' },
            text: value, createdAt: new Date(), suggestions: [], audioUrl: null, audioDuration: null, isVoice: false },
        ]);
        return;
      }

      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendSocketMessage(socket, value);
      } else {
        const sent = await chatsApi.send(room.id, value);
        setMessages((prev) => [...prev, sent]);
      }
    } catch {
      setError('Message not sent. Please try again.');
      setText(value);
    } finally {
      setSending(false);
    }
  };

  let lastDay = '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <Avatar name={roomTitle(room)} url={room.peer?.avatar ?? room.applicationSummary?.companyLogoUrl} logo={!room.peer?.avatar} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text-primary">{roomTitle(room)}</p>
          {roomSubtitle(room) && (
            <p className="truncate text-xs text-text-secondary">{roomSubtitle(room)}</p>
          )}
        </div>
        <span
          className={cn('text-xs', live ? 'text-success' : 'text-text-secondary')}
          title={live ? 'New messages arrive instantly' : 'No live connection, messages are sent as regular requests'}
        >
          {live ? 'live' : 'offline'}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 scroll-slim">
        {loading && (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && <p className="text-sm text-danger">{error}</p>}

        {!loading && !error && messages.length === 0 && (
          <p className="py-16 text-center text-sm text-text-secondary">
            No messages yet. Say hello.
          </p>
        )}

        {messages.map((m) => {
          const day = m.createdAt.toDateString();
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={`${m.id}-${m.createdAt.getTime()}`}>
              {showDay && <DayDivider date={m.createdAt} />}
              <Bubble message={m} own={!!user && m.sender.id === user.id} />
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      {templates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-line px-5 py-2.5 scroll-slim">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setText(
                  renderTemplate(t, {
                    name: room.peer?.firstName,
                    vacancy: room.applicationSummary?.vacancyTitle,
                  }),
                )
              }
              className="shrink-0 rounded-full bg-surface-muted px-3.5 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary focus-ring"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex items-end gap-2 border-t border-line px-5 py-3.5"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter отправляет, Shift+Enter переносит строку — как принято
            // в мессенджерах на компьютере.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Message"
          aria-label="Message text"
          className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring scroll-slim"
        />
        <Button type="submit" disabled={!text.trim() || sending} className="shrink-0">
          <Send size={16} />
          Send
        </Button>
      </form>
    </div>
  );
}

/** `segment` — переключатель Messages / Communities у кандидата (бриф, пункт 13). */
export function ChatScreen({ segment }: { segment?: React.ReactNode } = {}) {
  const [rooms, setRooms] = React.useState<ChatRoom[]>([]);
  const [selected, setSelected] = React.useState<ChatRoom | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [sample, setSample] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    chatsApi
      .rooms()
      .then((list) => {
        if (cancelled) return;
        // На новом аккаунте переписок нет — показываем sample, иначе раздел
        // выглядит сломанным.
        setSample(list.length === 0);
        list = list.length > 0 ? list : SAMPLE_ROOMS;
        setRooms(list);
        setSelected((prev) => (prev && list.some((r) => r.id === prev.id) ? prev : (list[0] ?? null)));
      })
      .catch(() => {
        if (cancelled) return;
        setSample(true);
        setRooms(SAMPLE_ROOMS);
        setSelected(SAMPLE_ROOMS[0]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const clearUnread = React.useCallback((roomId: number) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)));
  }, []);

  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0);

  return (
    <>
      <PageHeader
        title="Chats"
        subtitle={loading ? undefined : totalUnread > 0 ? `Unread: ${totalUnread}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            {segment}
            <Button variant="secondary" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw size={15} />
              Refresh
            </Button>
          </div>
        }
      />

      {sample && (
        <div className="px-5 pt-4 md:px-8">
          <DemoNotice what="There are no chats on the server yet, so this is a sample conversation with a candidate. Messages sent here go nowhere." />
        </div>
      )}

      <div className="grid gap-4 px-5 pb-6 pt-4 md:px-8 lg:h-[calc(100dvh-8.5rem)] lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-2.5 lg:min-h-0 lg:overflow-y-auto lg:pr-1 scroll-slim">
          {loading && (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          )}

          {!loading && error && (
            <Card className="p-5">
              <p className="text-sm text-danger">{error}</p>
            </Card>
          )}

          {!loading && !error && rooms.length === 0 && (
            <Card className="p-8 text-center">
              <MessageSquare size={22} className="mx-auto text-text-secondary" />
              <p className="mt-3 font-medium text-text-primary">No chats yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Chats appear once you apply to a job.
              </p>
            </Card>
          )}

          {rooms.map((r) => (
            <RoomRow key={r.id} room={r} active={selected?.id === r.id} onClick={() => setSelected(r)} />
          ))}
        </div>

        <Card className="hidden min-h-0 overflow-hidden p-0 lg:flex lg:flex-col">
          {selected ? (
            <Conversation room={selected} onRead={clearUnread} />
          ) : (
            <p className="grid flex-1 place-items-center p-8 text-center text-sm text-text-secondary">
              Pick a conversation on the left.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
