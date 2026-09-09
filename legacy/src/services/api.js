import axios from 'axios';

// Базовый URL — тот же что в мобилке: lib/core/api/api_client.dart
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.horecapass.com';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Подставляем токен из localStorage в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// При 401 — чистим токен
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hp_token');
      localStorage.removeItem('hp_user');
      window.location.reload();
    }
    return Promise.reject(err);
  },
);

/* ─── AUTH (email OTP — как в мобилке) ─── */
export const authApi = {
  sendOtp: (email) => api.post('/auth/otp/send/', { email }),
  verifyOtp: (email, code) => api.post('/auth/otp/verify/', { email, code }),
  getMe: () => api.get('/auth/me/'),
  deleteAccount: () => api.delete('/auth/me/'),
};

/* ─── VACANCIES ─── */
export const vacanciesApi = {
  list: (params) => api.get('/vacancies/', { params }),       // GET /vacancies/?city=&venue=&salary_min=
  detail: (id) => api.get(`/vacancies/${id}/`),
  create: (data) => api.post('/vacancies/', data),            // только employer
  update: (id, data) => api.patch(`/vacancies/${id}/`, data),
  remove: (id) => api.delete(`/vacancies/${id}/`),
  apply: (id) => api.post(`/vacancies/${id}/apply/`),         // applicant
  myApplications: () => api.get('/applications/'),
};

/* ─── CANDIDATES / KANBAN (employer) ─── */
export const candidatesApi = {
  list: (vacancyId, params) => api.get(`/vacancies/${vacancyId}/candidates/`, { params }),
  moveStage: (appId, stage) => api.patch(`/applications/${appId}/`, { stage }),
  profile: (candidateId) => api.get(`/candidates/${candidateId}/`),
};

/* ─── CHATS (REST, список бесед) ─── */
export const chatsApi = {
  list: () => api.get('/chats/'),
  history: (chatId) => api.get(`/chats/${chatId}/messages/`),
  send: (chatId, text) => api.post(`/chats/${chatId}/messages/`, { text }),
};

/* ─── COMPANY (employer profile) ─── */
export const companyApi = {
  get: () => api.get('/company/'),
  update: (data) => api.patch('/company/', data),
  inviteTeam: (email, role) => api.post('/company/team/invite/', { email, role }),
  team: () => api.get('/company/team/'),
};

/* ─── WebSocket для чата — как в мобилке: wss://api.horecapass.com/ws/chats/<id>/ ─── */
export function createChatSocket(chatId, onMessage) {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  const token = localStorage.getItem('hp_token');
  const url = `${wsBase}/ws/chats/${chatId}/?token=${token}`;
  const ws = new WebSocket(url);

  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (_) {}
  };

  ws.onerror = (e) => console.error('[WS] error', e);

  return ws;
}
