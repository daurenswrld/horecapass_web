'use client';

import * as React from 'react';

/**
 * Язык голосового ввода. Aldi, 29.09: голос — на русском, английском
 * и арабском; резюме потом переводится на английский (перевод — на сервере,
 * см. ТЗ, пункт про распознавание речи).
 *
 * Распознаёт браузер (Web Speech API), поэтому язык передаём ему. Выбор
 * хранится в браузере и сразу применяется во всех кнопках Voice.
 */

export const VOICE_LANGS = [
  { code: 'en-US', short: 'EN', label: 'English' },
  { code: 'ru-RU', short: 'RU', label: 'Русский' },
  { code: 'ar-SA', short: 'AR', label: 'العربية' },
] as const;

export type VoiceLang = (typeof VOICE_LANGS)[number]['code'];

const KEY = 'hp_voice_lang';
const EVENT = 'hp-voice-lang-change';

/** Без сохранённого выбора — язык браузера, если он из списка. */
function fromBrowser(): VoiceLang {
  const l = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
  if (l.startsWith('ru')) return 'ru-RU';
  if (l.startsWith('ar')) return 'ar-SA';
  return 'en-US';
}

export function readVoiceLang(): VoiceLang {
  if (typeof window === 'undefined') return 'en-US';
  try {
    const v = window.localStorage.getItem(KEY);
    if (VOICE_LANGS.some((x) => x.code === v)) return v as VoiceLang;
  } catch {
    /* приватный режим */
  }
  return fromBrowser();
}

export function setVoiceLang(code: VoiceLang) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    /* приватный режим — выбор проживёт до перезагрузки */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useVoiceLang(): VoiceLang {
  const [lang, setLang] = React.useState<VoiceLang>('en-US');
  React.useEffect(() => {
    const sync = () => setLang(readVoiceLang());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return lang;
}
