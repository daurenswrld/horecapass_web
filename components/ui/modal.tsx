'use client';

import * as React from 'react';

/**
 * Диалог: закрывается по Esc и по клику на фон, фокус уходит внутрь и
 * возвращается на кнопку, которая его открыла.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // onClose держим в ref: родитель передаёт новую функцию на каждом рендере, и
  // эффект с ней в зависимостях перебрасывал бы фокус на первое поле при
  // каждом нажатии клавиши.
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('textarea, input, select, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="fade-in absolute inset-0 bg-black/40" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pop-in relative w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-lift"
      >
        <h2 id={titleId} className="text-lg font-semibold text-heading">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
