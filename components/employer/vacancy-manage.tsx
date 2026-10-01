'use client';

import * as React from 'react';
import { Archive, Copy, Pencil, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button, Field } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api/client';
import { vacanciesApi, type Vacancy } from '@/lib/api/vacancies';

/**
 * Управление своей вакансией: править, убрать в архив и вернуть, сделать копию.
 *
 * Без этого работодатель мог только опубликовать черновик: опечатку в зарплате
 * или закрытую позицию исправить было нечем. Архив обратим: вакансия исчезает
 * у кандидатов, а откликов и переписок не теряет.
 */

export const CURRENCIES = ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'] as const;

/** Что именно не понравилось серверу, по-человечески. */
export function serverMessage(err: unknown, fallback: string): string {
  const payload = err instanceof ApiError ? err.payload : null;
  if (payload && typeof payload === 'object') {
    const parts = Object.entries(payload as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
      .slice(0, 3);
    if (parts.length) return parts.join('; ');
  }
  return fallback;
}

export function VacancyActions({ vacancy, onChanged }: { vacancy: Vacancy; onChanged: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState<'archive' | 'copy' | null>(null);

  const setStatus = async (status: 'ARCHIVED' | 'ACTIVE') => {
    setBusy('archive');
    try {
      await vacanciesApi.update(vacancy.id, { status });
      toast.success(status === 'ARCHIVED' ? `“${vacancy.title}” moved to the archive` : `“${vacancy.title}” is live again`);
      onChanged();
    } catch (e) {
      toast.error(serverMessage(e, 'Could not change the job.'));
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async () => {
    setBusy('copy');
    try {
      await vacanciesApi.create({
        title: `${vacancy.title} (copy)`,
        description: vacancy.description ?? '',
        requirements: vacancy.requirements ?? undefined,
        address: vacancy.address ?? undefined,
        city: vacancy.address ?? undefined,
        salary_min: vacancy.salaryMin ? Number(vacancy.salaryMin) : undefined,
        salary_max: vacancy.salaryMax ? Number(vacancy.salaryMax) : undefined,
        currency: vacancy.currency,
        department: vacancy.department ?? undefined,
        venue_type: vacancy.venueType ?? undefined,
        venue_level: vacancy.venueLevel ?? undefined,
        schedule: vacancy.schedule ?? undefined,
        hours: vacancy.hours ?? undefined,
        employment_type: vacancy.employmentType ?? undefined,
        payment_schedule: vacancy.paymentSchedule ?? undefined,
        salary_type: vacancy.salaryType ?? undefined,
        hiring_steps: vacancy.hiringSteps,
        benefits: vacancy.benefits,
        responsibilities: vacancy.responsibilities,
        status: 'DRAFT',
      });
      toast.success('A draft copy was created. Find it under Drafts.');
      onChanged();
    } catch (e) {
      toast.error(serverMessage(e, 'Could not copy the job.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${vacancy.title}`}>
          <Pencil size={14} aria-hidden /> Edit
        </Button>
        <Button size="sm" variant="ghost" disabled={busy === 'copy'} onClick={duplicate} aria-label={`Duplicate ${vacancy.title}`}>
          <Copy size={14} aria-hidden /> Duplicate
        </Button>
        {vacancy.status === 'ARCHIVED' ? (
          <Button size="sm" variant="ghost" disabled={busy === 'archive'} onClick={() => setStatus('ACTIVE')} aria-label={`Restore ${vacancy.title}`}>
            <RotateCcw size={14} aria-hidden /> Restore
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={busy === 'archive'} onClick={() => setStatus('ARCHIVED')} aria-label={`Archive ${vacancy.title}`}>
            <Archive size={14} aria-hidden /> Archive
          </Button>
        )}
      </div>
      <EditDialog vacancy={vacancy} open={editing} onClose={() => setEditing(false)} onSaved={onChanged} />
    </>
  );
}

function EditDialog({
  vacancy,
  open,
  onClose,
  onSaved,
}: {
  vacancy: Vacancy;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = React.useState({
    title: '',
    address: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'AED',
    description: '',
    requirements: '',
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Каждый раз открываем с актуальными данными вакансии, а не с прошлой правки.
  React.useEffect(() => {
    if (!open) return;
    setForm({
      title: vacancy.title,
      address: vacancy.address ?? '',
      salaryMin: vacancy.salaryMin ? String(Math.round(Number(vacancy.salaryMin))) : '',
      salaryMax: vacancy.salaryMax ? String(Math.round(Number(vacancy.salaryMax))) : '',
      currency: vacancy.currency || 'AED',
      description: vacancy.description ?? '',
      requirements: vacancy.requirements ?? '',
    });
    setError(null);
  }, [open, vacancy]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.title.trim() &&
    form.description.trim() &&
    (!form.salaryMin || !form.salaryMax || Number(form.salaryMin) <= Number(form.salaryMax));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await vacanciesApi.update(vacancy.id, {
        title: form.title.trim(),
        address: form.address.trim() || null,
        city: form.address.trim() || null,
        salary_min: form.salaryMin ? Number(form.salaryMin) : null,
        salary_max: form.salaryMax ? Number(form.salaryMax) : null,
        currency: form.currency,
        description: form.description.trim(),
        requirements: form.requirements.trim() || null,
      });
      toast.success('Changes saved');
      onClose();
      onSaved();
    } catch (err) {
      setError(serverMessage(err, 'Could not save the changes.'));
    } finally {
      setBusy(false);
    }
  };

  const rangeWrong = !!form.salaryMin && !!form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax);

  return (
    <Modal open={open} title="Edit job" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Position" value={form.title} onChange={set('title')} required />
        <Field label="City" value={form.address} onChange={set('address')} placeholder="Dubai" />
        <div className="grid grid-cols-[1fr_1fr_6rem] gap-2">
          <Field label="Salary from" type="number" min={0} value={form.salaryMin} onChange={set('salaryMin')} />
          <Field label="to" type="number" min={0} value={form.salaryMax} onChange={set('salaryMax')} error={rangeWrong ? 'Must not be lower than the start' : null} />
          <div className="space-y-1.5">
            <label htmlFor="edit-currency" className="block text-sm font-medium text-text-secondary">
              Currency
            </label>
            <select
              id="edit-currency"
              value={form.currency}
              onChange={set('currency')}
              className="h-12 w-full rounded border border-line-strong bg-surface px-2 text-text-primary focus-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="edit-desc" className="block text-sm font-medium text-text-secondary">
            Description
          </label>
          <textarea
            id="edit-desc"
            value={form.description}
            onChange={set('description')}
            rows={4}
            required
            className="mt-1.5 w-full resize-y rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary focus-ring"
          />
        </div>
        <div>
          <label htmlFor="edit-req" className="block text-sm font-medium text-text-secondary">
            Requirements
          </label>
          <textarea
            id="edit-req"
            value={form.requirements}
            onChange={set('requirements')}
            rows={2}
            className="mt-1.5 w-full resize-y rounded border border-line-strong bg-surface px-3.5 py-2.5 text-text-primary focus-ring"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid || busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
