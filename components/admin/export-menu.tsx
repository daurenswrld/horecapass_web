'use client';

import * as React from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { downloadCsv, downloadXlsx, printPdf, type Report } from '@/lib/export';
import { cn } from '@/lib/utils';

/** «Download»: CSV, Excel или PDF — для любой таблицы админки. */
export function ExportMenu<T>({
  report,
  disabled,
  className,
}: {
  /** Может быть асинхронным: например, догрузить все страницы списка. */
  report: () => Report<T> | Promise<Report<T>>;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const run = async (kind: 'xlsx' | 'csv' | 'pdf') => {
    setOpen(false);
    setNote(null);
    const win = kind === 'pdf' ? window.open('', '_blank', 'width=1100,height=800') : null;
    if (kind === 'pdf' && !win) {
      setNote('Allow pop-ups for this site to save as PDF.');
      return;
    }
    setBusy(true);
    try {
      const r = await report();
      if (kind === 'xlsx') downloadXlsx(r);
      else if (kind === 'csv') downloadCsv(r);
      else printPdf(r, win);
    } catch {
      win?.close();
      setNote('Could not prepare the file. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const item = 'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface-muted focus-ring';
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled || busy}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted disabled:opacity-50 focus-ring"
      >
        <Download size={15} aria-hidden />
        {busy ? 'Preparing…' : 'Download'}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-48 rounded-lg border border-line bg-surface p-1.5 shadow-lift">
          <button type="button" className={item} onClick={() => void run('xlsx')}>
            <FileSpreadsheet size={16} aria-hidden className="text-success" />
            Excel (.xlsx)
          </button>
          <button type="button" className={item} onClick={() => void run('csv')}>
            <FileText size={16} aria-hidden className="text-text-secondary" />
            CSV
          </button>
          <button type="button" className={item} onClick={() => void run('pdf')}>
            <Printer size={16} aria-hidden className="text-danger" />
            PDF
          </button>
        </div>
      )}
      {note && <p className="absolute right-0 top-11 w-56 text-xs text-danger">{note}</p>}
    </div>
  );
}
