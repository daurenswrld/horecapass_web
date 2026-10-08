import { CERT_TYPES, NATIONALITIES, type CandidateDraft } from '@/lib/demo/candidate';
import { normalizeTargetRoles } from '@/lib/candidate/roles';
import type { CvFields } from '@/lib/api/autofill';

/**
 * Что из резюме попадает в анкету. Правило одно: не перезаписываем то, что
 * человек уже указал сам, и не берём ничего, чего нет в списках приложения
 * (национальность только из справочника — «своё значение» форма не принимает).
 */

export function matchNationalityExact(value: string | null): string | null {
  const q = (value ?? '').trim().toLowerCase();
  if (!q) return null;
  const exact = NATIONALITIES.find((n) => n.toLowerCase() === q);
  if (exact) return exact;
  // «Filipino (Philippines)», «Indian national» — берём справочное слово внутри строки.
  return NATIONALITIES.find((n) => new RegExp(`\\b${n.toLowerCase()}\\b`).test(q)) ?? null;
}

export function certificateType(name: string): (typeof CERT_TYPES)[number] {
  const s = name.toLowerCase();
  if (s.includes('haccp')) return 'HACCP';
  if (s.includes('food safety') || s.includes('food hygiene') || s.includes('servsafe')) return 'Food Safety';
  if (s.includes('bartend') || s.includes('mixolog') || s.includes('wset') || s.includes('sommelier')) return 'Bartending';
  if (s.includes('barista') || s.includes('sca ')) return 'Barista';
  if (/\b(ielts|toefl|toeic|cefr|language)\b/.test(s)) return 'Language';
  return 'Other';
}

export interface AutofillResult {
  draft: CandidateDraft;
  /** Что именно заполнили — для сводки «Found in your CV». */
  applied: { label: string; value: string }[];
}

export function applyCvFields(draft: CandidateDraft, f: CvFields): AutofillResult {
  const next: CandidateDraft = { ...draft };
  const applied: AutofillResult['applied'] = [];

  const nationality = matchNationalityExact(f.nationality);
  if (!draft.nationality && nationality) {
    next.nationality = nationality;
    applied.push({ label: 'Nationality', value: nationality });
  }

  const location = f.location?.trim();
  if (!draft.location.trim() && location && location.length >= 2) {
    next.location = location;
    applied.push({ label: 'Based in', value: location });
  }

  const hasRoles = (draft.targetRoles?.length ?? 0) > 0 || !!draft.role;
  const roles = normalizeTargetRoles(f.desired_positions).slice(0, 5);
  if (!hasRoles && roles.length) {
    next.targetRoles = roles;
    applied.push({ label: 'Positions', value: roles.join(', ') });
  }

  if (draft.years === null && f.years_experience !== null && f.years_experience >= 0) {
    next.years = f.years_experience;
    applied.push({ label: 'Experience', value: `${f.years_experience} ${f.years_experience === 1 ? 'year' : 'years'}` });
  }

  if (draft.certificates.length === 0 && f.certificates.length) {
    next.certificates = f.certificates.slice(0, 8).map((name) => ({ name, type: certificateType(name) }));
    applied.push({ label: 'Certificates', value: f.certificates.slice(0, 8).join(', ') });
  }

  return { draft: next, applied };
}
