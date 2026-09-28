'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, FlaskConical, User } from 'lucide-react';
import { DEMO_AUTH_ENABLED, DEMO_USERS, demoSession, type DemoRole } from '@/lib/demo/session';
import { homeFor, useAuth } from '@/lib/auth/context';

/**
 * Кнопки демо-входа под формой. Видны только в dev (или при
 * NEXT_PUBLIC_DEMO_AUTH=1) — в обычной сборке компонент ничего не рисует.
 */
export function DemoLogin() {
  const router = useRouter();
  const { refresh } = useAuth();
  if (!DEMO_AUTH_ENABLED) return null;

  const enter = async (role: DemoRole) => {
    demoSession.start(role);
    await refresh();
    router.replace(homeFor(DEMO_USERS[role]));
  };

  return (
    <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface-muted p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <FlaskConical size={16} aria-hidden className="text-accent-text" />
        Demo sign-in (local only)
      </p>
      <p className="mt-1 text-xs text-text-secondary">
        No account on the real server: sign-in data is fake, public jobs come from the server, everything else stays in
        this browser.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => enter('applicant')}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-accent focus-ring"
        >
          <User size={15} aria-hidden />
          As a candidate
        </button>
        <button
          type="button"
          onClick={() => enter('company')}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-accent focus-ring"
        >
          <Briefcase size={15} aria-hidden />
          As an employer
        </button>
      </div>
    </div>
  );
}

/** Полоска «Demo mode» над разделами после входа — чтобы не спутать с боевым аккаунтом. */
export function DemoBanner() {
  const [role, setRole] = React.useState<DemoRole | null>(null);
  const { refresh } = useAuth();
  const router = useRouter();
  React.useEffect(() => setRole(demoSession.get()), []);
  // Выход — на страницу входа: из демо чаще всего идут пробовать другую роль.
  const exit = async () => {
    demoSession.end();
    await refresh();
    router.replace('/login');
  };
  if (!role) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-accent-strong px-4 py-1.5 text-xs text-on-accent dark:bg-accent">
      <FlaskConical size={13} aria-hidden />
      Demo mode as {role === 'company' ? 'an employer' : 'a candidate'} — nothing is sent to the server.
      <button type="button" onClick={exit} className="font-semibold underline underline-offset-2 focus-ring">
        Exit
      </button>
    </div>
  );
}
