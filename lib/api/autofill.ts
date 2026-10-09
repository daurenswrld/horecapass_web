import { API } from './endpoints';
import { http, ApiError } from './client';
import { extractCvText } from '@/lib/cv-text';
import { fileToBase64 } from './ai';

/**
 * Автозаполнение форм по документу: резюме → профиль кандидата, описание
 * вакансии → форма вакансии. Сервер читает документ ИИ и возвращает только то,
 * что в нём написано; человек проверяет и правит поля сам.
 */

export interface CvExperience {
  company: string | null;
  position: string | null;
  /** YYYY-MM */
  start_date: string | null;
  end_date: string | null;
  venue_type: string | null;
  venue_level: string | null;
  cuisine: string | null;
}

export interface CvFields {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  location: string | null;
  desired_positions: string[];
  years_experience: number | null;
  languages: string[];
  skills: string[];
  certificates: string[];
  summary: string | null;
  experiences: CvExperience[];
}

export interface VacancyFields {
  title: string | null;
  department: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  employment_type: string | null;
  schedule: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  salary_type: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string[];
  benefits: string[];
  skills: string[];
}

interface DocumentInput {
  text?: string;
  file?: string;
}

/** Размер файла, который сервер примет в base64 (лимит поля 6 МБ). */
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TEXT = 30000;

export class AutofillError extends Error {}

const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
const isImage = (f: File) => /^image\/(png|jpe?g|webp|gif|heic)$/.test(f.type) || /\.(png|jpe?g|webp|gif|heic)$/i.test(f.name);

/** PDF и картинки уходят как есть (сервер читает их моделью), DOCX/TXT — текстом. */
export async function readDocument(file: File): Promise<DocumentInput> {
  if (isPdf(file) || isImage(file)) {
    if (file.size > MAX_FILE_BYTES) throw new AutofillError('This file is larger than 4 MB. Please use a smaller PDF or image.');
    return { file: await fileToBase64(file) };
  }
  let text: string | null = null;
  try {
    text = await extractCvText(file, MAX_TEXT);
  } catch (e) {
    throw new AutofillError(e instanceof Error ? e.message : 'Could not read this file.');
  }
  if (!text) throw new AutofillError('We could not read this file. Please use a PDF, DOCX, TXT or a clear image.');
  return { text };
}

async function run<T>(path: string, input: DocumentInput): Promise<T> {
  if (!input.text && !input.file) throw new AutofillError('There is nothing to read yet.');
  try {
    const res = await http.post<{ fields: T }>(path, { text: input.text?.slice(0, MAX_TEXT), file: input.file });
    return res.fields;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 429) throw new AutofillError('Too many attempts for now. Please wait a few minutes or fill the form by hand.');
      if (e.status === 503) throw new AutofillError('Autofill is not available right now. You can fill the form by hand.');
      if (e.status === 400) throw new AutofillError('This document is too short to read. Add more text or fill the form by hand.');
    }
    throw new AutofillError('Autofill did not work this time. You can fill the form by hand.');
  }
}

export const autofillApi = {
  cv: (input: DocumentInput) => run<CvFields>(API.ai.autofillCv, input),
  vacancy: (input: DocumentInput) => run<VacancyFields>(API.ai.autofillVacancy, input),
};
