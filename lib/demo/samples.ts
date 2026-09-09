import type { CompanyApplication } from '@/lib/api/applications';
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

export const SAMPLE_CANDIDATES: CompanyApplication[] = [
  {
    id: -1,
    applicant: 'Айгерим Сарсенова',
    vacancyTitle: 'Banquet Supervisor',
    status: 'NEW',
    createdAt: day(1),
    avatarUrl: null,
    matchScore: 92,
    requiresVideoGreeting: true,
    videoGreetingUrl: null,
    profile: {},
  },
  {
    id: -2,
    applicant: 'Ерлан Мухамедов',
    vacancyTitle: 'Chef de Partie',
    status: 'REVIEWED',
    createdAt: day(3),
    avatarUrl: null,
    matchScore: 74,
    requiresVideoGreeting: false,
    videoGreetingUrl: null,
    profile: {},
  },
  {
    id: -3,
    applicant: 'Дина Абишева',
    vacancyTitle: 'Hostess',
    status: 'INVITED',
    createdAt: day(6),
    avatarUrl: null,
    matchScore: 61,
    requiresVideoGreeting: false,
    videoGreetingUrl: null,
    profile: {},
  },
  {
    id: -4,
    applicant: 'Тимур Байжанов',
    vacancyTitle: 'Waiter',
    status: 'REJECTED',
    createdAt: day(9),
    avatarUrl: null,
    matchScore: 38,
    requiresVideoGreeting: false,
    videoGreetingUrl: null,
    profile: {},
  },
];

const candidate: ChatUser = {
  id: -11,
  firstName: 'Айгерим',
  lastName: 'Сарсенова',
  role: 'APPLICANT',
  avatar: null,
  displayName: 'Айгерим Сарсенова',
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
