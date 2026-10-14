'use client';

import * as React from 'react';
import { redirect, useSearchParams } from 'next/navigation';
import { QuizFlow } from '@/components/quiz/quiz-flow';

/**
 * Приветственный квиз: /welcome?role=applicant|company. Без роли — на главную,
 * где она выбирается.
 */
function WelcomeInner() {
  const role = useSearchParams().get('role');
  if (role !== 'applicant' && role !== 'company') redirect('/');
  return <QuizFlow role={role} />;
}

export default function WelcomePage() {
  return (
    <React.Suspense fallback={<div className="min-h-[100dvh] bg-gradient-to-b from-peach-from to-peach-to" />}>
      <WelcomeInner />
    </React.Suspense>
  );
}
