import { API } from './endpoints';
import { ApiError, http } from './client';

/**
 * Профиль и резюме кандидата на сервере.
 *
 * Формы сверены с боевым сервером (OPTIONS и пробные запросы 29.09), а не
 * с кодом бэкенда в репозитории — прод собран из другой версии:
 * - профиль: PATCH /users/api/users/me/ — nationality, current_location,
 *   target_country, first_name, last_name, cv_file (файл);
 * - резюме одно на кандидата: GET /api/resumes/my/ отдаёт его (404 — ещё нет),
 *   POST создаёт, PATCH /api/resumes/my/<id>/ обновляет; salary_period —
 *   MONTH / HOUR; languages — массив строк;
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
  return {
    id: Number(j.id),
    title: String(j.title ?? ''),
    position: String(j.position ?? ''),
    languages: Array.isArray(j.languages) ? j.languages.map(String) : [],
    aboutMe: String(j.about_me ?? ''),
  };
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
      return parseResume(await http.get<Json>(RESUME_MINE));
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
