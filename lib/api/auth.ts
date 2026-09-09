import { API } from './endpoints';
import { http, request, tokens } from './client';

/**
 * Авторизация. Повторяет AuthRepository мобильного приложения
 * (lib/features/auth/application/auth_repository.dart) — тот же сервер,
 * те же поля, те же значения.
 *
 * Пароля нет: пользователь вводит почту, получает шестизначный код письмом
 * и подтверждает его.
 */

export type Purpose = 'LOGIN' | 'REGISTER';
export type BackendRole = 'APPLICANT' | 'COMPANY_OWNER' | 'COMPANY_MANAGER';

export interface CurrentUser {
  id: number;
  email?: string | null;
  phone_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role: BackendRole | string;
  avatar?: string | null;
  company?: number | null;
  company_name?: string | null;
  [key: string]: unknown;
}

export interface SendCodeResult {
  /** Сервер возвращает код в ответе для демо-аккаунтов проверки в сторах.
   *  На боевых аккаунтах поля нет. */
  debug_code?: string | null;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

/** Роль пользователя определяет, какой раздел ему показывать. */
export function isCompany(role: string | undefined | null): boolean {
  return role === 'COMPANY_OWNER' || role === 'COMPANY_MANAGER';
}

export function isApplicant(role: string | undefined | null): boolean {
  return role === 'APPLICANT';
}

export const authApi = {
  sendCode(contact: string, purpose: Purpose, role?: BackendRole) {
    return http.post<SendCodeResult>(API.auth.sendCode, {
      contact,
      purpose,
      ...(role ? { role } : {}),
    });
  },

  /**
   * Подтверждение кода.
   *
   * Мобилка шлёт это multipart — при регистрации в том же запросе уезжают
   * логотип компании и файл резюме. Повторяем формат, иначе сервер не примет
   * регистрацию, а расхождение вылезет позже и не здесь.
   */
  async verifyCode(params: {
    contact: string;
    code: string;
    purpose: Purpose;
    role?: BackendRole;
    companyName?: string;
    nationality?: string;
    currentLocation?: string;
    targetCountry?: string;
    preferredCities?: string;
    companyLogo?: File | null;
    cvFile?: File | null;
  }): Promise<TokenPair> {
    const fd = new FormData();
    fd.set('contact', params.contact);
    fd.set('code', params.code);
    fd.set('purpose', params.purpose);
    if (params.role) fd.set('role', params.role);
    if (params.companyName) fd.set('company_name', params.companyName);
    if (params.nationality) fd.set('nationality', params.nationality);
    if (params.currentLocation) fd.set('current_location', params.currentLocation);
    if (params.targetCountry) fd.set('target_country', params.targetCountry);
    if (params.preferredCities) fd.set('preferred_cities', params.preferredCities);
    if (params.companyLogo) fd.set('company_logo', params.companyLogo);
    if (params.cvFile) fd.set('cv_file', params.cvFile);

    const pair = await request<TokenPair>(API.auth.verifyCode, { method: 'POST', body: fd });
    tokens.save(pair.access, pair.refresh);
    return pair;
  },

  me() {
    return http.get<CurrentUser>(API.auth.me);
  },

  logout() {
    tokens.clear();
  },

  /** Удаление аккаунта. В мобилке это требование App Store 5.1.1(v). */
  async deleteAccount() {
    await http.delete<void>(API.auth.me);
    tokens.clear();
  },
};
