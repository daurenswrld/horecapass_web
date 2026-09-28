'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, LogOut, Mail, UserPlus, X } from 'lucide-react';
import { DemoNotice } from '@/components/demo-notice';
import { Button, Card, Field } from '@/components/ui/primitives';
import { isCompany } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/context';
import { ASSISTANTS, setAssistant, useAssistant, type AssistantKind } from '@/lib/demo/assistant';
import { cvConsent, type CvConsent } from '@/lib/demo/storage';
import { companyApi } from '@/lib/api/company';
import { canSyncToServer, syncError } from '@/lib/demo/employer-sync';
import { cn } from '@/lib/utils';

function Section({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-heading">{title}</h2>
      {lead && <p className="mt-1 text-sm text-text-secondary">{lead}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/** Выбор помощника — созвон 22.09: «мужчина и женщина, в настройках дать выбор». */
export function AssistantSection() {
  const { kind } = useAssistant();
  return (
    <Section title="Your assistant" lead="Who guides you through HorecaPass.">
      <div className="flex flex-wrap gap-4">
        {(Object.keys(ASSISTANTS) as AssistantKind[]).map((k) => {
          const on = kind === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => setAssistant(k)}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-surface p-3 pr-5 transition-colors focus-ring',
                on ? 'border-[1.5px] border-accent-strong dark:border-accent' : 'border-line hover:border-line-strong',
              )}
            >
              {/* Обычный img: маленький локальный файл. */}
              <img src={ASSISTANTS[k].avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
              <span className="text-left">
                <span className="block font-semibold text-heading">{ASSISTANTS[k].label}</span>
                <span className="block text-xs text-text-secondary">Recruiter</span>
              </span>
              {on && <Check size={18} aria-hidden className="ml-2 text-accent-text" />}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/**
 * Согласие кандидата — бриф кандидата, пункт 6: «дать реальную возможность
 * отозвать согласие позже в Settings — это должна быть рабочая функция,
 * а не просто строка в тексте согласия».
 */
export function ConsentSection() {
  const [c, setC] = React.useState<CvConsent | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  React.useEffect(() => setC(cvConsent.load()), []);
  if (!c) return null;

  return (
    <Section title="Consent to share your profile">
      {c.signedAt ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-text-primary">
            <Check size={17} aria-hidden className="text-success" />
            Signed by {c.signer} on {new Date(c.signedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
          {confirm ? (
            <div className="space-y-3 rounded-md border border-line-strong bg-surface-alt p-4">
              <p className="text-sm text-text-primary">
                Employers will stop seeing your profile, and we won&apos;t contact you about jobs until you sign again.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    cvConsent.clear();
                    setC(cvConsent.load());
                    setConfirm(false);
                  }}
                >
                  Withdraw consent
                </Button>
                <Button variant="secondary" onClick={() => setConfirm(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setConfirm(true)}>
              Withdraw consent
            </Button>
          )}
        </div>
      ) : (
        <p className="text-text-primary">
          Not signed — employers can&apos;t see your profile.{' '}
          <Link href="/onboarding?step=consent" className="font-semibold text-accent-text underline-offset-4 hover:underline">
            Review and sign
          </Link>
        </p>
      )}
      <DemoNotice
        className="mt-4"
        what="Consent is stored in this browser for now."
        endpoint="DELETE /api/resumes/my/<id>/publish-consent/ (withdraw)"
      />
    </Section>
  );
}

/* Команда работодателя ---------------------------------------------------------------- */

interface Row {
  key: string;
  id?: number;
  name: string;
  role: string;
  pending: boolean;
}

type Role = 'COMPANY_MANAGER' | 'ADMIN';
const ROLE_LABEL: Record<Role, string> = { COMPANY_MANAGER: 'Manager', ADMIN: 'Admin' };

const TEAM_KEY = 'hp_demo_team';

function loadLocal(): Row[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(TEAM_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * Приглашение в команду — бриф работодателя, пункт 5: убрано из онбординга
 * сюда, «доступно в любой момент». При настоящем входе — серверные адреса
 * (те же, что у мобилки): /users/api/users/me/company/team/ и invitations/.
 * В демо-входе список живёт в браузере.
 */
export function TeamSection() {
  const { user } = useAuth();
  const [server, setServer] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<Role>('COMPANY_MANAGER');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const owner = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'You';

  const load = React.useCallback(async () => {
    const onServer = canSyncToServer();
    setServer(onServer);
    if (!onServer) {
      setRows([{ key: 'owner', name: owner, role: 'Owner', pending: false }, ...loadLocal()]);
      return;
    }
    try {
      const t = await companyApi.team();
      setRows([
        ...t.members.map((m) => ({ key: `m${m.id}`, name: m.name, role: m.roleDisplay, pending: false })),
        ...t.invitations.map((i) => ({ key: `i${i.id}`, id: i.id, name: i.email, role: i.roleDisplay, pending: true })),
      ]);
    } catch (e) {
      setError(syncError(e));
    }
  }, [owner]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const saveLocal = (next: Row[]) => {
    setRows(next);
    try {
      window.localStorage.setItem(TEAM_KEY, JSON.stringify(next.filter((r) => r.pending)));
    } catch {
      /* приватный режим */
    }
  };

  const invite = async () => {
    const value = email.trim().toLowerCase();
    setError(null);
    if (!server) {
      if (!rows.some((r) => r.name === value)) saveLocal([...rows, { key: value, name: value, role: ROLE_LABEL[role], pending: true }]);
      setEmail('');
      return;
    }
    setBusy(true);
    try {
      await companyApi.invite(value, role);
      setEmail('');
      await load();
    } catch (e) {
      setError(syncError(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (r: Row) => {
    setError(null);
    if (!server || r.id === undefined) {
      saveLocal(rows.filter((x) => x.key !== r.key));
      return;
    }
    try {
      await companyApi.cancelInvite(r.id);
      await load();
    } catch (e) {
      setError(syncError(e));
    }
  };

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Section title="Team" lead="Hiring works better together. Invite the people who hire with you.">
      <ul className="divide-y divide-line rounded-md border border-line">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 px-4 py-3">
            {r.pending && <Mail size={16} aria-hidden className="text-text-secondary" />}
            <span className="min-w-0 flex-1 truncate text-text-primary">{r.name}</span>
            <span className="text-sm text-text-secondary">
              {r.role}
              {r.pending && ' · invited'}
            </span>
            {r.pending && (
              <button
                type="button"
                aria-label={`Cancel invitation for ${r.name}`}
                onClick={() => void cancel(r)}
                className="rounded p-1 text-text-secondary hover:text-danger focus-ring"
              >
                <X size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !busy) void invite();
        }}
      >
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" />
        <div className="space-y-1.5">
          <label htmlFor="team-role" className="block text-sm font-medium text-text-secondary">
            Role
          </label>
          <select
            id="team-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-12 rounded border border-line-strong bg-surface px-3 text-text-primary focus-ring"
          >
            <option value="COMPANY_MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <Button type="submit" size="lg" disabled={!valid || busy}>
          <UserPlus size={17} aria-hidden />
          Invite
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {!server && (
        <DemoNotice
          className="mt-4"
          what="Demo sign-in: invitations are kept in this browser and no email is sent. With a real account they go to the server and the colleague gets an email."
          endpoint="GET /users/api/users/me/company/team/, POST /users/api/users/me/company/invitations/"
        />
      )}
    </Section>
  );
}

export function AccountSection() {
  const { user, signOut } = useAuth();
  return (
    <Section title="Account">
      <dl className="space-y-2 text-sm">
        <div className="flex gap-3">
          <dt className="w-24 text-text-secondary">Email</dt>
          <dd className="text-text-primary">{user?.email ?? '—'}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 text-text-secondary">Role</dt>
          <dd className="text-text-primary">{isCompany(user?.role) ? 'Employer' : 'Candidate'}</dd>
        </div>
      </dl>
      <Button variant="secondary" className="mt-4" onClick={signOut}>
        <LogOut size={16} aria-hidden />
        Sign out
      </Button>
    </Section>
  );
}
