import { CvTemplate } from '@/components/cv/cv-template';
import type { ServerResume } from '@/lib/api/candidate';
import type { CandidateDraft } from '@/lib/demo/candidate';
import { cvFromResume } from '@/lib/candidate/cv-data';

export function SavedCv({ resume, draft, name }: { resume: ServerResume; draft: CandidateDraft; name: { first: string; last: string } }) {
  return <CvTemplate data={cvFromResume(resume, draft, name)} />;
}
