import { API } from "./endpoints";
import { demoResponse, demoSession } from "@/lib/demo/session";

/**
 * HTTP-клиент.
 *
 * Повторяет поведение мобильного ApiClient (lib/core/api/api_client.dart),
 * потому что бэкенд один и ведёт себя одинаково с обоими клиентами:
 *
 *  • Bearer-токен во всех запросах, кроме самих auth-эндпоинтов.
 *  • На 401 — одна попытка обновить пару токенов и повторить запрос.
 *  • Параллельные 401 делят один запрос обновления (single-flight), иначе
 *    десять висящих запросов устроят десять refresh и сервер их отвергнет.
 *  • Повторяем запрос ровно один раз: без этого флага свежий токен, который
 *    тоже вернул 401, уводил мобилку в бесконечный цикл.
 */

/** Всё идёт через прокси Next (см. rewrites в next.config.ts): у мобилки нет
 *  origin и CORS её не касается, у браузера — касается. */
const BASE_URL = "/backend";

const ACCESS_KEY = "hp_access";
const REFRESH_KEY = "hp_refresh";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}

/** Токены живут в localStorage: это SPA-часть, серверных сессий здесь нет.
 *  На сервере (SSR) их нет вовсе — публичные страницы рендерятся анонимно. */
export const tokens = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  save(access: string, refresh: string) {
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

const AUTH_PATHS = [API.auth.sendCode, API.auth.verifyCode, API.auth.refresh];
const isAuthPath = (path: string) => AUTH_PATHS.some((p) => path.startsWith(p));

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  // Single-flight: сколько бы запросов ни словили 401, refresh уйдёт один.
  refreshInFlight ??= (async () => {
    try {
      const refresh = tokens.refresh;
      if (!refresh) return false;

      const res = await fetch(BASE_URL + API.auth.refresh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;

      const data = (await res.json()) as { access?: string; refresh?: string };
      if (!data.access) return false;

      // Сервер может не вернуть новый refresh — тогда оставляем прежний.
      tokens.save(data.access, data.refresh ?? refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Служебный флаг: запрос уже повторяли после refresh. */
  __retried?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, __retried, headers, ...rest } = options;

  // Демо-сессия (только dev): закрытые запросы отвечаются локально,
  // публичные уходят на сервер без токена. См. lib/demo/session.ts.
  const demo = demoResponse(path, (rest.method ?? "GET").toUpperCase());
  if (demo) return demo.value as T;
  const inDemo = demoSession.get() !== null;
  // «Для вас» в демо — общий список: на сервере нет профиля демо-кандидата.
  if (inDemo && path.startsWith(API.vacancies.matches)) path = API.vacancies.list;

  let url = path.startsWith("http") ? path : BASE_URL + path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += (url.includes("?") ? "&" : "?") + s;
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const h = new Headers(headers);
  h.set("Accept", "application/json");
  if (body !== undefined && !isFormData)
    h.set("Content-Type", "application/json");

  const access = inDemo ? null : tokens.access;
  if (access && !isAuthPath(path)) h.set("Authorization", `Bearer ${access}`);

  const res = await fetch(url, {
    ...rest,
    headers: h,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (res.status === 401 && !isAuthPath(path) && !__retried) {
    const ok = await refreshTokens();
    if (ok) return request<T>(path, { ...options, __retried: true });
    tokens.clear();
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      /* тело может быть пустым или не-JSON — статуса достаточно */
    }
    throw new ApiError(res.status, payload);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/** Вебсокет чата — тот же адрес и тот же способ передать токен, что в мобилке. */
export function chatSocketUrl(chatId: string | number): string {
  // Прокси Next не туннелирует вебсокеты, поэтому чат подключается к серверу
  // напрямую. Токен передаётся в query — так же, как это делает мобилка.
  const origin = process.env.NEXT_PUBLIC_WS_ORIGIN ?? "wss://api.horecapass.com";
  return `${origin}${API.chats.socket(chatId)}?token=${tokens.access ?? ""}`;
}
