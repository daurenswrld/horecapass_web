'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api/client';
import { vacanciesApi, type Vacancy } from '@/lib/api/vacancies';
import { useCandidate } from '@/lib/candidate/context';

/**
 * Отклик на вакансию — один и тот же из карточки в списке и из страницы
 * вакансии. Статус «отправлено» подхватывается из самой вакансии: откликнулись
 * в одном месте, второе обновится через onChanged родителя.
 */
export function useApply(vacancy: Vacancy, onChanged?: (v: Vacancy) => void) {
  const { draft } = useCandidate();
  const toast = useToast();
  const [applying, setApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(vacancy.isApplied);
  const [error, setError] = React.useState<string | null>(null);

  // Открыли другую вакансию — состояние кнопки должно соответствовать ей.
  React.useEffect(() => {
    setApplied(vacancy.isApplied);
    setError(null);
  }, [vacancy.id, vacancy.isApplied]);

  const apply = async () => {
    setError(null);
    setApplying(true);
    try {
      await vacanciesApi.apply(vacancy.id, draft?.coverLetterText ?? '');
      setApplied(true);
      toast.success('Application sent');
      onChanged?.({ ...vacancy, isApplied: true });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? 'Application not sent: you may have already applied, or your profile is incomplete.'
          : 'Could not send the application. Please try again.',
      );
    } finally {
      setApplying(false);
    }
  };

  return { apply, applying, applied, error };
}
