'use client';

import * as React from 'react';
import { Download, Mail, MessageCircle, Search } from 'lucide-react';
import { useStaff } from '@/components/admin/admin-shell';
import { ExportMenu } from '@/components/admin/export-menu';
import { AdminHeader, Badge, Empty, ErrorNote, Segmented, shortDate, timeAgo, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { adminApi, errorText, type BankResume } from '@/lib/api/admin';

/**
 * Банк резюме (прототип A-05/A-06; видео заказчицы 14.10): все резюме
 * платформы, в том числе отправленные на чужие вакансии, с фильтрами по
 * должности, национальности, местонахождению и ключевым словам. Скачать
 * PDF может оператор и выше; каждое скачивание пишется в журнал аудита.
 */

const PAGE = 25;
const EXPORT_LIMIT = 500;

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block min-w-40 flex-1">
      <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
      />
    </label>
  );
}

export default function ResumeBankPage() {
  const staff = useStaff();
  const toast = useToast();
  const [form, setForm] = React.useState({ q: '', position: '', nationality: '', location: '' });
  const [filters, setFilters] = React.useState(form);
  const [applied, setApplied] = React.useState<'all' | 'applied'>('all');
  const [offset, setOffset] = React.useState(0);
  const [downloading, setDownloading] = React.useState<number | null>(null);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters({
        q: form.q.trim(),
        position: form.position.trim(),
        nationality: form.nationality.trim(),
        location: form.location.trim(),
      });
      setOffset(0);
    }, 350);
    return () => window.clearTimeout(t);
  }, [form]);

  const query = { ...filters, applied: applied === 'applied' ? 1 : undefined };
  const list = useLoad(
    () => adminApi.resumes({ ...query, limit: PAGE, offset }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, applied, offset],
  );
  const total = list.data?.count ?? 0;
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const download = async (r: BankResume) => {
    setDownloading(r.id);
    try {
      await adminApi.resumePdf(r.id, `${r.name} - ${r.title}`);
    } catch (e) {
      toast.error(errorText(e, 'Could not download the resume'));
    } finally {
      setDownloading(null);
    }
  };

  const report = async () => {
    const all = await adminApi.resumes({ ...query, limit: EXPORT_LIMIT, offset: 0 });
    const shown = Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (applied === 'applied') shown.push('applied to a job');
    return {
      name: 'resume-bank',
      title: 'Resume bank',
      subtitle: [shown.length ? shown.join(', ') : 'All resumes', all.count > EXPORT_LIMIT ? `first ${EXPORT_LIMIT} of ${all.count}` : '']
        .filter(Boolean)
        .join(' · '),
      columns: [
        { label: 'Name', value: (x: BankResume) => x.name },
        { label: 'Position', value: (x: BankResume) => x.title },
        { label: 'Years', value: (x: BankResume) => x.years },
        { label: 'Last job', value: (x: BankResume) => x.last_job },
        { label: 'Nationality', value: (x: BankResume) => x.nationality },
        { label: 'Location', value: (x: BankResume) => x.location },
        { label: 'Visa', value: (x: BankResume) => x.visa_status },
        { label: 'Languages', value: (x: BankResume) => x.languages.filter(Boolean).join(', ') },
        { label: 'Email', value: (x: BankResume) => x.email },
        { label: 'Phone', value: (x: BankResume) => x.phone },
        { label: 'Applications', value: (x: BankResume) => x.applications },
        { label: 'Last applied', value: (x: BankResume) => shortDate(x.last_applied_at) },
        { label: 'Updated', value: (x: BankResume) => shortDate(x.updated_at) },
      ],
      rows: all.results,
    };
  };

  return (
    <>
      <AdminHeader
        title="Resume bank"
        subtitle="Every resume on the platform, including those sent to other companies"
        actions={<ExportMenu report={report} disabled={!total} />}
      />

      <div className="space-y-5 px-5 py-6 md:px-8">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-60 flex-[2]">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Keywords</span>
            <span className="relative block">
              <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                value={form.q}
                onChange={(e) => set('q')(e.target.value)}
                placeholder="Skills, past employer, name…"
                className="h-10 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
              />
            </span>
          </label>
          <Field label="Position" value={form.position} onChange={set('position')} placeholder="Waiter, chef…" />
          <Field label="Nationality" value={form.nationality} onChange={set('nationality')} placeholder="Kenyan, Filipino…" />
          <Field label="Location" value={form.location} onChange={set('location')} placeholder="Dubai, Riyadh…" />
          <Segmented
            label="Which resumes"
            value={applied}
            onChange={(v) => {
              setApplied(v);
              setOffset(0);
            }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'applied', label: 'Applied to a job' },
            ]}
          />
        </div>

        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {list.loading && !list.data && <ListSkeleton count={6} />}
        {list.data && list.data.results.length === 0 && <Empty title="No resumes found" hint="Loosen a filter or clear the keywords." />}

        {list.data && list.data.results.length > 0 && (
          <>
            <p className="text-sm text-text-secondary">{total} {total === 1 ? 'resume' : 'resumes'}</p>
            <ul className="space-y-2">
              {list.data.results.map((r, i) => (
                <li
                  key={r.id}
                  className="rise flex flex-wrap items-start gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
                  style={riseStyle(i)}
                >
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="font-semibold text-text-primary">
                      {r.name} <span className="font-normal text-text-secondary">· {r.title}</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      {[r.years != null ? `${r.years} ${r.years === 1 ? 'year' : 'years'}` : null, r.last_job, r.nationality, r.location]
                        .filter(Boolean)
                        .join(' · ') || 'Profile not filled in yet'}
                    </p>
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ''} · updated {timeAgo(r.updated_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.applications > 0 ? (
                      <Badge tone="info">
                        {r.applications} {r.applications === 1 ? 'application' : 'applications'}
                      </Badge>
                    ) : (
                      <Badge>not applied</Badge>
                    )}
                    <a
                      href={`mailto:${r.email}`}
                      aria-label={`Email ${r.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full border border-line text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
                    >
                      <Mail size={14} />
                    </a>
                    {r.whatsapp && (
                      <a
                        href={r.whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`WhatsApp ${r.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-line text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                    {staff.can.operate && (
                      <Button size="sm" variant="secondary" disabled={downloading === r.id} onClick={() => void download(r)}>
                        {downloading === r.id ? <Spinner className="h-3.5 w-3.5" /> : <Download size={14} aria-hidden />}
                        PDF
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {total > PAGE && (
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>
              {offset + 1}–{Math.min(offset + PAGE, total)} of {total}
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
                Next
              </Button>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
