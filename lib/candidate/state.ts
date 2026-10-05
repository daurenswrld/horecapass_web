import type { CurrentUser } from '@/lib/api/auth';
import type { ServerResume } from '@/lib/api/candidate';
import type { CandidateProgress } from '@/lib/api/candidate-progress';
import { emptyCandidate, type CandidateDraft } from '@/lib/demo/candidate';

const text = (value: unknown) => typeof value === 'string' ? value : '';

/** Fill gaps from real account data without replacing newer unfinished answers. */
export function hydrateCandidate(saved: Partial<CandidateDraft> | null, user: CurrentUser, resume: ServerResume | null): CandidateDraft {
  const d = { ...emptyCandidate(), ...saved };
  let fileName = '';
  try { fileName = decodeURIComponent(new URL(text(user.cv_file), 'https://api.horecapass.com').pathname.split('/').pop() ?? ''); } catch { /* keep saved name */ }
  return {
    ...d,
    nationality: d.nationality || text(user.nationality),
    location: d.location || text(user.current_location),
    countries: d.countries.length ? d.countries : text(user.target_country).split(',').map((c) => c.trim()).filter(Boolean),
    cvFile: d.cvFile || fileName || null,
    cvBuilt: d.cvBuilt || !!resume?.hasContent || !!resume?.aboutMe.trim(),
    role: d.role || (resume?.title !== 'Hospitality professional' ? resume?.position : null) || null,
    check: {
      ...d.check,
      ...(!d.check.languages && resume?.languages.length ? { languages: resume.languages.join(', ') } : {}),
      ...(!d.check.achievement && resume?.aboutMe ? { achievement: resume.aboutMe } : {}),
    },
  };
}

export function candidateDestination(progress: CandidateProgress, user: CurrentUser, resume: ServerResume | null): string {
  if (progress.status === 'completed' || progress.status === 'deferred') return '/jobs';
  if (progress.status === 'in_progress') return '/onboarding';
  // Existing complete basic profiles predate web progress; do not restart them.
  return resume?.aboutMe.trim() && text(user.nationality) && text(user.current_location) ? '/jobs' : '/onboarding';
}

export function afterMaterials(d: CandidateDraft) {
  return d.nationality && d.location.trim().length >= 2 ? 'countries' as const : 'based' as const;
}
