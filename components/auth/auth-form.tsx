'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CodeInput } from './code-input';
import { Button, Field, Spinner } from '@/components/ui/primitives';
import { authApi, type BackendRole, type Purpose } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { homeFor, useAuth } from '@/lib/auth/context';

/**
 * Sign in и регистрация. Два шага в одном экране, как в login_screen.dart мобилки:
 * сначала почта, потом код из письма. Пароля в продукте нет.
 */

interface Props {
  purpose: Purpose;
  role?: BackendRole;
  /** Company name — нужно только при регистрации работодателя. */
  companyName?: string;
  title: string;
  subtitle: string;
}

type Step = 'contact' | 'code';

/** Сообщения сервера приходят по-разному: строкой, списком или словарём полей.
 *  Показываем человеку первое осмысленное, а не «[object Object]». */
function readError(e: unknown): string {
  if (e instanceof ApiError) {
    const p = e.payload;
    if (typeof p === 'string' && p.trim()) return p;
    if (p && typeof p === 'object') {
      for (const v of Object.values(p as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim()) return v;
        if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
      }
    }
    if (e.status === 400) return 'Check the code: it is wrong or has expired.';
    if (e.status === 404) return 'No account with this email. Please sign up.';
    if (e.status === 429) return 'Too many attempts. Please wait a minute.';
    return `The server returned error ${e.status}.`;
  }
  // fetch падает так при обрыве сети или недоступном бэкенде.
  return 'Could not reach the server. Check your connection.';
}

const RESEND_SECONDS = 60;

export function AuthForm({ purpose, role, companyName, title, subtitle }: Props) {
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = React.useState<Step>('contact');
  const [contact, setContact] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [debugCode, setDebugCode] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  // Обратный отсчёт до повторной отправки.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.sendCode(contact.trim(), purpose, role);
      setDebugCode(res?.debug_code ?? null);
      setStep('code');
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError(readError(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    setError(null);
    setBusy(true);
    try {
      await authApi.verifyCode({
        contact: contact.trim(),
        code: value,
        purpose,
        role,
        companyName,
      });
      // Токены уже сохранены; тянем профиль, чтобы узнать роль и куда вести.
      const me = await authApi.me();
      await refresh();
      router.replace(homeFor(me));
    } catch (e) {
      setError(readError(e));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const emailLooksValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.trim());

  return (
    <div className="w-full">
      {step === 'code' && (
        <button
          type="button"
          onClick={() => {
            setStep('contact');
            setCode('');
            setError(null);
          }}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary focus-ring"
        >
          <ArrowLeft size={16} />
          Change email
        </button>
      )}

      <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
        {step === 'contact' ? subtitle : `We sent a six-digit code to ${contact.trim()}`}
      </p>

      <div className="mt-6 space-y-4">
        {step === 'contact' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailLooksValid && !busy) void send();
            }}
            className="space-y-4"
          >
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="name@example.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              error={error}
            />
            <Button type="submit" full size="lg" disabled={!emailLooksValid || busy}>
              {busy ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : 'Get code'}
            </Button>
          </form>
        ) : (
          <>
            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={(v) => void verify(v)}
              disabled={busy}
              invalid={!!error}
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            {/* Код в ответе приходит только для демо-аккаунтов проверки в сторах. */}
            {debugCode && (
              <p className="text-xs text-text-secondary">
                Demo account, code from the server response: <span className="font-semibold">{debugCode}</span>
              </p>
            )}

            <Button
              full
              size="lg"
              disabled={code.length < 6 || busy}
              onClick={() => void verify(code)}
            >
              {busy ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : 'Confirm'}
            </Button>

            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void send()}
              className="w-full text-sm text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50 focus-ring"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
