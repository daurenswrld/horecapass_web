'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { authApi, isCompany, type CurrentUser } from '@/lib/api/auth';
import { tokens } from '@/lib/api/client';
import { demoSession } from '@/lib/demo/session';

/**
 * Кто сейчас в системе.
 *
 * Повторяет RootScreen мобилки: если токен есть — спрашиваем /users/api/users/me/
 * и по полю role решаем, какой раздел показать. Если запрос упал — чистим токены
 * и считаем пользователя вышедшим, иначе он застрянет на белом экране
 * с протухшей сессией.
 */

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const load = React.useCallback(async () => {
    // Демо-сессия (только dev) — без токенов и без сервера.
    const demo = demoSession.user();
    if (demo) {
      setUser(demo);
      setLoading(false);
      return;
    }
    if (!tokens.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await authApi.me());
    } catch {
      authApi.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const signOut = React.useCallback(() => {
    authApi.logout();
    setUser(null);
    router.push('/');
  }, [router]);

  const value = React.useMemo<AuthState>(
    () => ({ user, loading, refresh: load, signOut }),
    [user, loading, load, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useAuth was called outside AuthProvider');
  return v;
}

/** Куда отправить пользователя после входа — по его роли. */
export function homeFor(user: CurrentUser | null): string {
  if (!user) return '/';
  if (user.role === 'ADMIN') return '/admin';
  return isCompany(user.role) ? '/company/vacancies' : '/jobs';
}
