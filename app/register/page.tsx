'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Field } from '@/components/ui/primitives';
import type { BackendRole } from '@/lib/api/auth';

/**
 * Регистрация.
 *
 * Роль в интерфейсе — «applicant» / «company», на сервер уходит
 * 'APPLICANT' / 'COMPANY_OWNER'. Соответствие взято из мобилки
 * (company_register_wizard_screen.dart, _backendRole).
 */
function RegisterInner() {
  const params = useSearchParams();
  const isCompany = params.get('role') === 'company';
  const role: BackendRole = isCompany ? 'COMPANY_OWNER' : 'APPLICANT';

  const [companyName, setCompanyName] = React.useState('');

  return (
    <>
      {isCompany && (
        <div className="mb-6">
          <Field
            label="Название компании"
            placeholder="Например, Grand Hotel Almaty"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            Уедет вместе с подтверждением кода — так же, как в мобильном приложении.
          </p>
        </div>
      )}

      <AuthForm
        purpose="REGISTER"
        role={role}
        companyName={isCompany ? companyName : undefined}
        title={isCompany ? 'Регистрация компании' : 'Регистрация'}
        subtitle="Введите рабочую почту — пришлём шестизначный код. Пароль придумывать не нужно."
      />

      <p className="mt-6 text-sm text-text-secondary">
        {isCompany ? (
          <>
            Ищете работу?{' '}
            <Link href="/register?role=applicant" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              Регистрация соискателя
            </Link>
          </>
        ) : (
          <>
            Нанимаете?{' '}
            <Link href="/register?role=company" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              Регистрация компании
            </Link>
          </>
        )}
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      {/* useSearchParams требует Suspense, иначе страница целиком уходит
          в клиентский рендер. */}
      <React.Suspense fallback={null}>
        <RegisterInner />
      </React.Suspense>
    </AuthLayout>
  );
}
