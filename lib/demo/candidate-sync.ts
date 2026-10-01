'use client';

import { candidateApi } from '@/lib/api/candidate';
import { canSyncToServer } from '@/lib/demo/employer-sync';
import { cvConsent } from '@/lib/demo/storage';
import type { CandidateDraft } from '@/lib/demo/candidate';

/**
 * Онбординг кандидата → сервер (при настоящем входе; в демо — только браузер).
 *
 * Что уходит и куда (см. lib/api/candidate.ts):
 * - профиль: национальность, текущая локация, страны работы, имя из согласия;
 * - резюме: роль, языки, «о себе» из Smart-проверки и стажа;
 * - файлы (CV, сертификаты, видео) — в момент выбора, см. uploadCandidateFile.
 *
 * Работодатель видит это в карточке отклика сразу. Остальное (подпись согласия,
 * квалификация, страны списком, тип сертификата, портфолио) серверу пока
 * некуда записать — остаётся в браузере, экраны это говорят.
 */

export { canSyncToServer };

/** «English fluent, Arabic conversational» → ["English fluent", "Arabic conversational"]. */
function splitList(v: string | undefined): string[] {
  return (v ?? '')
    .split(/[,;\n]| and /i)
    .map((x) => x.trim().replace(/\.$/, ''))
    .filter(Boolean);
}

function aboutMe(d: CandidateDraft): string {
  return [
    d.role && d.years !== null ? `${d.role} with ${d.years}+ years of experience.` : null,
    d.check.achievement?.trim() || null,
    d.check.certs?.trim() ? `Certifications: ${d.check.certs.trim()}.` : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export async function syncCandidate(d: CandidateDraft, name: { first: string; last: string }) {
  // Имя: из аккаунта, а если его нет — из подписи согласия («Your full name»).
  const signer = cvConsent.load().signer.trim();
  const [first, ...rest] = signer.split(/\s+/);
  await candidateApi.patchProfile({
    nationality: d.nationality,
    current_location: d.location,
    target_country: d.countries.join(', '),
    first_name: name.first ? null : first,
    last_name: name.last ? null : rest.join(' '),
  });
  if (d.role || d.check.languages || d.check.achievement) {
    await candidateApi.saveResume({
      title: d.role ?? undefined,
      position: d.role ?? undefined,
      languages: splitList(d.check.languages),
      about_me: aboutMe(d),
    });
  }
}

export type CandidateFile = 'cv' | 'certificate' | 'video';

/** Файл уходит на сервер сразу при выборе. Ошибку показывает вызывающий. */
export async function uploadCandidateFile(kind: CandidateFile, file: File, title?: string) {
  if (!canSyncToServer()) return;
  if (kind === 'cv') await candidateApi.uploadCv(file);
  if (kind === 'video') await candidateApi.uploadVideo(file);
  if (kind === 'certificate') await candidateApi.addCertificate(file, title || file.name.replace(/\.[a-z0-9]+$/i, ''));
}
