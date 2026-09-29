'use client';

import * as React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

/**
 * Карта в блоке Location — «Company profile preview», вариант 189 макета
 * (карта города с меткой). OpenStreetMap: без ключа, без рекламных кук.
 *
 * Адрес в координаты переводит Nominatim. По его правилам — не больше
 * запроса в секунду и без автодополнения, поэтому ищем один раз на адрес
 * и запоминаем ответ до перезагрузки страницы.
 */

type Point = { lat: number; lon: number };

const cache = new Map<string, Promise<Point | null>>();

function geocode(query: string): Promise<Point | null> {
  const key = query.trim().toLowerCase();
  let hit = cache.get(key);
  if (!hit) {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: query.trim(),
      format: 'jsonv2',
      limit: '1',
      'accept-language': 'en',
    })}`;
    hit = fetch(url, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ lat: string; lon: string }>) =>
        rows[0] ? { lat: Number(rows[0].lat), lon: Number(rows[0].lon) } : null,
      )
      // Сбой сети не запоминаем: при следующем показе попробуем снова.
      .catch(() => {
        cache.delete(key);
        return null;
      });
    cache.set(key, hit);
  }
  return hit;
}

/** Окно вокруг точки — примерно несколько кварталов, как на макете. */
function embedUrl({ lat, lon }: Point) {
  const dLat = 0.01;
  const dLon = 0.02;
  const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat].map((n) => n.toFixed(5)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lon.toFixed(5)}`;
}

export function LocationMap({ address }: { address: string }) {
  const [point, setPoint] = React.useState<Point | null | undefined>(undefined);

  React.useEffect(() => {
    let alive = true;
    setPoint(undefined);
    geocode(address).then((p) => alive && setPoint(p));
    return () => {
      alive = false;
    };
  }, [address]);

  return (
    <div className="mt-2 space-y-2">
      <p className="flex items-center gap-2 text-sm text-text-primary">
        <MapPin size={16} aria-hidden className="text-danger" />
        {address}
      </p>

      {/* Не нашли адрес — остаётся строка выше, пустую рамку не показываем. */}
      {point !== null && (
        <div className="overflow-hidden rounded-md border border-line bg-surface-muted">
          {point ? (
            <iframe
              title={`Map: ${address}`}
              src={embedUrl(point)}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="block h-44 w-full border-0 sm:h-52"
            />
          ) : (
            <div className="h-44 animate-pulse sm:h-52" aria-hidden />
          )}
        </div>
      )}

      {point && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=16/${point.lat}/${point.lon}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-text-secondary underline-offset-2 hover:underline focus-ring"
        >
          Open larger map
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
    </div>
  );
}
