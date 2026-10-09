import { API } from './endpoints';
import { ApiError, http } from './client';

/**
 * Профиль и резюме кандидата на сервере.
 *
 * Поддерживаем текущий list API и старый сервер с одним объектом:
 * - профиль: PATCH /users/api/users/me/ — nationality, current_location,
 *   target_country, first_name, last_name, cv_file (файл);
 * - GET /api/resumes/my/ отдаёт список, пагинацию либо старый объект;
 *   работаем с последним обновлённым резюме, POST создаёт, PATCH обновляет;
 * - сертификаты: POST /api/resumes/my/certificates/ (title, file).
 *
 * Работодатель видит это в отклике сразу (applicant_profile собирается из
 * профиля и резюме кандидата), привязывать резюме к отклику не нужно.
 */

type Json = Record<string, unknown>;

export class VenueNotSupportedError extends Error {}

export interface ServerExperience {
  company_name: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  venue_type: string | null;
  venue_level: string | null;
  cuisine: string | null;
}

export interface ServerResume {
  id: number;
  title: string;
  position: string;
  languages: string[];
  aboutMe: string;
  hasContent?: boolean;
  skills?: string[];
  experiences?: ServerExperience[];
  educations?: { institution: string; degree: string; field_of_study: string | null; start_date: string; end_date: string | null }[];
}

const RESUME_MINE = '/api/resumes/my/';

function parseResume(j: Json): ServerResume {
  const id = Number(j.id);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(502, j, 'Invalid resume id');
  return {
    id,
    title: String(j.title ?? ''),
    position: String(j.position ?? j.title ?? ''),
    languages: Array.isArray(j.languages) ? j.languages.map(String) : [],
    aboutMe: String(j.about_me ?? ''),
    skills: Array.isArray(j.skills) ? j.skills.flatMap((s) => s && typeof s === 'object' && typeof s.name === 'string' ? [s.name] : typeof s === 'string' ? [s] : []) : [],
    experiences: Array.isArray(j.experiences) ? j.experiences.filter((e) => e && typeof e === 'object').map((e) => ({ company_name: String(e.company_name ?? ''), position: String(e.position ?? ''), start_date: String(e.start_date ?? ''), end_date: e.end_date ? String(e.end_date) : null, description: e.description ? String(e.description) : null, venue_type: e.venue_type ? String(e.venue_type) : null, venue_level: e.venue_level ? String(e.venue_level) : null, cuisine: e.cuisine ? String(e.cuisine) : null })) : [],
    educations: Array.isArray(j.educations) ? j.educations.filter((e) => e && typeof e === 'object').map((e) => ({ institution: String(e.institution ?? ''), degree: String(e.degree ?? ''), field_of_study: e.field_of_study ? String(e.field_of_study) : null, start_date: String(e.start_date ?? ''), end_date: e.end_date ? String(e.end_date) : null })) : [],
    hasContent: !!String(j.about_me ?? '').trim() || ['skills', 'experiences', 'educations'].some((key) => Array.isArray(j[key]) && j[key].length > 0),
  };
}

function currentResume(value: unknown): ServerResume | null {
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value as Json : null;
  const rows: unknown[] = Array.isArray(value) ? value : Array.isArray(object?.results) ? object.results : object ? [object] : [];
  if (!rows.length) return null;
  const valid = rows.filter((row): row is Json => {
    if (!row || typeof row !== 'object') return false;
    const id = Number((row as Json).id);
    return Number.isSafeInteger(id) && id > 0;
  });
  if (!valid.length) throw new ApiError(502, value, 'Invalid resume list');
  valid.sort((a, b) => {
    const date = (r: Json) => Date.parse(String(r.updated_at ?? r.created_at ?? '')) || 0;
    return date(b) - date(a) || Number(b.id) - Number(a.id);
  });
  return parseResume(valid[0]);
}

