import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hp_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('hp_token'));

  // При старте — проверяем токен
  useEffect(() => {
    if (!localStorage.getItem('hp_token')) { setLoading(false); return; }
    authApi.getMe()
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem('hp_token'); localStorage.removeItem('hp_user'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((userData, token) => {
    localStorage.setItem('hp_token', token);
    localStorage.setItem('hp_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hp_token');
    localStorage.removeItem('hp_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, authed: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
