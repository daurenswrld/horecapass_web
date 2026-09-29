import { parseApplicantProfile, type CompanyApplication } from '@/lib/api/applications';
import type { ChatMessage, ChatRoom, ChatUser } from '@/lib/api/chats';

/**
 * Примеры данных для показа.
 *
 * Подставляются только когда сервер вернул пустой список: на новом аккаунте
 * смотреть нечего, а показать раздел надо. Как только появятся настоящие
 * отклики и переписки, примеры исчезнут сами — подмешивать их к живым данным
 * нельзя, иначе непонятно, где что.
 *
 * Экран, работающий на примерах, обязан это показывать.
 */

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d;
};

/** Образец отклика: профиль в том же виде, что присылает сервер. */
function sampleCandidate(
  id: number,
  name: string,
  vacancyTitle: string,
  status: CompanyApplication['status'],
  daysAgo: number,
  matchScore: number,
  raw: Record<string, unknown>,
  coverLetter: string | null = null,
): CompanyApplication {
  const profile = { name, ...raw };
  return {
    id,
    vacancyId: null,
    applicant: name,
    vacancyTitle,
    status,
    createdAt: day(daysAgo),
    avatarUrl: null,
    matchScore,
    requiresVideoGreeting: false,
    videoGreetingUrl: null,
    coverLetter,
    relocationStep: null,
    details: parseApplicantProfile(profile),
    profile,
  };
}

// Имена и заведения вымышленные. Интерфейс английский, рынок — GCC:
// русские имена в образцах выглядели чужеродно.
export const SAMPLE_CANDIDATES: CompanyApplication[] = [
  sampleCandidate(
    -1,
    'Maria Santos',
    'Banquet Supervisor',
    'NEW',
    1,
    92,
    {
      nationality: 'Filipino',
      location: 'Dubai, UAE',
      position: 'Banquet Supervisor',
      position_level: 'Supervisor',
      visa_status: 'Visit visa',
      desired_salary: '7000',
      salary_currency: 'AED',
      salary_period: 'month',
      languages: ['English — fluent', 'Tagalog — native'],
      skills: ['Banquet service', 'Team leadership', 'Event setup'],
      experiences: [
        {
          position: 'Banquet Captain',
          company: 'Marina Grand Hotel',
          period: '03/2022 — Now',
          description: 'Events up to 300 guests, team of 12.',
        },
        { position: 'Waitress', company: 'Manila Bay Resort', period: '06/2018 — 02/2022', description: '' },
      ],
    },
    'I have run banquets for up to 300 guests and would love to join a new team.',
  ),
  sampleCandidate(-2, 'Rahul Nair', 'Chef de Partie', 'REVIEWED', 3, 74, {
    nationality: 'Indian',
    location: 'Abu Dhabi, UAE',
    position: 'Chef de Partie',
    languages: ['English', 'Hindi', 'Malayalam'],
    skills: ['Hot kitchen', 'HACCP'],
    experiences: [{ position: 'Demi Chef de Partie', company: 'Palm Coast Hotel', period: '01/2021 — Now', description: '' }],
  }),
  sampleCandidate(-3, 'Aisha Rahman', 'Hostess', 'INVITED', 6, 81, {
    nationality: 'Bangladeshi',
    location: 'Riyadh, KSA',
    position: 'Hostess',
    languages: ['English', 'Arabic — basic'],
    skills: ['Guest relations', 'Reservations'],
  }),
  sampleCandidate(-4, 'Omar Haddad', 'Waiter', 'REJECTED', 9, 38, {
    nationality: 'Jordanian',
    location: 'Amman, Jordan',
    position: 'Waiter',
    languages: ['Arabic', 'English — basic'],
  }),
];

const candidate: ChatUser = {
  id: -11,
  firstName: 'Maria',
  lastName: 'Santos',
  role: 'APPLICANT',
  avatar: null,
  displayName: 'Maria Santos',
};

const recruiter: ChatUser = {
  id: -12,
  firstName: 'You',
  lastName: '',
  role: 'COMPANY_OWNER',
  avatar: null,
  displayName: 'You',
};

const msg = (id: number, sender: ChatUser, text: string, offset: number): ChatMessage => ({
  id,
  room: -21,
  sender,
  text,
  createdAt: day(offset),
  suggestions: [],
  audioUrl: null,
  audioDuration: null,
  isVoice: false,
});

export const SAMPLE_MESSAGES: ChatMessage[] = [
  msg(-101, candidate, 'Application for: Banquet Supervisor', 2),
  msg(-102, recruiter, 'Hello! Thanks for applying. Do you have experience with banquets for 200+ guests?', 1),
  msg(-103, candidate, 'Hello! Yes, I have run banquets for up to 300 guests over the past three years.', 1),
  msg(-104, recruiter, 'Great. Could you come in for an interview on Thursday at 3pm?', 0),
];

export const SAMPLE_ROOMS: ChatRoom[] = [
  {
    id: -21,
    chatType: 'DIRECT',
    unreadCount: 1,
    participants: [candidate, recruiter],
    peer: candidate,
    applicationSummary: {
      applicationId: -1,
      vacancyId: -1,
      vacancyTitle: 'Banquet Supervisor',
      companyId: null,
      companyName: '',
      companyLogoUrl: null,
    },
    lastMessage: SAMPLE_MESSAGES[SAMPLE_MESSAGES.length - 1],
  },
];

/** Пример ли это. По отрицательному id отличаем от настоящих записей. */
export const isSample = (id: number) => id < 0;
