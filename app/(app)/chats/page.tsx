'use client';

import * as React from 'react';
import { ChatScreen } from '@/components/chat/chat-screen';
import { Communities } from '@/components/community/communities';
import { cn } from '@/lib/utils';

/**
 * Чаты кандидата. Сервер сам отдаёт комнаты, доступные вошедшему, — так же,
 * как в мобильном приложении. Второй сегмент — Communities (бриф кандидата,
 * пункт 13): «Messages / Communities» внутри той же вкладки. У работодателя
 * (/company/chats) сегмента нет.
 */
export default function Page() {
  const [tab, setTab] = React.useState<'messages' | 'communities'>('messages');

  const segment = (
    <div className="flex rounded-full bg-surface-muted p-1" role="tablist" aria-label="Chats">
      {(['messages', 'communities'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={tab === t}
          onClick={() => setTab(t)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-ring',
            tab === t ? 'bg-accent-strong text-on-accent dark:bg-accent' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {t === 'messages' ? 'Messages' : 'Communities'}
        </button>
      ))}
    </div>
  );

  return tab === 'messages' ? <ChatScreen segment={segment} /> : <Communities segment={segment} />;
}
