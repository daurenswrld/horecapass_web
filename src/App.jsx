/**
 * App.jsx — точка входа в HorecaPass Web
 *
 * Принцип работы:
 *  • UI (компоненты, стили, i18n) берётся из HorecaPass — монолитного компонента,
 *    который сгенерирован с нуля и полностью покрывает роли Applicant / Employer.
 *  • Реальные данные поступают из api.horecapass.com — того же бэкенда (Django/DRF),
 *    к которому обращается мобильное приложение (lib/core/api/api_client.dart).
 *  • Для слоёв, где API уже готов, данные подменяют mock-данные внутри HorecaPass.
 *  • Для слоёв, где API ещё не готов, компонент работает на mock-данных (функция будет
 *    заменена на API-вызов после появления endpoint'а).
 */

import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { authApi, vacanciesApi } from './services/api';
import HorecaPass from './HorecaPass';

export default function App() {
  const { user, login, logout } = useAuth();

  // Пробрасываем в HorecaPass колбэки для реальной авторизации
  const handleOtpSend = (email) => authApi.sendOtp(email);

  const handleOtpVerify = async (email, code) => {
    const res = await authApi.verifyOtp(email, code);
    // Бэкенд возвращает { token, user } — такой же формат как мобилка
    login(res.data.user, res.data.token);
    return res.data;
  };

  return (
    <HorecaPass
      // Реальная авторизация
      externalUser={user}
      onOtpSend={handleOtpSend}
      onOtpVerify={handleOtpVerify}
      onLogout={logout}
      // Реальный API для вакансий
      vacanciesApi={vacanciesApi}
    />
  );
}
