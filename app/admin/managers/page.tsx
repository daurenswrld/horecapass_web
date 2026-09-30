'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStaff } from '@/components/admin/admin-shell';
import { AdminHeader, Badge, ErrorNote, Modal, timeAgo, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button, Card, Field } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { adminApi, errorText, LEVEL_LABEL, type Manager, type StaffLevel } from '@/lib/api/admin';

/**
 * Менеджеры и их права (спецификация, п. 8). Четыре уровня: только просмотр,
 * ведение кандидатов и работодателей, вакансии и модерация, полный доступ.
 * Сервер не даст убрать последнего человека с полным доступом или удалить себя.
 */

const LEVELS = Object.keys(LEVEL_LABEL) as StaffLevel[];

const EXPLAIN: Record<StaffLevel, string> = {
  VIEWER: 'Sees metrics, feeds and lists. Changes nothing.',
  OPERATOR: 'Also marks employers Verified and handles support tickets.',
  MODERATOR: 'Also blocks and unblocks vacancies.',
  FULL: 'Everything, including managers and the audit log.',
};

export default function ManagersPage() {
  const me = useStaff();
  const toast = useToast();
  const list = useLoad(() => adminApi.managers(), []);
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState<Manager | null>(null);

  const setLevel = async (m: Manager, level: StaffLevel) => {
    try {
      await adminApi.setManagerLevel(m.id, level);
      toast.success(`${m.name} is now “${LEVEL_LABEL[level]}”`);
    } catch (e) {
      toast.error(errorText(e, 'Could not change the access level'));
    }
    list.reload();
  };

  return (
    <>
      <AdminHeader
        title="Managers"
        subtitle="Who can use the admin panel, and how far"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden /> Add manager
          </Button>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
        <Card className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Access levels</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
            {LEVELS.map((l) => (
              <div key={l}>
                <dt className="font-medium text-text-primary">{LEVEL_LABEL[l]}</dt>
                <dd className="text-text-secondary">{EXPLAIN[l]}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {list.loading && !list.data && <ListSkeleton count={3} />}

        {list.data && (
          <ul className="space-y-2">
            {list.data.results.map((m, i) => (
              <li
                key={m.id}
                className="rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
                style={riseStyle(i)}
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-medium text-text-primary">
                    {m.name} {m.id === me.id && <Badge tone="info">you</Badge>}
                  </p>
                  <p className="truncate text-sm text-text-secondary">{m.email}</p>
                </div>
                <span className="text-xs text-text-secondary">last login {timeAgo(m.last_login)}</span>
                {m.is_superuser ? (
                  <Badge tone="good">Superuser</Badge>
                ) : (
                  <select
                    aria-label={`Access level of ${m.name}`}
                    value={m.level}
                    onChange={(e) => setLevel(m, e.target.value as StaffLevel)}
                    className="h-9 rounded-full border border-line-strong bg-surface px-3 text-sm text-text-primary focus-ring"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {LEVEL_LABEL[l]}
                      </option>
                    ))}
                  </select>
                )}
                {!m.is_superuser && m.id !== me.id && (
                  <button
                    type="button"
                    onClick={() => setRemoving(m)}
                    aria-label={`Remove ${m.name}`}
                    className="grid h-9 w-9 place-items-center rounded-full text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger focus-ring"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddDialog
        open={adding}
        onClose={() => setAdding(false)}
        onDone={(m) => {
          setAdding(false);
          toast.success(`${m.name} can now sign in with ${m.email}`);
          list.reload();
        }}
      />
      <Modal open={!!removing} title="Remove this manager?" onClose={() => setRemoving(null)}>
        <p className="text-sm text-text-secondary">
          {removing?.name} loses access to the admin panel. Their account stays, as a regular candidate account.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!removing) return;
              try {
                await adminApi.removeManager(removing.id);
                toast.success(`${removing.name} was removed`);
              } catch (e) {
                toast.error(errorText(e, 'Could not remove the manager'));
              }
              setRemoving(null);
              list.reload();
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </>
  );
}

function AddDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: Manager) => void }) {
  const [email, setEmail] = React.useState('');
  const [level, setLevel] = React.useState<StaffLevel>('VIEWER');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEmail('');
      setLevel('VIEWER');
      setError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onDone(await adminApi.addManager({ email: email.trim(), level }));
    } catch (err) {
      setError(errorText(err, 'Could not add the manager.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Add a manager" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Work email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        <div className="space-y-1.5">
          <label htmlFor="new-level" className="block text-sm font-medium text-text-secondary">
            Access level
          </label>
          <select
            id="new-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as StaffLevel)}
            className="h-12 w-full rounded border border-line-strong bg-surface px-4 text-text-primary focus-ring"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABEL[l]}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary">{EXPLAIN[level]}</p>
        </div>
        <p className="text-xs text-text-secondary">They sign in at the normal login page with this email and a six-digit code; no password to share.</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !email.trim()}>
            {busy ? 'Adding…' : 'Add manager'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
