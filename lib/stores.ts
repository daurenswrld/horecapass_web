/**
 * Ссылки на магазины приложений.
 *
 * Единственное место, где они заданы. Появится приложение в сторе — правится
 * этот файл, и ссылки с QR-кодами на лендинге обновятся сами.
 */

/** Идентификатор сборки: android/app/build.gradle.kts и ios/Runner.xcodeproj. */
export const BUNDLE_ID = 'kz.zizinc.horecapass';

/**
 * Адрес в Google Play выводится из applicationId и будет рабочим сразу после
 * публикации — угадывать ничего не нужно.
 */
export const GOOGLE_PLAY_URL = `https://play.google.com/store/apps/details?id=${BUNDLE_ID}`;

/**
 * App Store так не умеет: там в адресе числовой идентификатор, который
 * выдаётся при создании записи в App Store Connect. Пока его нет — оставляем
 * null, и кнопка честно показывает «скоро», а не ведёт в никуда.
 *
 * Как появится, подставить сюда:
 *   export const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';
 */
export const APP_STORE_URL: string | null = null;

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
    caption: 'Загрузить в',
    url: APP_STORE_URL,
    requirement: 'iOS 15 и новее',
  },
  {
    id: 'android',
    name: 'Google Play',
    caption: 'Доступно в',
    url: GOOGLE_PLAY_URL,
    requirement: 'Android 5.0 и новее',
  },
];
