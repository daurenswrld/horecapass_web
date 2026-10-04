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

export interface ServerResume {
  id: number;
  title: string;
  position: string;
  languages: string[];
  aboutMe: string;
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
