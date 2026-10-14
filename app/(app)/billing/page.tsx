'use client';

import * as React from 'react';
import { PageHeader } from '@/components/shell/app-shell';
import { Card } from '@/components/ui/primitives';
import { CvUpgrade, EmployerPlans, ManageSubscription, useBilling } from '@/components/billing/plans';
import { isCompany } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/context';

function EmployerBilling() {
  const { access, products } = useBilling('employer');
  const company = access?.company;
  const plan = products.find((p) => p.code === company?.plan);
  const until = company?.active_until ? new Date(company.active_until).toLocaleDateString('en-GB') : null;
  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-bold text-heading">Your plan</h2>
        {company && (plan || company.vacancy_credits > 0) ? (
          <dl className="space-y-1.5 text-sm">
            {plan && (
              <div className="flex gap-3">
                <dt className="w-40 text-text-secondary">Plan</dt>
                <dd className="font-semibold text-text-primary">
                  {plan.name}
                  {until && <span className="font-normal text-text-secondary"> · paid until {until}</span>}
                </dd>
              </div>
            )}
            {company.vacancy_credits > 0 && (
              <div className="flex gap-3">
                <dt className="w-40 text-text-secondary">One-time vacancies</dt>
                <dd className="font-semibold text-text-primary">{company.vacancy_credits} left</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-text-secondary">No plan yet. Posting is free while we launch.</p>
        )}
        {plan && <ManageSubscription />}
      </Card>
      <EmployerPlans lead={<h2 className="text-lg font-bold text-heading">Choose a plan</h2>} />
    </div>
  );
}

/** Plans and payments: the employer's plan (E-26) or the candidate's CV upgrade (C-19). */
export default function BillingPage() {
  const { user } = useAuth();
  const employer = isCompany(user?.role ?? '');
  return (
    <>
      <PageHeader title="Plan & billing" />
      <div className="max-w-5xl space-y-4 px-5 py-6 md:px-8">
        {employer ? <EmployerBilling /> : <CvUpgrade />}
      </div>
    </>
  );
}
