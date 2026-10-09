import { CvTemplate, type CvData } from '@/components/cv/cv-template';
import type { ServerResume } from '@/lib/api/candidate';
import type { CandidateDraft } from '@/lib/demo/candidate';
import { venueLine } from '@/lib/candidate/venues';

export function SavedCv({ resume, draft, name }: { resume: ServerResume; draft: CandidateDraft; name: { first: string; last: string } }) {
  const data: CvData = {
    firstName: name.first, lastName: name.last, role: resume.position,
    nationality: draft.nationality || null, years: draft.years, location: draft.location || null,
    summary: resume.aboutMe || null, skills: resume.skills ?? [],
    work: (resume.experiences ?? []).map((w) => ({ title: w.position, place: [w.company_name, venueLine({ venueType: w.venue_type, venueLevel: w.venue_level, cuisine: w.cuisine })].filter(Boolean).join(' · ') || null, dates: w.start_date ? `${w.start_date} — ${w.end_date ?? 'Present'}` : null, bullets: w.description ? [w.description] : [] })),
    education: (resume.educations ?? []).map((e) => [e.degree, e.field_of_study, e.institution].filter(Boolean).join(' · ')),
    languages: resume.languages, certificates: draft.certificates.map((c) => c.type === 'Other' ? c.name : c.type),
  };
  return <CvTemplate data={data} />;
}
