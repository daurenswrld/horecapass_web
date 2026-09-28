import { API } from './endpoints';
import { http } from './client';

/**
 * Компания текущего пользователя — /users/api/users/me/company/ (CompanyProfileView).
 *
 * Поля онбординга (linkedin, whatsapp, size, is_pre_opening,
 * pre_opening_answers, hide_name) добавлены в бэкенд веткой
 * feat/company-onboarding-fields. До её выкатки сервер эти поля просто
 * игнорирует (DRF отбрасывает неизвестные), остальное сохраняется.
 */

type Json = Record<string, unknown>;

export interface CompanyProfile {
  id: number;
  name: string;
  logo: string | null;
  description: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  size: string | null;
  isPreOpening: boolean;
  preOpeningAnswers: string[];
  hideName: boolean;
  images: string[];
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

function parse(json: Json): CompanyProfile {
  return {
    id: Number(json.id),
    name: String(json.name ?? ''),
    logo: str(json.logo),
    description: String(json.description ?? ''),
    address: str(json.address),
    phoneNumber: str(json.phone_number),
    email: str(json.email),
    website: str(json.website),
    linkedin: str(json.linkedin),
    whatsapp: str(json.whatsapp),
    size: str(json.size),
    isPreOpening: json.is_pre_opening === true,
    preOpeningAnswers: Array.isArray(json.pre_opening_answers) ? json.pre_opening_answers.map(String) : [],
    hideName: json.hide_name === true,
    images: Array.isArray(json.images)
      ? json.images.map((i) => (typeof i === 'string' ? i : String((i as Json).image ?? ''))).filter(Boolean)
      : [],
  };
}

export interface TeamMember {
  id: number;
  name: string;
  email: string | null;
  roleDisplay: string;
}

export interface Invitation {
  id: number;
  email: string;
  roleDisplay: string;
}

export const companyApi = {
  async get(): Promise<CompanyProfile> {
    return parse(await http.get<Json>(API.company.mine));
  },

  /** JSON-поля; логотип — отдельно, через FormData. */
  async patch(data: Json | FormData): Promise<CompanyProfile> {
    return parse(await http.patch<Json>(API.company.mine, data));
  },

  async team(): Promise<{ members: TeamMember[]; invitations: Invitation[] }> {
    const d = await http.get<{ members?: Json[]; invitations?: Json[] }>(API.company.team);
    return {
      members: (d.members ?? []).map((m) => ({
        id: Number(m.id),
        name: String(m.name ?? ''),
        email: str(m.email),
        roleDisplay: String(m.role_display ?? m.role ?? ''),
      })),
      invitations: (d.invitations ?? []).map((i) => ({
        id: Number(i.id),
        email: String(i.email ?? ''),
        roleDisplay: String(i.role_display ?? i.role ?? ''),
      })),
    };
  },

  /** Роль на сервере — COMPANY_MANAGER или ADMIN. */
  invite(email: string, role: 'COMPANY_MANAGER' | 'ADMIN') {
    return http.post<Json>(API.company.invitations, { email, role });
  },

  cancelInvite(id: number) {
    return http.delete<void>(API.company.invitation(id));
  },
};

/** data URL логотипа из браузера → файл для multipart. */
export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}
