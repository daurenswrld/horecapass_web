'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Field } from '@/components/ui/primitives';
import type { BackendRole } from '@/lib/api/auth';

/**
 * Sign up.
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
            label="Company name"
            placeholder="e.g. Grand Hotel Almaty"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            Sent together with the code confirmation, the same way the mobile app does it.
          </p>
        </div>
      )}

      <AuthForm
        purpose="REGISTER"
        role={role}
        companyName={isCompany ? companyName : undefined}
        title={isCompany ? 'Employer sign-up' : 'Sign up'}
        subtitle="Enter your work email and we will send a six-digit code. No password to invent."
      />

      <p className="mt-6 text-sm text-text-secondary">
        {isCompany ? (
          <>
            Looking for a job?{' '}
            <Link href="/register?role=applicant" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              Candidate sign-up
            </Link>
          </>
        ) : (
          <>
            Hiring?{' '}
            <Link href="/register?role=company" className="font-semibold text-accent-text underline-offset-4 hover:underline">
              Employer sign-up
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
