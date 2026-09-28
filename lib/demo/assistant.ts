'use client';

import * as React from 'react';

/**
 * Какой помощник ведёт человека по онбордингу — женщина или мужчина
 * в костюме рекрутёра. Созвон 22.09: «можно сделать два варианта аватара:
 * мужчина и женщина. В настройках дать возможность выбора».
 *
 * Выбор хранится в браузере (на сервере поля нет) и применяется сразу во всех
 * местах через событие — без перезагрузки страницы.
 */

export type AssistantKind = 'woman' | 'man';

const KEY = 'hp_assistant';
const EVENT = 'hp-assistant-change';

export const ASSISTANTS: Record<AssistantKind, { label: string; photo: string; talk: string; avatar: string }> = {
  woman: {
    label: 'Woman',
    photo: '/landing/recruiter.webp',
    talk: '/landing/recruiter-talk.webp',
    avatar: '/landing/recruiter-avatar.webp',
  },
  man: {
    label: 'Man',
    photo: '/landing/recruiter-man.webp',
    talk: '/landing/recruiter-man.webp',
    avatar: '/landing/recruiter-man-avatar.webp',
  },
};

function read(): AssistantKind {
  if (typeof window === 'undefined') return 'woman';
  try {
    return window.localStorage.getItem(KEY) === 'man' ? 'man' : 'woman';
  } catch {
    return 'woman';
  }
}

export function setAssistant(kind: AssistantKind) {
  try {
    window.localStorage.setItem(KEY, kind);
  } catch {
    /* приватный режим — выбор проживёт до перезагрузки */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Текущий помощник. До гидрации — женщина (утверждённый вариант макета). */
export function useAssistant() {
  const [kind, setKind] = React.useState<AssistantKind>('woman');
  React.useEffect(() => {
    const sync = () => setKind(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { kind, ...ASSISTANTS[kind] };
}
