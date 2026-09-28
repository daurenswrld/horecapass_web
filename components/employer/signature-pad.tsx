'use client';

import * as React from 'react';
import { Eraser } from 'lucide-react';

/**
 * Подпись от руки — требование заказчицы от 17.09: «чтоб человек, кто
 * подписывает, написал своё имя и прям роспись поставил».
 *
 * Pointer events, а не mouse/touch по отдельности: одна реализация для мыши,
 * пальца и стилуса. Подпись отдаётся как PNG data URL.
 */
export function SignaturePad({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const dirty = React.useRef(false);

  // Холст в пикселях экрана, иначе на ретине линия мыльная. Сохранённую
  // подпись рисуем заново — после перезагрузки она не должна пропасть.
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    c.width = Math.round(width * ratio);
    c.height = Math.round(height * ratio);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(c).color;
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = value;
    }
    // Только при монтировании: дальше холст — источник истины.
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const [x, y] = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const [x, y] = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  };

  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange(e.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    dirty.current = false;
    onChange(null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          aria-label="Signature. Draw with a mouse, finger or stylus."
          role="img"
          className="h-40 w-full touch-none rounded-md border border-line-strong bg-surface text-heading"
        />
        {!value && (
          <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-line-strong pb-1 text-xs text-text-tertiary">
            Sign here
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={!value}
        className="mt-2 inline-flex items-center gap-1.5 rounded text-sm text-text-secondary transition-colors hover:text-text-primary focus-ring disabled:opacity-40"
      >
        <Eraser size={14} aria-hidden />
        Clear
      </button>
    </div>
  );
}
