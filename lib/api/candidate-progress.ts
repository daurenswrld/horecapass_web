import { http } from './client';
import type { CandidateDraft } from '@/lib/demo/candidate';

export type ProgressStatus = 'not_started' | 'in_progress' | 'deferred' | 'completed';
export interface CandidateProgress {
  draft: Partial<CandidateDraft> | null;
  status: ProgressStatus;
  version: number;
  updated_at: string | null;
}
const PATH = '/api/web/candidate-onboarding/';
export const candidateProgressApi = {
  load: (signal?: AbortSignal) => http.get<CandidateProgress>(PATH, { signal }),
  save: (draft: CandidateDraft, status: Exclude<ProgressStatus, 'not_started'>, version: number, signal?: AbortSignal) =>
    http.put<CandidateProgress>(PATH, { draft, status, version }, { signal }),
};
