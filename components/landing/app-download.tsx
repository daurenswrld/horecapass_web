import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';
import { STORES, type StoreLink } from '@/lib/stores';

/**
 * Блок «скачать приложение»: QR-коды и кнопки магазинов.
 *
 * Серверный компонент — QR-коды рисуются при сборке страницы и уезжают
 * в HTML готовой разметкой. Ни библиотеки в браузер, ни обращения к чужому
 * сервису вроде api.qrserver.com: чужой сервис — это и внешняя зависимость,
 * и утечка того, кто именно смотрит страницу.
 */

/** QR как SVG, перекрашиваемый темой. */
async function qrSvg(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: '#000000', light: '#00000000' },
  });
  // Библиотека печатает цвет числом; подменяем на currentColor, чтобы код
  // читался и в светлой, и в тёмной теме без второй картинки.
  return svg
    .replace(/fill="#000000"/g, 'fill="currentColor"')
    .replace(/stroke="#000000"/g, 'stroke="currentColor"')
    .replace('<svg', '<svg role="img" aria-hidden="true" style="width:100%;height:100%"');
}

/** Значок магазина.
 *
 * Нарисован нейтрально и намеренно: официальные бейджи «Download on the
 * App Store» и «Get it on Google Play» — фирменные материалы Apple и Google,
 * их полагается брать из их же наборов, а не перерисовывать. Перед публичным
 * запуском сюда нужно положить официальные файлы. */
function StoreGlyph({ id }: { id: StoreLink['id'] }) {
  if (id === 'ios') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 18.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M5 3.5v17c0 .8.9 1.3 1.6.9l13-8.5c.6-.4.6-1.3 0-1.7l-13-8.5c-.7-.5-1.6 0-1.6.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

async function StoreCard({ store }: { store: StoreLink }) {
  const qr = store.url ? await qrSvg(store.url) : null;

  const badge = (
    <span className="flex items-center gap-3">
      <StoreGlyph id={store.id} />
      <span className="text-left leading-tight">
        <span className="block text-[11px] uppercase tracking-wide opacity-80">
          {store.url ? store.caption : 'Coming soon to'}
        </span>
        <span className="block text-base font-semibold">{store.name}</span>
      </span>
    </span>
  );

  return (
    <div className="flex items-center gap-5 rounded-lg border border-line bg-surface p-5">
      <div
        className="grid h-28 w-28 shrink-0 place-items-center rounded-sm border border-line bg-qr-surface p-2 text-qr-ink"
        aria-hidden={!qr}
      >
        {qr ? (
          <span className="h-full w-full" dangerouslySetInnerHTML={{ __html: qr }} />
        ) : (
          <span className="px-2 text-center text-[11px] leading-tight text-qr-ink">
            QR appears after release
          </span>
        )}
      </div>

      <div className="min-w-0">
        {store.url ? (
          <a
            href={store.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-accent-strong px-5 py-3 text-on-accent transition-colors hover:brightness-95 focus-ring"
          >
            {badge}
          </a>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center rounded-full bg-accent-muted px-5 py-3 text-on-accent-muted"
            aria-disabled
          >
            {badge}
          </span>
        )}

        <p className="mt-3 text-sm text-text-secondary">{store.requirement}</p>
        {store.url && (
          <p className="mt-1 text-sm text-text-secondary">Point your phone camera at the code</p>
        )}
      </div>
    </div>
  );
}

export async function AppDownload() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent-muted">
          <Smartphone size={24} className="text-accent-text" />
        </span>
        <p className="max-w-2xl leading-relaxed text-text-secondary">
          Applications, chats and your CV stay in sync. Video intros and voice messages are
          recorded right in the app.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {STORES.map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </div>
    </div>
  );
}
