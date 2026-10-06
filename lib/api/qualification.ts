import { http } from './client';

export interface QualificationSession {
  id: number;
  role: string;
  level: number;
  questions: { id: string; role: string; level: number; text: string }[];
  answers: { question_id: string; text: string; mode: 'text' | 'voice_transcript' }[];
  status: 'in_progress' | 'awaiting_evaluation' | 'evaluating' | 'review_pending';
  result: 'review_pending' | null;
}

const BASE = '/api/web/qualification/';
export const qualificationApi = {
  load: () => http.get<{ roles: string[]; session: QualificationSession | null }>(BASE),
  start: (role: string, level: number) => http.post<QualificationSession>(BASE, { role, level }),
  answer: (id: number, answer: { question_id: string; text: string; mode: string; elapsed_seconds: number; paste_detected: boolean; focus_lost_count: number; focus_lost_seconds: number }) => http.post<QualificationSession>(`${BASE}${id}/answers/`, answer),
  evaluate: (id: number) => http.post<QualificationSession>(`${BASE}${id}/evaluate/`, {}),
};
