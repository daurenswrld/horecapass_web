import { NextRequest } from 'next/server';

/**
 * Прокси к бэкенду HorecaPass.
 *
 * Зачем он вообще нужен: у мобильного приложения нет origin, и CORS его
 * не касается. У браузера — касается, и без заголовков Access-Control-Allow-*
 * ни один запрос с localhost или с домена платформы не пройдёт. Просить
 * бэкендера открыть CORS ради веба — лишняя точка отказа.
 *
 * Почему обработчик, а не rewrites из next.config: rewrites не дают управлять
 * заголовками исходящего запроса. Django на той стороне включён за nginx
 * с редиректом на HTTPS и смотрит на X-Forwarded-Proto. Через rewrites туда
 * уезжало «http» (мы-то на localhost), и сервер отвечал 301 на самого себя
 * вместо ответа по существу.
 */

const API_ORIGIN = process.env.API_ORIGIN ?? 'https://api.horecapass.com';

/** Заголовки, которые нельзя пересылать как есть: они описывают соединение
 *  с нашим сервером, а не с бэкендом. */
const DROP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'cookie',
]);

const DROP_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
]);

async function proxy(req: NextRequest, path: string[]) {
  const target = new URL(`${API_ORIGIN}/${path.join('/')}`);
  // Завершающий слэш обязателен: маршруты Django без него отвечают редиректом.
  if (req.nextUrl.pathname.endsWith('/') && !target.pathname.endsWith('/')) {
    target.pathname += '/';
  }
  target.search = req.nextUrl.search;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!DROP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  // Соединение до бэкенда идёт по HTTPS — говорим об этом явно, иначе
  // Django редиректит на HTTPS и запрос теряет тело.
  headers.set('x-forwarded-proto', 'https');
  headers.set('host', new URL(API_ORIGIN).host);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      // Тело читаем целиком: через прокси ходят и JSON, и multipart с файлами,
      // а стриминг запроса требует duplex-режима, который поддержан не везде.
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json({ detail: 'Бэкенд недоступен.' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!DROP_RESPONSE_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}

export const dynamic = 'force-dynamic';
