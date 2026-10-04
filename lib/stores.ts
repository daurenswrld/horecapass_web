/**
 * Ссылки на магазины приложений.
 *
 * Единственное место, где они заданы. Появится приложение в сторе — правится
 * этот файл, и ссылки с QR-кодами на лендинге обновятся сами.
 */

/**
 * App Store: приложение вышло 29.09.2026 (bundle com.horecapass.app, iOS 15+).
 * Адрес без страны — Apple сам откроет витрину страны пользователя.
 */
export const APP_STORE_URL: string | null = 'https://apps.apple.com/app/id6810680039';

/**
 * Google Play: приложения там пока нет. Раньше адрес строился из
 * kz.zizinc.horecapass и вёл на 404 — теперь до публикации честное «скоро».
 * Как выйдет, подставить сюда адрес со страницы приложения в Google Play.
 */
export const GOOGLE_PLAY_URL: string | null = null;

export interface StoreLink {
  id: 'ios' | 'android';
  name: string;
  /** Что написано мелким шрифтом над названием магазина. */
  caption: string;
  url: string | null;
  /** Минимальные требования — их спрашивают чаще, чем кажется. */
  requirement: string;
}

export const STORES: readonly StoreLink[] = [
  {
    id: 'ios',
    name: 'App Store',
    caption: 'Download on the',
    url: APP_STORE_URL,
    requirement: 'iOS 15 and later',
  },
  {
    id: 'android',
    name: 'Google Play',
    caption: 'Get it on',
    url: GOOGLE_PLAY_URL,
    requirement: 'Android 5.0 and later',
  },
];
