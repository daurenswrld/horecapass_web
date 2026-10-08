/**
 * Приветственный квиз: вопросы и реплики-«мостики» из макета (Figma, раздел
 * «Welcome page+quiz»). Тексты утверждены заказчицей, их не переписываем.
 *
 * Идентификаторы вопросов и вариантов уходят на сервер как есть и попадают в
 * статистику админки, поэтому после запуска их менять нельзя: счётчики за
 * прошлые дни привязаны к ним. Новый вариант — новый id.
 *
 * Отступление от макета одно: на экране про резюме у кандидата в макете
 * осталась заголовком копия предыдущего вопроса («What worries you most…»)
 * при вариантах про состояние резюме. Здесь заголовок по смыслу вариантов.
 */

export type QuizRole = 'applicant' | 'company';

export interface QuizOption {
  id: string;
  label: string;
}

export type QuizStep =
  | { kind: 'bridge'; text: string }
  | { kind: 'question'; id: string; title: string; multi?: boolean; options: QuizOption[] };

const SELECT_ALL = 'Select all that apply';

export const QUIZ: Record<QuizRole, { steps: QuizStep[]; finish: string; cta: string }> = {
  applicant: {
    steps: [
      { kind: 'bridge', text: 'Got it. A few quick questions so we can point you to the right roles — not just any roles.' },
      {
        kind: 'question',
        id: 'frustration',
        title: "What's been the most frustrating part of your job search so far?",
        multi: true,
        options: [
          { id: 'no_reply', label: 'I apply and never hear back' },
          { id: 'cv_weak', label: "My CV doesn't fully show what I can actually do" },
          { id: 'endless_docs', label: 'Recruiters ask for endless documents before we even talk' },
          { id: 'job_differs', label: 'The job turned out different from what was promised' },
          { id: 'other', label: 'Something else' },
        ],
      },
      {
        kind: 'bridge',
        text: "That's exactly why Horeca Pass works through WhatsApp, not a black-box inbox — and why our team looks past a plain CV to see your real experience, the way an experienced recruiter would.",
      },
      {
        kind: 'question',
        id: 'role_kind',
        title: 'What kind of role are you looking for?',
        options: [
          { id: 'kitchen', label: 'Kitchen & culinary (chef, cook, kitchen staff)' },
          { id: 'service', label: 'Food & beverage service (waiter, bartender, host)' },
          { id: 'front_office', label: 'Front office & guest services / guest relations' },
          { id: 'housekeeping', label: 'Housekeeping' },
          { id: 'management', label: 'Management / supervisory / executives' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        kind: 'question',
        id: 'worry',
        title: 'What worries you most about starting a new job?',
        options: [
          { id: 'terms_differ', label: 'Terms turning out different from what was agreed' },
          { id: 'employer_unknown', label: 'Not knowing enough about the employer beforehand' },
          { id: 'slow_process', label: 'The process dragging on with no clear answer' },
          { id: 'nothing', label: 'Nothing specific — just want the process to be clear' },
        ],
      },
      {
        kind: 'bridge',
        text: "This is exactly why every listing on Horeca Pass shows real terms upfront — no surprises after you've already said yes.",
      },
      {
        kind: 'question',
        id: 'cv_state',
        title: 'How would you describe your current CV?',
        options: [
          { id: 'strong', label: 'Up to date and strong' },
          { id: 'outdated', label: 'A bit outdated' },
          { id: 'not_showing', label: 'Not sure it really shows my experience' },
          { id: 'none', label: "I don't have one prepared" },
        ],
      },
      {
        kind: 'bridge',
        text: "That's exactly why Horeca Pass can build a professional CV for you — one built the way an experienced recruiter would, so you don't get skipped in the first ten seconds.",
      },
    ],
    finish: "Perfect — let's build your profile so employers come to you, not the other way around.",
    cta: 'Create my profile',
  },
  company: {
    steps: [
      { kind: 'bridge', text: 'Got it. A few quick questions so we understand exactly who you need — and skip the noise.' },
      {
        kind: 'question',
        id: 'pain',
        title: "What's the biggest pain point in your hiring process right now?",
        multi: true,
        options: [
          { id: 'ghosting', label: 'Candidates who ghost after accepting the offer' },
          { id: 'unqualified', label: 'Too many unqualified applicants to sort through' },
          { id: 'agency_fees', label: 'Agencies charging high fees just to fill one role' },
          { id: 'slow_costly', label: 'Hiring takes too long and costs too much overall' },
        ],
      },
      {
        kind: 'bridge',
        text: "That's exactly the gap Horeca Pass closes — a pocket recruiter, not an agency price tag. You stay in control of the process, backed by smart matching and a pre-filtered candidate pool built on 9 years of hands-on GCC hospitality recruiting.",
      },
      {
        kind: 'question',
        id: 'sourcing',
        title: 'How are you currently finding candidates?',
        options: [
          { id: 'agencies', label: 'Recruitment agencies' },
          { id: 'job_boards', label: 'Job boards / social media' },
          { id: 'referrals', label: 'Referrals from staff' },
          { id: 'manual', label: "It's mostly manual and time-consuming" },
        ],
      },
      {
        kind: 'bridge',
        text: 'Manual screening is exactly what our smart matching replaces — it looks at real experience and fit, not just keywords on a CV.',
      },
      {
        kind: 'question',
        id: 'driver',
        title: "What's driving your current hiring need?",
        options: [
          { id: 'pre_opening', label: 'Opening a new property / pre-opening' },
          { id: 'turnover', label: 'Replacing high turnover' },
          { id: 'scaling', label: 'Scaling an existing team' },
          { id: 'specialist', label: 'A hard-to-fill specialist role' },
        ],
      },
      {
        kind: 'bridge',
        text: "Good to know — whether it's a pre-opening ramp-up or a hard-to-source specialist role, that's exactly the kind of hiring our network is built around.",
      },
      {
        kind: 'question',
        id: 'volume',
        title: 'How many hospitality roles are you typically hiring for at once?',
        options: [
          { id: 'one_two', label: '1-2 roles' },
          { id: 'three_ten', label: '3-10 roles' },
          { id: 'ten_plus', label: '10+ / ongoing hiring' },
        ],
      },
    ],
    finish: "Got it — let's set you up to start receiving matched candidates.",
    cta: 'Create my company',
  },
};

export const QUESTION_HINT = SELECT_ALL;

/** Подписи для админки: id вопроса и варианта → текст из макета. */
export function labelOf(role: QuizRole, questionId: string, optionId?: string): string {
  const q = QUIZ[role].steps.find((s): s is Extract<QuizStep, { kind: 'question' }> => s.kind === 'question' && s.id === questionId);
  if (!q) return optionId ?? questionId;
  if (optionId === undefined) return q.title;
  return q.options.find((o) => o.id === optionId)?.label ?? optionId;
}

export function questionIds(role: QuizRole): string[] {
  return QUIZ[role].steps.flatMap((s) => (s.kind === 'question' ? [s.id] : []));
}
