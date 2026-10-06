'use client';

import * as React from 'react';
import { AdminHeader, ErrorNote, useLoad } from '@/components/admin/ui';
import { Button } from '@/components/ui/primitives';
import { http } from '@/lib/api/client';

interface Review {
  id: number; name: string; role: string; level: number; status: string;
  evaluation: { employer_summary?: string; overall_verdict?: string; criteria_source?: string; framework_version?: string; answers?: { question_id: string; verdict: string; reasoning: string }[] };
  answers: { question_id: string; question: string; text: string; mode: string; elapsed_seconds: number; paste_detected: boolean; focus_lost_count: number; focus_lost_seconds: number }[];
}

export default function QualificationReviews() {
  const [offset, setOffset] = React.useState(0);
  const data = useLoad(() => http.get<{ count: number; results: Review[] }>('/api/admin/qualifications/', { query: { offset } }), [offset]);
  return <>
    <AdminHeader title="Qualification reviews" subtitle="Saved answers and Smart's assessment for staff review" />
    <div className="space-y-5 px-5 py-6 md:px-8">
      <p className="text-sm text-text-secondary">Smart assesses practical knowledge. Timing, pasted text and time away from the tab do not prove AI use. Results here do not automatically grant Verified or decide hiring.</p>
      {data.error && <ErrorNote message={data.error} onRetry={data.reload} />}
      {data.loading && <p role="status">Loading reviews…</p>}
      {data.data?.results.length === 0 && <p>No completed qualifications awaiting review.</p>}
      {data.data?.results.map((row) => <article key={row.id} className="space-y-4 rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold text-heading">{row.name} · {row.role} · Level {row.level}</h2>
        <p className="text-sm text-text-secondary">{row.evaluation.overall_verdict ? `Assessment: ${row.evaluation.overall_verdict} · Framework ${row.evaluation.framework_version} · ${row.evaluation.criteria_source}` : 'Answers saved; Smart assessment not available yet.'}</p>
        {row.evaluation.employer_summary && <p>{row.evaluation.employer_summary}</p>}
        <details><summary className="cursor-pointer font-semibold">Review eight answers</summary><div className="mt-4 space-y-4">{row.answers.map((answer, index) => {
          const verdict = row.evaluation.answers?.find((a) => a.question_id === answer.question_id);
          return <div key={answer.question_id} className="space-y-2 border-t border-line pt-3"><h3 className="font-semibold">{index + 1}. {answer.question}</h3><p className="whitespace-pre-wrap">{answer.text}</p>{verdict && <p className="text-sm text-text-secondary">{verdict.verdict}: {verdict.reasoning}</p>}<p className="text-xs text-text-secondary">{answer.mode} · {answer.elapsed_seconds}s · pasted text: {answer.paste_detected ? 'yes' : 'no'} · away from tab: {answer.focus_lost_count} times / {answer.focus_lost_seconds}s (client-reported)</p></div>;
        })}</div></details>
      </article>)}
      <div className="flex gap-3"><Button variant="secondary" disabled={!offset || data.loading} onClick={() => setOffset((n) => Math.max(0, n - 25))}>Previous</Button><Button variant="secondary" disabled={data.loading || !data.data || offset + 25 >= data.data.count} onClick={() => setOffset((n) => n + 25)}>Next</Button></div>
    </div>
  </>;
}
