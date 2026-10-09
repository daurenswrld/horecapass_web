'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Button, ChoiceChip, Field, Spinner } from '@/components/ui/primitives';
import { VENUE_TYPES, canSaveJob, type JobDraft } from '@/lib/candidate/venues';

/**
 * «Make your jobs easy to read for Gulf employers»: у каждого места работы
 * тип заведения, насколько оно известно и кухня. Что нашлось в резюме, уже
 * подставлено; чего нет, подсвечено вопросом. Ничего не придумываем за человека.
 */
export function JobDetails({
  jobs,
  onChange,
  onSave,
  saving,
  saved,
  error,
  nudge,
}: {
  jobs: JobDraft[];
  onChange: (jobs: JobDraft[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
  nudge: string | null;
}) {
  const set = (key: string, patch: Partial<JobDraft>) => onChange(jobs.map((j) => (j.key === key ? { ...j, ...patch } : j)));
  const missing = jobs.filter((j) => !j.venueType).length;
  const savable = jobs.filter(canSaveJob).length;

  return (
    <section aria-labelledby="job-details-title" className="mt-3 space-y-4 rounded-lg border border-line bg-surface p-4">
      <div>
        <h3 id="job-details-title" className="font-semibold text-heading">Make your jobs easy to read for Gulf employers</h3>
        <p className="mt-1 text-sm text-text-secondary">
          An employer in Dubai or Doha may not know how strong your previous workplace was. Say what kind of place it was and how well known it is.
          {missing > 0 ? ` ${missing} of ${jobs.length} still need the venue type.` : ''}
        </p>
      </div>

      {jobs.map((j) => (
        <fieldset key={j.key} className="space-y-3 rounded-md border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-text-primary">
            {[j.position, j.company].filter(Boolean).join(' · ') || 'Job'}
            {j.start ? <span className="font-normal text-text-secondary"> · {j.start} — {j.end || 'now'}</span> : null}
          </legend>

          {!/^\d{4}-\d{2}$/.test(j.start) && (
            <label className="block text-sm font-medium text-text-secondary">
              When did you start? (needed to save this job)
              <input
                type="month"
                value={j.start}
                onChange={(e) => set(j.key, { start: e.target.value })}
                className="mt-1.5 block h-12 rounded border border-line-strong bg-surface px-3 text-text-primary focus-ring"
              />
            </label>
          )}

          <div role="group" aria-label={`Kind of place: ${j.company || j.position}`}>
            <p className="mb-1.5 text-sm font-medium text-text-secondary">
              Kind of place{j.venueType ? '' : ' (not in your CV, please choose)'}
            </p>
            <div className="flex flex-wrap gap-2">
              {VENUE_TYPES.map((t) => (
                <ChoiceChip key={t} selected={j.venueType === t} onClick={() => set(j.key, { venueType: j.venueType === t ? '' : t })}>
                  {t}
                </ChoiceChip>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="How well known is it? (optional)"
              value={j.venueLevel}
              maxLength={160}
              onChange={(e) => set(j.key, { venueLevel: e.target.value })}
              placeholder="5-star, top-3 in Almaty, award winning…"
            />
            <Field
              label="Cuisine (optional)"
              value={j.cuisine}
              maxLength={120}
              onChange={(e) => set(j.key, { cuisine: e.target.value })}
              placeholder="Italian, Japanese…"
            />
          </div>
        </fieldset>
      ))}

      {nudge && <p className="rounded-md bg-accent-muted p-3 text-sm text-text-secondary">{nudge}</p>}

      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <Button type="button" onClick={onSave} disabled={saving || savable === 0}>
          {saving ? <Spinner className="h-4 w-4 border-accent-muted border-t-on-accent" /> : 'Save to my profile'}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <Check size={16} aria-hidden /> Saved. Employers will see this on your profile.
          </span>
        )}
        {error && <span role="alert" className="text-sm text-danger">{error}</span>}
        {!saved && savable < jobs.length && (
          <span className="text-sm text-text-secondary">{jobs.length - savable} job(s) need a start date and will be skipped.</span>
        )}
      </div>
    </section>
  );
}
