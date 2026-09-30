'use client';

import * as React from 'react';
import Link from 'next/link';
import { Briefcase, FileEdit, Inbox, UserSearch } from 'lucide-react';
import { CountUp, riseStyle } from '@/components/ui/motion';
import { companyApplicationsApi } from '@/lib/api/applications';
import type { Vacancy } from '@/lib/api/vacancies';

/**
 * Сводка над списком вакансий: четыре числа, которые работодатель хочет
 * увидеть сразу. Заказчица просила «не графики, а вакансии» (голосовое 15.09),
 * поэтому это четыре крупные цифры, а не диаграмма, и стоят они над списком,
 * а не вместо него.
 *
 * Отклики тянем отдельным запросом. Не получилось — плитки откликов просто
 * не показываем, вакансии при этом остаются.
 */
export function JobStats({ vacancies }: { vacancies: Vacancy[] }) {
  const [apps, setApps] = React.useState<{ total: number; fresh: number } | null>(null);

  React.useEffect(() => {
    let alive = true;
    companyApplicationsApi
      .list()
      .then((list) => {
        if (alive) setApps({ total: list.length, fresh: list.filter((a) => a.status === 'NEW').length });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const active = vacancies.filter((v) => v.status === 'ACTIVE').length;
  const drafts = vacancies.filter((v) => v.status === 'DRAFT').length;

  const tiles = [
    { Icon: Briefcase, label: 'Active jobs', value: active, href: undefined },
    { Icon: FileEdit, label: 'Drafts', value: drafts, href: undefined },
    ...(apps
      ? [
          { Icon: Inbox, label: 'Applications', value: apps.total, href: '/company/selection' },
          { Icon: UserSearch, label: 'Not reviewed', value: apps.fresh, href: '/company/selection' },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ Icon, label, value, href }, i) => {
        const body = (
          <>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-muted text-accent-text">
              <Icon size={17} aria-hidden />
            </span>
            <span className="mt-3 block text-3xl font-bold tracking-tight text-heading">
              <CountUp value={value} />
            </span>
            <span className="mt-0.5 block text-sm text-text-secondary">{label}</span>
          </>
        );
        const cls = 'rise block rounded-lg border border-line bg-surface p-4';
        return href ? (
          <Link key={label} href={href} style={riseStyle(i)} className={`${cls} lift focus-ring`}>
            {body}
          </Link>
        ) : (
          <div key={label} style={riseStyle(i)} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