export const candidateApi = {
  /** Поля профиля пользователя. Пустые не отправляем — сервер не любит "". */
  patchProfile(fields: Record<string, string | null | undefined>) {
    const body = Object.fromEntries(Object.entries(fields).filter(([, v]) => v != null && v !== ''));
    return Object.keys(body).length ? http.patch<Json>(API.auth.me, body) : Promise.resolve(null);
  },

  uploadCv(file: File) {
    const fd = new FormData();
    fd.set('cv_file', file);
    return http.patch<Json>(API.auth.me, fd);
  },

  async myResume(): Promise<ServerResume | null> {
    try {
      return currentResume(await http.get<unknown>(RESUME_MINE));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  async resume(id: number): Promise<ServerResume> {
    if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(502, id, 'Invalid resume id');
    return parseResume(await http.get<Json>(`${RESUME_MINE}${id}/`));
  },

  /** Создаёт резюме или обновляет существующее. Опыт и образование не трогает. */
  async saveResume(fields: Json): Promise<ServerResume> {
    const body = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)),
    );
    // Текущий backend хранит целевую роль в title; position остаётся для legacy.
    if (!body.title && body.position) body.title = body.position;
    const current = await candidateApi.myResume();
    if (current) return parseResume(await http.patch<Json>(`${RESUME_MINE}${current.id}/`, body));
    return parseResume(await http.post<Json>(RESUME_MINE, { title: 'Hospitality professional', ...body }));
  },

  /**
   * Места работы из резюме вместе с типом заведения, уровнем и кухней.
   * Название, «о себе» и языки ставим, только если в резюме их ещё нет.
   * Опыт заменяется целиком, поэтому вызывающий присылает уже слитый список.
   */
  async saveCvDetails(input: { title?: string | null; aboutMe?: string | null; languages?: string[]; experiences: Json[] }): Promise<ServerResume> {
    const current = await candidateApi.myResume();
    const body: Json = { experiences: input.experiences };
    if (input.title && !current?.title.trim()) body.title = input.title;
    if (input.aboutMe && !current?.aboutMe.trim()) body.about_me = input.aboutMe;
    if (input.languages?.length && !current?.languages.length) body.languages = input.languages;
    const saved = current
      ? await http.patch<Json>(`${RESUME_MINE}${current.id}/`, body)
      : await http.post<Json>(RESUME_MINE, { title: input.title || 'Hospitality professional', ...body });
    // Старый сервер молча отбрасывает тип заведения, уровень и кухню: тогда они не сохранились.
    const sentVenue = input.experiences.some((e) => e.venue_type || e.venue_level || e.cuisine);
    const back = Array.isArray(saved.experiences) ? saved.experiences : [];
    if (sentVenue && back.length && !back.some((e) => e && typeof e === 'object' && 'venue_type' in e)) {
      throw new VenueNotSupportedError();
    }
    return parseResume(saved);
  },

  async uploadVideo(file: File) {
    const resume = (await candidateApi.myResume()) ?? (await candidateApi.saveResume({}));
    const fd = new FormData();
    fd.set('video_greeting', file);
    return http.patch<Json>(`${RESUME_MINE}${resume.id}/`, fd);
  },

  /**
   * PDF резюме собирает сервер: GET /api/resumes/my/<id>/pdf/ →
   * {"cv_file_url": "/media/resumes/…pdf"}. Файл берём через свой прокси.
   */
  async pdfUrl(): Promise<string> {
    const resume = await candidateApi.myResume();
    if (!resume) throw new Error('no resume yet');
    const d = await http.get<Json>(`${RESUME_MINE}${resume.id}/pdf/`);
    const path = String(d.cv_file_url ?? '');
    if (!path) throw new Error('no pdf');
    return path.startsWith('http') ? path : `/backend${path.startsWith('/') ? '' : '/'}${path}`;
  },

  addCertificate(file: File, title: string) {
    const fd = new FormData();
    fd.set('title', title);
    fd.set('file', file);
    return http.post<Json>(API.resumes.certificates, fd);
  },
};
