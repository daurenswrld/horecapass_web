import type { CvExperience } from '@/lib/api/autofill';
import type { ServerExperience } from '@/lib/api/candidate';

/**
 * Что делает резюме понятным работодателю из Залива: у каждого места работы
 * тип заведения, его уровень и кухня. Из Казахстана или с Филиппин «топ-3
 * ресторан Алматы» в Дубае ничего не значит, пока это не написано в резюме.
 * Список типов совпадает с бэкендом (resumes/venues.py).
 */

export const VENUE_TYPES = [
  'Fine dining',
  'Casual dining',
  'Hotel',
  'Resort',
  'Catering',
  'Cafe / bakery',
  'Bar / lounge / club',
  'Fast food / takeaway',
  'Other',
] as const;

export interface JobDraft {
  key: string;
  company: string;
  position: string;
  /** YYYY-MM или пусто */
  start: string;
  end: string;
  venueType: string;
  venueLevel: string;
  cuisine: string;
  /** Город, абзац «About <работодатель>» и два списка: то, что показывает шаблон резюме. */
  location: string;
  about: string;
  responsibilities: string[];
  achievements: string[];
  /** Описание, которое уже есть в сохранённом резюме: при сохранении его не теряем. */
  description: string;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const ym = (date: string | null | undefined) => (date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '');

/** «Fine dining · top-3 in Almaty · Italian cuisine» — одна строка для карточек и резюме. */
export function venueLine(v: { venueType?: string | null; venueLevel?: string | null; cuisine?: string | null }): string {
  return [v.venueType, v.venueLevel, v.cuisine ? (/cuisine/i.test(v.cuisine) ? v.cuisine : `${v.cuisine} cuisine`) : ''].map((x) => (x ?? '').trim()).filter(Boolean).join(' · ');
}

/**
 * Места работы из резюме + то, что уже сохранено у кандидата. Сохранённое не
 * затираем: если у него для этой компании уже указан тип заведения, остаётся он.
 */
export function mergeJobs(saved: ServerExperience[], found: CvExperience[]): JobDraft[] {
  const jobs: JobDraft[] = [];
  const used = new Set<number>();
  found.forEach((f, i) => {
    const company = (f.company ?? '').trim();
    const position = (f.position ?? '').trim();
    if (!company && !position) return;
    const at = saved.findIndex((s, idx) => !used.has(idx) && !!company && norm(s.company_name) === norm(company));
    const old = at >= 0 ? saved[at] : null;
    if (at >= 0) used.add(at);
    jobs.push({
      key: `found-${i}`,
      company: company || old?.company_name || '',
      position: position || old?.position || '',
      start: ym(f.start_date) || ym(old?.start_date),
      end: ym(f.end_date) || (old ? ym(old.end_date) : ''),
      venueType: old?.venue_type || f.venue_type || '',
      venueLevel: old?.venue_level || f.venue_level || '',
      cuisine: old?.cuisine || f.cuisine || '',
      location: old?.location || f.location || '',
      about: old?.about ?? '',
      responsibilities: old?.responsibilities?.length ? old.responsibilities : (f.responsibilities ?? []),
      achievements: old?.achievements?.length ? old.achievements : (f.achievements ?? []),
      description: old?.description ?? '',
    });
  });
  saved.forEach((s, idx) => {
    if (used.has(idx)) return;
    jobs.push({
      key: `saved-${idx}`,
      company: s.company_name,
      position: s.position,
      start: ym(s.start_date),
      end: ym(s.end_date),
      venueType: s.venue_type ?? '',
      venueLevel: s.venue_level ?? '',
      cuisine: s.cuisine ?? '',
      location: s.location ?? '',
      about: s.about ?? '',
      responsibilities: s.responsibilities ?? [],
      achievements: s.achievements ?? [],
      description: s.description ?? '',
    });
  });
  return jobs;
}

/** Место попадает в резюме, только если есть, где и кем работал, и когда начал (сервер требует дату). */
export function canSaveJob(j: JobDraft): boolean {
  return !!j.company.trim() && !!j.position.trim() && /^\d{4}-\d{2}$/.test(j.start);
}

export function toServerExperiences(jobs: JobDraft[]) {
  return jobs.filter(canSaveJob).map((j) => ({
    company_name: j.company.trim(),
    position: j.position.trim(),
    start_date: `${j.start}-01`,
    end_date: /^\d{4}-\d{2}$/.test(j.end) ? `${j.end}-01` : null,
    description: j.description,
    venue_type: j.venueType || null,
    venue_level: j.venueLevel.trim() || null,
    cuisine: j.cuisine.trim() || null,
    location: j.location.trim() || null,
    about: j.about.trim() || null,
    responsibilities: j.responsibilities,
    achievements: j.achievements,
  }));
}

/** Что особенно важно для этой роли (бриф заказчицы 08.10): фото у хостес, блюда у шефа. */
export function roleNudge(positions: string[]): string | null {
  const text = positions.join(' ').toLowerCase();
  if (/\b(host|hostess|greeter|receptionist)\b/.test(text))
    return 'For hosts and hostesses the photo matters most. Add a clear professional photo in Portfolio below.';
  if (/\b(chef|cook|sous|commis|pastry|kitchen|sushi)\b/.test(text))
    return 'For chefs, employers look at the cuisines you know and how you present dishes. Add photos of your dishes in Portfolio below.';
  if (/\b(bar|barista|bartender|mixolog)/.test(text))
    return 'For bar and coffee roles, tell employers what kind of venue it was and add photos of your signature drinks in Portfolio below.';
  return null;
}
