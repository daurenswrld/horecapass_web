'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Ввод шестизначного кода — как в мобилке: отдельные ячейки, автопереход
 * вперёд, Backspace возвращает назад.
 *
 * Отдельно обработана вставка: код приходит письмом, и первое, что делает
 * человек за компьютером, — копирует его целиком. Без этого вставка попадёт
 * в одну ячейку и обрежется до символа.
 */

interface Props {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}

export function CodeInput({ value, onChange, onComplete, length = 6, disabled, invalid }: Props) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Поле кода появляется после «Get code» — сразу ставим курсор в первую
  // клетку, чтобы код можно было просто набрать или вставить, без лишнего клика.
  React.useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;

    if (digits.length > 1) {
      // Вставка целиком: раскладываем от текущей ячейки.
      const next = (value.slice(0, i) + digits).slice(0, length);
      set(next);
      refs.current[Math.min(next.length, length - 1)]?.focus();
      return;
    }

    const chars = value.padEnd(length, ' ').split('');
    chars[i] = digits;
    set(chars.join('').trimEnd());
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) {
        set(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        set(value.slice(0, i - 1));
        refs.current[i - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Code from the email">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          maxLength={length}
          className={cn(
            'h-14 w-12 rounded border bg-surface text-center text-xl font-semibold text-text-primary',
            'transition-colors focus-ring disabled:opacity-60',
            invalid ? 'border-danger' : 'border-line-strong',
          )}
        />
      ))}
    </div>
  );
}
