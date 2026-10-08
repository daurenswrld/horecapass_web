import type { CvData, CvJob } from '@/components/cv/cv-template';
import type { ServerExperience, ServerResume } from '@/lib/api/candidate';
import type { CandidateDraft } from '@/lib/demo/candidate';
import { venueLine } from '@/lib/candidate/venues';

/**
 * ServerResume + черновик кандидата → данные для шаблона резюме. Раскладка та же,
 * что у PDF на сервере (resumes/pdf.py): текущее место — первое без даты ухода,
 * остальные идут в Career History от новых к старым.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function month(iso: string | null): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const name = MONTHS[Number(m[2]) - 1];
  return name ? `${name} ${m[1]}` : m[1];
}

export function periodOf(start: string | null, end: string | null): string {
  const from = month(start);
  const to = end ? month(end) : 'Present';
  return from ? `${from} — ${to}` : '';
}

/** «English • B2 • Conversational» → { name: English, level: B2, Conversational }. */
export function languageRows(raw: string[]): { name: string; level: string }[] {
  return raw
    .map((item) => item.replace(/—/g, '•').split('•').map((p) => p.trim()).filter(Boolean))
    .filter((parts) => parts.length > 0)
    .map(([name, ...rest]) => ({ name, level: rest.join(', ') }));
}

function bulletsOf(text: string | null): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*•●]+/, '').trim())
    .filter(Boolean);
}

function jobOf(w: ServerExperience): CvJob {
  return {
    title: w.position,
    employer: w.company_name,
    location: w.location ?? '',
    period: periodOf(w.start_date, w.end_date),
    facts: venueLine({ venueType: w.venue_type, venueLevel: w.venue_level, cuisine: w.cuisine }),
    about: w.about ?? '',
    responsibilities: w.responsibilities,
    achievements: w.achievements,
    // Старые записи без новых полей: описание из одного текста, по строке на пункт.
    bullets: w.responsibilities.length || w.achievements.length ? [] : bulletsOf(w.description),
  };
}

export function cvFromResume(resume: ServerResume, draft: CandidateDraft, name: { first: string; last: string }): CvData {
  const jobs = [...(resume.experiences ?? [])].sort((a, b) => b.start_date.localeCompare(a.start_date));
  const currentIndex = jobs.findIndex((w) => !w.end_date);
  const current = currentIndex >= 0 ? jobOf(jobs[currentIndex]) : null;
  const history = jobs.filter((_, i) => i !== currentIndex).map(jobOf);
  const certs = draft.certificates.map((c) => (c.type === 'Other' ? c.name.replace(/\.[a-z]+$/i, '') : c.type));

  return {
    firstName: name.first,
    lastName: name.last,
    headline: resume.position || null,
    location: draft.location || null,
    nationality: draft.nationality || null,
    photoUrl: resume.photoUrl ?? null,
    summary: resume.aboutMe || null,
    current,
    history,
    education: (resume.educations ?? []).map((e) => {
      const from = e.start_date.slice(0, 4);
      const to = e.end_date ? e.end_date.slice(0, 4) : from ? 'Present' : '';
      return {
        institution: e.institution,
        what: [e.degree, e.field_of_study].filter(Boolean).join(', '),
        years: [from, to].filter(Boolean).join(' – '),
      };
    }),
    languages: languageRows(resume.languages),
    skills: resume.skills ?? [],
    certificates: certs,
    references: draft.references.filter((r) => r.trim() !== ''),
  };
}

/** Предпросмотр до входа: только то, что кандидат успел ответить в браузере. */
export function cvFromDraft(d: CandidateDraft, name: { first: string; last: string }): CvData {
  const certs = d.certificates.map((c) => (c.type === 'Other' ? c.name.replace(/\.[a-z]+$/i, '') : c.type));
  const fromCheck = d.check.certs ? [d.check.certs] : [];
  const role = d.role;
  const summary =
    [
      role ? `${role}` : 'Hospitality professional',
      d.years !== null ? `with ${d.years}+ years of experience` : null,
      d.countries.length ? `open to roles in ${d.countries.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' ') + '.';
  return {
    firstName: name.first || 'Your',
    lastName: name.last || 'Name',
    headline: role,
    location: d.location || null,
    nationality: d.nationality || null,
    photoUrl: null,
    summary,
    current: d.check.achievement
      ? { title: role ?? 'Most recent role', employer: '', location: '', period: '', facts: '', about: '', responsibilities: [], achievements: [], bullets: [d.check.achievement] }
      : null,
    history: [],
    education: [],
    languages: d.check.languages ? languageRows([d.check.languages]) : [],
    skills: [],
    certificates: [...certs, ...fromCheck],
    references: d.references.filter((r) => r.trim() !== ''),
  };
}
